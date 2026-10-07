import Link from 'next/link';
import { Check, Star, Zap, Shield, FileText } from 'lucide-react';

export default function PricingPage({
    searchParams,
}: {
    searchParams?: Promise<{ limit?: string }>
}) {
    // Await params if needed in future, currently just using for optional display logic if we wanted.

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            {/* Simple Header */}
            <div className="bg-white border-b border-gray-100 py-4 px-6">
                <Link href="/" className="flex items-center gap-2 max-w-7xl mx-auto">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold"><FileText className="text-white" size={20} /></div>
                    <span className="text-xl font-bold text-gray-900">CV Maker</span>
                </Link>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-4 sm:text-5xl">
                        Upgrade to <span className="text-blue-600">Pro</span>
                    </h1>
                    <p className="text-xl text-gray-600">
                        Unlock unlimited AI power and create as many resumes as you need to land your dream job.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto w-full">

                    {/* Free Plan */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col relative overflow-hidden">
                        <div className="mb-4">
                            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 uppercase tracking-wide">
                                Starter
                            </span>
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900 mb-2">Free</h3>
                        <p className="text-gray-500 mb-6">Perfect for trying out the resume builder.</p>

                        <div className="flex-1">
                            <ul className="space-y-4 mb-8">
                                <li className="flex items-start gap-3">
                                    <Check className="text-green-500 shrink-0" size={20} />
                                    <span className="text-gray-600">Create up to <strong>3 Resumes</strong></span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Check className="text-green-500 shrink-0" size={20} />
                                    <span className="text-gray-600"><strong>3 AI Optimiztions</strong> (Try it out)</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Check className="text-green-500 shrink-0" size={20} />
                                    <span className="text-gray-600">Basic PDF Download</span>
                                </li>
                            </ul>
                        </div>

                        <button className="w-full py-3 px-4 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition">
                            Current Plan
                        </button>
                    </div>

                    {/* Pro Plan */}
                    <div className="bg-gray-900 rounded-2xl shadow-xl border border-gray-800 p-8 flex flex-col relative overflow-hidden transform md:scale-105 z-10">
                        <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                            RECOMMENDED
                        </div>

                        <div className="mb-4">
                            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 uppercase tracking-wide">
                                Pro
                            </span>
                        </div>

                        <div className="flex items-baseline gap-1 mb-2">
                            <h3 className="text-4xl font-bold text-white">$9.99</h3>
                            <span className="text-gray-400">/month</span>
                        </div>
                        <p className="text-gray-400 mb-6">Everything you need to get hired faster.</p>

                        <div className="flex-1">
                            <ul className="space-y-4 mb-8">
                                <li className="flex items-start gap-3">
                                    <div className="bg-blue-600/20 p-1 rounded-full">
                                        <Check className="text-blue-400 shrink-0" size={14} />
                                    </div>
                                    <span className="text-gray-300"><strong>Unlimited</strong> Resumes</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="bg-blue-600/20 p-1 rounded-full">
                                        <Zap className="text-blue-400 shrink-0" size={14} />
                                    </div>
                                    <span className="text-gray-300"><strong>Unlimited</strong> AI Writer Usage</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="bg-blue-600/20 p-1 rounded-full">
                                        <Star className="text-blue-400 shrink-0" size={14} />
                                    </div>
                                    <span className="text-gray-300">Premium Templates</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="bg-blue-600/20 p-1 rounded-full">
                                        <Shield className="text-blue-400 shrink-0" size={14} />
                                    </div>
                                    <span className="text-gray-300">Priority Support</span>
                                </li>
                            </ul>
                        </div>

                        {/* 
                        <form action={async () => {
                            'use server';
                            const { upgradeToPremium } = await import('./actions');
                            await upgradeToPremium();
                        }}>
                            <button type="submit" className="w-full py-4 px-4 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition shadow-lg shadow-blue-900/50">
                                Upgrade Now (Test Mode)
                            </button>
                        </form> 
                        */}
                        <button type="button" className="w-full py-4 px-4 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-900/50 cursor-default">
                            Upgrade Now
                        </button>
                    </div>

                </div>

                <div className="mt-16 text-center">
                    <Link href="/dashboard" className="text-gray-500 hover:text-gray-900 text-sm font-medium">
                        Return to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
