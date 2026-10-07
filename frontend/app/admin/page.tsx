import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getCurrentUserRole } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import { Users, Crown, Sparkles } from "lucide-react";
import { AdminChart } from "@/components/AdminChart";

export default async function AdminPage() {
    // Defense in Depth: Layout zaten koruyor ancak doğrudan veriye erişimi de tekrar kontrol ediyoruz.
    const session = await getSession();
    if (!session || !session.user) redirect("/login");

    const role = await getCurrentUserRole(session.user.id);

    if (role !== "admin") {
        redirect("/dashboard");
    }

    // İstatistikleri çekelim (Polling yok, sadece sayfa yüklendiğinde çalışır)
    const totalUsers = await prisma.user.count();
    const premiumUsers = await prisma.user.count({ where: { isPremium: true } });
    
    // Aggregate kullanımı: aiUsageCount sütununun toplamı
    const aiUsageAgg = await prisma.user.aggregate({
        _sum: {
            aiUsageCount: true
        }
    });
    
    const totalAiOperations = aiUsageAgg._sum.aiUsageCount || 0;
    const premiumRatio = totalUsers > 0 ? Math.round((premiumUsers / totalUsers) * 100) : 0;

    // --- Grafik Verisi (Son 7 Gün) ---
    // Performanslı olması için Prisma queryRaw ve DATE_TRUNC ile veritabanı seviyesinde grupluyoruz.
    const usersByDay = await prisma.$queryRaw<any[]>`
      SELECT DATE_TRUNC('day', "createdAt") as date, COUNT(id) as count
      FROM "User"
      WHERE "createdAt" >= NOW() - INTERVAL '7 days'
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY date ASC;
    `;

    const resumesByDay = await prisma.$queryRaw<any[]>`
      SELECT DATE_TRUNC('day', "createdAt") as date, COUNT(id) as count
      FROM "resume"
      WHERE "createdAt" >= NOW() - INTERVAL '7 days'
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY date ASC;
    `;

    // Recharts kütüphanesine uygun formata dönüştürme (Boş günleri 0 doldurma)
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
        
        const u = usersByDay.find(x => {
            const rowDate = new Date(x.date);
            return rowDate.getDate() === d.getDate() && 
                   rowDate.getMonth() === d.getMonth() && 
                   rowDate.getFullYear() === d.getFullYear();
        });
        
        const r = resumesByDay.find(x => {
            const rowDate = new Date(x.date);
            return rowDate.getDate() === d.getDate() && 
                   rowDate.getMonth() === d.getMonth() && 
                   rowDate.getFullYear() === d.getFullYear();
        });

        chartData.push({
            date: dateStr,
            users: u ? Number(u.count) : 0, // Postgres COUNT() dönerken BigInt çevirir, Number'a çevirmeliyiz
            resumes: r ? Number(r.count) : 0
        });
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Platform Overview</h1>
            <p className="text-gray-500 text-lg">Welcome, monitor overall platform statistics and activity here.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                {/* Total Users */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                        <Users size={28} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total Users</p>
                        <h3 className="text-3xl font-bold text-gray-900">{totalUsers}</h3>
                    </div>
                </div>

                {/* Premium Users */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center">
                        <Crown size={28} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Premium Users ({premiumRatio}%)</p>
                        <h3 className="text-3xl font-bold text-gray-900">{premiumUsers}</h3>
                    </div>
                </div>

                {/* Total AI Usage */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center">
                        <Sparkles size={28} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total AI Generations</p>
                        <h3 className="text-3xl font-bold text-gray-900">{totalAiOperations}</h3>
                    </div>
                </div>
            </div>
            
            {/* Activity Chart */}
            <AdminChart data={chartData} />
            
            <div className="mt-8 bg-blue-50 rounded-xl p-4 border border-blue-100">
                <p className="text-sm text-blue-800">
                    💡 <strong>Note:</strong> Statistics are loaded directly from the database on page load.
                    Automatic polling is disabled to minimize unnecessary database load.
                </p>
            </div>
        </div>
    );
}
