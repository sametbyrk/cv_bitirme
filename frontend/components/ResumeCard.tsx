'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, MoreVertical, Trash2, Edit, Copy, Type } from 'lucide-react';
import { deleteResume } from '@/app/editor/actions';
import { renameResume, duplicateResume } from '@/app/dashboard/actions';

interface ResumeCardProps {
    resume: {
        id: string;
        title: string;
        createdAt: Date | string;
    };
}

function getInitialDate(createdAt: Date | string | undefined | null): string {
    if (!createdAt) return '';
    try {
        const d = new Date(createdAt);
        return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US');
    } catch {
        return '';
    }
}

export function ResumeCard({ resume }: ResumeCardProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [formattedDate, setFormattedDate] = useState<string>('');

    useEffect(() => {
        if (resume.createdAt) {
            try {
                const date = new Date(resume.createdAt);
                if (!isNaN(date.getTime())) {
                    setFormattedDate(date.toLocaleDateString());
                }
            } catch (e) {
                console.error("Invalid date:", e);
            }
        }
    }, [resume.createdAt]);

    // Delete States
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Rename States
    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
    const [isRenaming, setIsRenaming] = useState(false);
    const [newTitle, setNewTitle] = useState(resume.title);

    // Duplicate States
    const [isDuplicating, setIsDuplicating] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await deleteResume(resume.id);
        } catch (error) {
            console.error("Failed to delete", error);
            alert("Failed to delete resume");
        } finally {
            setIsDeleting(false);
            setIsDeleteModalOpen(false);
        }
    };

    const handleRename = async () => {
        if (!newTitle.trim()) return;
        setIsRenaming(true);
        try {
            await renameResume(resume.id, newTitle);
        } catch (error) {
            console.error("Failed to rename", error);
            alert("Failed to rename resume");
        } finally {
            setIsRenaming(false);
            setIsRenameModalOpen(false);
        }
    };

    const handleDuplicate = async () => {
        setIsDuplicating(true);
        try {
            await duplicateResume(resume.id);
        } catch (error: any) {
            console.error("Failed to duplicate", error);
            alert(error.message || "Failed to duplicate resume");
        } finally {
            setIsDuplicating(false);
            setIsMenuOpen(false);
        }
    };

    return (
        <>
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition overflow-hidden flex flex-col h-64 relative group">
                {isDuplicating && (
                    <div className="absolute inset-0 bg-white/50 z-20 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                )}

                <div className="bg-gray-100 h-32 flex items-center justify-center border-b border-gray-100 relative">
                    <FileText className="text-gray-300" size={48} />

                    <div className="absolute top-3 right-3">
                        <div className="relative">
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    setIsMenuOpen(!isMenuOpen);
                                }}
                                className="p-1.5 bg-white rounded-md shadow-sm hover:bg-gray-100 text-gray-600 transition-opacity opacity-0 group-hover:opacity-100 focus:opacity-100"
                            >
                                <MoreVertical size={16} />
                            </button>

                            {isMenuOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setIsMenuOpen(false)}
                                    ></div>
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-100 z-20 py-1 font-medium text-sm animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                                        <Link
                                            href={`/editor/${resume.id}`}
                                            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50 bg-inherit w-full text-left"
                                        >
                                            <Edit size={14} /> Edit
                                        </Link>
                                        <button
                                            onClick={() => {
                                                setIsMenuOpen(false);
                                                setIsRenameModalOpen(true);
                                                setNewTitle(resume.title); // Reset title on open
                                            }}
                                            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50 w-full text-left"
                                        >
                                            <Type size={14} /> Rename
                                        </button>
                                        <button
                                            onClick={handleDuplicate}
                                            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50 w-full text-left"
                                            disabled={isDuplicating}
                                        >
                                            <Copy size={14} /> Duplicate
                                        </button>
                                        <div className="h-px bg-gray-100 my-1"></div>
                                        <button
                                            onClick={() => {
                                                setIsMenuOpen(false);
                                                setIsDeleteModalOpen(true);
                                            }}
                                            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 w-full text-left"
                                        >
                                            <Trash2 size={14} /> Delete
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                    <Link href={`/editor/${resume.id}`}>
                        <h3 className="font-bold text-gray-900 truncate mb-1 hover:text-blue-600 transition-colors" title={resume.title}>
                            {resume.title || 'Untitled Resume'}
                        </h3>
                        <p className="text-xs text-gray-500" suppressHydrationWarning>
                            Created{' '}
                            <span suppressHydrationWarning>
                                {formattedDate || getInitialDate(resume.createdAt)}
                            </span>
                        </p>
                    </Link>

                    <Link href={`/editor/${resume.id}`} className="mt-4 w-full block text-center py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition">
                        Edit
                    </Link>
                </div>
            </div>

            {/* Rename Modal */}
            {isRenameModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsRenameModalOpen(false)}></div>
                    <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6 relative z-10 animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Rename Resume</h3>
                        <input
                            type="text"
                            className="w-full p-2 border border-gray-300 rounded-lg mb-4 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            autoFocus
                            placeholder="Enter new title..."
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsRenameModalOpen(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                                disabled={isRenaming}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRename}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                                disabled={isRenaming || !newTitle.trim()}
                            >
                                {isRenaming ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)}></div>
                    <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6 relative z-10 animate-in fade-in zoom-in-95 duration-200">
                        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                            <Trash2 size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-center text-gray-900 mb-2">Delete Resume?</h3>
                        <p className="text-gray-500 text-center text-sm mb-6">
                            Are you sure you want to delete <span className="font-semibold text-gray-800">"{resume.title}"</span>? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                                disabled={isDeleting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
                                disabled={isDeleting}
                            >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
