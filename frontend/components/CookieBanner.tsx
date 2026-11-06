'use client';

import React, { useState, useSyncExternalStore } from 'react';

const CONSENT_EVENT = 'cookie-consent-change';

function subscribeToConsent(callback: () => void) {
    window.addEventListener('storage', callback);
    window.addEventListener(CONSENT_EVENT, callback);
    return () => {
        window.removeEventListener('storage', callback);
        window.removeEventListener(CONSENT_EVENT, callback);
    };
}

function getConsentSnapshot(): boolean {
    return localStorage.getItem('cookie_consent') === 'true';
}

function getServerConsentSnapshot(): boolean | null {
    // Keep the banner hidden until the browser has read localStorage. Returning
    // false here flashes the banner for users who already accepted cookies.
    return null;
}

export default function CookieBanner() {
    const consentSnapshot = useSyncExternalStore(
        subscribeToConsent,
        getConsentSnapshot,
        getServerConsentSnapshot,
    );
    const [isDismissed, setIsDismissed] = useState(false);
    const isVisible = consentSnapshot === false && !isDismissed;

    const handleAccept = () => {
        localStorage.setItem('cookie_consent', 'true');
        window.dispatchEvent(new Event(CONSENT_EVENT));
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-4 md:p-6 z-50 animate-in slide-in-from-bottom-5 duration-500">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600 text-center md:text-left">
                    <p>
                        We use cookies to improve your experience and analyze site usage.
                        By continuing to use our site, you agree to our
                        <a href="/cookies" className="text-blue-600 hover:text-blue-800 underline ml-1">Cookie Policy</a>.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsDismissed(true)}
                        className="px-4 py-2 text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition"
                    >
                        Decline
                    </button>
                    <button
                        onClick={handleAccept}
                        className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-bold shadow-sm transition"
                    >
                        Accept All
                    </button>
                </div>
            </div>
        </div>
    );
}
