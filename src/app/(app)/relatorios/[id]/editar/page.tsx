"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ReportEditor } from "@/components/ReportEditor";
import { getReport } from "@/lib/reports";
import type { StoredReport } from "@/types";
export default function EditReportPage(){
 const params=useParams<{id:string}>();const router=useRouter();const [report,setReport]=useState<StoredReport|null>(null);
 useEffect(()=>{getReport(params.id).then(r=>{if(!r)router.replace("/dashboard");else setReport(r)});},[params.id,router]);
 if(!report)return <main className="page"><div className="card">Carregando ficha...</div></main>;
 return <ReportEditor initialData={report} reportId={report.id}/>;
}
