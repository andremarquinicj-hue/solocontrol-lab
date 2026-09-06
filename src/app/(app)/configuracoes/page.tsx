"use client";

import { COMPANY } from "@/config/company";
import { TRACK_BANDS } from "@/lib/granulometry";

export default function SettingsPage(){
  return <main className="page">
    <div className="section-head"><div><h2>Configurações e padrão técnico</h2><p>Parâmetros usados na emissão dos relatórios.</p></div></div>

    <section className="card">
      <h3 style={{marginTop:0,color:"var(--navy)"}}>Identidade do laboratório</h3>
      <div className="form-grid">
        <div className="field c6"><label>Razão/apresentação</label><input value={COMPANY.tradeName} readOnly/></div>
        <div className="field c3"><label>Telefone</label><input value={COMPANY.phone} readOnly/></div>
        <div className="field c3"><label>E-mail</label><input value={COMPANY.email} readOnly/></div>
        <div className="field c12"><label>Endereço</label><input value={COMPANY.address} readOnly/></div>
      </div>
    </section>

    <div className="section-head"><div><h2>Faixas NBR 5564:2021</h2><p>O técnico vê apenas as peneiras do padrão escolhido.</p></div></div>
    <section className="grid4">
      {Object.entries(TRACK_BANDS).map(([key,band])=><div className="card" key={key} style={{gridColumn:"span 2"}}>
        <strong style={{color:"var(--navy)"}}>Padrão {key}</strong><div className="stat-foot">{band.label}</div>
        <div style={{marginTop:12,display:"flex",gap:7,flexWrap:"wrap"}}>{band.sieves.map(s=><span className="badge info" key={s.mm}>{s.label} • {s.mm} mm • {s.minRetainedAccum}–{s.maxRetainedAccum}% ret. acum.</span>)}</div>
      </div>)}
    </section>

    <div className="section-head"><div><h2>Governança do relatório</h2></div></div>
    <section className="card">
      <div className="notice ok">O PDF oficial é gerado somente após a pré-validação: cabeçalho obrigatório, todas as pesagens, balanço de massa ≤ 0,3% e repetibilidade por peneira ≤ 4%.</div>
      <div className="notice warn" style={{marginTop:9}}>Resultado fora da faixa não bloqueia a emissão: o documento deve ser emitido como NÃO CONFORME. O que bloqueia é ensaio incompleto ou tecnicamente inválido.</div>
    </section>
  </main>
}
