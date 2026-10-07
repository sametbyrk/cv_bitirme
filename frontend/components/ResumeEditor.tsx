'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useResume } from '@/context/ResumeContext';
import { Download, Save, ArrowLeft, Sparkles, Loader2, Trash2, Check, CheckCircle2 } from 'lucide-react';
import { pdf, Document, Page, Text, View, StyleSheet, Image, Link as PdfLink } from '@react-pdf/renderer';
import { EducationForm, ExperienceForm, ProjectsForm, CertificatesForm, LanguagesForm } from '@/components/ResumeForms';
import { SkillsForm } from '@/components/SkillsForm';
import { ResumePreviewHTML } from '@/components/ResumePreviewHTML';
import { saveResume } from '@/app/editor/actions';
import { useSearchParams, useRouter } from 'next/navigation';
import { translateResumeUi } from '@/lib/resume-translations';

// --- Form Components - Personal Info ---
const TRANSLATIONS = {
    en: { choosePhoto: 'Choose Photo' },
    tr: { choosePhoto: 'Fotoğraf Seç' },
    de: { choosePhoto: 'Bild Auswählen' },
    es: { choosePhoto: 'Elegir Foto' },
    fr: { choosePhoto: 'Choisir Photo' },
};

const PersonalInfoForm = () => {
    const { resumeData, updatePersonalInfo } = useResume();
    const langCode = (resumeData.meta?.language || 'en') as keyof typeof TRANSLATIONS;
    const t = TRANSLATIONS[langCode] || TRANSLATIONS['en'];
    const ui = (text: string) => translateResumeUi(text, langCode);

    return (
        <div className="space-y-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                {ui('Personal Information')}
            </h3>
            
            {/* Photo Upload Section */}
            <div className="mb-4 flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gray-200 border-2 border-gray-300 flex items-center justify-center overflow-hidden shrink-0">
                    {resumeData.personalInfo.photo ? (
                        <img src={resumeData.personalInfo.photo} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-gray-400 text-[10px] text-center px-1">{ui('Photo')}</span>
                    )}
                </div>
                <div className="flex-1">
                    <label className="block text-sm font-medium text-black mb-1">{ui('Profile Photo (Optional & Private)')}</label>
                    <div className="flex items-center gap-2">
                        <label className="cursor-pointer bg-blue-50 text-blue-700 px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-blue-100 transition-colors">
                            {t.choosePhoto}
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                            updatePersonalInfo('photo', reader.result as string);
                                        };
                                        reader.readAsDataURL(file);
                                    }
                                }}
                            />
                        </label>
                        {resumeData.personalInfo.photo && (
                            <button
                                onClick={() => updatePersonalInfo('photo', '')}
                                className="text-red-500 hover:text-red-700 p-1.5 rounded-md hover:bg-red-50 transition-colors"
                                title={ui('Remove Photo')}
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">{ui('Photo is saved to your browser only. It will not be stored in our database.')}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-black mb-1">{ui('Full Name')}</label>
                    <input
                        type="text"
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white placeholder-gray-400"
                        value={resumeData.personalInfo.fullName}
                        onChange={(e) => updatePersonalInfo('fullName', e.target.value)}
                        placeholder={ui('e.g. John Doe')}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-black mb-1">{ui('Email')}</label>
                    <input
                        type="email"
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white placeholder-gray-400"
                        value={resumeData.personalInfo.email}
                        onChange={(e) => updatePersonalInfo('email', e.target.value)}
                        placeholder={ui('e.g. john@example.com')}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-black mb-1">{ui('Phone')}</label>
                    <input
                        type="tel"
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white placeholder-gray-400"
                        value={resumeData.personalInfo.phone}
                        onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                        placeholder={ui('e.g. +1 234 567 890')}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-black mb-1">{ui('LinkedIn URL (Optional)')}</label>
                    <input
                        type="text"
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white placeholder-gray-400"
                        value={resumeData.personalInfo.linkedin}
                        onChange={(e) => updatePersonalInfo('linkedin', e.target.value)}
                        placeholder={ui('e.g. linkedin.com/in/johndoe')}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-black mb-1">{ui('GitHub URL (Optional)')}</label>
                    <input
                        type="text"
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white placeholder-gray-400"
                        value={resumeData.personalInfo.github || ''}
                        onChange={(e) => updatePersonalInfo('github', e.target.value)}
                        placeholder={ui('e.g. github.com/johndoe')}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-black mb-1">{ui('Location / Address')}</label>
                    <input
                        type="text"
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white placeholder-gray-400"
                        value={resumeData.personalInfo.address || ''}
                        onChange={(e) => updatePersonalInfo('address', e.target.value)}
                        placeholder={ui('e.g. Istanbul, Turkey')}
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-black mb-1">{ui('Summary')}</label>
                    <textarea
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 text-black bg-white placeholder-gray-400"
                        value={resumeData.personalInfo.summary}
                        onChange={(e) => updatePersonalInfo('summary', e.target.value)}
                        placeholder={ui('Briefly describe your professional background and key achievements...')}
                    />
                </div>
            </div>
        </div>
    );
};

