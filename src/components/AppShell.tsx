"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { useEffect, useState } from "react";
import { FilePlus2, LayoutDashboard, LogOut, Settings } from "lucide-react";
import { auth } from "@/lib/firebase";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      if (!u) {
        router.replace("/login");
        return;
      }
      setUser(u);
      setReady(true);
    });
  }, [router]);

  if (!ready) {
    return <div className="login-page"><div className="card">Carregando Solocontrol Lab...</div></div>;
  }

  const active = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="app-shell">
      <header className="topbar no-print">
        <div className="topbar-inner">
          <div className="brand">
            <img src="/logo-solocontrol.png" alt="Solocontrol" />
            <div className="brand-copy">
              <strong>Solocontrol Lab</strong>
              <small>Ensaios • análise • relatórios normativos</small>
            </div>
          </div>

          <nav className="nav">
            <Link href="/dashboard" style={active("/dashboard") ? {background:"#eef5fb",color:"var(--navy)"}:undefined}>
              <LayoutDashboard size={15}/> Dashboard
            </Link>
            <Link href="/relatorios/novo" style={active("/relatorios/novo") ? {background:"#eef5fb",color:"var(--navy)"}:undefined}>
              <FilePlus2 size={15}/> Novo ensaio
            </Link>
            <Link href="/configuracoes" style={active("/configuracoes") ? {background:"#eef5fb",color:"var(--navy)"}:undefined}>
              <Settings size={15}/> Configurações
            </Link>
          </nav>

          <button className="btn ghost" onClick={() => signOut(auth)} title={user?.email || ""}>
            <LogOut size={16}/> Sair
          </button>
        </div>
      </header>
      {children}
    </div>
  );
}
