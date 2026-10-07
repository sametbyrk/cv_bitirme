
import React from 'react';

export default function CookiePolicyPage() {
    return (
        <div className="min-h-screen bg-white text-gray-800 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto prose">
                <h1 className="text-3xl font-bold mb-8 text-black">Cookie Policy</h1>

                <p className="text-sm text-gray-500 mb-6" suppressHydrationWarning>
                    Last Updated: <span suppressHydrationWarning>{new Date().toLocaleDateString('tr-TR')}</span>
                </p>

                <h2 className="text-xl font-bold mt-8 mb-4 text-black">1. What are cookies?</h2>
                <p>
                    Cookies are small text files that are stored on your computer or mobile device when you visit a website.
                    They allow the website to remember your actions and preferences (such as login, language, font size, and other display preferences) over a period of time.
                </p>

                <h2 className="text-xl font-bold mt-8 mb-4 text-black">2. How we use cookies</h2>
                <p>
                    We use cookies to:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                    <li>Identify you when you sign in to our site.</li>
                    <li>Keep track of your specified preferences.</li>
                    <li>Conduct research and diagnostics to improve our content, products, and services.</li>
                    <li>Prevent fraudulent activity.</li>
                    <li>Improve security.</li>
                </ul>

                <h2 className="text-xl font-bold mt-8 mb-4 text-black">3. Managing cookies</h2>
                <p>
                    You can manage browser cookies through your browser settings. The 'Help' feature on most browsers will tell you how to prevent your browser from accepting new cookies, how to have the browser notify you when you receive a new cookie, how to disable cookies, and when cookies will expire.
                </p>
            </div>
        </div>
    );
}
