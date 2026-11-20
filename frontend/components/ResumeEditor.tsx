'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { useResume, type ResumeData } from '@/context/ResumeContext';
import { Download, Save, ArrowLeft, Sparkles, Loader2, Trash2, Check, CheckCircle2 } from 'lucide-react';
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
                        <NextImage src={resumeData.personalInfo.photo} alt="Profile photo" width={64} height={64} unoptimized className="w-full h-full object-cover" />
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
                        maxLength={30}
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
                        maxLength={320}
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
                        maxLength={50}
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
                        maxLength={500}
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
                        maxLength={500}
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
                        maxLength={200}
                        placeholder={ui('e.g. Istanbul, Turkey')}
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-black mb-1">{ui('Summary')}</label>
                    <textarea
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 text-black bg-white placeholder-gray-400"
                        value={resumeData.personalInfo.summary}
                        onChange={(e) => updatePersonalInfo('summary', e.target.value)}
                        maxLength={600}
                        placeholder={ui('Briefly describe your professional background and key achievements...')}
                    />
                </div>
            </div>
        </div>
    );
};

const RESUME_LANGUAGE_NAMES: Record<string, string> = { en: 'English', tr: 'Türkçe', de: 'Deutsch', es: 'Español', fr: 'Français' };

const readChangedField = (resume: ResumeData, path: string): string => {
    const match = path.match(/^(\w+)(?:\[(\d+)\])?\.(\w+)$/);
    if (!match) return '';
    const [, section, index, field] = match;
    const sectionValue = (resume as unknown as Record<string, unknown>)[section];
    const target = index === undefined
        ? sectionValue
        : Array.isArray(sectionValue) ? sectionValue[Number(index)] : undefined;
    if (typeof target !== 'object' || target === null || Array.isArray(target)) return '';
    const value = (target as Record<string, unknown>)[field];
    return Array.isArray(value) ? value.join(', ') : String(value ?? '');
};

type PendingTailorDraft = {
    updated: ResumeData;
    changedFields: string[];
    tailoringNotes: string[];
    suggestedSkills: string[];
    jobDescription: string;
    iterationCount: number;
};

type TailorResponse = {
    updatedContent?: ResumeData;
    changedFields?: string[];
    tailoringNotes?: string[];
    suggestedSkills?: string[];
    iterationCount?: number;
    detail?: unknown;
    error?: unknown;
};

type AtsKeywordMatch = {
    keyword: string;
    category: string;
    importance: 'required' | 'preferred';
    matchType: 'exact' | 'semantic' | 'missing';
      similarity?: number | null;
      credit?: number | null;
      status?: 'supporting' | null;
    matchedWith?: string | null;
    relatedSkills?: string[];
    evidence?: string | null;
    evidenceSection?: string | null;
};

type AtsMatchResult = {
    atsScore: {
        score: number;
        ruleCoverage: number;
        hybridCoverage: number;
        matched: AtsKeywordMatch[];
        semantic: AtsKeywordMatch[];
        missing: AtsKeywordMatch[];
        confidence: 'low' | 'medium';
        algorithmVersion: string;
        params: Record<string, number>;
        explanation: string;
    };
    extractedSkills: Array<{ name: string; importance: 'required' | 'preferred'; category: string; evidence: string }>;
    excludedSkillCount: number;
};

