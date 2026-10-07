
import React from 'react';
import Link from 'next/link';
import { FileText } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-gray-900 border-t border-gray-800 text-gray-400 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="md:col-span-2">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold"><FileText className="text-white" size={20} /></div>
                        <span className="text-xl font-bold text-white">CV Maker</span>
                    </div>
                    <p className="text-sm leading-relaxed mb-4 max-w-sm">
                        The AI-powered resume builder helping you land your dream job faster. ATS-friendly, professional, and easy to use.
                    </p>
                    <div className="text-xs text-gray-500">
                        &copy; {new Date().getFullYear()} CV Maker Inc. All rights reserved.
                    </div>
                </div>

                <div>
                    <h3 className="text-white font-bold mb-4">Product</h3>
                    <ul className="space-y-2 text-sm">
                        <li><Link href="/dashboard" className="hover:text-blue-400 transition">Resume Editor</Link></li>
                        <li><Link href="/pricing" className="hover:text-blue-400 transition">Pricing</Link></li>
                        <li><Link href="/examples" className="hover:text-blue-400 transition">Examples</Link></li>
                    </ul>
                </div>

                <div>
                    <h3 className="text-white font-bold mb-4">Legal</h3>
                    <ul className="space-y-2 text-sm">
                        <li><Link href="/privacy" className="hover:text-blue-400 transition">Privacy Policy</Link></li>
                        <li><Link href="/terms" className="hover:text-blue-400 transition">Terms of Service</Link></li>
                        <li><Link href="/cookies" className="hover:text-blue-400 transition">Cookie Policy</Link></li>
                    </ul>
                </div>
            </div>
        </footer>
    );
}
