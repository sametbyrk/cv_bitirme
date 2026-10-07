import { GoogleGenerativeAI } from "@google/generative-ai";

const modelsToTry = ["gemini-2.0-flash", "gemini-2.0-flash-001", "gemini-2.5-flash", "gemini-1.5-flash"];

const languageMap: Record<string, string> = {
    en: 'English',
    tr: 'Turkish',
    de: 'German',
    fr: 'French',
    es: 'Spanish',
    it: 'Italian',
    pt: 'Portuguese',
    ru: 'Russian',
    zh: 'Chinese',
    ja: 'Japanese'
};

export async function optimizeContent(text: string, type: 'summary' | 'experience' | 'project' | 'job-match', targetLanguage?: string) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'your-gemini-key') {
        console.warn("Gemini API Key missing. Returning mock data.");
        return new Promise<string>((resolve) => {
            setTimeout(() => {
                if (type === 'job-match') {
                    resolve(JSON.stringify({
                        optimizedSummary: "[DEMO MODE] Passionate intern ready to learn...",
                        suggestedSkills: ["Demo Skill 1", "Demo Skill 2", "Demo Skill 3"],
                        matchScore: 99
                    }));
                } else {
                    resolve(`[DEMO AI]: Optimized version of "${text.substring(0, 20)}..."`);
                }
            }, 1000);
        });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    let lastError: any = null;

    // Resolve full language name if code provided
    const languageName = targetLanguage ? (languageMap[targetLanguage] || targetLanguage) : null;

    for (const modelName of modelsToTry) {
        try {
            console.log(`Attempting AI generation with model: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });

            let prompt = "";

            // Dynamic Language Instruction
            let languageInstruction = "";
            if (languageName) {
                languageInstruction = `IMPORTANT: The output MUST be in ${languageName}. If the input is in a different language, TRANSLATE it to ${languageName} while optimizing.`;
            } else {
                languageInstruction = "IMPORTANT: Detect the language of the input text (e.g., Turkish, German, English). The output MUST be in the SAME language as the input. Do NOT translate to English if the input is not English.";
            }

            if (type === 'experience') {
                prompt = `You are an expert resume writer. Your task is to SIGNIFICANTLY enhance the following work experience bullet point to make it sound highly professional, impactful, and achievement-oriented for a top-tier resume.
                ${languageInstruction}
                Input: "${text}"
                Rules:
                - Start with a strong action verb (e.g. Developed, Led, Optimized, Delivered, Engineered)
                - Make it sound more professional and specific even if the input is vague or short
                - Keep it under 30 words
                - Do NOT invent specific numbers, metrics, or tech stacks not mentioned
                - The output MUST be clearly and noticeably better than the input — never return the same or nearly identical text
                - Output ONLY the rewritten bullet point, nothing else`;
            } else if (type === 'summary') {
                prompt = `You are an expert resume writer. Your task is to SIGNIFICANTLY rewrite the following professional summary to make it compelling, confident, and recruiter-ready.
                ${languageInstruction}
                Input: "${text}"
                Rules:
                - Make it sound polished and professional even if the input is casual or short
                - Highlight value, skills, and passion without inventing false details
                - Keep it 2-3 sentences
                - The output MUST be clearly and noticeably better than the input — never return the same or nearly identical text
                - Output ONLY the rewritten summary, nothing else`;
            } else if (type === 'project') {
                prompt = `You are a senior software engineer writing resume content. Your task is to SIGNIFICANTLY rewrite the following project description to make it sound professional, technical, and impressive for a resume.
                ${languageInstruction}
                Input: "${text}"
                Rules:
                - Even if the input is short or casual, produce a clearly more professional and detailed version
                - Describe WHAT was built and WHY it matters (e.g. to solve X, enabling users to Y)
                - Mention the type of tech or approach only if it's clearly implied or stated — do NOT invent specific stack names
                - Max 2 sentences, concise but substantive
                - The output MUST be clearly and noticeably better than the input — never return the same or nearly identical text
                - Output ONLY the rewritten description, nothing else`;
            } else if (type === 'job-match') {
                // job-match prompt is constructed in ResumeEditor.tsx and passed here as 'text'.
                prompt = text;
            }

            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text().replace(/^"|"$/g, '').trim();

        } catch (error: any) {
            const errStr = String(error?.message || error);
            console.warn(`Model ${modelName} failed:`, errStr);
            lastError = error;
            // Only skip to next model on 404 (model not found)
            if (errStr.includes('404') || errStr.includes('not found') || errStr.includes('NOT_FOUND')) {
                continue;
            }
            // For auth errors or quota errors, break immediately — trying other models won't help
            if (errStr.includes('API_KEY_INVALID') || errStr.includes('403') || errStr.includes('401') || errStr.includes('API key')) {
                console.error('Fatal Gemini error (auth/key problem). Stopping retries.');
                break;
            }
            // For quota/rate limit, keep trying other models
        }
    }

    console.error('All Gemini models failed. Last error:', lastError?.message || lastError);
    throw new Error(`AI Optimization failed. Last error: ${lastError?.message || lastError}`);
}
