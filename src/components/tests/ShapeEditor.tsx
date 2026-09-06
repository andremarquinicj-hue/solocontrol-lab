"use client";

import { Plus, Trash2 } from "lucide-react";
import type { GranulometryCalculation, ShapeCalculation, ShapeParticleInput, ShapeTestData } from "@/types";
import { DecimalInput } from "@/components/DecimalInput";
import { formatPt } from "@/lib/math";

const FRACTIONS=[63.5,50.8,38,25.4,19,12.5];

export function ShapeEditor({data,onChange,calculation,granulometry}:{data:ShapeTestData;onChange:(v:ShapeTestData)=>void;calculation:ShapeCalculation;granulometry?:GranulometryCalculation}){
  const relevantRows=(granulometry?.rows??[]).filter(r=>(r.averageRetainedPct??0)>=10);
  const relevant=relevantRows.map(r=>r.mm);
  const counts=new Map<number,number>();
  calculation.rows.forEach(r=>{if(r.fractionMm!==null&&r.classification!=="PENDENTE") counts.set(r.fractionMm,(counts.get(r.fractionMm)??0)+1)});

  function addParticle(fractionMm:number|null=null){
    const p:ShapeParticleInput={id:`p-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,fractionMm,aMm:null,bMm:null,cMm:null};
    onChange({...data,particles:[...data.particles,p]});
  }
  function addBatch(fraction:number,count=10){
    const now=Date.now();
    const next=Array.from({length:count},(_,i):ShapeParticleInput=>({id:`p-${now}-${i}-${Math.random().toString(36).slice(2,5)}`,fractionMm:fraction,aMm:null,bMm:null,cMm:null}));
    onChange({...data,particles:[...data.particles,...next]});
  }
  function addRemaining(fraction:number){
    const current=data.particles.filter(p=>p.fractionMm===fraction).length;
    const missing=Math.max(0,100-current);
    if(missing) addBatch(fraction,missing);
  }
  function patch(id:string,patch:Partial<ShapeParticleInput>){onChange({...data,particles:data.particles.map(p=>p.id===id?{...p,...patch}:p)});}
  function remove(id:string){onChange({...data,particles:data.particles.filter(p=>p.id!==id)});}

  return <section className="test-editor">
    <div className="test-editor-title"><div><span className="step-chip">2</span><h3>Índice de forma — medição dos fragmentos (pedras)</h3></div><small>Meça a, b e c. O sistema calcula b/a, c/b e classifica cada fragmento.</small></div>
    <div className="card">
      <div className="notice ok"><strong>Como usar:</strong> a granulometria identifica as frações com retenção ≥ 10%. Para cada fração indicada, lance as medidas dos fragmentos. O alvo é 100 partículas por fração quando houver essa quantidade disponível.</div>

      {granulometry&&<div className="shape-fraction-progress">
        {relevantRows.length?relevantRows.map(r=>{
          const count=counts.get(r.mm)??0;
          return <div className="shape-fraction-card" key={r.mm}>
            <div><strong>{formatPt(r.mm,1)} mm</strong><span>{formatPt(r.averageRetainedPct,0)}% retida média</span></div>
            <div className="shape-progress"><span style={{width:`${Math.min(100,count)}%`}}/></div>
            <small>{count} fragmento(s) medido(s) • alvo 100 quando disponíveis</small>
            <div className="shape-mini-actions"><button type="button" className="btn ghost" onClick={()=>addBatch(r.mm,10)}>+ 10</button><button type="button" className="btn ghost" onClick={()=>addRemaining(r.mm)} disabled={data.particles.filter(p=>p.fractionMm===r.mm).length>=100}>Preparar até 100</button></div>
          </div>
        }):<div className="notice warn">Preencha a granulometria para o sistema indicar automaticamente quais frações precisam do ensaio de forma.</div>}
      </div>}

      <div className="shape-actions">
        {!granulometry&&FRACTIONS.map(f=><button key={f} type="button" className="btn ghost" onClick={()=>addBatch(f,10)}>+ 10 fragmentos • {formatPt(f,1)} mm</button>)}
        <button type="button" className="btn primary" onClick={()=>addParticle(relevant[0]??null)}><Plus size={16}/> Adicionar fragmento</button>
      </div>
      <div className="table-wrap"><table className="data shape-table"><thead><tr><th>#</th><th>Fração (mm)</th><th>a (mm)</th><th>b (mm)</th><th>c (mm)</th><th>b/a</th><th>c/b</th><th>Classificação</th><th></th></tr></thead><tbody>
        {calculation.rows.length===0&&<tr><td colSpan={9}>Nenhum fragmento inserido.</td></tr>}
        {calculation.rows.map((r,i)=><tr key={r.id}><td>{i+1}</td><td><select value={r.fractionMm??""} onChange={e=>patch(r.id,{fractionMm:e.target.value?Number(e.target.value):null})}><option value="">Selecione</option>{FRACTIONS.map(f=><option key={f} value={f}>{formatPt(f,1)}</option>)}</select></td>
          <td><DecimalInput value={r.aMm} onValueChange={v=>patch(r.id,{aMm:v})}/></td><td><DecimalInput value={r.bMm} onValueChange={v=>patch(r.id,{bMm:v})}/></td><td><DecimalInput value={r.cMm} onValueChange={v=>patch(r.id,{cMm:v})}/></td>
          <td><strong>{formatPt(r.ba,1)}</strong></td><td><strong>{formatPt(r.cb,1)}</strong></td><td><span className={`badge ${r.classification==="CÚBICA"?"ok":r.classification==="PENDENTE"?"warn":"bad"}`}>{r.classification}</span></td><td><button type="button" className="icon-btn" onClick={()=>remove(r.id)} title="Excluir fragmento"><Trash2 size={15}/></button></td></tr>)}
      </tbody></table></div>
      <div className="result-cards">
        <div><small>Fragmentos válidos</small><strong>{calculation.validCount}</strong></div><div><small>Média b/a</small><strong>{formatPt(calculation.meanBA,2)}</strong></div><div><small>Média c/b</small><strong>{formatPt(calculation.meanCB,2)}</strong></div><div><small>Forma média</small><strong>{calculation.meanClassification}</strong></div><div><small>Não cúbicas</small><strong>{formatPt(calculation.nonCubicPct,1)}%</strong></div><div><small>Limite</small><strong>≤ {formatPt(calculation.nonCubicLimitPct,0)}%</strong></div><div><small>Status</small><strong className={calculation.overallStatus==="CONFORME"?"text-ok":calculation.overallStatus==="NÃO CONFORME"?"text-bad":""}>{calculation.overallStatus}</strong></div>
      </div>
    </div>
  </section>;
}
