'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, LogOut, FileText } from 'lucide-react';
import { ResumeCard } from '@/components/ResumeCard';
// We need to import logout action, but it might need to be passed or imported if it's a server action
import { logout } from '@/app/login/actions';

interface DashboardClientProps {
    resumes: any[];
    user: any;
}

export default function DashboardClient({ resumes, user }: DashboardClientProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredResumes, setFilteredResumes] = useState(resumes);

    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredResumes(resumes);
        } else {
            const lowerTerm = searchTerm.toLowerCase();
            const filtered = resumes.filter(resume =>
                (resume.title || 'Untitled').toLowerCase().includes(lowerTerm)
            );
            setFilteredResumes(filtered);
        }
    }, [searchTerm, resumes]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Navbar */}
            <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                                <FileText className="text-white" size={20} />
                            </div>
                            <span className="text-xl font-bold text-gray-900">CV Maker</span>
                        </Link>
                    </div>

                    <div className="flex items-center gap-4">
                        {user?.role === 'admin' && (
                            <Link href="/admin" className="text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-md transition-colors">
                                Admin Panel
                            </Link>
                        )}
                        <form action={logout}>
                            <button className="text-gray-500 hover:text-gray-700 flex items-center p-2" title="Sign Out">
                                <LogOut size={20} />
                            </button>
                        </form>
                        <div className="w-8 h-8 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-bold text-sm" title={user.name || user.email}>
                            {user.name ? user.name[0].toUpperCase() : (user.email ? user.email[0].toUpperCase() : 'U')}
                        </div>
                    </div>
                </div>
            </nav>

            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Your Documents</h1>
                        <p className="text-gray-500 text-sm mt-1">Manage and create new resumes.</p>
                    </div>
                    <Link
                        href="/editor"
                        className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition shadow-sm"
                    >
                        <Plus size={18} />
                        Create New Resume
                    </Link>
                </div>

                {/* Search & Filter */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search documents..."
                            className="w-full pl-10 pr-4 py-2 border-none focus:ring-0 text-gray-900 placeholder-gray-400 outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Documents Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

                    {/* Create New Card */}
                    <Link
                        href="/editor"
                        className="group flex flex-col items-center justify-center p-8 bg-white border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition cursor-pointer h-64"
                    >
                        <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Plus size={28} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Create New Resume</h3>
                        <p className="text-gray-500 text-sm text-center mt-2 px-4">
                            Start from scratch
                        </p>
                    </Link>

                    {/* Real Resume Cards from DB */}
                    {filteredResumes?.map((resume) => (
                        <ResumeCard key={resume.id} resume={resume} />
                    ))}

                    {filteredResumes.length === 0 && searchTerm && (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            No resumes found matching "{searchTerm}"
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
}
