"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FilePlus2, FileText, ShieldCheck } from "lucide-react";
import { subscribeReports } from "@/lib/reports";
import type { StoredReport } from "@/types";

export default function DashboardPage() {
  const [reports, setReports] = useState<StoredReport[]>([]);

  useEffect(() => subscribeReports(setReports), []);

  const stats = useMemo(() => ({
    total: reports.length,
    draft: reports.filter((r) => r.status === "draft").length,
    review: reports.filter((r) => r.status === "review").length,
    issued: reports.filter((r) => r.status === "issued").length,
  }), [reports]);

  return (
    <main className="page">
      <section className="hero">
        <h1>Controle de ensaios e relatórios</h1>
        <p>O técnico preenche os dados do laboratório, o sistema calcula, valida e gera o relatório A4 padronizado para o cliente.</p>
      </section>

      <section className="grid4">
        <div className="card"><div className="stat-label">Relatórios</div><div className="stat-value">{stats.total}</div><div className="stat-foot">Histórico na nuvem</div></div>
        <div className="card"><div className="stat-label">Rascunhos</div><div className="stat-value">{stats.draft}</div><div className="stat-foot">Em preenchimento</div></div>
        <div className="card"><div className="stat-label">Em revisão</div><div className="stat-value">{stats.review}</div><div className="stat-foot">Aguardando conferência</div></div>
        <div className="card"><div className="stat-label">Emitidos</div><div className="stat-value">{stats.issued}</div><div className="stat-foot">PDFs oficiais</div></div>
      </section>

      <div className="section-head">
        <div><h2>Relatórios recentes</h2><p>Granulometria de lastro ferroviário – NBR 5564:2021.</p></div>
        <Link href="/relatorios/novo" className="btn orange"><FilePlus2 size={17}/> Novo ensaio</Link>
      </div>

      <section className="report-list">
        {reports.length === 0 && (
          <div className="card"><strong style={{color:"var(--navy)"}}>Nenhum relatório cadastrado.</strong><div className="stat-foot">Crie o primeiro ensaio para validar o fluxo completo.</div></div>
        )}
        {reports.slice(0,12).map((r) => (
          <Link key={r.id} href={`/relatorios/${r.id}`} className="report-row">
            <div><strong>{r.header.reportNumber || "Sem número"}</strong><small>Rev. {r.header.revision || "00"}</small></div>
            <div><strong>{r.header.interested || "Interessado não informado"}</strong><small>{r.header.work || "Obra não informada"}</small></div>
            <div><strong>Padrão {r.band}</strong><small>{r.header.sample || "Sem amostra"}</small></div>
            <div>{r.status === "issued" ? <span className="badge ok"><ShieldCheck size={12}/> EMITIDO</span> : <span className="badge info"><FileText size={12}/> {r.status.toUpperCase()}</span>}</div>
            <div style={{color:"var(--muted)",fontSize:12}}>Abrir →</div>
          </Link>
        ))}
      </section>
    </main>
  );
}
