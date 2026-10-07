export function calculateHybridAtsScore(
    jobKeywords: string[],
    resumeText: string
): { matchScore: number; matchedKeywords: string[]; missingKeywords: string[] } {
    if (!jobKeywords || jobKeywords.length === 0) {
        return { matchScore: 0, matchedKeywords: [], missingKeywords: [] };
    }

    const matchedKeywords: string[] = [];
    const missingKeywords: string[] = [];

    // Normalize resume text for case-insensitive matching
    const normalizedResumeText = resumeText.toLowerCase();

    for (const keyword of jobKeywords) {
        const normalizedKeyword = keyword.toLowerCase().trim();
        if (!normalizedKeyword) continue;

        // Escaping regex special characters in the keyword
        const escapedKeyword = normalizedKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escapedKeyword}\\b`, 'i');

        // Check if keyword exists using word boundary
        if (regex.test(normalizedResumeText)) {
            matchedKeywords.push(keyword);
        } else {
            missingKeywords.push(keyword);
        }
    }

    const totalKeywords = matchedKeywords.length + missingKeywords.length;
    let matchScore = 0;
    
    if (totalKeywords > 0) {
        matchScore = Math.round((matchedKeywords.length / totalKeywords) * 100);
    }

    return {
        matchScore,
        matchedKeywords,
        missingKeywords
    };
}
