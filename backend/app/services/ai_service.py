"""Gemini-backed copy editing and truthful job-specific resume tailoring."""

import json
import logging
import re
from typing import Any, Dict, List, Tuple

from fastapi import HTTPException, status
from google import genai
from google.genai import types
from pydantic import ValidationError

from app.core.config import settings
from app.schemas.ai import (
    SINGLE_FIELD_LIMITS,
    OptimizeRequest,
    OptimizeResponse,
    SingleFieldOptimizeRequest,
    SingleFieldOptimizeResponse,
)
from app.schemas.resume import ResumeContent


logger = logging.getLogger(__name__)


class AIService:
    MODEL = settings.GEMINI_MODEL

    def __init__(self) -> None:
        self._client = genai.Client(api_key=settings.GEMINI_API_KEY) if settings.GEMINI_API_KEY else None

    def _get_client(self):
        if self._client is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI servisi yapılandırılmamış. GEMINI_API_KEY ayarını kontrol edin.",
            )
        return self._client

    async def _generate(self, prompt: str, *, json_mode: bool = False) -> str:
        try:
            response = await self._get_client().aio.models.generate_content(
                model=self.MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.2,
                    response_mime_type="application/json" if json_mode else "text/plain",
                ),
            )
            text = response.text
            if not text:
                raise ValueError("Gemini boş yanıt döndürdü.")
            return text.strip()
        except HTTPException:
            raise
        except Exception as exc:
            provider_code = getattr(exc, "code", None) or getattr(exc, "status", None)
            normalized_code = str(provider_code).upper()
            logger.exception(
                "Gemini request failed (model=%s, provider_code=%s)",
                self.MODEL,
                provider_code or "unknown",
            )

            if provider_code == 429 or "RESOURCE_EXHAUSTED" in normalized_code:
                detail = "AI kullanım kotası dolmuş olabilir. Biraz sonra tekrar deneyin."
                error_status = status.HTTP_503_SERVICE_UNAVAILABLE
            elif provider_code in (401, 403) or any(
                code in normalized_code for code in ("UNAUTHENTICATED", "PERMISSION_DENIED")
            ):
                detail = "AI sağlayıcı anahtarı geçersiz veya bu model için yetkisiz."
                error_status = status.HTTP_502_BAD_GATEWAY
            elif provider_code == 400 or "INVALID_ARGUMENT" in normalized_code:
                detail = "İlan veya CV metni AI sağlayıcısı tarafından işlenemedi. Metinleri kısaltıp tekrar deneyin."
                error_status = status.HTTP_502_BAD_GATEWAY
            else:
                detail = "AI sağlayıcısından yanıt alınamadı. Lütfen daha sonra tekrar deneyin."
                error_status = status.HTTP_502_BAD_GATEWAY

            raise HTTPException(
                status_code=error_status,
                detail=detail,
            ) from exc

    async def optimize_single_field(
        self, request: SingleFieldOptimizeRequest
    ) -> SingleFieldOptimizeResponse:
        language_names = {
            "tr": "Turkish", "en": "English", "de": "German",
            "es": "Spanish", "fr": "French",
        }
        language_code = (request.target_language or "tr").lower()
        target_language = language_names.get(language_code, request.target_language or "Turkish")
        output_limit = SINGLE_FIELD_LIMITS[request.type]
        prompt = f"""Sen profesyonel CV metin editörüsün. Yalnızca aşağıdaki kaynak metni yeniden ifade et.
Kaynakta bulunmayan başarı, ölçüm, sorumluluk veya teknoloji ekleme. Gerçekleri değiştirme.
Tür: {request.type}
Hedef dil: {target_language}
Çıktı en fazla {output_limit} karakter olmalı.
Metin:
<source>
{request.text}
</source>
Yalnızca iyileştirilmiş metni döndür; açıklama veya başlık ekleme."""
        optimized_text = await self._generate(prompt)
        if len(optimized_text) > output_limit:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="AI önerisi alanın karakter sınırını aşıyor. Tekrar deneyin.",
            )
        return SingleFieldOptimizeResponse(optimizedText=optimized_text)

    async def auto_tailor_resume(self, request: OptimizeRequest) -> OptimizeResponse:
        try:
            content = ResumeContent.model_validate(request.resume_content or {})
        except ValidationError as exc:
            raise HTTPException(status_code=422, detail="CV içeriği geçersiz.") from exc

        original = content.model_dump(by_alias=True, mode="json", exclude_none=False)
        previous_draft = None
        if request.previous_tailored_content is not None:
            try:
                previous_draft = ResumeContent.model_validate(
                    request.previous_tailored_content
                ).model_dump(by_alias=True, mode="json", exclude_none=False)
            except ValidationError as exc:
                raise HTTPException(status_code=422, detail="Önceki CV taslağı geçersiz.") from exc

        language_names = {"tr": "Turkish", "en": "English", "de": "German", "es": "Spanish", "fr": "French"}
        target_language = language_names.get((request.target_language or "en").lower(), request.target_language or "English")
        prompt = f"""You are a professional resume editor. Write revised resume text in {target_language}.
SABİT ETİK VE DOĞRULUK KURALLARI:
- Orijinal CV tek doğruluk kaynağıdır. CV'de kanıtı olmayan staj, teknoloji, beceri, görev, başarı, metrik, iş veya eğitim ekleme.
- Kullanıcı geri bildirimi orijinal CV ile çelişirse geri bildirimi uygulama; gerçek deneyim sınırını koru.
- İlandaki gereksinimleri belirle ve yalnızca adayın CV'sinde kanıtı bulunan gereksinimleri öne çıkar.
- Tüm nesne/listelerin yapısını ve mevcut tüm id değerlerini aynen koru.
- Yalnızca personalInfo.summary, experience[*].description/highlights ve projects[*].description alanlarını değiştirebilirsin.
- Diğer tüm alanları ve alan değerlerini aynen koru.
- "suggested_skills" listesinde yalnızca CV'nin başka bir bölümünde açıkça geçen ve mevcut skills listesinde olmayan becerileri öner.
- Çıktı JSON nesnesi olsun: {{"updated_content": {{...tam CV...}}, "tailoring_notes": ["..."], "suggested_skills": ["..."]}}
İş ilanı:
<job_description>
{request.job_description}
</job_description>
Orijinal CV JSON (tek doğruluk kaynağı):
{json.dumps(original, ensure_ascii=False)}"""
        if previous_draft is not None and request.user_feedback is not None:
            prompt += f"""
Önceki taslak ve kullanıcı geri bildirimi:
<previous_tailored_content>
{json.dumps(previous_draft, ensure_ascii=False)}
</previous_tailored_content>
<user_feedback>
{request.user_feedback}
</user_feedback>
Önceki taslağı ve kullanıcı geri bildirimini dikkate alarak yeniden düzenle. Orijinal CV'de kanıtlanmayan hiçbir bilgiyi ekleme. Çıktı yapısını ve izin verilen alanları koru."""
        else:
            prompt += "\nİlk uyarlamayı orijinal CV ve iş ilanına göre yap."
        prompt += "\nCV taslağı JSON'u:\n" + json.dumps(previous_draft or original, ensure_ascii=False)
        raw = await self._generate(prompt, json_mode=True)
        try:
            parsed = _parse_json_object(raw)
            updated = ResumeContent.model_validate(parsed["updated_content"])
            updated_dict = updated.model_dump(by_alias=True, mode="json", exclude_none=False)
            notes = parsed.get("tailoring_notes", [])
            if not isinstance(notes, list) or not all(isinstance(note, str) for note in notes):
                notes = []
            suggestions = parsed.get("suggested_skills", [])
            if not isinstance(suggestions, list) or not all(isinstance(item, str) for item in suggestions):
                suggestions = []
            source_text = json.dumps(original, ensure_ascii=False).casefold()
            existing_skills = {str(item.get("name") if isinstance(item, dict) else item).casefold() for item in original.get("skills", [])}
            suggestions = [
                skill.strip() for skill in suggestions
                if skill.strip().casefold() in source_text and skill.strip().casefold() not in existing_skills
            ]
        except (json.JSONDecodeError, KeyError, TypeError, ValidationError) as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="AI servisi beklenen CV JSON biçimini döndürmedi.",
            ) from exc

        # LLM yanıtında izin verilmeyen alan değişikliklerini ve ID kayıplarını
        # engellemek için yalnızca izinli metin alanlarını kaynak nesneye aktar.
        sanitized, changed = _apply_allowed_edits(original, updated_dict)
        return OptimizeResponse(
            updatedContent=sanitized,
            changedFields=changed,
            tailoringNotes=notes,
            suggestedSkills=suggestions,
            iterationCount=request.iteration_count + 1,
        )


