
import React from 'react';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-white text-gray-800 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto prose">
                <h1 className="text-3xl font-bold mb-8 text-black">Privacy Policy</h1>

                <p className="text-sm text-gray-500 mb-6" suppressHydrationWarning>
                    Last Updated: <span suppressHydrationWarning>{new Date().toLocaleDateString('en-US')}</span>
                </p>

                <h2 className="text-xl font-bold mt-8 mb-4 text-black">1. Information We Collect</h2>
                <p>
                    We collect information you provide directly to us when you create an account, build a resume, or communicate with us.
                    This includes your name, email address, phone number, and professional history (employment, education, skills).
                </p>

                <h2 className="text-xl font-bold mt-8 mb-4 text-black">2. How We Use Your Information</h2>
                <p>
                    We use the information we collect to:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                    <li>Provide, maintain, and improve our services.</li>
                    <li>Generate your resume PDF documents.</li>
                    <li>Process transactions (if you subscribe to Premium plans).</li>
                </ul>

                <h2 className="text-xl font-bold mt-8 mb-4 text-black">3. A.I. Processing</h2>
                <p>
                    When you use an AI feature, the relevant resume text, job description, and feedback are sent to Google Gemini API for processing. Google's data handling depends on whether the Google Cloud project is using an Unpaid or Paid Gemini API service. Under Google's current terms, Unpaid Service prompts and responses may be used to improve Google products and may be reviewed by people; Google says not to submit personal or sensitive information to Unpaid Services. For Paid Services, prompts and responses are not used to improve Google products, but Google may retain limited safety logs and may store them in countries where it or its agents operate. See the current <a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noreferrer">Gemini API terms</a>.
                </p>
                <p>
                    This processing may involve transfers outside Türkiye. Before offering the service to real users, the operator must determine and implement an applicable legal basis and cross-border transfer safeguard. This notice alone does not establish those requirements.
                </p>
                <p>
                    After a successful Job Match analysis, we save the job description and its explainable ATS result in your account history so you can view it later. The result can include short evidence excerpts (up to 25 words each) from your resume; we do not save a full resume copy. We delete records after 90 days and retain no more than the latest 50 per account, whichever limit is reached first. A daily cleanup job removes expired records; expired records are also removed when history is accessed or a new result is stored. You can review or delete individual results in the resume editor. Deleting a saved resume also deletes analyses linked to that resume.
                </p>

                <h2 className="text-xl font-bold mt-8 mb-4 text-black">4. Data Security</h2>
                <p>
                    We implement reasonable security measures to protect your information. However, no security system is impenetrable.
                </p>

                <h2 className="text-xl font-bold mt-8 mb-4 text-black">5. Contact Us</h2>
                <p>
                    If you have any questions about this Privacy Policy, please contact us at {process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@example.com'}.
                </p>
            </div>
        </div>
    );
}