// --- PDF Generation Logic ---
const styles = StyleSheet.create({
    page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#333' },
    header: { marginBottom: 20, borderBottom: '1px solid #ddd', paddingBottom: 16 },
    name: { fontSize: 24, fontWeight: 'bold', marginBottom: 6, textTransform: 'uppercase', color: '#111' },
    contactRow: { flexDirection: 'row', gap: 16, flexWrap: 'wrap', marginTop: 4 },
    contactItem: { fontSize: 9, color: '#555' },
    section: { marginBottom: 16 },
    sectionTitle: { fontSize: 11, fontWeight: 'bold', marginBottom: 8, textTransform: 'uppercase', color: '#2563EB', borderBottom: '1px solid #eee', paddingBottom: 4, letterSpacing: 1 },
    experienceBlock: { marginBottom: 10 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
    institution: { fontWeight: 'bold', fontSize: 10, color: '#000' },
    date: { fontSize: 9, color: '#666' },
    subtitle: { fontSize: 9, color: '#444', fontStyle: 'italic', marginBottom: 4 },
    description: { fontSize: 9, color: '#333', lineHeight: 1.5 },
    skillsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    skillBadge: { fontSize: 9, color: '#333', backgroundColor: '#f3f4f6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3 },
});


const SECTION_TITLES = {
    en: { experience: 'Experience', education: 'Education', skills: 'Skills', languages: 'Languages', projects: 'Projects', certificates: 'Certificates', personalInfo: 'Personal Info', summary: 'Summary', email: 'Email', phone: 'Phone', linkedin: 'LinkedIn', github: 'GitHub', location: 'Location' },
    tr: { experience: 'İş Deneyimi', education: 'Eğitim', skills: 'Yetenekler', languages: 'Diller', projects: 'Projeler', certificates: 'Sertifikalar', personalInfo: 'Kişisel Bilgiler', summary: 'Özet', email: 'E-posta', phone: 'Telefon', linkedin: 'LinkedIn', github: 'GitHub', location: 'Konum' },
    de: { experience: 'Berufserfahrung', education: 'Ausbildung', skills: 'Fähigkeiten', languages: 'Sprachen', projects: 'Projekte', certificates: 'Zertifikate', personalInfo: 'Persönliche Infos', summary: 'Zusammenfassung', email: 'E-Mail', phone: 'Telefon', linkedin: 'LinkedIn', github: 'GitHub', location: 'Standort' },
    es: { experience: 'Experiencia', education: 'Educación', skills: 'Habilidades', languages: 'Idiomas', projects: 'Proyectos', certificates: 'Certificados', personalInfo: 'Información personal', summary: 'Resumen profesional', email: 'Correo electrónico', phone: 'Teléfono', linkedin: 'LinkedIn', github: 'GitHub', location: 'Ubicación' },
    fr: { experience: 'Expérience', education: 'Éducation', skills: 'Compétences', languages: 'Langues', projects: 'Projets', certificates: 'Certificats', personalInfo: 'Informations personnelles', summary: 'Résumé professionnel', email: 'E-mail', phone: 'Téléphone', linkedin: 'LinkedIn', github: 'GitHub', location: 'Localisation' },
};

const RESUME_LANGUAGE_NAMES: Record<string, string> = {
    en: 'English', tr: 'Türkçe', de: 'Deutsch', es: 'Español', fr: 'Français',
};

function normalizeExternalUrl(value?: string) {
    const input = value?.trim();
    if (!input) return undefined;
    const candidate = /^[a-z][a-z\d+.-]*:/i.test(input) ? input : `https://${input}`;
    try {
        const url = new URL(candidate);
        return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : undefined;
    } catch {
        return undefined;
    }
}

const ResumePDF = ({ data }: { data: any }) => {
    const langCode = (data.meta?.language || 'en') as keyof typeof SECTION_TITLES;
    const titles = SECTION_TITLES[langCode] || SECTION_TITLES['en'];

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={[styles.header, { flexDirection: 'row', alignItems: 'flex-start', gap: 16 }]}>
                    {data.personalInfo.photo && (
                        <Image 
                            src={data.personalInfo.photo} 
                            style={{ width: 60, height: 60, borderRadius: 30, objectFit: 'cover', marginRight: 16 }} 
                        />
                    )}
                    <View style={{ flex: 1 }}>
                        <Text style={styles.name}>{data.personalInfo.fullName || 'YOUR NAME'}</Text>
                        <View style={styles.contactRow}>
                            {data.personalInfo.email && <Text style={styles.contactItem}>{titles.email}: {data.personalInfo.email}</Text>}
                            {data.personalInfo.phone && <Text style={styles.contactItem}>{titles.phone}: {data.personalInfo.phone}</Text>}
                            {data.personalInfo.linkedin && <Text style={styles.contactItem}>{titles.linkedin}: {data.personalInfo.linkedin}</Text>}
                            {data.personalInfo.github && <Text style={styles.contactItem}>{titles.github}: {data.personalInfo.github}</Text>}
                            {data.personalInfo.address && <Text style={styles.contactItem}>{titles.location}: {data.personalInfo.address}</Text>}
                        </View>
                    </View>
                </View>
                {data.personalInfo.summary && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{titles.summary}</Text>
                        <Text style={{ fontSize: 9, lineHeight: 1.5 }}>{data.personalInfo.summary}</Text>
                    </View>
                )}
                {data.experience.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{titles.experience}</Text>
                        {data.experience.map((exp: any, i: number) => (
                            <View key={i} style={styles.experienceBlock}>
                                <View style={styles.row}>
                                    <View style={{ width: '75%' }}>
                                        <Text style={styles.institution}>{exp.position}</Text>
                                        <Text style={styles.subtitle}>{exp.company}</Text>
                                    </View>
                                    <View style={{ width: '25%', alignItems: 'flex-end' }}>
                                        <Text style={styles.date}>{exp.startDate} - {exp.endDate}</Text>
                                    </View>
                                </View>
                                <Text style={styles.description}>{exp.description}</Text>
                            </View>
                        ))}
                    </View>
                )}
                {(data.projects || []).length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{titles.projects}</Text>
                        {data.projects.map((proj: any, i: number) => (
                            <View key={i} style={styles.experienceBlock}>
                                <View style={styles.row}>
                                    <View style={{ width: '75%' }}>
                                        <Text style={styles.institution}>{proj.name}</Text>
                                        {proj.link && <Text style={styles.subtitle}>{proj.link}</Text>}
                                    </View>
                                </View>
                                {proj.description && <Text style={styles.description}>{proj.description}</Text>}
                            </View>
                        ))}
                    </View>
                )}
                {data.education.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{titles.education}</Text>
                        {data.education.map((edu: any, i: number) => (
                            <View key={i} style={styles.experienceBlock}>
                                <View style={styles.row}>
                                    <View style={{ width: '75%' }}>
                                        <Text style={styles.institution}>{edu.school}</Text>
                                        <Text style={styles.subtitle}>{edu.degree}</Text>
                                    </View>
                                    <View style={{ width: '25%', alignItems: 'flex-end' }}>
                                        <Text style={styles.date}>{edu.startDate} - {edu.endDate}</Text>
                                    </View>
                                </View>
                                {edu.description && <Text style={styles.description}>{edu.description}</Text>}
                            </View>
                        ))}
                    </View>
                )}
                {data.skills.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{titles.skills}</Text>
                        <View style={styles.skillsContainer}>
                            {data.skills.map((skill: string, i: number) => (
                                <Text key={i} style={styles.skillBadge}>{skill}</Text>
                            ))}
                        </View>
                    </View>
                )}
                {(data.languages || []).length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{titles.languages}</Text>
                        <View style={styles.skillsContainer}>
                            {(data.languages || []).map((lang: any, i: number) => (
                                <Text key={i} style={styles.skillBadge}>{lang.language}: {translateResumeUi(lang.level, data.meta?.language)}</Text>
                            ))}
                        </View>
                    </View>
                )}
                {(data.certificates || []).length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{titles.certificates}</Text>
                        <View style={styles.skillsContainer}>
                            {(data.certificates || []).map((cert: any, i: number) => (
                                <View key={i} style={{ marginBottom: 5 }}>
                                    <Text style={styles.institution}>{cert.name}{cert.issuer ? ` (${cert.issuer})` : ''}{cert.date ? ` · ${cert.date}` : ''}</Text>
                                    {normalizeExternalUrl(cert.link) && (
                                        <PdfLink src={normalizeExternalUrl(cert.link)!}>
                                            <Text style={{ fontSize: 8, color: '#2563EB' }}>{normalizeExternalUrl(cert.link)}</Text>
                                        </PdfLink>
                                    )}
                                </View>
                            ))}
                        </View>
                    </View>
                )}
            </Page>
        </Document>
    );
};

