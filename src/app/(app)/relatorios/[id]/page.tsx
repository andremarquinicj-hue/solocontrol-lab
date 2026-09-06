"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Download, FileCheck2, FileSpreadsheet, Pencil, Printer, Send, Save } from "lucide-react";
import { auth } from "@/lib/firebase";
import { loadAppUser } from "@/lib/auth";
import type { AppUser, StoredReport } from "@/types";
import { calculateLabReport, labReportPreflight } from "@/lib/lab";
import { getReport, issueReport, updateReport, uploadPdf } from "@/lib/reports";
import { reportElementToPdf } from "@/lib/pdf";
import { downloadLabReportExcel } from "@/lib/excel";
import { LabReport } from "@/components/report/LabReport";

export default function ReportDetailPage(){
 const params=useParams<{id:string}>();const router=useRouter();const [report,setReport]=useState<StoredReport|null>(null);const [busy,setBusy]=useState(false);const [appUser,setAppUser]=useState<AppUser|null>(null);
 useEffect(()=>{getReport(params.id).then(r=>{if(!r)router.replace("/dashboard");else setReport(r)});const uid=auth.currentUser?.uid;if(uid)loadAppUser(uid).then(setAppUser);},[params.id,router]);
 const calc=useMemo(()=>report?calculateLabReport(report):null,[report]);const preflight=useMemo(()=>report&&calc?labReportPreflight(report,calc):null,[report,calc]);
 if(!report||!calc||!preflight)return <main className="page"><div className="card">Carregando relatório...</div></main>;
 async function saveSnapshot(){if(!auth.currentUser)return;setBusy(true);try{await updateReport(report!.id,{calculationSnapshot:calc!},auth.currentUser.uid)}finally{setBusy(false)}}
 async function downloadPdf(){const el=document.getElementById("official-report");if(!el)return;setBusy(true);try{const pdf=await reportElementToPdf(el);pdf.save(`Solocontrol-${report!.header.reportNumber||report!.id}-rev-${report!.header.revision||"00"}.pdf`)}finally{setBusy(false)}}
 async function downloadExcel(){setBusy(true);try{await downloadLabReportExcel(report!,calc!)}catch(error){console.error(error);alert(error instanceof Error?error.message:"Não foi possível gerar o Excel. Tente novamente.")}finally{setBusy(false)}}
 async function sendReview(){if(!auth.currentUser||report!.status==="issued")return;setBusy(true);try{await updateReport(report!.id,{status:"review",calculationSnapshot:calc!},auth.currentUser.uid);setReport({...report!,status:"review",calculationSnapshot:calc!})}finally{setBusy(false)}}
 async function issue(){if(!auth.currentUser||!preflight?.canIssue||!appUser||!["admin","coordenador"].includes(appUser.role))return;const el=document.getElementById("official-report");if(!el)return;const ok=confirm("Emitir este relatório como documento oficial? O PDF será arquivado como registro controlado.");if(!ok)return;setBusy(true);try{const pdf=await reportElementToPdf(el);const url=await uploadPdf(report!.id,report!.header.revision||"00",pdf.output("blob"));await issueReport(report!.id,url,auth.currentUser.uid);setReport({...report!,status:"issued",pdfUrl:url,calculationSnapshot:calc!})}finally{setBusy(false)}}
 return <main className="page"><div className="section-head no-print"><div><h2>Relatório {report.header.reportNumber||report.id}</h2><p>Rev. {report.header.revision||"00"} • {report.status.toUpperCase()} • {report.selectedTests?.length||0} ensaio(s)</p></div><div className="action-row">{report.status!=="issued"&&<Link className="btn ghost" href={`/relatorios/${report.id}/editar`}><Pencil size={16}/> Editar ficha</Link>}<button className="btn ghost" onClick={saveSnapshot} disabled={busy}><Save size={16}/> Salvar análise</button><button className="btn ghost" onClick={()=>window.print()}><Printer size={16}/> Imprimir</button><button className="btn ghost" onClick={downloadExcel} disabled={busy}><FileSpreadsheet size={16}/> Exportar Excel</button><button className="btn primary" onClick={downloadPdf} disabled={busy}><Download size={16}/> Baixar PDF</button>{report.status==="draft"&&<button className="btn orange" onClick={sendReview} disabled={busy||!preflight.canIssue}><Send size={16}/> Enviar para revisão</button>}{report.status!=="issued"&&appUser&&["admin","coordenador"].includes(appUser.role)&&<button className="btn orange" onClick={issue} disabled={busy||!preflight.canIssue}><FileCheck2 size={16}/> Emitir e arquivar</button>}{report.status==="issued"&&report.pdfUrl&&<a className="btn orange" href={report.pdfUrl} target="_blank" rel="noreferrer"><FileCheck2 size={16}/> PDF oficial</a>}</div></div>
 <div className="no-print validation-stack">{preflight.errors.length>0&&<div className="notice warn"><strong>Emissão bloqueada:</strong> {preflight.errors.join(" • ")}</div>}{preflight.warnings.length>0&&<div className="notice bad">{preflight.warnings.join(" • ")}</div>}{preflight.canIssue&&<div className="notice ok">Pré-validação concluída. O PDF pode ser revisado e emitido, inclusive quando houver resultado explicitamente NÃO CONFORME.</div>}</div>
 <div className="report-preview-shell"><LabReport data={report} calculation={calc}/></div></main>;
}
