import { z } from 'zod';

export const ResumeValidationSchema = z.object({
    personalInfo: z.object({
        fullName: z.string().nullish().default(''),
        email: z.union([z.literal(''), z.string().email()]).nullish().default(''),
        phone: z.string().nullish().default(''),
        linkedin: z.union([z.literal(''), z.string().url()]).nullish().default(''),
        github: z.union([z.literal(''), z.string().url()]).nullish().default(''),
        address: z.string().nullish().default(''),
        summary: z.string().nullish().default(''),
        photo: z.string().nullish().default('')
    }).default({
        fullName: '',
        email: '',
        phone: '',
        linkedin: '',
        github: '',
        address: '',
        summary: '',
        photo: ''
    }),
    education: z.array(z.object({
        id: z.string(),
        school: z.string().nullish().default(''),
        degree: z.string().nullish().default(''),
        startDate: z.string().nullish().default(''),
        endDate: z.string().nullish().default(''),
        description: z.string().nullish().default('')
    })).default([]),
    experience: z.array(z.object({
        id: z.string(),
        company: z.string().nullish().default(''),
        position: z.string().nullish().default(''),
        startDate: z.string().nullish().default(''),
        endDate: z.string().nullish().default(''),
        description: z.string().nullish().default('')
    })).default([]),
    skills: z.array(z.string()).default([]),
    projects: z.array(z.object({
        id: z.string(),
        name: z.string().nullish().default(''),
        description: z.string().nullish().default(''),
        link: z.string().nullish().default('')
    })).default([]),
    certificates: z.array(z.object({
        id: z.string(),
        name: z.string().nullish().default(''),
        issuer: z.string().nullish().default(''),
        date: z.string().nullish().default(''),
        link: z.string().nullish().default('')
    })).default([]),
    languages: z.array(z.object({
        id: z.string(),
        language: z.string().nullish().default(''),
        level: z.string().nullish().default('')
    })).default([]),
    meta: z.object({
        language: z.string().nullish().default('en')
    }).default({ language: 'en' }),
    templateId: z.enum(['classic', 'modern']).catch('classic').default('classic')
}).default({
    personalInfo: {
        fullName: '',
        email: '',
        phone: '',
        linkedin: '',
        github: '',
        address: '',
        summary: '',
        photo: ''
    },
    education: [],
    experience: [],
    skills: [],
    projects: [],
    certificates: [],
    languages: [],
    meta: {
        language: 'en'
    },
    templateId: 'classic'
});