type AtsHistoryRecord = {
    id: string;
    resumeId: string | null;
    jobDescription: string;
    result: AtsMatchResult;
    createdAt: string;
};

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'An unexpected error occurred.';
}

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
    const [tailorFeedback, setTailorFeedback] = useState("");
    const [isTailoring, setIsTailoring] = useState(false);
    const [pendingTailor, setPendingTailor] = useState<PendingTailorDraft | null>(null);
    const [isMatching, setIsMatching] = useState(false);
    const [atsResult, setAtsResult] = useState<AtsMatchResult | null>(null);
    const [atsError, setAtsError] = useState<string | null>(null);
    const [showAtsLimitModal, setShowAtsLimitModal] = useState(false);
    const [atsQuotaResetAt, setAtsQuotaResetAt] = useState<string | null>(null);
    const [atsQuotaKind, setAtsQuotaKind] = useState<'free' | 'premium'>('free');
    const [atsHistory, setAtsHistory] = useState<AtsHistoryRecord[]>([]);
    const [showAtsHistory, setShowAtsHistory] = useState(false);
    const [isLoadingAtsHistory, setIsLoadingAtsHistory] = useState(false);
    const [atsHistoryError, setAtsHistoryError] = useState<string | null>(null);

    const loadAtsHistory = async () => {
        setIsLoadingAtsHistory(true);
        setAtsHistoryError(null);
        try {
            const response = await fetch('/api/ai/match', { method: 'GET', cache: 'no-store' });
            const data = await response.json() as AtsHistoryRecord[] | { error?: string };
            if (!response.ok || !Array.isArray(data)) {
                throw new Error(typeof data === 'object' && data && 'error' in data ? data.error || ui('Could not load saved ATS analyses.') : ui('Could not load saved ATS analyses.'));
            }
            setAtsHistory(data);
        } catch (error) {
            setAtsHistoryError(getErrorMessage(error));
        } finally {
            setIsLoadingAtsHistory(false);
        }
    };

    const deleteAtsHistoryItem = async (id: string) => {
        try {
            const response = await fetch('/api/ai/match', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            if (!response.ok) throw new Error(ui('Could not delete saved ATS analysis.'));
            setAtsHistory((items) => items.filter((item) => item.id !== id));
        } catch (error) {
            setAtsHistoryError(getErrorMessage(error));
        }
    };

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

    const handleJobTailor = async (previousDraft?: PendingTailorDraft) => {
        const jobDescription = previousDraft?.jobDescription ?? jobDescriptionInput;
        const feedback = previousDraft ? tailorFeedback.trim() : "";
        if (previousDraft && !feedback) return;
        setIsTailoring(true);
        try {
            const response = await fetch('/api/ai/tailor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jobDescription,
                    currentResume: resumeData,
                    targetLanguage: resumeData.meta?.language || 'en',
                    userFeedback: previousDraft ? feedback : undefined,
                    previousTailoredContent: previousDraft?.updated,
                    iterationCount: previousDraft?.iterationCount ?? 0,
                })
            });

            const data = await response.json() as TailorResponse;
            if (!response.ok) {
                const detail = data.detail ?? data.error;
                throw new Error(typeof detail === 'string' ? detail : `API Error: ${response.status}`);
            }

            const updated = data.updatedContent;
            if (!updated) throw new Error('AI response did not include updated resume content.');

            setPendingTailor({
                updated,
                changedFields: data.changedFields || [],
                tailoringNotes: data.tailoringNotes || [],
                suggestedSkills: data.suggestedSkills || [],
                jobDescription,
                iterationCount: data.iterationCount || (previousDraft?.iterationCount ?? 0) + 1,
            });
            setTailorFeedback("");
            if (!previousDraft) setIsJobModalOpen(false);
        } catch (e: unknown) {
            console.error("Tailor Error:", e);
            alert("Failed to tailor resume: " + getErrorMessage(e));
        } finally {
            setIsTailoring(false);
        }
    };

    const handleJobMatch = async () => {
        if (jobDescriptionInput.trim().length < 30) return;
        setIsMatching(true);
        setAtsResult(null);
        setAtsError(null);
        try {
            const response = await fetch('/api/ai/match', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jobDescription: jobDescriptionInput,
                    ...(resumeId ? { resumeId } : { currentResume: resumeData }),
                    targetLanguage: resumeData.meta?.language || 'en',
                }),
            });
            const data = await response.json() as AtsMatchResult & { detail?: unknown; error?: unknown };
            if (!response.ok) {
                if (response.status === 401) throw new Error(ui('Please log in to use AI features.'));
                if (response.status === 404) throw new Error(ui('The saved resume was not found or you do not have access.'));
                const detail = data.detail ?? data.error;
                const payload = detail && typeof detail === 'object' ? detail as { code?: string; message?: string; resetAt?: string | null } : null;
                const code = payload?.code ?? '';
                if (code === 'AI_QUOTA_EXCEEDED' || code === 'PREMIUM_AI_QUOTA_EXCEEDED') {
                    setAtsQuotaResetAt(payload?.resetAt ?? null);
                    setAtsQuotaKind(code === 'PREMIUM_AI_QUOTA_EXCEEDED' ? 'premium' : 'free');
                    setShowAtsLimitModal(true);
                    return;
                }
                const messages: Record<string, string> = {
                    NO_JOB_SKILLS: 'No verifiable skills could be extracted from the job description; no score was produced.',
                    NO_REQUIRED_SKILLS: 'No required skills could be verified in the job description; no score was produced.',
                    REQUIRED_UNVERIFIED: 'Required skills could not be verified in the job description.',
                    JOB_EMPTY: 'Enter a job description.', JOB_TOO_SHORT: 'The job description is too short.',
                    JOB_TOO_LONG: 'The job description exceeds 20,000 characters.', CV_TOO_LARGE: 'The resume is too large to analyze.',
                    RATE_LIMITED: 'Too many requests.',
                    RATE_LIMIT_UNAVAILABLE: 'Request limiting is temporarily unavailable.', AI_QUOTA_EXCEEDED: 'Your AI allowance has been reached.',
                    ATS_EXTRACTION_TIMEOUT: 'Job requirements could not be extracted in time.', ATS_EMBEDDING_TIMEOUT: 'Semantic matching timed out.',
                    ATS_TOTAL_TIMEOUT: 'ATS matching exceeded its time limit.', CV_NO_TEXT: 'The resume has no text that can be compared.',
                    ATS_PROVIDER_UNAVAILABLE: 'The AI matching service is temporarily unavailable.',
                    ATS_CONFIG_INVALID: 'ATS scoring parameters are invalid. Please contact support.',
                    REQUEST_BODY_TOO_LARGE: 'The request body exceeds the 256 KiB limit.',
                    QUOTA_UNAVAILABLE: 'AI quota could not be checked right now.',
                    QUOTA_FINALIZATION_FAILED: 'AI usage could not be finalized. Please retry later.',
                    PREMIUM_AI_QUOTA_EXCEEDED: 'You have reached the Pro AI limit of 50 uses in 24 hours. Try again after the limit resets.',
                    USER_NOT_FOUND: 'Your user account could not be found.',
                    INVALID_REQUEST: 'The match request is incomplete or invalid.',
                };
                const retryAfter = response.headers.get('Retry-After');
                const rateLimitSuffix = code === 'RATE_LIMITED' && retryAfter
                    ? ` ${ui('Retry after')} ${retryAfter} ${ui('seconds.')}`
                    : '';
                throw new Error(`${ui(messages[code] || payload?.message || (typeof detail === 'string' ? detail : `API Error: ${response.status}`))}${rateLimitSuffix}`);
            }
            setAtsResult(data);
            if (showAtsHistory) void loadAtsHistory();
        } catch (error) {
            console.error('ATS match error:', error);
            setAtsError(getErrorMessage(error));
        } finally {
            setIsMatching(false);
        }
    };

    const acceptTailorChanges = () => {
        if (!pendingTailor) return;
        const { updated } = pendingTailor;
        setResumeData(prev => ({
            ...prev,
            personalInfo: { ...prev.personalInfo, summary: updated.personalInfo?.summary ?? prev.personalInfo.summary },
            experience: prev.experience.map((exp, index) => {
                const item = updated.experience?.find(candidate => candidate.id === exp.id)
                    ?? updated.experience?.[index];
                return item ? { ...exp, description: item.description ?? exp.description, highlights: item.highlights ?? exp.highlights } : exp;
            }),
            projects: prev.projects.map((project, index) => {
                const item = updated.projects?.find(candidate => candidate.id === project.id)
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
        } catch (error: unknown) {
            console.error("Save error:", error);
            const message = getErrorMessage(error);
            if (message.includes("Free limit")) {
                if (confirm("You've reached the free limit of 3 resumes. Upgrade to Pro to create more?")) {
                    router.push('/pricing');
                }
            } else {
                alert("Failed to save: " + message);
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleDownloadPDF = () => {
        setIsDownloading(true);
        document.body.classList.add('printing-resume');
        window.setTimeout(() => {
            window.print();
            document.body.classList.remove('printing-resume');
            setIsDownloading(false);
        }, 150);
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
                        <p className="text-xs text-indigo-100 mb-3">ℹ️ {ui('Each successful AI generation uses 1 AI credit, even if you discard the suggestion.')}</p>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <button
                                onClick={() => setIsJobModalOpen(true)}
                                className="w-full bg-white text-indigo-600 font-bold py-2 rounded shadow hover:bg-indigo-50 transition text-sm"
                            >
                                {ui('Tailor my Resume')}
                            </button>
                            <button
                                onClick={() => {
                                    setIsJobModalOpen(true);
                                    setShowAtsHistory(true);
                                    void loadAtsHistory();
                                }}
                                className="w-full border border-white/70 text-white font-semibold py-2 rounded hover:bg-white/10 transition text-sm"
                            >
                                {ui('View saved ATS analyses')}
                            </button>
                        </div>
                    </div>

                    {/* Job Match Modal */}
                    {isJobModalOpen && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 animate-in fade-in zoom-in duration-200">
                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-black">
                                                    <Sparkles className="text-purple-600" /> {ui('Analyze Job Match / Tailor Resume')}
                                </h3>
                                <p className="text-sm text-gray-600 mb-4">
                                    {ui('Paste the job description or internship details here. We will optimize your CV to match their requirements in')} <span className="font-bold">{selectedLanguageName}</span>.
                                </p>
                                <p className="text-xs text-amber-700 bg-amber-50 rounded-md p-2 mb-3">ℹ️ {ui('Each successful AI generation uses 1 AI credit, even if you discard the suggestion.')}</p>
                                <textarea
                                    className="w-full h-40 border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 mb-4 text-black"
                                    placeholder={ui('Paste job description here...')}
                                    value={jobDescriptionInput}
                                    onChange={(e) => {
                                        setJobDescriptionInput(e.target.value);
                                        setAtsError(null);
                                        setAtsResult(null);
                                    }}
                                    maxLength={20000}
                                />
                                <p className="-mt-3 mb-3 text-right text-xs text-gray-500">{jobDescriptionInput.length}/20000</p>
                                <p className="-mt-2 mb-3 text-xs text-gray-500">{ui('Successful ATS results, job descriptions, and short CV evidence excerpts are kept for up to 90 days (maximum 50 per account). You can view or delete them later.')}</p>
                                <div className="mb-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const next = !showAtsHistory;
                                            setShowAtsHistory(next);
                                            if (next) void loadAtsHistory();
                                        }}
                                        className="text-sm font-semibold text-indigo-700 underline"
                                    >
                                        {showAtsHistory ? ui('Hide saved ATS analyses') : ui('View saved ATS analyses')}
                                    </button>
                                    {showAtsHistory && (
                                        <div className="mt-2 max-h-48 space-y-2 overflow-y-auto rounded border border-indigo-100 bg-indigo-50 p-2">
                                            {isLoadingAtsHistory && <p className="text-sm text-gray-600">{ui('Loading saved analyses...')}</p>}
                                            {atsHistoryError && <p role="alert" className="text-sm text-red-700">{atsHistoryError}</p>}
                                            {!isLoadingAtsHistory && !atsHistoryError && atsHistory.length === 0 && <p className="text-sm text-gray-600">{ui('No saved ATS analyses yet.')}</p>}
                                            {atsHistory.map((item) => (
                                                <div key={item.id} className="flex items-center gap-2 rounded bg-white p-2 text-sm">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setJobDescriptionInput(item.jobDescription);
                                                            setAtsResult(item.result);
                                                            setAtsError(null);
                                                        }}
                                                        className="min-w-0 flex-1 text-left"
                                                    >
                                                        <span className="block truncate font-medium text-gray-900">{item.jobDescription}</span>
                                                        <span className="text-xs text-gray-500">{new Date(item.createdAt).toLocaleString(selectedLanguage)} · {Math.round(item.result.atsScore.score)}%</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => void deleteAtsHistoryItem(item.id)}
                                                        aria-label={ui('Delete saved ATS analysis')}
                                                        title={ui('Delete saved ATS analysis')}
                                                        className="rounded p-1 text-red-600 hover:bg-red-50"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 mb-4">{ui('ATS analysis and resume tailoring each use one AI credit after a successful result.')}</p>
                                {atsError && <p role="alert" className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">{atsError}</p>}
                                {!atsResult && !atsError && !isMatching && <p className="mb-4 rounded bg-indigo-50 p-3 text-xs text-indigo-900">{ui('Enter a job description and choose Score CV Match to see an explainable compatibility result.')}</p>}
                                {atsResult && (
                                    <section className="border border-indigo-200 rounded-lg p-4 mb-4 space-y-3" aria-live="polite">
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <div>
                                                <h4 className="font-bold text-gray-900">{ui('Job match score')}</h4>
                                                <p className="text-xs text-gray-500">{ui('Exact contribution')}: {atsResult.atsScore.ruleCoverage}% · {ui('Hybrid coverage')}: {atsResult.atsScore.hybridCoverage}% · {ui('Confidence')}: {ui(atsResult.atsScore.confidence)}</p>
                                            </div>
                                            <span className="text-3xl font-bold text-indigo-700">{Math.round(atsResult.atsScore.score)}%</span>
                                        </div>
                                        <p className="text-xs text-amber-800 bg-amber-50 rounded p-2">{ui('This score is a job-fit indicator, not a hiring decision or probability.')}</p>
                                        <p className="text-xs text-gray-600">{ui('Parameters are starting values, not calibrated.')}</p>
                                        <p className="text-xs text-gray-600">{ui('Semantic similarity is supporting evidence, not proof that a skill is present.')}</p>
                                        {atsResult.excludedSkillCount > 0 && <p className="text-xs text-amber-800 bg-amber-50 rounded p-2">{ui('Some extracted skills were excluded because they were invalid, duplicated, or could not be verified in the job description.')} ({atsResult.excludedSkillCount})</p>}
                                        <p className="text-xs text-gray-500">{ui('Algorithm version')}: {atsResult.atsScore.algorithmVersion} · τlow {atsResult.atsScore.params.tauLow} · τhigh {atsResult.atsScore.params.tauHigh} · β {atsResult.atsScore.params.beta} · {ui('Required weight')} {atsResult.atsScore.params.requiredWeight} · {ui('Preferred weight')} {atsResult.atsScore.params.preferredWeight}</p>
                                        <div className="max-h-64 overflow-y-auto space-y-2">
                                            {[...atsResult.atsScore.matched, ...atsResult.atsScore.semantic].map((item) => (
                                                <div key={`${item.keyword}-${item.matchType}`} className="rounded border border-emerald-100 bg-emerald-50 p-2 text-sm">
                                                    <div className="font-semibold text-gray-900">{item.keyword} <span className="font-normal text-xs text-gray-600">· {item.matchType === 'exact' ? ui(item.matchedWith ? 'Recognized equivalent term' : 'Direct wording match') : ui('Semantic support')} · {ui(item.importance)} · {ui(item.category)}</span></div>
                                                    {item.matchType === 'semantic' && <p className="mt-1 text-xs text-gray-600">{ui('Similarity')}: {item.similarity ?? '—'} · {ui('Semantic credit')}: {item.credit ?? '—'} · {ui('Supporting evidence')}</p>}
                                                    {item.evidence && <p className="mt-1 text-xs text-gray-700">“{item.evidence}” <span className="text-gray-500">({item.evidenceSection})</span></p>}
                                                    {item.matchType === 'semantic' && (
                                                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded bg-white/70 p-2">
                                                            <span className="text-xs text-gray-700">
                                                                {item.relatedSkills?.length
                                                                    ? `${ui('Related evidence found in your CV')}: ${item.relatedSkills.join(', ')}. `
                                                                    : ''}
                                                                {ui('If this reflects your experience, add the job wording to your CV and analyze again to update the score.')}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => setResumeData(prev => ({
                                                                    ...prev,
                                                                    skills: prev.skills.some(skill => skill.trim().toLocaleLowerCase() === item.keyword.trim().toLocaleLowerCase())
                                                                        ? prev.skills
                                                                        : [...prev.skills, item.keyword],
                                                                }))}
                                                                disabled={resumeData.skills.some(skill => skill.trim().toLocaleLowerCase() === item.keyword.trim().toLocaleLowerCase())}
                                                                className="rounded border border-emerald-300 bg-white px-2 py-1 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 disabled:cursor-default disabled:opacity-60"
                                                            >
                                                                {resumeData.skills.some(skill => skill.trim().toLocaleLowerCase() === item.keyword.trim().toLocaleLowerCase())
                                                                    ? ui('Added to CV')
                                                                    : ui('Add to CV')}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            {atsResult.atsScore.missing.map((item) => (
                                                <div key={`${item.keyword}-missing`} className="rounded border border-amber-100 bg-amber-50 p-2 text-sm">
                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                        <span>
                                                            <span className="font-semibold text-gray-900">{item.keyword}</span>{' '}
                                                            <span className="text-xs text-gray-600">
                                                                · {item.relatedSkills?.length
                                                                    ? `${ui('Related evidence found in your CV')}: ${item.relatedSkills.join(', ')}. ${ui('If you also know this skill, add it to your CV and analyze again to update the score.')}`
                                                                    : ui('No supporting CV evidence found')}
                                                                {' · '}{ui(item.importance)} · {ui(item.category)}
                                                            </span>
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setResumeData(prev => ({
                                                                ...prev,
                                                                skills: prev.skills.some(skill => skill.trim().toLocaleLowerCase() === item.keyword.trim().toLocaleLowerCase())
                                                                    ? prev.skills
                                                                    : [...prev.skills, item.keyword],
                                                            }))}
                                                            disabled={resumeData.skills.some(skill => skill.trim().toLocaleLowerCase() === item.keyword.trim().toLocaleLowerCase())}
                                                            className="rounded border border-amber-300 bg-white px-2 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-100 disabled:cursor-default disabled:opacity-60"
                                                        >
                                                            {resumeData.skills.some(skill => skill.trim().toLocaleLowerCase() === item.keyword.trim().toLocaleLowerCase())
                                                                ? ui('Added to CV')
                                                                : ui('Add to CV')}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}
                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => {
                                            setIsJobModalOpen(false);
                                            setJobDescriptionInput('');
                                            setAtsResult(null);
                                            setAtsError(null);
                                            setShowAtsLimitModal(false);
                                        }}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
                                    >
                                        {ui('Cancel')}
                                    </button>
                                    <button
                                        onClick={() => { void handleJobMatch(); }}
                                        disabled={isMatching || isTailoring || jobDescriptionInput.trim().length < 30}
                                        className="px-4 py-2 border border-indigo-600 text-indigo-700 rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {isMatching ? <><Loader2 className="animate-spin" size={16} /> {ui('Scoring...')}</> : ui('Score CV Match')}
                                    </button>
                                    <button
                                        onClick={() => { void handleJobTailor(); }}
                                        disabled={isTailoring || isMatching || jobDescriptionInput.length < 50 || jobDescriptionInput.length > 3000}
                                        className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg text-sm font-bold shadow hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {isTailoring ? <><Loader2 className="animate-spin" size={16} /> {ui('Analyzing...')}</> : ui('Analyze & Optimize')}
                                    </button>
                                </div>
                                {jobDescriptionInput.length > 3000 && <p className="text-xs text-amber-700 mt-2">{ui('Auto-Tailor currently accepts up to 3,000 characters; ATS matching accepts up to 20,000.')}</p>}
                            </div>
                        </div>
                    )}

                    {showAtsLimitModal && (
                        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="ats-limit-title">
                            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
                                <h3 id="ats-limit-title" className="text-lg font-bold text-gray-900">{ui('AI Limit Reached')}</h3>
                                <p className="my-4 text-sm text-gray-600">{ui(atsQuotaKind === 'premium' ? 'You have reached the Pro AI limit of 50 uses in 24 hours. Try again after the limit resets.' : "You've used your 5 free AI uses in your current monthly period. Pro includes up to 50 AI uses per 24 hours.")}</p>
                                {atsQuotaResetAt && <p className="-mt-2 mb-4 text-sm text-gray-600">{ui(atsQuotaKind === 'premium' ? 'Your Pro AI allowance resets on' : 'Your monthly AI allowance resets on')} {new Date(atsQuotaResetAt).toLocaleDateString(selectedLanguage)}</p>}
                                <div className="flex justify-end gap-3">
                                    <button onClick={() => setShowAtsLimitModal(false)} className="rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">{ui('Continue Editing')}</button>
                                    <Link href="/pricing" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">{ui('View Pro Plans')}</Link>
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
                                    <p className="text-xs text-gray-500 mt-2">{ui('Iteration')}: {pendingTailor.iterationCount} · {ui('Each successful AI generation uses 1 AI credit, even if you discard the suggestion.')}</p>
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
                                    <section className="rounded-lg border border-indigo-200 p-4 space-y-3">
                                        <label htmlFor="tailor-feedback" className="block font-semibold text-sm text-gray-800">{ui('Tell us what you want changed in this draft...')}</label>
                                        <textarea
                                            id="tailor-feedback"
                                            value={tailorFeedback}
                                            onChange={(event) => setTailorFeedback(event.target.value)}
                                            maxLength={4000}
                                            rows={3}
                                            className="w-full border border-gray-300 rounded-lg p-3 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500"
                                            placeholder={ui('Tell us what you want changed in this draft...')}
                                            disabled={isTailoring}
                                        />
                                        <button
                                            onClick={() => handleJobTailor(pendingTailor)}
                                            disabled={isTailoring || !tailorFeedback.trim()}
                                            className="px-4 py-2 bg-indigo-100 text-indigo-800 rounded-lg font-semibold hover:bg-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isTailoring ? ui('Revising...') : ui('Revise with feedback')}
                                        </button>
                                    </section>
                                </div>
                                <div className="p-4 border-t flex justify-end gap-3">
                                    <button onClick={() => { setPendingTailor(null); setTailorFeedback(''); }} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Discard</button>
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
            <div id="resume-preview-print-area" className={`w-full md:w-1/2 bg-gray-600 p-4 md:p-8 flex justify-center overflow-y-auto scrollbar-hide h-full ${activeTab === 'editor' ? 'hidden md:flex' : 'flex'}`}>
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
