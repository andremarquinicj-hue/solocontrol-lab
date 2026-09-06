"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, ShieldCheck } from "lucide-react";
import { auth } from "@/lib/firebase";
import { COMPANY } from "@/config/company";
import { calculateGranulometry, initialSievesForBand, reportPreflight, TRACK_BANDS } from "@/lib/granulometry";
import { createReport } from "@/lib/reports";
import type { GranulometryReportData, TrackBand } from "@/types";
import { GranulometryChart } from "@/components/report/GranulometryChart";

function numberValue(v: string) { return v === "" ? null : Number(v.replace(",",".")); }

const emptyHeader = {
  reportNumber: "",
  revision: "00",
  interested: "",
  contractorAddress: "",
  work: "",
  supplierOrigin: "",
  material: "Lastro ferroviário",
  sample: "",
  sampleType: "",
  completionDate: new Date().toISOString().slice(0,10),
  lithology: "BASALTO",
  responsibleTechnician: "",
  technicalManager: "",
  crea: "",
  observations: "",
};

export default function NewReportPage() {
  const router=useRouter();
  const [saving,setSaving]=useState(false);
  const [band,setBand]=useState<TrackBand>("A");
  const [header,setHeader]=useState(emptyHeader);
  const [sample1MassG,setSample1MassG]=useState<number|null>(null);
  const [sample2MassG,setSample2MassG]=useState<number|null>(null);
  const [bottom1G,setBottom1G]=useState<number|null>(0);
  const [bottom2G,setBottom2G]=useState<number|null>(0);
  const [sieves,setSieves]=useState(()=>initialSievesForBand("A"));

  function changeBand(next: TrackBand){
    setBand(next);
    setSieves(initialSievesForBand(next,sieves));
  }

  const data: GranulometryReportData = useMemo(()=>({
    companyId: COMPANY.id,
    status:"draft",
    band,
    header,
    sample1MassG,
    sample2MassG,
    sieves,
    bottom1G,
    bottom2G,
    createdBy: auth.currentUser?.uid || "",
  }),[band,header,sample1MassG,sample2MassG,sieves,bottom1G,bottom2G]);
  const calc=useMemo(()=>calculateGranulometry(data),[data]);
  const preflight=useMemo(()=>reportPreflight(data,calc),[data,calc]);

  function setHeaderField<K extends keyof typeof header>(key: K, value: (typeof header)[K]){
    setHeader((h)=>({...h,[key]:value}));
  }

  async function save(){
    if(!auth.currentUser) return;
    setSaving(true);
    try{
      const id=await createReport({...data,createdBy:auth.currentUser.uid,calculationSnapshot:calc});
      router.push(`/relatorios/${id}`);
    } finally { setSaving(false); }
  }

  return <main className="page">
    <div className="section-head">
      <div><h2>Novo ensaio de granulometria</h2><p>Selecione a faixa. O sistema mostra somente as peneiras aplicáveis.</p></div>
      <button className="btn primary" onClick={save} disabled={saving}><Save size={17}/>{saving?"Salvando...":"Salvar rascunho"}</button>
    </div>

    <section className="card">
      <div className="form-grid">
        <div className="field c3"><label>Nº do relatório *</label><input value={header.reportNumber} onChange={e=>setHeaderField("reportNumber",e.target.value)} placeholder="Ex.: 102"/></div>
        <div className="field c2"><label>Revisão</label><input value={header.revision} onChange={e=>setHeaderField("revision",e.target.value)}/></div>
        <div className="field c7"><label>Interessado *</label><input value={header.interested} onChange={e=>setHeaderField("interested",e.target.value)}/></div>
        <div className="field c6"><label>Endereço do contratante</label><input value={header.contractorAddress} onChange={e=>setHeaderField("contractorAddress",e.target.value)}/></div>
        <div className="field c6"><label>Obra *</label><input value={header.work} onChange={e=>setHeaderField("work",e.target.value)}/></div>
        <div className="field c6"><label>Procedência / Fornecedor *</label><input value={header.supplierOrigin} onChange={e=>setHeaderField("supplierOrigin",e.target.value)} placeholder="Estado, cidade, mina/local de coleta"/></div>
        <div className="field c3"><label>Material *</label><input value={header.material} onChange={e=>setHeaderField("material",e.target.value)}/></div>
        <div className="field c3"><label>Amostra *</label><input value={header.sample} onChange={e=>setHeaderField("sample",e.target.value)}/></div>
        <div className="field c3"><label>Tipo de amostra / designação</label><input value={header.sampleType} onChange={e=>setHeaderField("sampleType",e.target.value)}/></div>
        <div className="field c3"><label>Data final do ensaio *</label><input type="date" value={header.completionDate} onChange={e=>setHeaderField("completionDate",e.target.value)}/></div>
        <div className="field c3"><label>Litologia / tipo petrográfico</label><select value={header.lithology} onChange={e=>setHeaderField("lithology",e.target.value)}><option>BASALTO</option><option>GRANITO</option><option>CALCÁRIO CALCÍTICO</option><option>CALCÁRIO DOLOMÍTICO</option><option>OUTRAS LITOLOGIAS</option></select></div>
        <div className="field c3"><label>Responsável pelo ensaio *</label><input value={header.responsibleTechnician} onChange={e=>setHeaderField("responsibleTechnician",e.target.value)}/></div>
        <div className="field c3"><label>Responsável técnico *</label><input value={header.technicalManager} onChange={e=>setHeaderField("technicalManager",e.target.value)}/></div>
        <div className="field c3"><label>CREA *</label><input value={header.crea} onChange={e=>setHeaderField("crea",e.target.value)}/></div>
        <div className="field c12"><label>Observações complementares</label><textarea rows={2} value={header.observations} onChange={e=>setHeaderField("observations",e.target.value)}/></div>
      </div>
    </section>

    <div className="section-head"><div><h2>Faixa granulométrica</h2><p>As peneiras mudam automaticamente conforme o padrão selecionado.</p></div></div>
    <section className="card">
      <div className="form-grid">
        <div className="field c4"><label>Tipo da faixa *</label><select value={band} onChange={e=>changeBand(e.target.value as TrackBand)}><option value="A">{TRACK_BANDS.A.label}</option><option value="B">{TRACK_BANDS.B.label}</option></select></div>
        <div className="field c4"><label>Massa inicial A1 (g) *</label><input inputMode="decimal" value={sample1MassG??""} onChange={e=>setSample1MassG(numberValue(e.target.value))}/></div>
        <div className="field c4"><label>Massa inicial A2 (g) *</label><input inputMode="decimal" value={sample2MassG??""} onChange={e=>setSample2MassG(numberValue(e.target.value))}/></div>
      </div>

      <div className="table-wrap" style={{marginTop:15}}>
        <table className="data"><thead><tr><th>Peneira</th><th>mm</th><th>Peso retido A1 (g)</th><th>% ret. A1</th><th>Peso retido A2 (g)</th><th>% ret. A2</th><th>Dif. (%)</th><th>% média retida</th><th>% retida acum.</th><th>% passando</th><th>Faixa acum.</th><th>Status</th></tr></thead>
        <tbody>{calc.rows.map((row,i)=><tr key={row.mm}>
          <td><strong>{row.label}</strong></td><td>{row.mm.toLocaleString("pt-BR")}</td>
          <td><input inputMode="decimal" value={sieves[i]?.retained1G??""} onChange={e=>setSieves(s=>s.map((x,j)=>j===i?{...x,retained1G:numberValue(e.target.value)}:x))}/></td>
          <td>{row.retained1Pct?.toLocaleString("pt-BR",{minimumFractionDigits:1})??"—"}</td>
          <td><input inputMode="decimal" value={sieves[i]?.retained2G??""} onChange={e=>setSieves(s=>s.map((x,j)=>j===i?{...x,retained2G:numberValue(e.target.value)}:x))}/></td>
          <td>{row.retained2Pct?.toLocaleString("pt-BR",{minimumFractionDigits:1})??"—"}</td>
          <td>{row.differencePct?.toLocaleString("pt-BR",{minimumFractionDigits:1})??"—"}</td><td>{row.averageRetainedPct??"—"}</td><td>{row.accumulatedRetainedPct??"—"}</td><td>{row.passingPct??"—"}</td>
          <td>{row.minRetainedAccum}–{row.maxRetainedAccum}</td><td><span className={`badge ${row.conformityStatus==="CONFORME"?"ok":row.conformityStatus==="NÃO CONFORME"?"bad":"warn"}`}>{row.conformityStatus}</span></td>
        </tr>)}</tbody></table>
      </div>

      <div className="form-grid" style={{marginTop:14}}>
        <div className="field c3"><label>Fundo A1 (g) *</label><input inputMode="decimal" value={bottom1G??""} onChange={e=>setBottom1G(numberValue(e.target.value))}/></div>
        <div className="field c3"><label>Fundo A2 (g) *</label><input inputMode="decimal" value={bottom2G??""} onChange={e=>setBottom2G(numberValue(e.target.value))}/></div>
        <div className="c6" style={{display:"flex",gap:9,alignItems:"end",flexWrap:"wrap"}}><span className={`badge ${calc.overallStatus==="CONFORME"?"ok":calc.overallStatus==="NÃO CONFORME"?"bad":"warn"}`}><ShieldCheck size={13}/> RESULTADO: {calc.overallStatus}</span><span className="badge info">Balanço A1: {calc.sample1BalancePct??"—"}%</span><span className="badge info">Balanço A2: {calc.sample2BalancePct??"—"}%</span></div>
      </div>
    </section>

    <div className="section-head"><div><h2>Prévia da curva</h2><p>O relatório usa esta mesma geometria de gráfico.</p></div></div>
    <section className="card" style={{height:510}}><GranulometryChart band={band} calculation={calc}/></section>

    <div style={{marginTop:16,display:"grid",gap:8}}>
      {preflight.errors.length>0 && <div className="notice warn"><strong>Antes de emitir:</strong> {preflight.errors.join(" • ")}</div>}
      {preflight.warnings.length>0 && <div className="notice bad">{preflight.warnings.join(" • ")}</div>}
    </div>
  </main>
}
