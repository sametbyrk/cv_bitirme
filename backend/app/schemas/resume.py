"""
Resume Pydantic v2 Models for Vitascor Platform.
Synchronized with prisma/schema.prisma and frontend TypeScript types (context/ResumeContext.tsx).
"""

from datetime import datetime
from typing import Optional, List, Union
from pydantic import BaseModel, ConfigDict, Field, AliasChoices


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
    full_name: str = Field(default="", alias="fullName")
    email: str = Field(default="")
    phone: str = Field(default="")
    location: Optional[str] = Field(default="", alias="address")
    website: Optional[str] = Field(default="")
    linkedin: Optional[str] = Field(default="")
    github: Optional[str] = Field(default="")
    summary: str = Field(default="")
    photo: Optional[str] = Field(default=None, description="Client-side only; stripped before DB persistence")


class EducationItem(BaseSchema):
    id: Optional[str] = None
    institution: str = Field(default="", alias="school")
    degree: str = Field(default="")
    field_of_study: Optional[str] = Field(default="", alias="fieldOfStudy")
    start_date: str = Field(default="", alias="startDate")
    end_date: str = Field(default="", alias="endDate")
    current: Optional[bool] = Field(default=False)
    gpa: Optional[str] = Field(default=None)
    description: Optional[str] = Field(default="")


class ExperienceItem(BaseSchema):
    id: Optional[str] = None
    company: str = Field(default="")
    position: str = Field(default="")
    location: Optional[str] = Field(default="")
    start_date: str = Field(default="", alias="startDate")
    end_date: str = Field(default="", alias="endDate")
    current: Optional[bool] = Field(default=False)
    description: str = Field(default="")
    highlights: List[str] = Field(default_factory=list)


class SkillItem(BaseSchema):
    id: Optional[str] = None
    name: str
    level: Optional[str] = None
    category: Optional[str] = None


# Eleman seviyesinde union: Liste içinde hem nesneler hem saf string'ler güvenle desteklenir
SkillList = List[Union[SkillItem, str]]


class ProjectItem(BaseSchema):
    id: Optional[str] = None
    title: str = Field(default="", alias="name")
    description: str = Field(default="")
    technologies: List[str] = Field(default_factory=list)
    link: Optional[str] = Field(default="")
    github_link: Optional[str] = Field(default=None, alias="githubLink")


class CertificateItem(BaseSchema):
    id: Optional[str] = None
    name: str = Field(default="")
    issuer: str = Field(default="")
    issue_date: str = Field(default="", alias="date")
    expiry_date: Optional[str] = Field(default=None, alias="expiryDate")
    url: Optional[str] = Field(default="", alias="link")


class LanguageItem(BaseSchema):
    id: Optional[str] = None
    language: str = Field(default="")
    proficiency: str = Field(default="", alias="level")


class CustomSectionItem(BaseSchema):
    """Kullanıcının ekleyebileceği dinamik alanlar (yayınlar, patentler, gönüllülük vb.)."""
    id: Optional[str] = None
    title: str = Field(default="")
    content: Optional[str] = None
    items: List[str] = Field(default_factory=list)


class ResumeMeta(BaseSchema):
    language: str = Field(default="tr")


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


# --- CRUD Şemaları ---

class ResumeBase(BaseSchema):
    title: str = Field(default="Başlıksız Özgeçmiş")


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
    content: ResumeContent
    created_at: Optional[datetime] = Field(default=None, alias="createdAt", validation_alias=AliasChoices("createdAt", "created_at"))
    updated_at: Optional[datetime] = Field(default=None, alias="updatedAt", validation_alias=AliasChoices("updatedAt", "updated_at"))
