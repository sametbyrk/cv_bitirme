"""
Resume Pydantic v2 Models for Vitascor Platform.
Synchronized with prisma/schema.prisma and frontend TypeScript types (context/ResumeContext.tsx).
"""

from datetime import datetime
import json
from typing import Annotated, Optional, List, Union, Dict, Any
from pydantic import BaseModel, ConfigDict, Field, AliasChoices, StringConstraints, model_validator

MAX_RESUME_JSON_BYTES = 150 * 1024
ShortText = Annotated[str, StringConstraints(max_length=50)]


class BaseSchema(BaseModel):
    """Tüm alt modeller için ortak yapılandırma: camelCase desteği ve dinamik alan toleransı."""
    model_config = ConfigDict(populate_by_name=True, extra="allow")


class PersonalInfo(BaseSchema):
    """
    Kişisel iletişim ve özet bilgileri.
    
    ÖNEMLİ (KVKK & Mimari Kural):
    photo alanı istemciden gelen (localStorage tabanlı) veriyi kabul eder; ancak backend,
    veritabanına (PostgreSQL JSONB) yazmadan önce bu alanı mutlaka temizlemelidir
    (mevcut app/editor/actions.ts davranışı ve tez raporuyla birebir tutarlı).
    """
    full_name: str = Field(default="", alias="fullName", max_length=30)
    email: str = Field(default="", max_length=320)
    phone: str = Field(default="", max_length=50)
    location: Optional[str] = Field(default="", alias="address", max_length=200)
    website: Optional[str] = Field(default="", max_length=500)
    linkedin: Optional[str] = Field(default="", max_length=500)
    github: Optional[str] = Field(default="", max_length=500)
    summary: str = Field(default="", max_length=600)
    photo: Optional[str] = Field(default=None, description="Client-side only; stripped before DB persistence")


class EducationItem(BaseSchema):
    id: Optional[str] = None
    institution: str = Field(default="", alias="school", max_length=300)
    degree: str = Field(default="", max_length=200)
    field_of_study: Optional[str] = Field(default="", alias="fieldOfStudy", max_length=200)
    start_date: str = Field(default="", alias="startDate", max_length=50)
    end_date: str = Field(default="", alias="endDate", max_length=50)
    current: Optional[bool] = Field(default=False)
    gpa: Optional[str] = Field(default=None, max_length=50)
    description: Optional[str] = Field(default="", max_length=1500)


class ExperienceItem(BaseSchema):
    id: Optional[str] = None
    company: str = Field(default="", max_length=200)
    position: str = Field(default="", max_length=60)
    location: Optional[str] = Field(default="", max_length=200)
    start_date: str = Field(default="", alias="startDate", max_length=50)
    end_date: str = Field(default="", alias="endDate", max_length=50)
    current: Optional[bool] = Field(default=False)
    description: str = Field(default="", max_length=1200)
    highlights: List[ShortText] = Field(default_factory=list, max_length=30)


class SkillItem(BaseSchema):
    id: Optional[str] = None
    name: ShortText
    level: Optional[str] = Field(default=None, max_length=100)
    category: Optional[str] = Field(default=None, max_length=100)


# Eleman seviyesinde union: Liste içinde hem nesneler hem saf string'ler güvenle desteklenir
SkillList = List[Union[SkillItem, ShortText]]


class ProjectItem(BaseSchema):
    id: Optional[str] = None
    title: str = Field(default="", alias="name", max_length=300)
    description: str = Field(default="", max_length=800)
    technologies: List[ShortText] = Field(default_factory=list, max_length=50)
    link: Optional[str] = Field(default="", max_length=500)
    github_link: Optional[str] = Field(default=None, alias="githubLink", max_length=500)


class CertificateItem(BaseSchema):
    id: Optional[str] = None
    name: str = Field(default="", max_length=300)
    issuer: str = Field(default="", max_length=300)
    issue_date: str = Field(default="", alias="date", max_length=50)
    expiry_date: Optional[str] = Field(default=None, alias="expiryDate", max_length=50)
    url: Optional[str] = Field(default="", alias="link", max_length=500)


class LanguageItem(BaseSchema):
    id: Optional[str] = None
    language: str = Field(default="", max_length=100)
    proficiency: str = Field(default="", alias="level", max_length=100)


class CustomSectionItem(BaseSchema):
    """Kullanıcının ekleyebileceği dinamik alanlar (yayınlar, patentler, gönüllülük vb.)."""
    id: Optional[str] = None
    title: str = Field(default="", max_length=200)
    content: Optional[str] = Field(default=None, max_length=3000)
    items: List[str] = Field(default_factory=list, max_length=50)


class ResumeMeta(BaseSchema):
    language: str = Field(default="tr", max_length=10)


class ResumeContent(BaseSchema):
    """
    resume.content (JSONB) alanının ana hiyerarşik veri modeli.
    extra='allow' sayesinde kullanıcı veya modern şablonların ekleyebileceği
    dinamik alanlar ValidationError fırlatmaz ve korunur.
    """
    personal_info: PersonalInfo = Field(default_factory=PersonalInfo, alias="personalInfo")
    education: List[EducationItem] = Field(default_factory=list)
    experience: List[ExperienceItem] = Field(default_factory=list)
    skills: SkillList = Field(default_factory=list)
    projects: List[ProjectItem] = Field(default_factory=list)
    certificates: List[CertificateItem] = Field(default_factory=list)
    languages: List[LanguageItem] = Field(default_factory=list)
    custom_sections: List[CustomSectionItem] = Field(default_factory=list, alias="customSections")
    meta: ResumeMeta = Field(default_factory=ResumeMeta)
    template_id: str = Field(default="classic", alias="templateId", description="CV şablon kimliği (örn. 'classic', 'modern')")

    @model_validator(mode="after")
    def enforce_total_json_size(self):
        validate_resume_json_size(self.model_dump(by_alias=True, mode="json", exclude_none=False))
        return self


def validate_resume_json_size(value):
    encoded = json.dumps(value, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    if len(encoded) > MAX_RESUME_JSON_BYTES:
        raise ValueError(f"CV içeriği {MAX_RESUME_JSON_BYTES} bayt sınırını aşıyor.")
    return value


# --- CRUD Şemaları ---

class ResumeBase(BaseSchema):
    title: str = Field(default="Untitled Resume", max_length=200)


class ResumeCreate(ResumeBase):
    content: ResumeContent = Field(default_factory=ResumeContent)


class ResumeUpdate(BaseSchema):
    title: Optional[str] = None
    content: Optional[ResumeContent] = None


class ResumeResponse(ResumeBase):
    """SQLAlchemy ORM modellerinden doğrudan dönüşüm için from_attributes=True aktif."""
    model_config = ConfigDict(populate_by_name=True, from_attributes=True, extra="allow")

    id: str
    user_id: str = Field(alias="userId", validation_alias=AliasChoices("userId", "user_id"))
    title: str
    # Keep reads compatible with CVs saved before field limits were introduced.
    # Create/update request models still validate and enforce the current limits.
    content: Dict[str, Any]
    created_at: Optional[datetime] = Field(default=None, alias="createdAt", validation_alias=AliasChoices("createdAt", "created_at"))
    updated_at: Optional[datetime] = Field(default=None, alias="updatedAt", validation_alias=AliasChoices("updatedAt", "updated_at"))
