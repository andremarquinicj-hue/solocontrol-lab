import type { ClayCalculation, ClayIntervalInput, ClayTestData } from "@/types";
import { round } from "@/lib/math";

export const CLAY_INTERVALS: Array<{key:string;label:string;minimumMassG:number}> = [
  { key:"1.18-4.75", label:"≥ 1,18 e < 4,75 mm", minimumMassG:200 },
  { key:"4.75-9.5", label:"≥ 4,75 e < 9,5 mm", minimumMassG:1000 },
  { key:"9.5-19", label:"≥ 9,5 e < 19,0 mm", minimumMassG:2000 },
  { key:"19-37.5", label:"≥ 19,0 e < 37,5 mm", minimumMassG:3000 },
  { key:"37.5+", label:"≥ 37,5 mm", minimumMassG:5000 },
];

export function initialClayData(): ClayTestData {
  return { intervals: CLAY_INTERVALS.map((x):ClayIntervalInput=>({ key:x.key,label:x.label,retainedPct:null,initialMassG:null,finalMassG:null,adoptedPct:null })) };
}

export function calculateClay(data: ClayTestData | undefined): ClayCalculation {
  const d=data ?? initialClayData();
  const map=new Map(d.intervals.map(x=>[x.key,x]));
  const rows=CLAY_INTERVALS.map((def)=>{
    const i=map.get(def.key) ?? {key:def.key,label:def.label,retainedPct:null,initialMassG:null,finalMassG:null,adoptedPct:null};
    const retained=i.retainedPct;
    const tested=retained !== null && retained >= 5;
    let clayPct:number|null=null;
    let usedPct:number|null=null;
    let partialPct:number|null=null;
    let massStatus:ClayCalculation["rows"][number]["massStatus"]="PENDENTE";
    if (retained !== null && retained < 5) {
      massStatus="DISPENSADA <5%";
      usedPct=i.adoptedPct;
      if (usedPct !== null) partialPct=round((usedPct*retained)/100,3);
    } else if (tested) {
      if (i.initialMassG === null || i.finalMassG === null) massStatus="PENDENTE";
      else if (i.initialMassG < def.minimumMassG) massStatus="MASSA INSUFICIENTE";
      else if (i.initialMassG <= 0 || i.finalMassG<0 || i.finalMassG>i.initialMassG) massStatus="PENDENTE";
      else {
        massStatus="OK";
        clayPct=round(((i.initialMassG-i.finalMassG)/i.initialMassG)*100,1);
        usedPct=clayPct;
        partialPct=round((clayPct*retained!)/100,3);
      }
    }
    return {...i,minimumMassG:def.minimumMassG,tested,clayPct,usedPct,partialPct,massStatus};
  });
  const rowsWithRetained=rows.filter(r=>r.retainedPct!==null);
  const complete=rowsWithRetained.length===rows.length && rows.every(r=>
    r.retainedPct !== null && (r.retainedPct < 5 ? r.adoptedPct !== null : r.massStatus==="OK")
  );
  const totalPct=complete?round(rows.reduce((a,r)=>a+(r.partialPct??0),0),3):null;
  let overallStatus:ClayCalculation["overallStatus"]="PENDENTE";
  if (rows.some(r=>r.massStatus==="MASSA INSUFICIENTE")) overallStatus="REPETIR ENSAIO";
  else if (complete && totalPct!==null) overallStatus=totalPct<=0.5?"CONFORME":"NÃO CONFORME";
  return {rows,totalPct,overallStatus,complete};
}
