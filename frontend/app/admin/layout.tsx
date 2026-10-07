import { getSession } from "@/lib/auth";
import { getCurrentUserRole } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { ArrowLeft, LayoutDashboard } from "lucide-react";
import Link from "next/link";

export default async function AdminLayout({ children }: { children: ReactNode }) {
    const session = await getSession();

    if (!session || !session.user) {
        redirect("/login");
    }

    // Defense in Depth: Doğrudan JWT yetkisine güvenmeyip DB üzerinden güncel rolü çekiyoruz.
    const role = await getCurrentUserRole(session.user.id);

    if (role !== "admin") {
        redirect("/dashboard");
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
            {/* Admin Sidebar */}
            <aside className="w-full md:w-64 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800">Admin Panel</h2>
                    <p className="text-sm text-gray-500">Vitascor Platform</p>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <Link href="/admin" className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg bg-blue-50 text-blue-700">
                        <LayoutDashboard size={18} />
                        Overview
                    </Link>
                    <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                        <ArrowLeft size={18} />
                        Back to App
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8">
                {children}
            </main>
        </div>
    );
}
