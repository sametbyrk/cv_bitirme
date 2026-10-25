'use client';

import React, { useState, useEffect } from 'react';
import { useResume, ResumeData } from '@/context/ResumeContext';
import { Plus, Trash2, Sparkles, Loader2, GripVertical, Check, X, ArrowRight, Zap } from 'lucide-react';
import { Reorder, useDragControls, AnimatePresence, motion } from 'framer-motion';
import { translateResumeUi } from '@/lib/resume-translations';

const L = ({ text }: { text: string }) => {
    const { resumeData } = useResume();
    return <>{translateResumeUi(text, resumeData.meta?.language)}</>;
};

// --- AI COMPARISON MODAL ---
interface AiCompareModalProps {
    originalText: string;
    aiText: string;
    onAccept: () => Promise<void> | void;
    onReject: () => void;
}

const AiCompareModal = ({ originalText, aiText, onAccept, onReject }: AiCompareModalProps) => (
    <AnimatePresence>
        <motion.div
            key="ai-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
            onClick={onReject}
        >
            <motion.div
                key="ai-modal-card"
                initial={{ opacity: 0, scale: 0.93, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.93, y: 20 }}
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                className="w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
                style={{ background: '#fff', border: '1.5px solid #e5e7eb' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100" style={{ background: 'linear-gradient(90deg,#f5f3ff 0%,#ede9fe 100%)' }}>
                    <Sparkles size={18} className="text-purple-600" />
                    <span className="font-semibold text-purple-800 text-sm"><L text="AI Suggestion — Review Before Applying" /></span>
                    <button onClick={onReject} className="ml-auto text-gray-400 hover:text-gray-700 transition-colors"><X size={18} /></button>
                </div>

                {/* Before / After */}
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-0 p-5">
                    {/* Before */}
                    <div className="flex flex-col gap-2">
                        <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400"><L text="Before" /></span>
                        <div className="rounded-lg p-3 text-sm text-gray-600 leading-relaxed min-h-[80px]" style={{ background: '#fafafa', border: '1px solid #e5e7eb' }}>
                            {originalText || <span className="italic text-gray-300"><L text="Empty" /></span>}
                        </div>
                    </div>

                    {/* Arrow */}
                    <div className="hidden sm:flex items-center justify-center px-4">
                        <div className="rounded-full p-2" style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>
                            <ArrowRight size={16} className="text-white" />
                        </div>
                    </div>

                    {/* After */}
                    <div className="flex flex-col gap-2 mt-4 sm:mt-0">
                        <span className="text-[11px] font-semibold uppercase tracking-widest text-purple-500"><L text="AI Version" /></span>
                        <div className="rounded-lg p-3 text-sm text-gray-800 leading-relaxed min-h-[80px]" style={{ background: '#faf5ff', border: '1.5px solid #d8b4fe' }}>
                            {aiText}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100" style={{ background: '#fafafa' }}>
                    <button
                        onClick={onReject}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors border border-gray-200"
                    >
                        <X size={14} /> <L text="Keep Original" />
                    </button>
                    <button
                        onClick={onAccept}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all shadow-md hover:shadow-lg active:scale-95"
                        style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}
                    >
                        <Check size={14} /> <L text="Apply AI Version" />
                    </button>
                </div>
            </motion.div>
        </motion.div>
    </AnimatePresence>
);

// --- AI LIMIT MODAL ---
const AiLimitModal = ({ onClose }: { onClose: () => void }) => (
    <AnimatePresence>
        <motion.div
            key="limit-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
        >
            <motion.div
                key="limit-modal-card"
                initial={{ opacity: 0, scale: 0.93, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.93, y: 20 }}
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
                style={{ background: '#fff', border: '1.5px solid #e5e7eb' }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-6 py-5 text-center">
                    <div className="mx-auto mb-4 w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>
                        <Zap size={22} className="text-white" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 mb-2"><L text="AI Limit Reached" /></h2>
                    <p className="text-sm text-gray-500 mb-6"><L text="You've used your 3 free AI optimizations. Upgrade to Pro for unlimited AI rewrites." /></p>
                    <div className="flex flex-col gap-2">
                        <a
                            href="/pricing"
                            className="block w-full py-3 rounded-xl text-white text-sm font-bold text-center transition-all shadow-md hover:shadow-lg"
                            style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}
                        >
                            <L text="View Pro Plans" />
                        </a>
                        <button
                            onClick={onClose}
                            className="w-full py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 border border-gray-200 transition-colors"
                        >
                            <L text="Continue Editing" />
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    </AnimatePresence>
);

const generateId = () => Math.random().toString(36).substr(2, 9);

// Date format validation helper
const isValidDateFormat = (value: string): boolean => {
    if (!value || value.trim() === '') return true;
    const v = value.trim().toLowerCase();
    // Allow: Present, Devam Ediyor, Günümüz, Halen
    if (['present', 'devam ediyor', 'günümüz', 'halen', 'current'].includes(v)) return true;
    // Allow: YYYY (4 digits)
    if (/^\d{4}$/.test(v)) return true;
    // Allow: MM/YYYY or MM-YYYY
    if (/^\d{1,2}[\/\-]\d{4}$/.test(v)) return true;
    return false;
};

// Reusable Date Input with validation warning
const DateInput = ({
    value,
    onChange,
    placeholder = "MM/YYYY",
    allowPresent = false
}: {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    allowPresent?: boolean;
}) => {
    const { resumeData } = useResume();
    const showWarning = value && !isValidDateFormat(value);

    return (
        <div>
            <input
                type="text"
                className={`w-full p-2 text-sm border rounded-md text-black bg-white placeholder-gray-400 ${showWarning ? 'border-orange-400' : 'border-gray-300'}`}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={translateResumeUi(placeholder, resumeData.meta?.language)}
            />
            {showWarning && (
                <p className="text-[10px] text-orange-500 mt-1">
                    {translateResumeUi(allowPresent ? 'Format: 01/2022, 2022, or Present' : 'Format: 01/2022 or 2022', resumeData.meta?.language)}
                </p>
            )}
        </div>
    );
};

// --- EDUCATION ---

const EducationItem = ({
    edu,
    updateEducation,
    removeEducation
}: {
    edu: ResumeData['education'][0];
    updateEducation: (id: string, key: keyof ResumeData['education'][0], value: string) => void;
    removeEducation: (id: string) => void;
}) => {
    const controls = useDragControls();
    const language = useResume().resumeData.meta?.language;

    return (
        <Reorder.Item
            value={edu}
            id={edu.id}
            dragListener={false}
            dragControls={controls}
            className="p-4 border border-gray-100 rounded-md bg-gray-50 space-y-3 group"
        >
            <div className="flex justify-end gap-2 mb-2">
                <div
                    onPointerDown={(e) => controls.start(e)}
                    className="cursor-grab text-gray-500 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded p-1.5 touch-none shadow-sm active:cursor-grabbing"
                    title={translateResumeUi('Drag to Reorder', language)}
                >
                    <GripVertical size={16} />
                </div>
                <button
                    onClick={() => removeEducation(edu.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                    title={translateResumeUi('Delete', language)}
                >
                    <Trash2 size={18} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-medium text-black mb-1"><L text="School / University" /></label>
                    <input
                        type="text"
                        className="w-full p-2 text-sm border border-gray-300 rounded-md text-black bg-white placeholder-gray-400"
                        value={edu.school}
                        onChange={(e) => updateEducation(edu.id, 'school', e.target.value)}
                        placeholder={translateResumeUi('e.g. Harvard University', language)}
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-black mb-1"><L text="Degree / Major" /></label>
                    <input
                        type="text"
                        className="w-full p-2 text-sm border border-gray-300 rounded-md text-black bg-white placeholder-gray-400"
                        value={edu.degree}
                        onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                        placeholder={translateResumeUi('e.g. Computer Science', language)}
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-black mb-1"><L text="Start Date" /></label>
                    <DateInput
                        value={edu.startDate}
                        onChange={(val) => updateEducation(edu.id, 'startDate', val)}
                        placeholder="e.g. 09/2018"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-black mb-1"><L text="End Date" /></label>
                    <DateInput
                        value={edu.endDate}
                        onChange={(val) => updateEducation(edu.id, 'endDate', val)}
                        placeholder="e.g. 06/2022"
                        allowPresent={true}
                    />
                </div>
            </div>
        </Reorder.Item>
    );
};

export const EducationForm = () => {
    const { resumeData, setResumeData } = useResume();

    const addEducation = () => {
        setResumeData((prev) => ({
            ...prev,
            education: [
                ...prev.education,
                { id: generateId(), school: '', degree: '', startDate: '', endDate: '', description: '' },
            ],
        }));
    };

    const removeEducation = (id: string) => {
        setResumeData((prev) => ({
            ...prev,
            education: prev.education.filter((item) => item.id !== id),
        }));
    };

    const updateEducation = (id: string, key: keyof ResumeData['education'][0], value: string) => {
        setResumeData((prev) => ({
            ...prev,
            education: prev.education.map((item) => item.id === id ? { ...item, [key]: value } : item),
        }));
    };

    const handleReorder = (newOrder: ResumeData['education']) => {
        setResumeData((prev) => ({ ...prev, education: newOrder }));
    };

    return (
        <div className="space-y-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center justify-between">
                <L text="Education" />
                <button onClick={addEducation} className="p-1 rounded-full hover:bg-gray-100 text-blue-600" title={translateResumeUi('Add Education', resumeData.meta?.language)}>
                    <Plus size={20} />
                </button>
            </h3>

            <Reorder.Group axis="y" values={resumeData.education || []} onReorder={handleReorder} className="space-y-3">
                {(resumeData.education || []).map((edu) => (
                    <EducationItem
                        key={edu.id}
                        edu={edu}
                        updateEducation={updateEducation}
                        removeEducation={removeEducation}
                    />
                ))}
            </Reorder.Group>

            {resumeData.education.length === 0 && (
                <div className="text-center py-4 text-gray-400 text-sm"><L text="No education added yet." /></div>
            )}
        </div>
    );
};

// --- EXPERIENCE ---

const ExperienceItem = ({
    exp,
    updateExperience,
    removeExperience,
    handleAiRewrite,
    loading
}: {
    exp: ResumeData['experience'][0];
    updateExperience: (id: string, key: keyof ResumeData['experience'][0], value: string) => void;
    removeExperience: (id: string) => void;
    handleAiRewrite: (id: string, text: string) => void;
    loading: boolean;
}) => {
    const controls = useDragControls();
    const language = useResume().resumeData.meta?.language;

    return (
        <Reorder.Item
            value={exp}
            id={exp.id}
            dragListener={false}
            dragControls={controls}
            className="p-4 border border-gray-100 rounded-md bg-gray-50 space-y-3 group"
        >
            <div className="flex justify-end gap-2 mb-2">
                <div
                    onPointerDown={(e) => controls.start(e)}
                    className="cursor-grab text-gray-500 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded p-1.5 touch-none shadow-sm active:cursor-grabbing"
                    title={translateResumeUi('Drag to Reorder', language)}
                >
                    <GripVertical size={16} />
                </div>
                <button
                    onClick={() => removeExperience(exp.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                    title={translateResumeUi('Delete', language)}
                >
                    <Trash2 size={18} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-medium text-black mb-1"><L text="Company" /></label>
                    <input
                        type="text"
                        className="w-full p-2 text-sm border border-gray-300 rounded-md text-black bg-white placeholder-gray-400"
                        value={exp.company}
                        onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                        placeholder={translateResumeUi('e.g. Google', language)}
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-black mb-1"><L text="Position / Title" /></label>
                    <input
                        type="text"
                        className="w-full p-2 text-sm border border-gray-300 rounded-md text-black bg-white placeholder-gray-400"
                        value={exp.position}
                        onChange={(e) => updateExperience(exp.id, 'position', e.target.value)}
                        placeholder={translateResumeUi('e.g. Software Engineer', language)}
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-black mb-1"><L text="Start Date" /></label>
                    <DateInput
                        value={exp.startDate}
                        onChange={(val) => updateExperience(exp.id, 'startDate', val)}
                        placeholder="e.g. 01/2020"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-black mb-1"><L text="End Date" /></label>
                    <DateInput
                        value={exp.endDate}
                        onChange={(val) => updateExperience(exp.id, 'endDate', val)}
                        placeholder="e.g. 12/2023 or Present"
                        allowPresent={true}
                    />
                </div>
                <div className="md:col-span-2">
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-medium text-black"><L text="Description" /></label>
                        <button
                            onClick={() => handleAiRewrite(exp.id, exp.description)}
                            disabled={loading || !exp.description}
                            className="flex items-center gap-1 text-xs font-medium text-purple-600 hover:text-purple-800 disabled:opacity-50 transition-colors bg-purple-50 px-2 py-1 rounded-md"
                        >
                            {loading ? (
                                <> <Loader2 size={12} className="animate-spin" /> <L text="Writing..." /> </>
                            ) : (
                                <> <Sparkles size={12} /> <L text="AI Rewrite" /> </>
                            )}
                        </button>
                    </div>
                    <textarea
                        className="w-full p-2 text-sm border border-gray-300 rounded-md h-24 focus:ring-2 focus:ring-purple-500 transition-all font-mono text-black bg-white placeholder-gray-400"
                        value={exp.description}
                        onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                        placeholder={translateResumeUi('Describe your responsibilities and achievements...', language)}
                    />
                    <p className="mt-1 text-[11px] text-gray-500">ℹ️ {translateResumeUi('Each successful AI generation uses 1 AI credit, even if you discard the suggestion.', language)}</p>
                </div>
            </div>
        </Reorder.Item>
    );
};

export const ExperienceForm = () => {
    const { resumeData, setResumeData } = useResume();
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [compareModal, setCompareModal] = useState<{ id: string; original: string; ai: string } | null>(null);
    const [showLimitModal, setShowLimitModal] = useState(false);

    const addExperience = () => {
        setResumeData((prev) => ({
            ...prev,
            experience: [
                ...prev.experience,
                { id: generateId(), company: '', position: '', startDate: '', endDate: '', description: '' },
            ],
        }));
    };

    const removeExperience = (id: string) => {
        setResumeData((prev) => ({
            ...prev,
            experience: prev.experience.filter((item) => item.id !== id),
        }));
    };

    const updateExperience = (id: string, key: keyof ResumeData['experience'][0], value: string) => {
        setResumeData((prev) => ({
            ...prev,
            experience: prev.experience.map((item) => item.id === id ? { ...item, [key]: value } : item),
        }));
    };

    const handleReorder = (newOrder: ResumeData['experience']) => {
        setResumeData((prev) => ({ ...prev, experience: newOrder }));
    };

    const handleAiRewrite = async (id: string, currentText: string) => {
        if (!currentText) return;
        setLoadingId(id);
        try {
            const response = await fetch('/api/ai/optimize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: currentText,
                    type: 'experience',
                    targetLanguage: resumeData.meta?.language
                }),
            });
            const data = await response.json();

            if (response.status === 403) {
                setShowLimitModal(true);
                return;
            }

            if (response.status === 401) {
                alert("Please log in to use AI features.");
                return;
            }

            if (!response.ok) {
                alert(`AI Error: ${data.error || 'Unknown error'}${data.detail ? ' — ' + data.detail : ''}`);
                return;
            }

            if (data.optimizedText) {
                setCompareModal({ id, original: currentText, ai: data.optimizedText });
            }
        } catch (error) {
            console.error("Rewrite failed", error);
            alert("Network error. Please try again.");
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <div className="space-y-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
            {showLimitModal && <AiLimitModal onClose={() => setShowLimitModal(false)} />}
            {compareModal && (
                <AiCompareModal
                    originalText={compareModal.original}
                    aiText={compareModal.ai}
                    onAccept={() => {
                        updateExperience(compareModal.id, 'description', compareModal.ai);
                        setCompareModal(null);
                    }}
                    onReject={() => setCompareModal(null)}
                />
            )}
            <h3 className="text-lg font-semibold text-gray-800 flex items-center justify-between">
                <L text="Work Experience" />
                <button onClick={addExperience} className="p-1 rounded-full hover:bg-gray-100 text-blue-600" title={translateResumeUi('Add Experience', resumeData.meta?.language)}>
                    <Plus size={20} />
                </button>
            </h3>

            <Reorder.Group axis="y" values={resumeData.experience || []} onReorder={handleReorder} className="space-y-3">
                {(resumeData.experience || []).map((exp) => (
                    <ExperienceItem
                        key={exp.id}
                        exp={exp}
                        updateExperience={updateExperience}
                        removeExperience={removeExperience}
                        handleAiRewrite={handleAiRewrite}
                        loading={loadingId === exp.id}
                    />
                ))}
            </Reorder.Group>

            {resumeData.experience.length === 0 && (
                <div className="text-center py-4 text-gray-400 text-sm"><L text="No experience added yet." /></div>
            )}
        </div>
    );
};

// --- PROJECTS ---

const ProjectItem = ({
    proj,
    updateProject,
    removeProject,
    handleAiRewrite,
    loading
}: {
    proj: ResumeData['projects'][0];
    updateProject: (id: string, key: keyof ResumeData['projects'][0], value: string) => void;
    removeProject: (id: string) => void;
    handleAiRewrite: (id: string, text: string) => void;
    loading: boolean;
}) => {
    const controls = useDragControls();
    const language = useResume().resumeData.meta?.language;

    return (
        <Reorder.Item
            value={proj}
            id={proj.id}
            dragListener={false}
            dragControls={controls}
            className="p-4 border border-gray-100 rounded-md bg-gray-50 space-y-3 group"
        >
            <div className="flex justify-end gap-2 mb-2">
                <div
                    onPointerDown={(e) => controls.start(e)}
                    className="cursor-grab text-gray-500 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded p-1.5 touch-none shadow-sm active:cursor-grabbing"
                    title={translateResumeUi('Drag to Reorder', language)}
                >
                    <GripVertical size={16} />
                </div>
                <button
                    onClick={() => removeProject(proj.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                    title={translateResumeUi('Delete', language)}
                >
                    <Trash2 size={18} />
                </button>
            </div>

            <div className="space-y-3">
                <div>
                    <label className="block text-xs font-medium text-black mb-1"><L text="Project Name" /></label>
                    <input
                        type="text"
                        className="w-full p-2 text-sm border border-gray-300 rounded-md text-black bg-white placeholder-gray-400"
                        value={proj.name}
                        onChange={(e) => updateProject(proj.id, 'name', e.target.value)}
                        placeholder={translateResumeUi('e.g. E-Commerce App', language)}
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-black mb-1"><L text="Link (Optional)" /></label>
                    <input
                        type="text"
                        className="w-full p-2 text-sm border border-gray-300 rounded-md text-black bg-white placeholder-gray-400"
                        value={proj.link}
                        onChange={(e) => updateProject(proj.id, 'link', e.target.value)}
                        placeholder={translateResumeUi('e.g. github.com/username/project', language)}
                    />
                </div>
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-medium text-black"><L text="Description" /></label>
                        <button
                            onClick={() => handleAiRewrite(proj.id, proj.description)}
                            disabled={loading || !proj.description}
                            className="flex items-center gap-1 text-xs font-medium text-purple-600 hover:text-purple-800 disabled:opacity-50 transition-colors bg-purple-50 px-2 py-1 rounded-md"
                        >
                            {loading ? (
                                <> <Loader2 size={12} className="animate-spin" /> <L text="Writing..." /> </>
                            ) : (
                                <> <Sparkles size={12} /> <L text="AI Rewrite" /> </>
                            )}
                        </button>
                    </div>
                    <textarea
                        className="w-full p-2 text-sm border border-gray-300 rounded-md h-20 text-black bg-white placeholder-gray-400"
                        value={proj.description}
                        onChange={(e) => updateProject(proj.id, 'description', e.target.value)}
                        placeholder={translateResumeUi('Briefly describe what you built...', language)}
                    />
                    <p className="mt-1 text-[11px] text-gray-500">ℹ️ {translateResumeUi('Each successful AI generation uses 1 AI credit, even if you discard the suggestion.', language)}</p>
                </div>
            </div>
        </Reorder.Item>
    );
};

export const ProjectsForm = () => {
    const { resumeData, setResumeData } = useResume();
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [compareModal, setCompareModal] = useState<{ id: string; original: string; ai: string } | null>(null);
    const [showLimitModal, setShowLimitModal] = useState(false);

    const addProject = () => {
        setResumeData((prev) => ({
            ...prev,
            projects: [
                ...prev.projects,
                { id: generateId(), name: '', description: '', link: '' },
            ],
        }));
    };

    const removeProject = (id: string) => {
        setResumeData((prev) => ({
            ...prev,
            projects: prev.projects.filter((item) => item.id !== id),
        }));
    };

    const updateProject = (id: string, key: keyof ResumeData['projects'][0], value: string) => {
        setResumeData((prev) => ({
            ...prev,
            projects: prev.projects.map((item) => item.id === id ? { ...item, [key]: value } : item),
        }));
    };

    const handleReorder = (newOrder: ResumeData['projects']) => {
        setResumeData((prev) => ({ ...prev, projects: newOrder }));
    };

    const handleAiRewrite = async (id: string, currentText: string) => {
        if (!currentText) return;
        setLoadingId(id);
        try {
            const response = await fetch('/api/ai/optimize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: currentText,
                    type: 'project',
                    targetLanguage: resumeData.meta?.language
                }),
            });
            const data = await response.json();

            if (response.status === 403) {
                setShowLimitModal(true);
                return;
            }

            if (response.status === 401) {
                alert("Please log in to use AI features.");
                return;
            }

            if (!response.ok) {
                alert(`AI Error: ${data.error || 'Unknown error'}${data.detail ? ' — ' + data.detail : ''}`);
                return;
            }

            if (data.optimizedText) {
                setCompareModal({ id, original: currentText, ai: data.optimizedText });
            }
        } catch (error) {
            console.error("Rewrite failed", error);
            alert("Network error. Please try again.");
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <div className="space-y-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm mt-4">
            {showLimitModal && <AiLimitModal onClose={() => setShowLimitModal(false)} />}
            {compareModal && (
                <AiCompareModal
                    originalText={compareModal.original}
                    aiText={compareModal.ai}
                    onAccept={() => {
                        updateProject(compareModal.id, 'description', compareModal.ai);
                        setCompareModal(null);
                    }}
                    onReject={() => setCompareModal(null)}
                />
            )}
            <h3 className="text-lg font-semibold text-gray-800 flex items-center justify-between">
                <L text="Projects" />
                <button onClick={addProject} className="p-1 rounded-full hover:bg-gray-100 text-blue-600" title={translateResumeUi('Add Project', resumeData.meta?.language)}>
                    <Plus size={20} />
                </button>
            </h3>

            <Reorder.Group axis="y" values={resumeData.projects || []} onReorder={handleReorder} className="space-y-3">
                {(resumeData.projects || []).map((proj) => (
                    <ProjectItem
                        key={proj.id}
                        proj={proj}
                        updateProject={updateProject}
                        removeProject={removeProject}
                        handleAiRewrite={handleAiRewrite}
                        loading={loadingId === proj.id}
                    />
                ))}
            </Reorder.Group>

            {resumeData.projects.length === 0 && (
                <div className="text-center py-4 text-gray-400 text-sm"><L text="No projects added yet." /></div>
            )}
        </div>
    );
};

// --- CERTIFICATES ---

const CertificateItem = ({
    cert,
    updateCertificate,
    removeCertificate
}: {
    cert: ResumeData['certificates'][0];
    updateCertificate: (id: string, key: keyof ResumeData['certificates'][0], value: string) => void;
    removeCertificate: (id: string) => void;
}) => {
    const controls = useDragControls();
    const language = useResume().resumeData.meta?.language;

    return (
        <Reorder.Item
            value={cert}
            id={cert.id}
            dragListener={false}
            dragControls={controls}
            className="p-4 border border-gray-100 rounded-md bg-gray-50 space-y-3 group"
        >
            <div className="flex justify-end gap-2 mb-2">
                <div
                    onPointerDown={(e) => controls.start(e)}
                    className="cursor-grab text-gray-500 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded p-1.5 touch-none shadow-sm active:cursor-grabbing"
                    title={translateResumeUi('Drag to Reorder', language)}
                >
                    <GripVertical size={16} />
                </div>
                <button
                    onClick={() => removeCertificate(cert.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                    title={translateResumeUi('Delete', language)}
                >
                    <Trash2 size={18} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-medium text-black mb-1"><L text="Certificate Name" /></label>
                    <input
                        type="text"
                        className="w-full p-2 text-sm border border-gray-300 rounded-md text-black bg-white placeholder-gray-400"
                        value={cert.name}
                        onChange={(e) => updateCertificate(cert.id, 'name', e.target.value)}
                        placeholder={translateResumeUi('e.g. AWS Solutions Architect', language)}
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-black mb-1"><L text="Issuer" /></label>
                    <input
                        type="text"
                        className="w-full p-2 text-sm border border-gray-300 rounded-md text-black bg-white placeholder-gray-400"
                        value={cert.issuer}
                        onChange={(e) => updateCertificate(cert.id, 'issuer', e.target.value)}
                        placeholder={translateResumeUi('e.g. Amazon Web Services', language)}
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-black mb-1"><L text="Date" /></label>
                    <DateInput
                        value={cert.date}
                        onChange={(val) => updateCertificate(cert.id, 'date', val)}
                        placeholder="e.g. 06/2023"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-black mb-1"><L text="Link (Optional)" /></label>
                    <input
                        type="text"
                        className="w-full p-2 text-sm border border-gray-300 rounded-md text-black bg-white placeholder-gray-400"
                        value={cert.link || ''}
                        onChange={(e) => updateCertificate(cert.id, 'link', e.target.value)}
                        placeholder={translateResumeUi('https://credential.net/verify/...', language)}
                    />
                    <p className="mt-1 text-xs text-gray-500"><L text="Enter the certificate verification URL. It will appear as a clickable link in the preview and PDF." /></p>
                </div>
            </div>
        </Reorder.Item>
    );
};

export const CertificatesForm = () => {
    const { resumeData, setResumeData } = useResume();

    const addCertificate = () => {
        setResumeData((prev) => ({
            ...prev,
            certificates: [
                ...prev.certificates,
                { id: generateId(), name: '', issuer: '', date: '', link: '' },
            ],
        }));
    };

    const removeCertificate = (id: string) => {
        setResumeData((prev) => ({
            ...prev,
            certificates: prev.certificates.filter((item) => item.id !== id),
        }));
    };

    const updateCertificate = (id: string, key: keyof ResumeData['certificates'][0], value: string) => {
        setResumeData((prev) => ({
            ...prev,
            certificates: prev.certificates.map((item) => item.id === id ? { ...item, [key]: value } : item),
        }));
    };

    const handleReorder = (newOrder: ResumeData['certificates']) => {
        setResumeData((prev) => ({ ...prev, certificates: newOrder }));
    };

    return (
        <div className="space-y-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm mt-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center justify-between">
                <L text="Certificates" />
                <button onClick={addCertificate} className="p-1 rounded-full hover:bg-gray-100 text-blue-600" title={translateResumeUi('Add Certificate', resumeData.meta?.language)}>
                    <Plus size={20} />
                </button>
            </h3>

            <Reorder.Group axis="y" values={resumeData.certificates || []} onReorder={handleReorder} className="space-y-3">
                {(resumeData.certificates || []).map((cert) => (
                    <CertificateItem
                        key={cert.id}
                        cert={cert}
                        updateCertificate={updateCertificate}
                        removeCertificate={removeCertificate}
                    />
                ))}
            </Reorder.Group>

            {resumeData.certificates.length === 0 && (
                <div className="text-center py-4 text-gray-400 text-sm"><L text="No certificates added yet." /></div>
            )}
        </div>
    );
};

// --- LANGUAGES ---

const LanguageItem = ({
    lang,
    updateLanguage,
    removeLanguage
}: {
    lang: ResumeData['languages'][0];
    updateLanguage: (id: string, key: keyof ResumeData['languages'][0], value: string) => void;
    removeLanguage: (id: string) => void;
}) => {
    const controls = useDragControls();
    const { resumeData } = useResume();
    const language = resumeData.meta?.language;

    return (
        <Reorder.Item
            value={lang}
            id={lang.id}
            dragListener={false}
            dragControls={controls}
            className="flex gap-3 items-end relative group p-2 bg-gray-50 rounded-md border border-gray-100"
        >
            <div
                onPointerDown={(e) => controls.start(e)}
                className="cursor-grab text-gray-500 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded p-1.5 mb-1 touch-none shadow-sm active:cursor-grabbing"
                title={translateResumeUi('Drag to Reorder', language)}
            >
                <GripVertical size={16} />
            </div>

            <div className="flex-1">
                <label className="block text-xs font-medium text-black mb-1"><L text="Language" /></label>
                <input
                    type="text"
                    className="w-full p-2 text-sm border border-gray-300 rounded-md text-black bg-white placeholder-gray-400"
                    value={lang.language}
                    onChange={(e) => updateLanguage(lang.id, 'language', e.target.value)}
                    placeholder={translateResumeUi('e.g. English, German', language)}
                />
            </div>
            <div className="flex-1">
                <label className="block text-xs font-medium text-black mb-1"><L text="Proficiency Level" /></label>
                <select
                    className="w-full p-2 text-sm border border-gray-300 rounded-md text-black bg-white"
                    value={lang.level}
                    onChange={(e) => updateLanguage(lang.id, 'level', e.target.value)}
                >
                    <option value="Native">{translateResumeUi('Native', language)}</option>
                    <option value="Fluent">{translateResumeUi('Fluent', language)}</option>
                    <option value="Advanced">{translateResumeUi('Advanced', language)} (C1)</option>
                    <option value="Intermediate">{translateResumeUi('Intermediate', language)} (B2)</option>
                    <option value="Beginner">{translateResumeUi('Beginner', language)} (A1/A2)</option>
                </select>
            </div>
            <button
                onClick={() => removeLanguage(lang.id)}
                className="p-2 text-gray-400 hover:text-red-500 mb-0.5"
            >
                <Trash2 size={18} />
            </button>
        </Reorder.Item>
    );
};

export const LanguagesForm = () => {
    const { resumeData, setResumeData } = useResume();

    const addLanguage = () => {
        setResumeData((prev) => ({
            ...prev,
            languages: [...(prev.languages || []), { id: generateId(), language: '', level: 'Fluent' }]
        }));
    };

    const removeLanguage = (id: string) => {
        setResumeData((prev) => ({
            ...prev,
            languages: (prev.languages || []).filter((item) => item.id !== id)
        }));
    };

    const updateLanguage = (id: string, key: keyof ResumeData['languages'][0], value: string) => {
        setResumeData((prev) => ({
            ...prev,
            languages: (prev.languages || []).map((item) => item.id === id ? { ...item, [key]: value } : item)
        }));
    };

    const handleReorder = (newOrder: ResumeData['languages']) => {
        setResumeData((prev) => ({ ...prev, languages: newOrder }));
    };

    return (
        <div className="space-y-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm mt-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center justify-between">
                <L text="Languages" />
                <button onClick={addLanguage} className="p-1 rounded-full hover:bg-gray-100 text-blue-600" title={translateResumeUi('Add Language', resumeData.meta?.language)}>
                    <Plus size={20} />
                </button>
            </h3>

            <Reorder.Group axis="y" values={resumeData.languages || []} onReorder={handleReorder} className="space-y-3">
                {(resumeData.languages || []).map((lang) => (
                    <LanguageItem
                        key={lang.id}
                        lang={lang}
                        updateLanguage={updateLanguage}
                        removeLanguage={removeLanguage}
                    />
                ))}
            </Reorder.Group>

            {(resumeData.languages || []).length === 0 && (
                <div className="text-center py-4 text-gray-400 text-sm"><L text="No languages added yet." /></div>
            )}
        </div>
    );
};
