'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ResumeProvider, ResumeData } from '@/context/ResumeContext';
import { ResumePreviewHTML } from '@/components/ResumePreviewHTML';

// Dummy Data 1: Modern - Software Engineer
const EXAMPLE_MODERN: ResumeData = {
    personalInfo: {
        fullName: 'Alex Wright',
        email: 'alex.wright.dev@example-mail.com',
        phone: '+1 (555) 019-2834',
        linkedin: 'linkedin.com/in/alex-wright-demo-dev',
        github: 'github.com/alex-wright-demo',
        address: 'San Francisco, CA',
        photo: '/avatar_modern.png',
        summary: 'Innovative and detail-oriented Senior Full-Stack Engineer with 7+ years of experience crafting robust, scalable web architectures. Proven expertise in React, Next.js, Node.js, and modern cloud database ecosystems. Passionate about engineering high-performance systems and leading cross-functional teams.',
    },
    experience: [
        {
            id: 'exp1',
            company: 'TechFlow Solutions',
            position: 'Senior Frontend Engineer',
            startDate: '2021',
            endDate: 'Present',
            description: 'Led a team of 4 developers in rebuilding the core SaaS dashboard using Next.js and Tailwind CSS, reducing average initial page load times by 42%. Established unit testing standards with Jest and React Testing Library, boosting code coverage to 90%.',
        },
        {
            id: 'exp2',
            company: 'Creative Digital Studio',
            position: 'Full-Stack Developer',
            startDate: '2018',
            endDate: '2021',
            description: 'Architected and maintained 20+ responsive web projects using React, Node.js, and PostgreSQL. Automated CI/CD deployment pipelines using GitHub Actions and AWS ECS, cutting deployments from 2 hours to under 10 minutes.',
        }
    ],
    education: [
        {
            id: 'edu1',
            school: 'University of California, Berkeley',
            degree: 'B.S. Computer Science',
            startDate: '2014',
            endDate: '2018',
            description: 'Graduated with Magna Cum Laude. Actively organized regional developer hackathons and specialized in human-computer interaction (HCI) methodologies.',
        }
    ],
    skills: ['React', 'TypeScript', 'Next.js', 'Node.js', 'TailwindCSS', 'PostgreSQL', 'GraphQL', 'Docker', 'AWS'],
    projects: [
        {
            id: 'proj1',
            name: 'ZenTask - Collaborative PM Suite',
            description: 'Designed a real-time team project board application utilising WebSockets and Redis. Integrated drag-and-drop workflow status tools and automated analytics reports.',
            link: 'github.com/alex-wright-demo/zentask'
        },
        {
            id: 'proj2',
            name: 'AutoSync - Cloud Storage Bridge',
            description: 'Created a CLI and desktop client that synchronizes local directory folders with S3 buckets. Implemented smart deduplication algorithms to reduce bandwidth consumption.',
            link: 'github.com/alex-wright-demo/autosync'
        }
    ],
    certificates: [
        {
            id: 'cert1',
            name: 'AWS Certified Solutions Architect',
            issuer: 'Amazon Web Services',
            date: '2024',
            link: 'credly.com/aws-solutions-architect-demo'
        },
        {
            id: 'cert2',
            name: 'Advanced React Pattern Expert',
            issuer: 'Frontend Masters',
            date: '2022',
            link: ''
        }
    ],
    languages: [{ id: 'lang1', language: 'English', level: 'Native' }, { id: 'lang2', language: 'Spanish', level: 'Conversational' }],
    meta: { language: 'en' },
    templateId: 'modern',
};

