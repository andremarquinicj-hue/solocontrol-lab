"use client";

import { ShieldCheck } from "lucide-react";
import { TRACK_BANDS } from "@/lib/granulometry";
import { formatPt } from "@/lib/math";
import type { GranulometryCalculation, SieveInput, TrackBand } from "@/types";
import { GranulometryChart } from "@/components/report/GranulometryChart";
import { DecimalInput } from "@/components/DecimalInput";

export function GranulometryEditor({
  band, onBandChange, sample1MassG, sample2MassG, onSample1MassChange, onSample2MassChange,
  bottom1G,bottom2G,onBottom1Change,onBottom2Change,sieves,onSievesChange,calculation,
}:{
  band:TrackBand; onBandChange:(v:TrackBand)=>void;
  sample1MassG:number|null; sample2MassG:number|null;
  onSample1MassChange:(v:number|null)=>void; onSample2MassChange:(v:number|null)=>void;
  bottom1G:number|null; bottom2G:number|null; onBottom1Change:(v:number|null)=>void; onBottom2Change:(v:number|null)=>void;
  sieves:SieveInput[]; onSievesChange:(v:SieveInput[])=>void; calculation:GranulometryCalculation;
}){
  const c=calculation;
  return <section className="test-editor">
    <div className="test-editor-title"><div><span className="step-chip">1</span><h3>Granulometria</h3></div><small>Faixa A/B, duas determinações, balanço, repetibilidade e curva.</small></div>
    <div className="card">
      <div className="notice info decimal-help"><strong>Lançamento de pesos:</strong> os campos aceitam vírgula ou ponto decimal (ex.: <b>1874,9</b> ou <b>1874.9</b>). Pressione Enter para avançar para o próximo peso.</div>
      <div className="form-grid">
        <div className="field c4"><label>Tipo da faixa *</label><select value={band} onChange={e=>onBandChange(e.target.value as TrackBand)}><option value="A">{TRACK_BANDS.A.label}</option><option value="B">{TRACK_BANDS.B.label}</option></select></div>
        <div className="field c4"><label>Massa inicial A1 (g) *</label><DecimalInput value={sample1MassG} onValueChange={onSample1MassChange} placeholder="Ex.: 40000,5"/></div>
        <div className="field c4"><label>Massa inicial A2 (g) *</label><DecimalInput value={sample2MassG} onValueChange={onSample2MassChange} placeholder="Ex.: 39998,7"/></div>
      </div>
      <div className="table-wrap" style={{marginTop:15}}><table className="data"><thead><tr><th>Peneira</th><th>mm</th><th>Peso A1 (g)</th><th>% ret. A1</th><th>Peso A2 (g)</th><th>% ret. A2</th><th>Dif.</th><th>% média ret.</th><th>% retida acum.</th><th>% passando</th><th>Faixa acum.</th><th>Status</th></tr></thead><tbody>
        {c.rows.map((row,i)=><tr key={row.mm}><td><strong>{row.label}</strong></td><td>{formatPt(row.mm,1)}</td>
          <td><DecimalInput aria-label={`Peso A1 ${row.label}`} value={sieves[i]?.retained1G} onValueChange={v=>onSievesChange(sieves.map((x,j)=>j===i?{...x,retained1G:v}:x))}/></td>
          <td>{formatPt(row.retained1Pct,1)}</td>
          <td><DecimalInput aria-label={`Peso A2 ${row.label}`} value={sieves[i]?.retained2G} onValueChange={v=>onSievesChange(sieves.map((x,j)=>j===i?{...x,retained2G:v}:x))}/></td>
          <td>{formatPt(row.retained2Pct,1)}</td><td>{formatPt(row.differencePct,1)}</td>
          <td>{formatPt(row.averageRetainedPct,0)}</td><td>{formatPt(row.accumulatedRetainedPct,0)}</td><td>{formatPt(row.passingPct,0)}</td><td>{row.minRetainedAccum}–{row.maxRetainedAccum}</td>
          <td><span className={`badge ${row.conformityStatus==="CONFORME"?"ok":row.conformityStatus==="NÃO CONFORME"?"bad":"warn"}`}>{row.conformityStatus}</span></td></tr>)}
      </tbody></table></div>
      <div className="form-grid" style={{marginTop:14}}>
        <div className="field c3"><label>Fundo A1 (g) *</label><DecimalInput value={bottom1G} onValueChange={onBottom1Change}/></div>
        <div className="field c3"><label>Fundo A2 (g) *</label><DecimalInput value={bottom2G} onValueChange={onBottom2Change}/></div>
        <div className="c6 result-line"><span className={`badge ${c.overallStatus==="CONFORME"?"ok":c.overallStatus==="NÃO CONFORME"?"bad":"warn"}`}><ShieldCheck size={13}/> {c.overallStatus}</span><span className="badge info">Balanço A1: {formatPt(c.sample1BalancePct,1)}%</span><span className="badge info">A2: {formatPt(c.sample2BalancePct,1)}%</span></div>
      </div>
      <div className="mini-chart"><GranulometryChart band={band} calculation={c}/></div>
    </div>
  </section>;
}
