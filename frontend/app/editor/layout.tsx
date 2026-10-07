import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function EditorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Java'daki "AuthFilter" veya "SecurityGuard" gibi çalışır.
    // Sayfa sunucuda oluşturulmadan önce oturum kontrolü yapar.
    const session = await getSession();

    if (!session) {
        // Oturum yoksa, kimse bu sayfayı göremez, direkt girişe atılır.
        redirect("/login");
    }

    return <>{children}</>;
}
