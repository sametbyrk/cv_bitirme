'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';

export type ResumeData = {
    personalInfo: {
        fullName: string;
        email: string;
        phone: string;
        linkedin: string;
        github: string;
        address: string;
        summary: string;
        photo?: string;
    };
    education: Array<{
        id: string;
        school: string;
        degree: string;
        startDate: string;
        endDate: string;
        description: string;
    }>;
    experience: Array<{
        id: string;
        company: string;
        position: string;
        startDate: string;
        endDate: string;
        description: string;
        highlights?: string[];
    }>;
    skills: string[];
    projects: Array<{
        id: string;
        name: string;
        description: string;
        link: string;
    }>;
    certificates: Array<{
        id: string;
        name: string;
        issuer: string;
        date: string;
        link?: string;
    }>;
    languages: Array<{
        id: string;
        language: string;
        level: string;
    }>;
    meta: {
        language: string;
    };
    templateId: 'classic' | 'modern';
};

const defaultResumeData: ResumeData = {
    personalInfo: {
        fullName: '',
        email: '',
        phone: '',
        linkedin: '',
        github: '',
        address: '',
        summary: '',
        photo: '',
    },
    education: [],
    experience: [],
    skills: [],
    projects: [],
    certificates: [],
    languages: [],
    meta: {
        language: 'en' // Default content language
    },
    templateId: 'classic',
};

interface ResumeContextType {
    resumeData: ResumeData;
    setResumeData: React.Dispatch<React.SetStateAction<ResumeData>>;
    updatePersonalInfo: (key: keyof ResumeData['personalInfo'], value: string) => void;
}

const ResumeContext = createContext<ResumeContextType | undefined>(undefined);

// Helper to generate IDs if missing
const generateId = () => Math.random().toString(36).substr(2, 9);

const ensureIds = (data: ResumeData): ResumeData => {
    return {
        ...data,
        education: data.education?.map(e => ({ ...e, id: e.id || generateId() })) || [],
        experience: data.experience?.map(e => ({ ...e, id: e.id || generateId() })) || [],
        projects: data.projects?.map(e => ({ ...e, id: e.id || generateId() })) || [],
        certificates: data.certificates?.map(e => ({ ...e, id: e.id || generateId() })) || [],
        languages: data.languages?.map(e => ({ ...e, id: e.id || generateId() })) || [],
    };
};

export function ResumeProvider({ children, initialData, userId, resumeId, skipDraftRestore = false }: { children: ReactNode, initialData?: ResumeData, userId?: string, resumeId?: string, skipDraftRestore?: boolean }) {
    const draftKey = initialData
        ? (resumeId ? `cv_draft_edit_${resumeId}` : `cv_draft_edit_${userId || 'guest'}_${initialData.templateId || 'edit'}`)
        : (userId ? `cv_draft_user_${userId}` : 'cv_draft_guest');
    const [draftRestored, setDraftRestored] = useState(false);
    const hasLoadedFromStorage = useRef(false);
    const hasShownNotification = useRef(false);

    // Initialize with defaults or server data
    const [resumeData, setResumeData] = useState<ResumeData>(() => {
        if (initialData) {
            return ensureIds({
                ...defaultResumeData,
                ...initialData,
                personalInfo: { ...defaultResumeData.personalInfo, ...(initialData.personalInfo || {}) },
                education: initialData.education || [],
                experience: initialData.experience || [],
                skills: initialData.skills || [],
                projects: initialData.projects || [],
                certificates: initialData.certificates || [],
                languages: initialData.languages || [],
                meta: { ...defaultResumeData.meta, ...(initialData.meta || {}) }
            });
        }
        return ensureIds(defaultResumeData);
    });

    // Load from localStorage on client mount
    useEffect(() => {
        if (skipDraftRestore) {
            hasLoadedFromStorage.current = true;
            return;
        }

        // For existing CVs, check for unsaved changes
        if (initialData) {
            try {
                const draft = localStorage.getItem(draftKey);
                if (draft) {
                    const parsed = JSON.parse(draft);
                    // Only restore if draft is newer (has more content)
                    if (parsed.personalInfo?.fullName || parsed.personalInfo?.summary) {
                        setResumeData(ensureIds({
                            ...defaultResumeData,
                            ...parsed,
                            personalInfo: { ...defaultResumeData.personalInfo, ...(parsed.personalInfo || {}) },
                            meta: { ...defaultResumeData.meta, ...(parsed.meta || {}) }
                        }));
                        setDraftRestored(true);
                    }
                }
            } catch (e) { }
            setTimeout(() => { hasLoadedFromStorage.current = true; }, 500);
            return;
        }

        // For new CVs, load from user-specific draft
        try {
            const draft = localStorage.getItem(draftKey);
            if (draft) {
                const parsed = JSON.parse(draft);
                const hasContent = parsed.personalInfo?.fullName ||
                    parsed.personalInfo?.summary ||
                    (parsed.experience?.length > 0) ||
                    (parsed.education?.length > 0) ||
                    (parsed.skills?.length > 0);

                if (hasContent) {
                    setResumeData(ensureIds({
                        ...defaultResumeData,
                        ...parsed,
                        personalInfo: { ...defaultResumeData.personalInfo, ...(parsed.personalInfo || {}) },
                        meta: { ...defaultResumeData.meta, ...(parsed.meta || {}) }
                    }));
                    setDraftRestored(true);
                }
            }
        } catch (e) { }

        setTimeout(() => { hasLoadedFromStorage.current = true; }, 1000);
    }, [initialData, skipDraftRestore, draftKey]);

    // Auto-save to localStorage (works for both new and existing CVs)
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (skipDraftRestore) return;
        if (!hasLoadedFromStorage.current) return;

        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(() => {
            try {
                localStorage.setItem(draftKey, JSON.stringify(resumeData));
            } catch (e) { }
        }, 2000);

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [resumeData, initialData, skipDraftRestore, draftKey]);

    // Show toast notification if draft was restored
    useEffect(() => {
        if (draftRestored) {
            const lang = resumeData.meta?.language || 'en';

            const messages = {
                en: '⚠️ Draft restored. Don\'t forget to save your changes!',
                tr: '⚠️ Taslak geri yüklendi. Değişiklikleri kaydetmeyi unutmayın!',
                de: '⚠️ Entwurf wiederhergestellt. Vergessen Sie nicht zu speichern!',
                fr: '⚠️ Brouillon restauré. N\'oubliez pas d\'enregistrer !',
                es: '⚠️ Borrador restaurado. ¡No olvides guardar!',
            };

            const message = messages[lang as keyof typeof messages] || messages.en;

            const notification = document.createElement('div');
            notification.innerHTML = message;
            notification.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#F59E0B;color:white;padding:12px 24px;border-radius:8px;z-index:9999;font-size:14px;font-weight:500;box-shadow:0 4px 12px rgba(0,0,0,0.15);animation:fadeIn 0.3s ease;';
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 5000);
        }
    }, [draftRestored]);

    const updatePersonalInfo = (key: keyof ResumeData['personalInfo'], value: string) => {
        setResumeData((prev) => ({
            ...prev,
            personalInfo: {
                ...prev.personalInfo,
                [key]: value,
            },
        }));
    };

    return (
        <ResumeContext.Provider value={{ resumeData, setResumeData, updatePersonalInfo }}>
            {children}
        </ResumeContext.Provider>
    );
}

export function useResume() {
    const context = useContext(ResumeContext);
    if (context === undefined) {
        throw new Error('useResume must be used within a ResumeProvider');
    }
    return context;
}