def _apply_allowed_edits(original: Dict[str, Any], updated: Dict[str, Any]) -> Tuple[Dict[str, Any], List[str]]:
    result = json.loads(json.dumps(original, ensure_ascii=False))
    changed: List[str] = []

    def replace(path: str, target: Dict[str, Any], source: Dict[str, Any], key: str) -> None:
        new_value = source.get(key)
        if isinstance(new_value, type(target.get(key))) and new_value != target.get(key):
            target[key] = new_value
            changed.append(path)

    original_personal = original.get("personalInfo", {})
    updated_personal = updated.get("personalInfo", {})
    if isinstance(original_personal, dict) and isinstance(updated_personal, dict):
        replace("personalInfo.summary", result["personalInfo"], updated_personal, "summary")

    for section, fields in (("experience", ("description", "highlights")), ("projects", ("description",))):
        original_items = original.get(section, [])
        updated_items = updated.get(section, [])
        if not isinstance(original_items, list) or not isinstance(updated_items, list):
            continue
        by_id = {item.get("id"): item for item in updated_items if isinstance(item, dict) and item.get("id")}
        position_edits = [item for item in updated_items if isinstance(item, dict)]
        for index, target in enumerate(result.get(section, [])):
            if not isinstance(target, dict):
                continue
            if target.get("id"):
                source = by_id.get(target.get("id"))
            else:
                source = position_edits[index] if index < len(position_edits) else None
            if source is None:
                continue
            for field in fields:
                path = f"{section}[{index}].{field}"
                replace(path, target, source, field)
    return result, changed


ai_service = AIService()


def _parse_json_object(raw: str) -> Dict[str, Any]:
    """Parse Gemini JSON, tolerating optional Markdown code fences."""
    text = raw.strip()
    fenced = re.fullmatch(r"```(?:json)?\s*(.*?)\s*```", text, flags=re.IGNORECASE | re.DOTALL)
    if fenced:
        text = fenced.group(1).strip()

    parsed = json.loads(text)
    if not isinstance(parsed, dict):
        raise TypeError("Gemini JSON yanıtı nesne olmalıdır.")
    return parsed
