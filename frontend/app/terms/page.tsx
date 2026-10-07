
import React from 'react';

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-white text-gray-800 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto prose">
                <h1 className="text-3xl font-bold mb-8 text-black">Terms of Service</h1>

                <p className="text-sm text-gray-500 mb-6" suppressHydrationWarning>
                    Last Updated: <span suppressHydrationWarning>{new Date().toLocaleDateString('tr-TR')}</span>
                </p>

                <h2 className="text-xl font-bold mt-8 mb-4 text-black">1. Acceptance of Terms</h2>
                <p>
                    By accessing or using our website, you agree to be bound by these Terms of Service. If you do not agree, do not use our services.
                </p>

                <h2 className="text-xl font-bold mt-8 mb-4 text-black">2. Description of Service</h2>
                <p>
                    CV Maker provides an online resume builder tool. We offer both free and paid subscriptions.
                    We reserve the right to modify or discontinue the service at any time.
                </p>

                <h2 className="text-xl font-bold mt-8 mb-4 text-black">3. User Accounts</h2>
                <p>
                    You are responsible for maintaining the security of your account credentials. You are responsible for all activities that occur under your account.
                </p>

                <h2 className="text-xl font-bold mt-8 mb-4 text-black">4. Paid Services</h2>
                <p>
                    Certain features (e.g., AI Writer limit increases, Premium Templates) require payment. All fees are non-refundable unless required by law.
                </p>

                <h2 className="text-xl font-bold mt-8 mb-4 text-black">5. Termination</h2>
                <p>
                    We may terminate or suspend your access to the Service immediately, without prior notice, for any reason whatsoever, including without limitation if you breach the Terms.
                </p>
            </div>
        </div>
    );
}
