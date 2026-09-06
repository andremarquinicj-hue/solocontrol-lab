import fs from "node:fs";
import path from "node:path";
import { calculateLabReport } from "../src/lib/lab";
import { buildLabReportWorkbook } from "../src/lib/excel";
import type { LabReportData } from "../src/types";

const data: LabReportData = {
  companyId: "solocontrol",
  status: "review",
  band: "A",
  header: {
    reportNumber: "TESTE-EXCEL-010",
    revision: "00",
    interested: "CLIENTE TESTE",
    contractorAddress: "Inocência/MS",
    work: "TRECHO FERROVIÁRIO - LINHA PRINCIPAL",
    supplierOrigin: "Pedreira Coplan - Inocência/MS",
    material: "Lastro ferroviário",
    sample: "AM-TESTE-010",
    sampleType: "Brita 03 / Lastro Padrão A",
    completionDate: "2026-09-06",
    lithology: "BASALTO",
    responsibleTechnician: "Técnico Demonstração",
    technicalManager: "Ana Maria Bezerra",
    crea: "CREA 0000000000",
    observations: "Arquivo gerado automaticamente para teste de integridade.",
  },
  sample1MassG: 40000.4,
  sample2MassG: 40000.2,
  sieves: [
    { mm: 63.5, retained1G: 0, retained2G: 0 },
    { mm: 50.8, retained1G: 2000.4, retained2G: 1960.2 },
    { mm: 38.0, retained1G: 18000.2, retained2G: 18120.1 },
    { mm: 25.4, retained1G: 16000.1, retained2G: 15920.4 },
    { mm: 12.5, retained1G: 3600.2, retained2G: 3620.1 },
  ],
  bottom1G: 399.5,
  bottom2G: 379.4,
  createdBy: "teste",
  selectedTests: ["granulometria","forma","massa_especifica","material_pulverulento","torroes_argila","massa_unitaria","intemperie","los_angeles","treton"],
  shape: { method:"paquimetro", particles: [
    {id:"p1",fractionMm:38,aMm:52.4,bMm:38.1,cMm:24.5},
    {id:"p2",fractionMm:38,aMm:50.2,bMm:35.4,cMm:20.1},
    {id:"p3",fractionMm:25.4,aMm:42.3,bMm:31.8,cMm:18.6},
    {id:"p4",fractionMm:25.4,aMm:41.1,bMm:30.2,cMm:17.9},
  ]},
  physicalProperties: { specimens: Array.from({length:10},(_,i)=>({id:`cp${i+1}`,dryMassG:1000+i*2,saturatedMassG:1010+i*2,submergedMassG:630+i})) },
  powder: { nominalMaxSizeMm:63, aggregateType:"GRAÚDO", determinations:[{initialDryG:5000.4,afterWashDryG:4960.2},{initialDryG:5001.1,afterWashDryG:4961.0},{initialDryG:null,afterWashDryG:null}] },
  clay: { intervals:[
    {key:"1.18-4.75",label:"≥ 1,18 e < 4,75 mm",retainedPct:2,initialMassG:null,finalMassG:null,adoptedPct:.2},
    {key:"4.75-9.5",label:"≥ 4,75 e < 9,5 mm",retainedPct:4,initialMassG:null,finalMassG:null,adoptedPct:.2},
    {key:"9.5-19",label:"≥ 9,5 e < 19,0 mm",retainedPct:12,initialMassG:2200.4,finalMassG:2196.0,adoptedPct:null},
    {key:"19-37.5",label:"≥ 19,0 e < 37,5 mm",retainedPct:47,initialMassG:3200.2,finalMassG:3193.8,adoptedPct:null},
    {key:"37.5+",label:"≥ 37,5 mm",retainedPct:35,initialMassG:5200.5,finalMassG:5189.9,adoptedPct:null},
  ]},
  bulkDensity: {containerVolumeL:20,containerMassKg:5.5,containerPlusAggregateKg:31.2},
  weathering:{result:4.3,observations:"Teste"},
  losAngeles:{result:22.5,observations:"Teste"},
  treton:{result:18.4,observations:"Teste"},
};

const calc=calculateLabReport(data);
const logoPath=path.resolve(process.cwd(),"public/logo-solocontrol.png");
const logoBase64=fs.existsSync(logoPath)?fs.readFileSync(logoPath).toString("base64"):undefined;
const wb=await buildLabReportWorkbook(data,calc,{logoBase64});
const out=process.env.EXCEL_TEST_OUT || path.resolve(process.cwd(),"Solocontrol_Lab_Excel_Teste_V10.xlsx");
await wb.xlsx.writeFile(out);
const reloaded=new (await import("exceljs")).default.Workbook();
await reloaded.xlsx.readFile(out);
const required=["Relatório Oficial","Granulometria","Índice de Forma","Propriedades Físicas","Material Pulverulento","Torrões de Argila","Massa Unitária","Resultados Gerais"];
for(const n of required) if(!reloaded.getWorksheet(n)) throw new Error(`Aba ausente: ${n}`);
const formulaCount=reloaded.worksheets.reduce((total,ws)=>{let count=0;ws.eachRow(row=>row.eachCell(cell=>{const v=cell.value as any;if(v&&typeof v==="object"&&"formula" in v)count++;}));return total+count;},0);
if(formulaCount<20) throw new Error(`Poucas fórmulas encontradas: ${formulaCount}`);
const stat=fs.statSync(out);if(stat.size<25000)throw new Error(`Arquivo pequeno demais: ${stat.size}`);
console.log(JSON.stringify({out,size:stat.size,worksheets:reloaded.worksheets.length,formulaCount,overallStatus:calc.overallStatus},null,2));