// Dummy Data 2: Classic - Product Manager
const EXAMPLE_CLASSIC: ResumeData = {
    personalInfo: {
        fullName: 'Sarah Jenkins',
        email: 'sarah.jenkins.pm@example-mail.com',
        phone: '+44 20 7946 0192',
        linkedin: 'linkedin.com/in/sarah-jenkins-demo-pm',
        github: 'github.com/sarah-jenkins-demo',
        address: 'London, United Kingdom',
        photo: '/avatar_classic.png',
        summary: 'Results-driven Lead Product Manager with 8+ years of expertise in agile development, product lifecycle strategy, and market-driven research. Strong history of leading cross-functional teams to launch high-impact SaaS products and digital platforms, leveraging analytical insights to increase customer acquisition and retention.',
    },
    experience: [
        {
            id: 'exp3',
            company: 'Global SaaS Corporation',
            position: 'Lead Product Manager',
            startDate: '2021',
            endDate: 'Present',
            description: 'Spearheaded the mobile-first redesign of our enterprise SaaS portal, which onboarded 150k+ daily active users and increased monthly revenue by 25%. Directed the long-term product roadmap and sprint cycles for three engineering teams.',
        },
        {
            id: 'exp4',
            company: 'FinTech Innovators Ltd',
            position: 'Associate Product Manager',
            startDate: '2018',
            endDate: '2021',
            description: 'Conducted 100+ user interviews to identify usability gaps, leading to key onboarding feature improvements that drove a 18% increase in user retention. Assisted in writing spec documents and managing backlog priorities in JIRA.',
        }
    ],
    education: [
        {
            id: 'edu2',
            school: 'NYU Stern School of Business',
            degree: 'MBA in Product Management & Strategy',
            startDate: '2016',
            endDate: '2018',
            description: 'Specialized in marketing analytics and entrepreneurial studies. Graduated with top honors.',
        },
        {
            id: 'edu3',
            school: 'University College London',
            degree: 'B.Sc. Management Science',
            startDate: '2012',
            endDate: '2015',
            description: 'Focused on operations research, data analytics, and organizational behavior.',
        }
    ],
    skills: ['Product Strategy', 'Agile & Scrum', 'Roadmap Planning', 'User Research', 'Data Analysis (SQL)', 'A/B Testing', 'JIRA & Confluence', 'Wireframing'],
    projects: [
        {
            id: 'proj3',
            name: 'PayStream - Peer-to-Peer Payments',
            description: 'Managed the launch of a new micro-payment feature, coordinating between design, engineering, and compliance. Achieved 200k transactions in the first month.',
            link: 'github.com/sarah-jenkins-demo/paystream'
        },
        {
            id: 'proj4',
            name: 'InsightDash - Customer Feedback Hub',
            description: 'Created an internal dashboard that aggregates NPS scores and customer support tickets to categorize product feedback using NLP sentiment analysis.',
            link: 'github.com/sarah-jenkins-demo/insightdash'
        }
    ],
    certificates: [
        {
            id: 'cert3',
            name: 'Certified Scrum Product Owner (CSPO)',
            issuer: 'Scrum Alliance',
            date: '2023',
            link: ''
        },
        {
            id: 'cert4',
            name: 'Product Management Professional',
            issuer: 'Product School',
            date: '2020',
            link: 'credly.com/product-school-pm-demo'
        }
    ],
    languages: [{ id: 'lang3', language: 'English', level: 'Native' }, { id: 'lang4', language: 'French', level: 'Professional Working' }],
    meta: { language: 'en' },
    templateId: 'classic',
};

export default function ExamplesPage() {
    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <nav className="bg-white border-b border-gray-100 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center gap-4">
                    <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition">
                        <ArrowLeft size={20} /> Back to Home
                    </Link>
                </div>
            </nav>
            <div className="max-w-7xl mx-auto py-12 px-6">
                <h1 className="text-4xl font-bold text-gray-900 mb-4 text-center">Resume Examples</h1>
                <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
                    Explore our professional, ATS-friendly resume templates.
                    Choose a style that matches your career path, customize it in the editor, and download your high-quality resume in minutes.
                </p>
 
                <div className="grid md:grid-cols-2 gap-12">
                    {/* Example 1 - Modern */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                        <h3 className="text-xl font-bold mb-4 flex items-center justify-between">
                            <span className='text-black'>Software Engineer (Modern)</span>
                            <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded">Ivy League</span>
                        </h3>
                        {/* Preview Container */}
                        <div className="bg-gray-100 h-[500px] rounded-lg border border-gray-200 overflow-hidden relative group">
                            <div className="absolute inset-0 overflow-hidden bg-gray-500/5">
                                <ResumeProvider initialData={EXAMPLE_MODERN} skipDraftRestore={true}>
                                    <div className="transform scale-[0.35] sm:scale-[0.45] origin-top-left w-[210mm] h-[297mm] bg-white shadow-lg pointer-events-none">
                                        <ResumePreviewHTML />
                                    </div>
                                </ResumeProvider>
                            </div>
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <Link href="/editor?template=modern" className="bg-blue-600 text-white px-6 py-3 rounded-full font-bold shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all">
                                    Use This Template
                                </Link>
                            </div>
                        </div>
                        <p className="mt-4 text-sm text-gray-500">
                            Best for applying to startups and tech companies. Precise, clean, and highlights skills.
                        </p>
                    </div>
 
                    {/* Example 2 - Classic */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                        <h3 className="text-xl font-bold mb-4 flex items-center justify-between">
                            <span className='text-black'>Product Manager (Classic)</span>
                            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">Traditional</span>
                        </h3>
                        {/* Preview Container */}
                        <div className="bg-gray-100 h-[500px] rounded-lg border border-gray-200 overflow-hidden relative group">
                            <div className="absolute inset-0 overflow-hidden bg-gray-500/5">
                                <ResumeProvider initialData={EXAMPLE_CLASSIC} skipDraftRestore={true}>
                                    <div className="transform scale-[0.35] sm:scale-[0.45] origin-top-left w-[210mm] h-[297mm] bg-white shadow-lg pointer-events-none">
                                        <ResumePreviewHTML />
                                    </div>
                                </ResumeProvider>
                            </div>
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <Link href="/editor?template=classic" className="bg-blue-600 text-white px-6 py-3 rounded-full font-bold shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all">
                                    Use This Template
                                </Link>
                            </div>
                        </div>
                        <p className="mt-4 text-sm text-gray-500">
                            Perfect for corporate roles, banking, and government jobs. Simple, ATS-readable format.
                        </p>
                    </div>
                </div>

                <div className="mt-16 text-center">
                    <Link href="/dashboard" className="px-8 py-4 bg-blue-600 text-white rounded-lg font-bold text-lg hover:bg-blue-700 transition inline-block">
                        Build Your Own Resume Now
                    </Link>
                </div>
            </div>
        </div>
    );
}
