
import React from 'react';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-white text-gray-800 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto prose">
                <h1 className="text-3xl font-bold mb-8 text-black">Privacy Policy</h1>

                <p className="text-sm text-gray-500 mb-6" suppressHydrationWarning>
                    Last Updated: <span suppressHydrationWarning>{new Date().toLocaleDateString('tr-TR')}</span>
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
                    When you use our AI features (AI Writer, Job Match), the text you input is sent to third-party providers (Verify Provider, e.g., Google Gemini) for processing.
                    We do not use your personal resume data to train these public models.
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
