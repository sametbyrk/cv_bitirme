'use client';

import React from 'react';
import Image from 'next/image';
import { useResume } from '@/context/ResumeContext';
import { Mail, Phone, Linkedin, MapPin, Github } from 'lucide-react';
import { translateResumeUi } from '@/lib/resume-translations';

function groupSkills(skills: string[]) {
    const groups = new Map<string, string[]>();
    for (const entry of skills) {
        const separator = entry.indexOf(': ');
        const category = separator > 0 ? entry.slice(0, separator).trim() : '';
        const skill = separator > 0 ? entry.slice(separator + 2).trim() : entry;
        if (!skill) continue;
        const key = category;
        groups.set(key, [...(groups.get(key) || []), skill]);
    }
    return [...groups.entries()];
}

const SECTION_TITLES = {
    en: { experience: 'Experience', education: 'Education', skills: 'Skills', languages: 'Languages', projects: 'Projects', certificates: 'Certificates', summary: 'Summary', contact: 'Contact', email: 'Email', phone: 'Phone', linkedin: 'LinkedIn', github: 'GitHub', location: 'Location', verifyCertificate: 'Verify certificate' },
    tr: { experience: 'İş Deneyimi', education: 'Eğitim', skills: 'Yetenekler', languages: 'Diller', projects: 'Projeler', certificates: 'Sertifikalar', summary: 'Özet', contact: 'İletişim', email: 'E-posta', phone: 'Telefon', linkedin: 'LinkedIn', github: 'GitHub', location: 'Konum', verifyCertificate: 'Sertifikayı doğrula' },
    de: { experience: 'Berufserfahrung', education: 'Ausbildung', skills: 'Fähigkeiten', languages: 'Sprachen', projects: 'Projekte', certificates: 'Zertifikate', summary: 'Profil', contact: 'Kontakt', email: 'E-Mail', phone: 'Telefon', linkedin: 'LinkedIn', github: 'GitHub', location: 'Standort', verifyCertificate: 'Zertifikat überprüfen' },
    es: { experience: 'Experiencia', education: 'Educación', skills: 'Habilidades', languages: 'Idiomas', projects: 'Proyectos', certificates: 'Certificados', summary: 'Resumen profesional', contact: 'Contacto', email: 'Correo electrónico', phone: 'Teléfono', linkedin: 'LinkedIn', github: 'GitHub', location: 'Ubicación', verifyCertificate: 'Verificar certificado' },
    fr: { experience: 'Expérience', education: 'Formation', skills: 'Compétences', languages: 'Langues', projects: 'Projets', certificates: 'Certificats', summary: 'Résumé professionnel', contact: 'Contact', email: 'E-mail', phone: 'Téléphone', linkedin: 'LinkedIn', github: 'GitHub', location: 'Localisation', verifyCertificate: 'Vérifier le certificat' },
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

export function ResumePreviewHTML() {
    const { resumeData } = useResume();
    const { templateId, projects = [], certificates = [], languages = [], education = [], experience = [], skills = [], personalInfo } = resumeData;
    const langCode = (resumeData.meta?.language || 'en') as keyof typeof SECTION_TITLES;
    const titles = SECTION_TITLES[langCode] || SECTION_TITLES['en'];

    // --- Modern/Premium Template (Two-Column with Sidebar) ---
    if (templateId === 'modern') {
        return (
            <div className="bg-white shadow-2xl w-[210mm] min-h-[297mm] mx-auto text-gray-900 font-sans text-sm leading-normal origin-top scale-75 md:scale-90 lg:scale-100 transition-transform grid grid-cols-[1fr_2fr] h-full">

                {/* Sidebar (Left) - Dark */}
                <div className="bg-slate-900 text-white p-8 space-y-8 h-full min-h-[inherit]">
                    {/* Header */}
                    <div className="text-center">
                        {personalInfo.photo && (
                            <div className="w-24 h-32 bg-blue-500 rounded-xl mx-auto mb-4 flex items-center justify-center overflow-hidden border-2 border-white/10 shadow-lg">
                                <Image src={personalInfo.photo} alt="Profile photo" width={96} height={128} unoptimized className="w-full h-full object-cover" />
                            </div>
                        )}
                        <h1 className="text-2xl font-bold uppercase tracking-wider mb-2 leading-tight">
                            {personalInfo.fullName || 'Your Name'}
                        </h1>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-3 text-xs text-gray-300">
                        {personalInfo.email && (
                            <div className="flex items-center gap-2 break-all">
                                <Mail size={14} className="text-blue-400 shrink-0" />
                                <span>{personalInfo.email}</span>
                            </div>
                        )}
                        {personalInfo.phone && (
                            <div className="flex items-center gap-2">
                                <Phone size={14} className="text-blue-400 shrink-0" />
                                <span>{personalInfo.phone}</span>
                            </div>
                        )}
                        {personalInfo.linkedin && (
                            <div className="flex items-center gap-2 break-all">
                                <Linkedin size={14} className="text-blue-400 shrink-0" />
                                <span>{personalInfo.linkedin}</span>
                            </div>
                        )}
                        {personalInfo.github && (
                            <div className="flex items-center gap-2 break-all">
                                <Github size={14} className="text-blue-400 shrink-0" />
                                <span>{personalInfo.github}</span>
                            </div>
                        )}
                        {personalInfo.address && (
                            <div className="flex items-center gap-2">
                                <MapPin size={14} className="text-blue-400 shrink-0" />
                                <span>{personalInfo.address}</span>
                            </div>
                        )}
                    </div>

                    {/* Education (Sidebar style) */}
                    {education.length > 0 && (
                        <div>
                            <h2 className="text-sm font-bold uppercase tracking-widest text-blue-400 mb-4 border-b border-gray-700 pb-2">
                                {titles.education}
                            </h2>
                            <div className="space-y-4">
                                {education.map((edu, i) => (
                                    <div key={i}>
                                        <h3 className="font-bold text-white">{edu.school}</h3>
                                        <p className="text-xs text-gray-400">{edu.degree}</p>
                                        <p className="text-xs text-gray-500 italic mt-1">{edu.startDate} - {edu.endDate}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Skills (Sidebar style) */}
                    {skills.length > 0 && (
                        <div>
                            <h2 className="text-sm font-bold uppercase tracking-widest text-blue-400 mb-4 border-b border-gray-700 pb-2">
                                {titles.skills}
                            </h2>
                            <div className="space-y-2">
                                {groupSkills(skills).map(([category, items]) => (
                                    <div key={category || 'uncategorized'} className="text-xs text-blue-100">
                                        {category && <strong className="text-blue-200">{category}: </strong>}
                                        {items.join(' • ')}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Languages (Sidebar style) */}
                    {languages.length > 0 && (
                        <div>
                            <h2 className="text-sm font-bold uppercase tracking-widest text-blue-400 mb-4 border-b border-gray-700 pb-2">
                                {titles.languages}
                            </h2>
                            <div className="space-y-2">
                                {languages.map((lang, i) => (
                                    <div key={i} className="flex justify-between text-xs">
                                        <span className="text-white font-medium">{lang.language}</span>
                                        <span className="text-gray-400">{lang.level === 'Custom' ? lang.customLevel : translateResumeUi(lang.level, langCode)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Certificates (Sidebar style) */}
                    {certificates.length > 0 && (
                        <div>
                            <h2 className="text-sm font-bold uppercase tracking-widest text-blue-400 mb-4 border-b border-gray-700 pb-2">
                                {titles.certificates}
                            </h2>
                            <div className="space-y-3">
                                {certificates.map((cert, i) => {
                                    const certificateUrl = normalizeExternalUrl(cert.link);
                                    return (
                                    <div key={i}>
                                        <h3 className="font-bold text-white text-xs">
                                            {certificateUrl ? (
                                                <a href={certificateUrl} target="_blank" rel="noopener noreferrer" className="hover:text-blue-300 underline underline-offset-2">
                                                    {cert.name} ↗
                                                </a>
                                            ) : (
                                                cert.name
                                            )}
                                        </h3>
                                        <p className="text-xs text-gray-400">{cert.issuer} {cert.date && `• ${cert.date}`}</p>
                                    </div>
                                )})}
                            </div>
                        </div>
                    )}
                </div>

                {/* Main Content (Right) */}
                <div className="p-10 space-y-8 bg-white text-gray-800">

                    {/* Summary */}
                    {personalInfo.summary && (
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 border-b-2 border-slate-900 pb-2 mb-4 uppercase">
                                {titles.summary}
                            </h2>
                            <p className="text-sm text-gray-600 leading-7 text-justify whitespace-pre-line">
                                {personalInfo.summary}
                            </p>
                        </div>
                    )}

                    {/* Experience */}
                    {experience.length > 0 && (
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 border-b-2 border-slate-900 pb-2 mb-6 uppercase">
                                {titles.experience}
                            </h2>
                            <div className="space-y-8 border-l-2 border-gray-200 pl-6 ml-2">
                                {experience.map((exp, i) => (
                                    <div key={i} className="relative">
                                        {/* Timeline Dot */}
                                        <div className="absolute -left-[31px] top-1 w-4 h-4 bg-slate-900 rounded-full border-4 border-white"></div>

                                        <div className="flex justify-between items-baseline mb-2">
                                            <h3 className="text-lg font-bold text-gray-800">{exp.position}</h3>
                                            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                                {exp.startDate} - {exp.endDate}
                                            </span>
                                        </div>
                                        <div className="text-sm font-semibold text-blue-600 mb-2">
                                            {exp.company}
                                        </div>
                                        <p className="text-sm text-gray-600 leading-relaxed text-justify whitespace-pre-line">
                                            {exp.description}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Projects (Main Content style) */}
                    {projects.length > 0 && (
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 border-b-2 border-slate-900 pb-2 mb-6 uppercase">
                                {titles.projects}
                            </h2>
                            <div className="space-y-6">
                                {projects.map((proj, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h3 className="text-lg font-bold text-gray-800">{proj.name}</h3>
                                            {proj.link && (
                                                <a href={proj.link.startsWith('http') ? proj.link : `https://${proj.link}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">
                                                    Link ↗
                                                </a>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 leading-relaxed text-justify whitespace-pre-line">
                                            {proj.description}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // --- Classic Template (ATS-Friendly, Single Column) ---
    return (
        <div className="bg-white shadow-2xl w-[210mm] min-h-[297mm] p-[40px] mx-auto text-gray-900 font-serif text-sm leading-normal origin-top scale-75 md:scale-90 lg:scale-100 transition-transform">

            {/* Header */}
            <div className="border-b-2 border-gray-800 pb-4 mb-6 flex items-start gap-6">
                {personalInfo.photo && (
                    <div className="w-24 h-32 shrink-0 overflow-hidden border-2 border-gray-200 rounded-lg shadow-sm">
                        <Image src={personalInfo.photo} alt="Profile photo" width={96} height={128} unoptimized className="w-full h-full object-cover" />
                    </div>
                )}
                <div className="flex-1">
                    <h1 className="text-3xl font-bold uppercase tracking-wide text-gray-900 mb-2">
                        {personalInfo.fullName || 'Your Name'}
                    </h1>

                    {/* Contact Info - Plain Text for ATS */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                        {personalInfo.email && <span>{titles.email}: {personalInfo.email}</span>}
                        {personalInfo.phone && <span>| {titles.phone}: {personalInfo.phone}</span>}
                        {personalInfo.linkedin && <span>| {titles.linkedin}: <a href={personalInfo.linkedin.startsWith('http') ? personalInfo.linkedin : `https://${personalInfo.linkedin}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{personalInfo.linkedin}</a></span>}
                        {personalInfo.github && <span>| {titles.github}: <a href={personalInfo.github.startsWith('http') ? personalInfo.github : `https://${personalInfo.github}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{personalInfo.github}</a></span>}
                        {personalInfo.address && <span>| {titles.location}: {personalInfo.address}</span>}
                    </div>
                </div>
            </div>

            {/* Summary */}
            {personalInfo.summary && (
                <div className="mb-6">
                    <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest border-b-2 border-gray-600 pb-1 mb-2">
                        {titles.summary}
                    </h2>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                        {personalInfo.summary}
                    </p>
                </div>
            )}

            {/* Experience */}
            {experience.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest border-b-2 border-gray-600 pb-1 mb-3">
                        {titles.experience}
                    </h2>
                    <div className="space-y-4">
                        {experience.map((exp, i) => (
                            <div key={i}>
                                <div className="flex justify-between items-baseline mb-1">
                                    <div>
                                        <span className="text-sm font-bold text-gray-900">{exp.position}</span>
                                        <span className="text-sm text-gray-600"> at {exp.company}</span>
                                    </div>
                                    <span className="text-xs font-semibold text-gray-700">{exp.startDate} - {exp.endDate}</span>
                                </div>
                                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{exp.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Projects */}
            {projects.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest border-b-2 border-gray-600 pb-1 mb-3">
                        {titles.projects}
                    </h2>
                    <div className="space-y-3">
                        {projects.map((proj, i) => (
                            <div key={i}>
                                <div className="flex justify-between items-baseline">
                                    <span className="text-sm font-bold text-gray-900">{proj.name}</span>
                                    {proj.link && <a href={proj.link.startsWith('http') ? proj.link : `https://${proj.link}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">{proj.link}</a>}
                                </div>
                                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{proj.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Education */}
            {education.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest border-b-2 border-gray-600 pb-1 mb-3">
                        {titles.education}
                    </h2>
                    <div className="space-y-3">
                        {education.map((edu, i) => (
                            <div key={i}>
                                <div className="flex justify-between items-baseline">
                                    <div>
                                        <span className="text-sm font-bold text-gray-900">{edu.degree}</span>
                                        <span className="text-sm text-gray-600"> - {edu.school}</span>
                                    </div>
                                    <span className="text-xs font-semibold text-gray-700">{edu.startDate} - {edu.endDate}</span>
                                </div>
                                {edu.description && <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{edu.description}</p>}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Skills */}
            {skills.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest border-b-2 border-gray-600 pb-1 mb-2">
                        {titles.skills}
                    </h2>
                    <p className="text-sm text-gray-700">
                        {groupSkills(skills).map(([category, items]) => (
                            <span key={category} className="block">
                                {category && <strong>{category}: </strong>}{items.join(' • ')}
                            </span>
                        ))}
                    </p>
                </div>
            )}

            {/* Languages */}
            {languages.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest border-b-2 border-gray-600 pb-1 mb-2">
                        {titles.languages}
                    </h2>
                    <p className="text-sm text-gray-700">
                        {languages.map((lang) => `${lang.language} (${lang.level === 'Custom' ? lang.customLevel || '' : translateResumeUi(lang.level, langCode)})`).join(' • ')}
                    </p>
                </div>
            )}

            {/* Certificates */}
            {certificates.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest border-b-2 border-gray-600 pb-1 mb-2">
                        {titles.certificates}
                    </h2>
                    <div className="space-y-1">
                        {certificates.map((cert, i) => {
                            const certificateUrl = normalizeExternalUrl(cert.link);
                            return (
                            <div key={i} className="text-sm">
                                <span className="font-semibold text-gray-900">{cert.name}</span>
                                {cert.issuer && <span className="text-gray-600"> - {cert.issuer}</span>}
                                {cert.date && <span className="text-gray-500"> ({cert.date})</span>}
                                {certificateUrl && <span className="text-gray-600"> - <a href={certificateUrl} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">{titles.verifyCertificate}: {new URL(certificateUrl).host}</a></span>}
                            </div>
                        )})}
                    </div>
                </div>
            )}
        </div>
    );
};
