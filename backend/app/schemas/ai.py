"""
AI and Hybrid ATS Pydantic v2 Models for Vitascor Platform.
Supports Explainable AI (XAI), Gemini Embeddings semantic matching, and Auto-Tailor.
All models provide full camelCase aliases for seamless Next.js / TypeScript frontend integration.
"""

from enum import Enum
from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, ConfigDict, Field, model_validator, field_validator
from app.schemas.resume import MAX_RESUME_JSON_BYTES, validate_resume_json_size

MAX_JOB_DESCRIPTION_CHARS = 20_000
MAX_TAILOR_JOB_DESCRIPTION_CHARS = 3_000
MAX_SINGLE_FIELD_TEXT_CHARS = 1_200
SINGLE_FIELD_LIMITS = {"summary": 600, "experience": 1_200, "project": 800}


# --- Akademik XAI çekirdeği ---

class SkillPriority(str, Enum):
    REQUIRED = "required"    # Ağırlık: 1.0
    PREFERRED = "preferred"  # Ağırlık: 0.5


class MatchType(str, Enum):
    EXACT = "exact"        # Birebir kelime eşleşmesi
    SEMANTIC = "semantic"  # Gemini Embeddings + cosine similarity
    MISSING = "missing"    # CV'de bulunamayan yetkinlik


class SkillCategory(str, Enum):
    LANGUAGE = "language"
    FRAMEWORK = "framework"
    DATABASE = "database"
    CLOUD = "cloud"
    TOOL = "tool"
    SOFT = "soft"
    DOMAIN = "domain"
    CERTIFICATION = "certification"


class JobSkill(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=60)
    aliases: List[str] = Field(default_factory=list, max_length=10)
    category: SkillCategory
    importance: SkillPriority
    evidence: str = Field(min_length=1, max_length=500)

    @field_validator("name")
    @classmethod
    def clean_name(cls, value: str) -> str:
        return value.strip()

    @field_validator("aliases")
    @classmethod
    def clean_aliases(cls, values: List[str]) -> List[str]:
        return list(dict.fromkeys(value.strip()[:60] for value in values if value.strip()))

    @field_validator("evidence")
    @classmethod
    def keep_evidence_short(cls, value: str) -> str:
        words = value.split()
        if len(words) > 25:
            raise ValueError("Kanıt en fazla 25 kelime içerebilir.")
        return value.strip()


class JobSkillExtraction(BaseModel):
    model_config = ConfigDict(extra="forbid")
    skills: List[JobSkill] = Field(max_length=40)


