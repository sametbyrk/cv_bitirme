'use client'

import { useState, use } from 'react'
import { useFormStatus } from 'react-dom'
import { login, signup } from './actions'
import Link from 'next/link'
import { ArrowLeft, FileText } from 'lucide-react'

function AuthSubmitButton({ mode }: { mode: 'login' | 'signup' }) {
    const { pending } = useFormStatus()
    const label = mode === 'login' ? 'Sign in' : 'Create Account'
    const pendingLabel = mode === 'login' ? 'Signing in…' : 'Creating account…'

    return (
        <button
            formAction={mode === 'login' ? login : signup}
            type="submit"
            disabled={pending}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition disabled:opacity-60 disabled:cursor-wait ${mode === 'login' ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'}`}
        >
            {pending ? pendingLabel : label}
        </button>
    )
}

export default function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ message: string, error?: string }>
}) {
    const [isLogin, setIsLogin] = useState(true)
    const params = use(searchParams)

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans relative">

            <Link href="/" className="absolute top-4 left-4 sm:top-8 sm:left-8 flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors font-medium">
                <ArrowLeft size={20} />
                <span>Back to Home</span>
            </Link>

            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <Link href="/" className="flex justify-center items-center gap-2 mb-6">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                        <FileText className="text-white" size={24} />
                    </div>
                    <span className="text-2xl font-bold text-gray-900">Vitascor</span>
                </Link>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    {isLogin ? 'Sign in to your account' : 'Create your account'}
                </h2>
                <div className="mt-4">
                    <button
                        type="button"
                        onClick={() => setIsLogin(!isLogin)}
                        className="w-full py-3 px-4 border-2 border-dashed border-blue-300 rounded-lg text-sm font-bold text-blue-600 hover:bg-blue-50 hover:border-blue-500 transition-all flex items-center justify-center gap-2"
                    >
                        {isLogin ? (
                            <>Don't have an account? <span className="underline">Create one now</span></>
                        ) : (
                            <>Already have an account? <span className="underline">Sign in here</span></>
                        )}
                    </button>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-gray-50 text-gray-500">Or continue with</span>
                        </div>
                    </div>

                    <a
                        href="/api/auth/google"
                        className="w-full py-3 px-4 bg-white border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-3 shadow-sm"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        Sign in with Google
                    </a>
                </div>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-200">
                    <form className="space-y-6">

                        {!isLogin && (
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                    Full Name
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        required={!isLogin}
                                        placeholder="John Doe"
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black bg-white"
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email address
                            </label>
                            <div className="mt-1">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    placeholder='you@example.com'
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black bg-white"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <div className="mt-1">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    placeholder='••••••••'
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black bg-white"
                                />
                            </div>
                        </div>

                        {(params?.error && params.error !== 'Session_missing') && (
                            <div className="rounded-md bg-red-50 p-4">
                                <div className="flex">
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-red-800">
                                            Authentication Error
                                        </h3>
                                        <div className="mt-2 text-sm text-red-700">
                                            <p>{params.error}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <AuthSubmitButton mode={isLogin ? 'login' : 'signup'} />
                        </div>
                    </form>

                </div>
            </div>
        </div>
    )
}
