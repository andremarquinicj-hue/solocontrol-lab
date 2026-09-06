"use client";

import { Plus, Trash2 } from "lucide-react";
import type { PhysicalPropertiesCalculation, PhysicalPropertiesTestData, PhysicalSpecimenInput } from "@/types";
import { DecimalInput } from "@/components/DecimalInput";
import { formatPt } from "@/lib/math";

export function PhysicalEditor({data,onChange,calculation}:{data:PhysicalPropertiesTestData;onChange:(v:PhysicalPropertiesTestData)=>void;calculation:PhysicalPropertiesCalculation}){
  const patch=(id:string,patch:Partial<PhysicalSpecimenInput>)=>onChange({specimens:data.specimens.map(s=>s.id===id?{...s,...patch}:s)});
  const remove=(id:string)=>onChange({specimens:data.specimens.filter(s=>s.id!==id)});
  const add=()=>onChange({specimens:[...data.specimens,{id:`cp-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,dryMassG:null,saturatedMassG:null,submergedMassG:null}]});
  return <section className="test-editor"><div className="test-editor-title"><div><span className="step-chip">3</span><h3>Massa específica aparente, porosidade e absorção</h3></div><small>ABNT NBR 5564:2021 — Anexo B. Mínimo de 10 corpos de prova.</small></div><div className="card">
    <div className="table-wrap"><table className="data"><thead><tr><th>CP</th><th>Massa seca (g)</th><th>Massa saturada (g)</th><th>Massa submersa (g)</th><th>Massa específica (kg/m³)</th><th>Porosidade (%)</th><th>Absorção (%)</th><th></th></tr></thead><tbody>{calculation.rows.map((r,i)=><tr key={r.id}><td>{i+1}</td><td><DecimalInput value={r.dryMassG} onValueChange={v=>patch(r.id,{dryMassG:v})}/></td><td><DecimalInput value={r.saturatedMassG} onValueChange={v=>patch(r.id,{saturatedMassG:v})}/></td><td><DecimalInput value={r.submergedMassG} onValueChange={v=>patch(r.id,{submergedMassG:v})}/></td><td>{formatPt(r.densityKgM3,0)}</td><td>{formatPt(r.porosityPct,2)}</td><td>{formatPt(r.absorptionPct,2)}</td><td><button type="button" className="icon-btn" onClick={()=>remove(r.id)}><Trash2 size={14}/></button></td></tr>)}</tbody></table></div>
    <button type="button" className="btn ghost" style={{marginTop:12}} onClick={add}><Plus size={16}/> Adicionar corpo de prova</button>
    <div className="result-cards"><div><small>CP válidos</small><strong>{calculation.validCount}/10</strong></div><div><small>Massa específica média</small><strong>{formatPt(calculation.meanDensityKgM3,0)} kg/m³</strong></div><div><small>Limite</small><strong>≥ {formatPt(calculation.densityLimitKgM3,0)}</strong></div><div><small>Porosidade média</small><strong>{formatPt(calculation.meanPorosityPct,2)}%</strong></div><div><small>Limite</small><strong>≤ {formatPt(calculation.porosityLimitPct,1)}%</strong></div><div><small>Absorção média</small><strong>{formatPt(calculation.meanAbsorptionPct,2)}%</strong></div><div><small>Status</small><strong className={calculation.overallStatus==="CONFORME"?"text-ok":calculation.overallStatus==="NÃO CONFORME"?"text-bad":""}>{calculation.overallStatus}</strong></div></div>
  </div></section>;
}