class KeywordMatchDetail(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    keyword: str
    category: SkillCategory
    importance: SkillPriority
    match_type: MatchType = Field(alias="matchType")
    similarity_score: Optional[float] = Field(default=None, alias="similarity", ge=0, le=1)  # semantic/missing
    credit: Optional[float] = Field(default=None, ge=0, le=1)
    status: Optional[Literal["supporting"]] = None
    matched_with: Optional[str] = Field(default=None, alias="matchedWith")            # Örn: "PostgreSQL" -> CV'de "Postgres"
    related_skills: List[str] = Field(default_factory=list, alias="relatedSkills")
    evidence: Optional[str] = None
    evidence_section: Optional[str] = Field(default=None, alias="evidenceSection")


class HybridAtsScoreResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    score: float = Field(ge=0, le=100)
    rule_coverage: float = Field(ge=0, le=100, alias="ruleCoverage")
    hybrid_coverage: float = Field(ge=0, le=100, alias="hybridCoverage")
    matched: List[KeywordMatchDetail]
    semantic: List[KeywordMatchDetail]
    missing: List[KeywordMatchDetail]
    confidence: Literal["low", "medium"]
    algorithm_version: str = Field(alias="algorithmVersion")
    params: Dict[str, float]
    explanation: str


# --- Tekil madde iyileştirme (mevcut /api/ai/optimize — Zod şemasından birebir) ---
# Kaynak: app/api/ai/optimize/route.ts satır 9-13
#   z.object({ text, type: enum(['summary','experience','project']), targetLanguage })

class SingleFieldOptimizeRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    text: str = Field(min_length=1, max_length=MAX_SINGLE_FIELD_TEXT_CHARS, description="İyileştirilecek ham metin")
    type: Literal["summary", "experience", "project"]
    target_language: Optional[str] = Field(default="tr", alias="targetLanguage")

    @model_validator(mode="after")
    def enforce_field_limit(self):
        limit = SINGLE_FIELD_LIMITS[self.type]
        if len(self.text) > limit:
            raise ValueError(f"{self.type} alanı en fazla {limit} karakter olabilir.")
        return self

    @field_validator("target_language")
    @classmethod
    def supported_language(cls, value):
        if value is not None and value.lower() not in {"tr", "en", "de", "es", "fr"}:
            raise ValueError("Desteklenmeyen hedef dil.")
        return value


class SingleFieldOptimizeResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    optimized_text: str = Field(alias="optimizedText")


# --- İlana özel tüm CV uyarlama (Auto-Tailor) ---
# strict_truthfulness YOK — sunucuda sabit kural, istek parametresi değil

class OptimizeRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    resume_id: Optional[str] = Field(default=None, alias="resumeId")
    resume_content: Optional[Dict[str, Any]] = Field(default=None, alias="resumeContent")  # kaydedilmemiş taslak desteği
    job_description: str = Field(min_length=30, max_length=MAX_TAILOR_JOB_DESCRIPTION_CHARS, alias="jobDescription", description="Hedef iş ilanı metni")
    target_language: Optional[str] = Field(default="en", alias="targetLanguage")
    user_feedback: Optional[str] = Field(default=None, alias="userFeedback", min_length=1, max_length=4000)
    previous_tailored_content: Optional[Dict[str, Any]] = Field(
        default=None, alias="previousTailoredContent"
    )
    iteration_count: int = Field(default=0, alias="iterationCount", ge=0, le=3)

    @field_validator("resume_content", "previous_tailored_content", mode="before")
    @classmethod
    def bound_resume_json(cls, value):
        return validate_resume_json_size(value) if value is not None else value

    @model_validator(mode="after")
    def check_resume_source(self):
        if not self.resume_id and not self.resume_content:
            raise ValueError("En az bir 'resume_id' veya 'resume_content' sağlanmalıdır.")
        has_feedback = self.user_feedback is not None
        has_previous = self.previous_tailored_content is not None
        if has_feedback != has_previous:
            raise ValueError("Kullanıcı geri bildirimi ve önceki CV taslağı birlikte sağlanmalıdır.")
        if has_feedback and not self.user_feedback.strip():
            raise ValueError("Kullanıcı geri bildirimi boş olamaz.")
        if not has_feedback and self.iteration_count != 0:
            raise ValueError("İlk uyarlamada iterationCount sıfır olmalıdır.")
        if has_feedback and self.iteration_count < 1:
            raise ValueError("Geri bildirimli revizyonda iterationCount en az 1 olmalıdır.")
        return self


class OptimizeResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    updated_content: Dict[str, Any] = Field(alias="updatedContent")
    changed_fields: List[str] = Field(alias="changedFields")  # şeffaflık: hangi alanlar değişti
    tailoring_notes: List[str] = Field(default_factory=list, alias="tailoringNotes")
    suggested_skills: List[str] = Field(default_factory=list, alias="suggestedSkills")
    iteration_count: int = Field(default=1, alias="iterationCount", ge=1)


# --- İlan eşleştirme / ATS skorlama ---
# Kaynak: components/ResumeEditor.tsx satır 302-306
#   body: { jobDescription, currentResume, targetLanguage }

class JobMatchRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    resume_id: Optional[str] = Field(default=None, alias="resumeId")
    resume_content: Optional[Dict[str, Any]] = Field(default=None, alias="currentResume")
    job_description: str = Field(alias="jobDescription")
    target_language: Optional[str] = Field(default="tr", alias="targetLanguage")


class JobMatchResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    ats_score: HybridAtsScoreResponse = Field(alias="atsScore")
    extracted_skills: List[JobSkill] = Field(alias="extractedSkills")
    excluded_skill_count: int = Field(default=0, alias="excludedSkillCount", ge=0)


class AtsMatchHistoryItem(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    resume_id: Optional[str] = Field(default=None, alias="resumeId")
    job_description: str = Field(alias="jobDescription")
    result: JobMatchResponse
    created_at: str = Field(alias="createdAt")
