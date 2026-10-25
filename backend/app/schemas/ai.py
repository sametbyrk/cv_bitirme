"""
AI and Hybrid ATS Pydantic v2 Models for Vitascor Platform.
Supports Explainable AI (XAI), text-embedding-004 Semantic Matching, and Auto-Tailor.
All models provide full camelCase aliases for seamless Next.js / TypeScript frontend integration.
"""

from enum import Enum
from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, ConfigDict, Field, model_validator


# --- Akademik XAI çekirdeği ---

class SkillPriority(str, Enum):
    REQUIRED = "required"    # Ağırlık: 1.0
    PREFERRED = "preferred"  # Ağırlık: 0.5


class MatchType(str, Enum):
    EXACT = "exact"        # Birebir kelime eşleşmesi
    SEMANTIC = "semantic"  # text-embedding-004 + cosine similarity
    MISSING = "missing"    # CV'de bulunamayan yetkinlik


class KeywordMatchDetail(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    keyword: str
    category: SkillPriority
    match_type: MatchType = Field(alias="matchType")
    similarity_score: Optional[float] = Field(default=None, alias="similarityScore")  # sadece semantic/missing'te dolu
    matched_with: Optional[str] = Field(default=None, alias="matchedWith")            # Örn: "PostgreSQL" -> CV'de "Postgres"


class HybridAtsScoreResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    total_score: float = Field(ge=0, le=100, alias="totalScore")
    rule_based_score: float = Field(alias="ruleBasedScore")
    semantic_score: float = Field(alias="semanticScore")
    matched_keywords: List[KeywordMatchDetail] = Field(alias="matchedKeywords")
    missing_keywords: List[KeywordMatchDetail] = Field(alias="missingKeywords")
    explanation: str
    similarity_threshold_used: float = Field(alias="similarityThresholdUsed")


# --- Tekil madde iyileştirme (mevcut /api/ai/optimize — Zod şemasından birebir) ---
# Kaynak: app/api/ai/optimize/route.ts satır 9-13
#   z.object({ text, type: enum(['summary','experience','project']), targetLanguage })

class SingleFieldOptimizeRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    text: str = Field(min_length=1, description="İyileştirilecek ham metin")
    type: Literal["summary", "experience", "project"]
    target_language: Optional[str] = Field(default="tr", alias="targetLanguage")


class SingleFieldOptimizeResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    optimized_text: str = Field(alias="optimizedText")


# --- İlana özel tüm CV uyarlama (Auto-Tailor) ---
# strict_truthfulness YOK — sunucuda sabit kural, istek parametresi değil

class OptimizeRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    resume_id: Optional[str] = Field(default=None, alias="resumeId")
    resume_content: Optional[Dict[str, Any]] = Field(default=None, alias="resumeContent")  # kaydedilmemiş taslak desteği
    job_description: str = Field(min_length=30, alias="jobDescription", description="Hedef iş ilanı metni")
    target_language: Optional[str] = Field(default="en", alias="targetLanguage")
    user_feedback: Optional[str] = Field(default=None, alias="userFeedback", min_length=1, max_length=4000)
    previous_tailored_content: Optional[Dict[str, Any]] = Field(
        default=None, alias="previousTailoredContent"
    )
    iteration_count: int = Field(default=0, alias="iterationCount", ge=0)

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
    job_description: str = Field(min_length=10, alias="jobDescription")
    target_language: Optional[str] = Field(default="tr", alias="targetLanguage")

    @model_validator(mode="after")
    def check_resume_source(self):
        if not self.resume_id and not self.resume_content:
            raise ValueError("En az bir 'resume_id' veya 'resume_content' (currentResume) sağlanmalıdır.")
        return self


class JobMatchResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    ats_score: HybridAtsScoreResponse = Field(alias="atsScore")
