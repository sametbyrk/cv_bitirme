import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { adminLogin } from './actions'
import { getSession } from '@/lib/auth'
import { getCurrentUserRole } from '@/lib/auth-helpers'

const ERROR_MESSAGES: Record<string, string> = {
    'missing-fields': 'E-posta ve şifre alanlarını doldurun.',
    'rate-limited': 'Çok fazla giriş denemesi. Lütfen daha sonra tekrar deneyin.',
    'invalid-credentials': 'Giriş bilgileri geçersiz veya bu alana erişim yetkiniz yok.',
    unavailable: 'Giriş şu anda tamamlanamadı. Lütfen tekrar deneyin.',
    'invalid-session': 'Oturum doğrulanamadı. Lütfen yeniden giriş yapın.',
}

export default async function AdminLoginPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>
}) {
    const session = await getSession()
    if (session?.user?.id) {
        const role = await getCurrentUserRole(session.user.id)
        if (role === 'admin') redirect('/admin')
    }

    const { error } = await searchParams
    const errorMessage = error ? ERROR_MESSAGES[error] : undefined

    return (
        <main className="min-h-screen bg-gray-50 flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
            <Link href="/" className="absolute left-4 top-4 flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 sm:left-8 sm:top-8">
                <ArrowLeft size={18} />
                Ana sayfaya dön
            </Link>

            <section className="mx-auto w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
                <div className="mb-6 flex items-center gap-3">
                    <div className="rounded-lg bg-blue-50 p-3 text-blue-700">
                        <ShieldCheck size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Yönetici girişi</h1>
                        <p className="text-sm text-gray-500">Vitascor yönetim paneli</p>
                    </div>
                </div>

                <p className="mb-6 text-sm text-gray-600">
                    Bu alan yalnızca yönetici yetkisi olan hesaplara açıktır.
                </p>

                {errorMessage && (
                    <p role="alert" className="mb-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        {errorMessage}
                    </p>
                )}

                <form action={adminLogin} className="space-y-5">
                    <div>
                        <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">E-posta</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="username"
                            required
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">Şifre</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full rounded-md bg-blue-700 px-4 py-2.5 font-semibold text-white transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        Yönetici olarak giriş yap
                    </button>
                </form>
            </section>
        </main>
    )
}