const readChangedField = (resume: any, path: string): string => {
    const match = path.match(/^(\w+)(?:\[(\d+)\])?\.(\w+)$/);
    if (!match) return '';
    const [, section, index, field] = match;
    const value = index === undefined ? resume?.[section]?.[field] : resume?.[section]?.[Number(index)]?.[field];
    return Array.isArray(value) ? value.join(', ') : String(value ?? '');
};

export const ResumeEditor = ({ resumeId }: { isPremium?: boolean; resumeId?: string }) => {
    const { resumeData, setResumeData } = useResume();
    const ui = (text: string) => translateResumeUi(text, resumeData.meta?.language);
    const selectedLanguage = resumeData.meta?.language || 'en';
    const selectedLanguageName = RESUME_LANGUAGE_NAMES[selectedLanguage] || RESUME_LANGUAGE_NAMES.en;
    const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
    const [isDownloading, setIsDownloading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Auto-Tailor Modal State
    const [isJobModalOpen, setIsJobModalOpen] = useState(false);
    const [jobDescriptionInput, setJobDescriptionInput] = useState("");
    const [isTailoring, setIsTailoring] = useState(false);
    const [pendingTailor, setPendingTailor] = useState<{
        updated: any;
        changedFields: string[];
        tailoringNotes: string[];
        suggestedSkills: string[];
    } | null>(null);

    // Read URL params for template selection
    const searchParams = useSearchParams();
    const router = useRouter();

    React.useEffect(() => {
        const templateParam = searchParams.get('template');
        if (templateParam === 'modern') {
            setResumeData(prev => ({ ...prev, templateId: 'modern' }));
        } else if (templateParam === 'classic') {
            setResumeData(prev => ({ ...prev, templateId: 'classic' }));
        }
    }, [searchParams, setResumeData]);

    const handleJobTailor = async () => {
        setIsTailoring(true);
        try {
            const response = await fetch('/api/ai/tailor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jobDescription: jobDescriptionInput,
                    currentResume: resumeData,
                    targetLanguage: resumeData.meta?.language || 'en',
                })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || data.error || `API Error: ${response.status}`);
            }

            const updated = data.updatedContent;
            if (!updated) throw new Error('AI response did not include updated resume content.');

            setPendingTailor({
                updated,
                changedFields: data.changedFields || [],
                tailoringNotes: data.tailoringNotes || [],
                suggestedSkills: data.suggestedSkills || [],
            });
            setIsJobModalOpen(false);
        } catch (e: any) {
            console.error("Tailor Error:", e);
            alert("Failed to tailor resume: " + e.message);
        } finally {
            setIsTailoring(false);
        }
    };

    const acceptTailorChanges = () => {
        if (!pendingTailor) return;
        const { updated } = pendingTailor;
        setResumeData(prev => ({
            ...prev,
            personalInfo: { ...prev.personalInfo, summary: updated.personalInfo?.summary ?? prev.personalInfo.summary },
            experience: prev.experience.map((exp, index) => {
                const item = updated.experience?.find((candidate: any) => candidate.id && candidate.id === exp.id)
                    ?? updated.experience?.[index];
                return item ? { ...exp, description: item.description ?? exp.description, highlights: item.highlights ?? exp.highlights } : exp;
            }),
            projects: prev.projects.map((project, index) => {
                const item = updated.projects?.find((candidate: any) => candidate.id && candidate.id === project.id)
                    ?? updated.projects?.[index];
                return item ? { ...project, description: item.description ?? project.description } : project;
            }),
            skills: [...new Set([...prev.skills, ...pendingTailor.suggestedSkills])],
        }));
        setPendingTailor(null);
    };

    const handleTemplateChange = (id: 'classic' | 'modern') => {
        setResumeData(prev => ({ ...prev, templateId: id }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveSuccess(false);
        try {
            // Check if we are in create mode (no resumeId) and creating a 4th resume (if free)
            // The server action 'saveResume' handles the DB check, we just need to catch the error.

            const result = await saveResume(resumeData, resumeId);

            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);

            if (result?.newId) {
                // We created a new resume. Redirect to its specific URL to prevent duplicate creations on subsequent saves.
                // Using replace so the back button works expectedly (or push if you prefer history).
                router.replace(`/editor/${result.newId}`);
            } else {
                // Update success (already on the page)
            }
        } catch (error: any) {
            console.error("Save error:", error);
            if (error.message.includes("Free limit")) {
                if (confirm("You've reached the free limit of 3 resumes. Upgrade to Pro to create more?")) {
                    router.push('/pricing');
                }
            } else {
                alert("Failed to save: " + error.message);
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleDownloadPDF = async () => {
        setIsDownloading(true);
        try {
            const blob = await pdf(<ResumePDF data={resumeData} />).toBlob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${resumeData.personalInfo.fullName || 'resume'}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Download failed", error);
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="flex flex-col md:flex-row h-screen bg-gray-100 overflow-hidden relative">
            {/* Save Success Toast */}
            {saveSuccess && (
                <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-2xl transition-all animate-bounce">
                    <CheckCircle2 size={20} className="text-white shrink-0" />
                    <span className="text-sm font-semibold">{ui('Resume saved successfully!')}</span>
                </div>
            )}

            {/* Editor Section (Left) */}
            <div className={`w-full md:w-1/2 overflow-y-auto p-4 md:p-6 border-r border-gray-200 bg-gray-50 h-full ${activeTab === 'preview' ? 'hidden md:block' : ''}`}>
                <div className="max-w-2xl mx-auto space-y-6 pb-20">
                    <div className="flex items-center justify-between mb-8 sticky top-0 bg-gray-50 z-20 py-2 border-b border-gray-200">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard" className="p-2 hover:bg-gray-200 rounded-full text-gray-600 transition" title={ui('Back to Dashboard')}>
                                <ArrowLeft size={24} />
                            </Link>
                            <h1 className="text-xl md:text-2xl font-bold text-black">{ui('CV Editor')}</h1>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className={`flex items-center gap-1 md:gap-2 px-3 py-2 rounded-md text-xs md:text-sm font-medium shadow-md transition-all disabled:opacity-50 ${
                                    saveSuccess
                                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                            >
                                {isSaving ? (
                                    <><Loader2 className="animate-spin" size={16} /> <span className="hidden sm:inline">{ui('Saving...')}</span></>
                                ) : saveSuccess ? (
                                    <><Check size={16} /> <span className="hidden sm:inline">{ui('Saved!')}</span></>
                                ) : (
                                    <><Save size={16} /> <span className="hidden sm:inline">{ui('Save')}</span></>
                                )}
                            </button>
                            <button
                                onClick={handleDownloadPDF}
                                disabled={isDownloading}
                                className="flex items-center gap-1 md:gap-2 px-3 py-2 bg-green-600 text-white rounded-md text-xs md:text-sm hover:bg-green-700 shadow-md transition-all disabled:opacity-50"
                            >
                                {isDownloading ? ui('Generating...') : <><Download size={16} /> <span className="hidden sm:inline">PDF</span></>}
                            </button>
                        </div>
                    </div>

                    {/* Template & Language Selector */}
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-6">
                        <div className="flex justify-between items-center mb-4">
                            <label className="text-sm font-semibold text-gray-700">{ui('Settings')}</label>
                        </div>

                        <div className="space-y-4">
                            {/* Language Settings */}
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-2">{ui('Resume Language')}</label>
                                <select
                                    className="w-full p-2 border border-gray-300 rounded-md text-sm text-black bg-white"
                                    value={resumeData.meta?.language || 'en'}
                                    onChange={(e) => setResumeData(prev => ({ ...prev, meta: { ...prev.meta, language: e.target.value } }))}
                                >
                                    <option value="en">English</option>
                                    <option value="tr">Türkçe</option>
                                    <option value="de">Deutsch</option>
                                    <option value="es">Español</option>
                                    <option value="fr">Français</option>
                                </select>
                                <p className="text-[10px] text-gray-400 mt-1">{ui('Changes section titles and AI response language.')}</p>
                            </div>

                            {/* Template Settings */}
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-2">{ui('Template')}</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => handleTemplateChange('classic')}
                                        className={`p-3 border rounded-lg text-left flex flex-col gap-1 transition-all ${resumeData.templateId === 'classic' || !resumeData.templateId ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'}`}
                                    >
                                        <span className="font-bold text-gray-900 text-sm">Classic</span>
                                        <span className="text-[10px] text-gray-500">Clean</span>
                                    </button>

                                    <button
                                        onClick={() => handleTemplateChange('modern')}
                                        className={`p-3 border rounded-lg text-left flex flex-col gap-1 transition-all relative ${resumeData.templateId === 'modern' ? 'border-purple-600 bg-purple-50 ring-2 ring-purple-200' : 'border-gray-200 hover:border-gray-300'}`}
                                    >
                                        <span className="font-bold text-gray-900 text-sm">Modern</span>
                                        <span className="text-[10px] text-gray-500">Ivy League</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* AI Job Match (New Feature) */}
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 rounded-lg text-white shadow-lg mb-6">
                        <h3 className="flex items-center gap-2 font-bold text-lg mb-2">
                            <Sparkles size={20} className="text-yellow-300" /> {ui('Auto-Tailor')}
                        </h3>
                        <p className="text-xs text-indigo-100 mb-4">
                            {ui('Paste Job Description to optimize. Language:')} <span className="font-bold">{selectedLanguageName}</span>
                        </p>
                        <button
                            onClick={() => setIsJobModalOpen(true)}
                            className="w-full bg-white text-indigo-600 font-bold py-2 rounded shadow hover:bg-indigo-50 transition text-sm"
                        >
                            {ui('Tailor my Resume')}
                        </button>
                    </div>

                    {/* Job Match Modal */}
                    {isJobModalOpen && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in duration-200">
                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-black">
                            <Sparkles className="text-purple-600" /> {ui('Tailor Resume to Job')}
                                </h3>
                                <p className="text-sm text-gray-600 mb-4">
                                    {ui('Paste the job description or internship details here. We will optimize your CV to match their requirements in')} <span className="font-bold">{selectedLanguageName}</span>.
                                </p>
                                <textarea
                                    className="w-full h-40 border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 mb-4 text-black"
                                    placeholder={ui('Paste job description here...')}
                                    value={jobDescriptionInput}
                                    onChange={(e) => setJobDescriptionInput(e.target.value)}
                                />
                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => {
                                            setIsJobModalOpen(false);
                                            setJobDescriptionInput(''); // Clear input on cancel
                                        }}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
                                    >
                                        {ui('Cancel')}
                                    </button>
                                    <button
                                        onClick={handleJobTailor}
                                        disabled={isTailoring || jobDescriptionInput.length < 50}
                                        className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg text-sm font-bold shadow hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {isTailoring ? <><Loader2 className="animate-spin" size={16} /> {ui('Analyzing...')}</> : ui('Analyze & Optimize')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {pendingTailor && (
                        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
                            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col">
                                <div className="p-5 border-b">
                                    <h3 className="text-xl font-bold text-gray-900">Review resume changes</h3>
                                    <p className="text-sm text-gray-600 mt-1">Nothing is applied until you accept. Closing this preview discards the suggestions.</p>
                                </div>
                                <div className="p-5 overflow-y-auto space-y-5">
                                    {pendingTailor.changedFields.map((path) => (
                                        <section key={path} className="border rounded-lg overflow-hidden">
                                            <h4 className="px-3 py-2 bg-gray-50 font-semibold text-sm text-gray-800">{path}</h4>
                                            <div className="grid md:grid-cols-2">
                                                <div className="p-3 border-t md:border-r">
                                                    <div className="text-xs font-bold text-red-700 mb-1">BEFORE</div>
                                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{readChangedField(resumeData, path) || '(empty)'}</p>
                                                </div>
                                                <div className="p-3 border-t">
                                                    <div className="text-xs font-bold text-emerald-700 mb-1">AFTER</div>
                                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{readChangedField(pendingTailor.updated, path) || '(empty)'}</p>
                                                </div>
                                            </div>
                                        </section>
                                    ))}
                                    {pendingTailor.changedFields.length === 0 && <p className="text-sm text-gray-600">No resume text changes were suggested.</p>}
                                    {pendingTailor.suggestedSkills.length > 0 && (
                                        <section className="rounded-lg bg-indigo-50 p-4">
                                            <h4 className="font-semibold text-sm text-indigo-900">Skills found in your existing CV</h4>
                                            <p className="text-xs text-indigo-800 mt-1">These are suggestions only and will be added to Skills if you accept.</p>
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {pendingTailor.suggestedSkills.map(skill => <span key={skill} className="rounded-full bg-white border border-indigo-200 px-3 py-1 text-sm text-indigo-900">{skill}</span>)}
                                            </div>
                                        </section>
                                    )}
                                    {pendingTailor.tailoringNotes.length > 0 && (
                                        <section className="rounded-lg bg-gray-50 p-4">
                                            <h4 className="font-semibold text-sm text-gray-800">Tailoring notes</h4>
                                            <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-gray-700">
                                                {pendingTailor.tailoringNotes.map((note, index) => <li key={index}>{note}</li>)}
                                            </ul>
                                        </section>
                                    )}
                                </div>
                                <div className="p-4 border-t flex justify-end gap-3">
                                    <button onClick={() => setPendingTailor(null)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Discard</button>
                                    <button onClick={acceptTailorChanges} className="px-5 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700">Accept changes</button>
                                </div>
                            </div>
                        </div>
                    )}

                    <PersonalInfoForm />
                    <ExperienceForm />
                    <ProjectsForm />
                    <EducationForm />
                    <CertificatesForm />
                    <LanguagesForm />
                    <SkillsForm />
                </div>
            </div>

            {/* Preview Section (Right) */}
            <div className={`w-full md:w-1/2 bg-gray-600 p-4 md:p-8 flex justify-center overflow-y-auto scrollbar-hide h-full ${activeTab === 'editor' ? 'hidden md:flex' : 'flex'}`}>
                <div className="origin-top transform scale-[0.45] sm:scale-[0.55] md:scale-[0.8] lg:scale-[0.9] xl:scale-100 transition-all duration-300 mt-4 md:mt-0">
                    <ResumePreviewHTML />
                </div>
            </div>

            {/* Mobile Tab Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex md:hidden z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                <button
                    onClick={() => setActiveTab('editor')}
                    className={`flex-1 p-4 text-center font-bold text-sm ${activeTab === 'editor' ? 'text-blue-600 bg-blue-50' : 'text-gray-500'}`}
                >
                    📝 Editor
                </button>
                <button
                    onClick={() => setActiveTab('preview')}
                    className={`flex-1 p-4 text-center font-bold text-sm ${activeTab === 'preview' ? 'text-blue-600 bg-blue-50' : 'text-gray-500'}`}
                >
                    👁️ Preview
                </button>
            </div>
        </div>
    );
};
