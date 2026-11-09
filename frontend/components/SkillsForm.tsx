'use client';

import React, { useState } from 'react';
import { useResume } from '@/context/ResumeContext';
import { Trash2 } from 'lucide-react';
import { translateResumeUi } from '@/lib/resume-translations';

export const SkillsForm = () => {
    const { resumeData, setResumeData } = useResume();
    const t = (text: string) => translateResumeUi(text, resumeData.meta?.language);
    const [skillInput, setSkillInput] = useState('');
    const [category, setCategory] = useState('');
    const [limitError, setLimitError] = useState(false);

    const addSkill = () => {
        const cleanSkill = skillInput.trim();
        const cleanCategory = category.trim();
        if (!cleanSkill) return;
        const entry = cleanCategory ? `${cleanCategory}: ${cleanSkill}` : cleanSkill;
        if (entry.length > 50) {
            setLimitError(true);
            return;
        }
        setResumeData((prev) => ({
            ...prev,
            skills: [...prev.skills, entry],
        }));
        setSkillInput('');
        setLimitError(false);
    };

    const removeSkill = (index: number) => {
        setResumeData((prev) => ({
            ...prev,
            skills: prev.skills.filter((_, i) => i !== index),
        }));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addSkill();
        }
    };

    return (
        <div className="space-y-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800">{t('Skills')}</h3>

            <div className="flex flex-col gap-2">
                <input
                    type="text"
                    className="p-2 border border-gray-300 rounded-md text-black bg-white placeholder-gray-400"
                    value={category}
                    onChange={(e) => { setCategory(e.target.value); setLimitError(false); }}
                    maxLength={50}
                    aria-label={t('Optional category')}
                    placeholder={t('Category (optional, e.g. Programming, Databases, Office)')}
                />
                <div className="flex gap-2">
                <input
                    type="text"
                    className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white placeholder-gray-400"
                    value={skillInput}
                    onChange={(e) => { setSkillInput(e.target.value); setLimitError(false); }}
                    maxLength={50}
                    onKeyDown={handleKeyDown}
                    placeholder={t('Add a skill (e.g. Python, Excel)')}
                />
                <button
                    onClick={addSkill}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                    {t('Add')}
                </button>
                </div>
                {limitError && <p className="text-sm text-red-600">{t('Category and skill must be 50 characters or fewer.')}</p>}
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
                {resumeData.skills.map((skill, index) => (
                    <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                    >
                        {skill}
                        <button
                            onClick={() => removeSkill(index)}
                            className="hover:text-red-500 ml-1"
                        >
                            <Trash2 size={14} />
                        </button>
                    </span>
                ))}
                {resumeData.skills.length === 0 && (
                    <div className="text-gray-400 text-sm italic">
                        {t('No skills added yet.')}
                    </div>
                )}
            </div>
        </div>
    );
};
