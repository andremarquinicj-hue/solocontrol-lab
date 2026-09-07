"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LocateFixed, Save, ShieldCheck } from "lucide-react";
import { auth } from "@/lib/firebase";
import { COMPANY } from "@/config/company";
import { calculateGranulometry, initialSievesForBand } from "@/lib/granulometry";
import { createReport, updateReport, uploadEvidencePhoto } from "@/lib/reports";
import { calculateLabReport, labReportPreflight } from "@/lib/lab";
import { calculateShape } from "@/lib/shape";
import { calculatePhysicalProperties, emptyPhysicalSpecimens } from "@/lib/physical";
import { calculatePowder, initialPowderData } from "@/lib/powder";
import { calculateClay, initialClayData } from "@/lib/clay";
import { calculateBulkDensity, initialBulkDensityData } from "@/lib/bulkDensity";
import { TEST_CATALOG } from "@/lib/testCatalog";
import type {
  BulkDensityTestData, ClayTestData, EvidencePhoto, GranulometryHeader, LabReportData, NumericResultTestData,
  PhysicalPropertiesTestData, PowderTestData, ShapeTestData, StoredReport, TestType, TrackBand,
} from "@/types";
import { TestSelector } from "@/components/tests/TestSelector";
import { GranulometryEditor } from "@/components/tests/GranulometryEditor";
import { ShapeEditor } from "@/components/tests/ShapeEditor";
import { PhysicalEditor } from "@/components/tests/PhysicalEditor";
import { PowderEditor } from "@/components/tests/PowderEditor";
import { ClayEditor } from "@/components/tests/ClayEditor";
import { BulkDensityEditor } from "@/components/tests/BulkDensityEditor";
import { NumericTestEditor } from "@/components/tests/NumericTestEditor";

const emptyNumeric=():NumericResultTestData=>({result:null,observations:""});
const defaultHeader:GranulometryHeader={
  reportNumber:"",revision:"00",interested:"",contractorAddress:"",work:"",supplierOrigin:"",material:"Lastro ferroviário",
  sample:"",sampleType:"",completionDate:new Date().toISOString().slice(0,10),lithology:"BASALTO",responsibleTechnician:"",technicalManager:"",crea:"",observations:"",
  latitude:null,longitude:null,locationCapturedAt:"",
};

function initialReport():LabReportData{
  return {
    companyId:COMPANY.id,status:"draft",band:"A",header:defaultHeader,sample1MassG:null,sample2MassG:null,sieves:initialSievesForBand("A"),bottom1G:0,bottom2G:0,
    createdBy:auth.currentUser?.uid||"",selectedTests:["granulometria"],shape:{method:"paquimetro",particles:[]},physicalProperties:{specimens:emptyPhysicalSpecimens(10)},
    weathering:emptyNumeric(),bulkDensity:initialBulkDensityData(),powder:initialPowderData(),clay:initialClayData(),losAngeles:emptyNumeric(),treton:emptyNumeric(),softFragments:emptyNumeric(),microDeval:emptyNumeric(),pointLoad:emptyNumeric(),
  };
}

export function ReportEditor({initialData,reportId}:{initialData?:StoredReport;reportId?:string}){
  const router=useRouter();
  const [saving,setSaving]=useState(false);
  const [saveMessage,setSaveMessage]=useState("");
  const [saveError,setSaveError]=useState("");
  const [localSavedAt,setLocalSavedAt]=useState("");
  const [localInitialized,setLocalInitialized]=useState(false);
  const [newPhotoFiles,setNewPhotoFiles]=useState<File[]>([]);
  const [geoBusy,setGeoBusy]=useState(false);
  const base=useMemo(()=>initialData??initialReport(),[initialData]);
  const [header,setHeader]=useState<GranulometryHeader>(base.header);
  const [band,setBand]=useState<TrackBand>(base.band);
  const [selectedTests,setSelectedTests]=useState<TestType[]>(base.selectedTests??["granulometria"]);
  const [sample1MassG,setSample1MassG]=useState(base.sample1MassG);
  const [sample2MassG,setSample2MassG]=useState(base.sample2MassG);
  const [bottom1G,setBottom1G]=useState(base.bottom1G);
  const [bottom2G,setBottom2G]=useState(base.bottom2G);
  const [sieves,setSieves]=useState(base.sieves?.length?base.sieves:initialSievesForBand(base.band));
  const [shape,setShape]=useState<ShapeTestData>(base.shape??{method:"paquimetro",particles:[]});
  const [physicalProperties,setPhysicalProperties]=useState<PhysicalPropertiesTestData>(base.physicalProperties??{specimens:emptyPhysicalSpecimens(10)});
  const [weathering,setWeathering]=useState<NumericResultTestData>(base.weathering??emptyNumeric());
  const [bulkDensity,setBulkDensity]=useState<BulkDensityTestData>(base.bulkDensity??initialBulkDensityData());
  const [powder,setPowder]=useState<PowderTestData>(base.powder??initialPowderData());
  const [clay,setClay]=useState<ClayTestData>(base.clay??initialClayData());
  const [losAngeles,setLosAngeles]=useState<NumericResultTestData>(base.losAngeles??emptyNumeric());
  const [treton,setTreton]=useState<NumericResultTestData>(base.treton??emptyNumeric());
  const [softFragments,setSoftFragments]=useState<NumericResultTestData>(base.softFragments??emptyNumeric());
  const [microDeval,setMicroDeval]=useState<NumericResultTestData>(base.microDeval??emptyNumeric());
  const [pointLoad,setPointLoad]=useState<NumericResultTestData>(base.pointLoad??emptyNumeric());
  const [evidencePhotos,setEvidencePhotos]=useState(base.evidencePhotos??[]);

  function changeBand(next:TrackBand){setBand(next);setSieves(initialSievesForBand(next,sieves));}
  const data:LabReportData=useMemo(()=>({
    companyId:COMPANY.id,status:base.status??"draft",band,header,sample1MassG,sample2MassG,sieves,bottom1G,bottom2G,createdBy:base.createdBy||auth.currentUser?.uid||"",selectedTests,
    shape,physicalProperties,weathering,bulkDensity,powder,clay,losAngeles,treton,softFragments,microDeval,pointLoad,evidencePhotos,
    ...(base.pdfUrl ? {pdfUrl:base.pdfUrl} : {}),
    ...(base.issuedAt ? {issuedAt:base.issuedAt} : {}),
  }),[base.status,base.createdBy,base.pdfUrl,base.issuedAt,band,header,sample1MassG,sample2MassG,sieves,bottom1G,bottom2G,selectedTests,shape,physicalProperties,weathering,bulkDensity,powder,clay,losAngeles,treton,softFragments,microDeval,pointLoad,evidencePhotos]);

  const localDraftKey=`solocontrol-lab:draft:${reportId??"novo"}`;

  useEffect(()=>{
    if(reportId||initialData){setLocalInitialized(true);return;}
    try{
      const raw=localStorage.getItem(localDraftKey);
      if(raw){
        const saved=JSON.parse(raw) as LabReportData;
        const hasUsefulData=Boolean(saved?.header?.reportNumber||saved?.shape?.particles?.length||saved?.sieves?.some(r=>r.retained1G!=null||r.retained2G!=null));
        if(hasUsefulData&&window.confirm("Encontramos um rascunho local não enviado ao banco de dados. Deseja recuperar os dados?")){
          setHeader(saved.header??defaultHeader);
          setBand(saved.band??"A");
          setSelectedTests(saved.selectedTests??["granulometria"]);
          setSample1MassG(saved.sample1MassG??null);setSample2MassG(saved.sample2MassG??null);
          setBottom1G(saved.bottom1G??0);setBottom2G(saved.bottom2G??0);
          setSieves(saved.sieves?.length?saved.sieves:initialSievesForBand(saved.band??"A"));
          setShape(saved.shape??{method:"paquimetro",particles:[]});
          setPhysicalProperties(saved.physicalProperties??{specimens:emptyPhysicalSpecimens(10)});
          setWeathering(saved.weathering??emptyNumeric());setBulkDensity(saved.bulkDensity??initialBulkDensityData());
          setPowder(saved.powder??initialPowderData());setClay(saved.clay??initialClayData());
          setLosAngeles(saved.losAngeles??emptyNumeric());setTreton(saved.treton??emptyNumeric());
          setSoftFragments(saved.softFragments??emptyNumeric());setMicroDeval(saved.microDeval??emptyNumeric());setPointLoad(saved.pointLoad??emptyNumeric());
          setEvidencePhotos(saved.evidencePhotos??[]);
          setSaveMessage("Backup local recuperado. Clique em Salvar rascunho para enviar ao banco de dados.");
        }else if(hasUsefulData){
          localStorage.removeItem(localDraftKey);
        }
      }
    }catch{
      localStorage.removeItem(localDraftKey);
    }finally{
      setLocalInitialized(true);
    }
  },[initialData,localDraftKey,reportId]);

  useEffect(()=>{
    if(!localInitialized)return;
    const timer=window.setTimeout(()=>{
      try{
        localStorage.setItem(localDraftKey,JSON.stringify(data));
        setLocalSavedAt(new Date().toLocaleTimeString("pt-BR"));
      }catch{
        // O salvamento local é uma camada de segurança; não bloqueia o formulário.
      }
    },700);
    return()=>window.clearTimeout(timer);
  },[data,localDraftKey,localInitialized]);

  const granCalc=useMemo(()=>calculateGranulometry(data),[data]);
  const shapeCalc=useMemo(()=>calculateShape(shape,header.lithology),[shape,header.lithology]);
  const physicalCalc=useMemo(()=>calculatePhysicalProperties(physicalProperties,header.lithology),[physicalProperties,header.lithology]);
  const powderCalc=useMemo(()=>calculatePowder(powder),[powder]);
  const clayCalc=useMemo(()=>calculateClay(clay),[clay]);
  const bulkCalc=useMemo(()=>calculateBulkDensity(bulkDensity),[bulkDensity]);
  const labCalc=useMemo(()=>calculateLabReport(data),[data]);
  const preflight=useMemo(()=>labReportPreflight(data,labCalc),[data,labCalc]);
  const selected=(t:TestType)=>selectedTests.includes(t);
  const status=(t:TestType)=>labCalc.summaries.find(s=>s.type===t)?.status??"PENDENTE";

  function field<K extends keyof GranulometryHeader>(key:K,value:GranulometryHeader[K]){setHeader(h=>({...h,[key]:value}));}
  async function captureLocation(){
    if(!navigator.geolocation){alert("Geolocalização não disponível neste dispositivo.");return;}
    setGeoBusy(true);
    navigator.geolocation.getCurrentPosition(p=>{setHeader(h=>({...h,latitude:p.coords.latitude,longitude:p.coords.longitude,locationCapturedAt:new Date().toISOString()}));setGeoBusy(false);},e=>{alert(`Não foi possível obter a localização: ${e.message}`);setGeoBusy(false);},{enableHighAccuracy:true,timeout:15000});
  }
  async function save(){
    if(!auth.currentUser){setSaveError("Sessão expirada. Entre novamente antes de salvar.");return;}
    setSaving(true);setSaveMessage("");setSaveError("");
    try{
      const payload:LabReportData={...data,createdBy:data.createdBy||auth.currentUser.uid,calculationSnapshot:labCalc};
      let id:string;
      if(reportId){id=reportId;await updateReport(id,payload,auth.currentUser.uid);}else{id=await createReport(payload);}
      if(newPhotoFiles.length){
        const uploaded:EvidencePhoto[]=[];
        for(const file of newPhotoFiles) uploaded.push(await uploadEvidencePhoto(id,file));
        const nextPhotos=[...evidencePhotos,...uploaded];
        await updateReport(id,{evidencePhotos:nextPhotos},auth.currentUser.uid);
        setEvidencePhotos(nextPhotos); setNewPhotoFiles([]);
      }
      localStorage.removeItem(localDraftKey);
      const when=new Date().toLocaleTimeString("pt-BR");
      setSaveMessage(`Rascunho salvo com sucesso às ${when}. Abrindo o relatório...`);
      window.setTimeout(()=>router.push(`/relatorios/${id}`),350);
    }catch(error){
      console.error("Falha ao salvar relatório",error);
      const message=error instanceof Error?error.message:"Erro desconhecido ao salvar.";
      setSaveError(`Não foi possível salvar no banco de dados. Seus dados continuam nesta tela e no backup local. ${message}`);
    }finally{setSaving(false);}
  }

  if(base.status==="issued") return <main className="page"><div className="notice warn">Relatórios emitidos são registros controlados e não podem ser editados. Gere uma nova revisão a partir do histórico.</div></main>;

  return <main className="page">
    <div className="section-head"><div><h2>{reportId?"Editar ficha de ensaio":"Nova ficha de ensaio"}</h2><p>Cadastre a amostra, selecione os ensaios e deixe o sistema calcular e validar cada módulo.</p><small style={{display:"block",marginTop:4,color:"#58708f"}}>Backup local automático {localSavedAt?`• salvo às ${localSavedAt}`:"• preparando..."}</small></div><button className="btn primary" onClick={save} disabled={saving}><Save size={17}/>{saving?"Salvando...":reportId?"Salvar alterações":"Salvar rascunho"}</button></div>
    {saveMessage&&<div className="notice ok" style={{marginBottom:12}}><strong>{saveMessage}</strong></div>}
    {saveError&&<div className="notice bad" style={{marginBottom:12}}><strong>Erro ao salvar.</strong> {saveError}</div>}

    <section className="card sample-card"><div className="card-title-row"><div><h3>Identificação da amostra e do relatório</h3><p>Estas informações serão repetidas no cabeçalho do PDF oficial.</p></div><span className={`badge ${labCalc.overallStatus==="CONFORME"?"ok":labCalc.overallStatus==="NÃO CONFORME"?"bad":"warn"}`}><ShieldCheck size={13}/> {labCalc.overallStatus}</span></div>
      <div className="form-grid">
        <div className="field c2"><label>Nº relatório *</label><input value={header.reportNumber} onChange={e=>field("reportNumber",e.target.value)} placeholder="Ex.: 102"/></div><div className="field c2"><label>Revisão</label><input value={header.revision} onChange={e=>field("revision",e.target.value)}/></div><div className="field c4"><label>Interessado *</label><input value={header.interested} onChange={e=>field("interested",e.target.value)}/></div><div className="field c4"><label>Obra *</label><input value={header.work} onChange={e=>field("work",e.target.value)}/></div>
        <div className="field c6"><label>Endereço do contratante *</label><input value={header.contractorAddress} onChange={e=>field("contractorAddress",e.target.value)}/></div><div className="field c6"><label>Procedência / fornecedor *</label><input value={header.supplierOrigin} onChange={e=>field("supplierOrigin",e.target.value)} placeholder="Estado, cidade, mina, local de coleta..."/></div>
        <div className="field c3"><label>Material *</label><input value={header.material} onChange={e=>field("material",e.target.value)}/></div><div className="field c3"><label>Amostra *</label><input value={header.sample} onChange={e=>field("sample",e.target.value)}/></div><div className="field c3"><label>Tipo / designação</label><input value={header.sampleType} onChange={e=>field("sampleType",e.target.value)}/></div><div className="field c3"><label>Data final *</label><input type="date" value={header.completionDate} onChange={e=>field("completionDate",e.target.value)}/></div>
        <div className="field c3"><label>Litologia</label><select value={header.lithology} onChange={e=>field("lithology",e.target.value)}><option>BASALTO</option><option>GRANITO</option><option>CALCÁRIO CALCÍTICO</option><option>CALCÁRIO DOLOMÍTICO</option><option>OUTRAS LITOLOGIAS</option></select></div><div className="field c3"><label>Responsável pelo ensaio *</label><input value={header.responsibleTechnician} onChange={e=>field("responsibleTechnician",e.target.value)}/></div><div className="field c3"><label>Responsável técnico *</label><input value={header.technicalManager} onChange={e=>field("technicalManager",e.target.value)}/></div><div className="field c3"><label>CREA *</label><input value={header.crea} onChange={e=>field("crea",e.target.value)}/></div>
        <div className="field c8"><label>Observações</label><textarea rows={2} value={header.observations} onChange={e=>field("observations",e.target.value)}/></div><div className="field c4"><label>Geolocalização da coleta / ensaio</label><button type="button" className="btn ghost" onClick={captureLocation} disabled={geoBusy}><LocateFixed size={16}/>{geoBusy?"Capturando...":header.latitude!=null?`${header.latitude.toFixed(5)}, ${header.longitude?.toFixed(5)}`:"Capturar localização"}</button></div>
        <div className="field c8"><label>Fotos / evidências da amostra</label><input type="file" accept="image/*" multiple onChange={e=>setNewPhotoFiles(Array.from(e.target.files??[]))}/><small className="field-help">No celular, use a câmera ou selecione fotos. Elas serão arquivadas junto ao relatório.</small></div><div className="field c4"><label>Arquivos selecionados</label><div className="photo-file-list">{evidencePhotos.length>0&&<span>{evidencePhotos.length} foto(s) já salva(s)</span>}{newPhotoFiles.map(f=><span key={`${f.name}-${f.size}`}>{f.name}</span>)}{evidencePhotos.length===0&&newPhotoFiles.length===0&&<span>Nenhuma foto anexada</span>}</div></div>
      </div>
    </section>

    <div className="section-head"><div><h2>Seleção dos ensaios</h2><p>O técnico escolhe o que será realizado nesta amostra.</p></div></div><TestSelector selected={selectedTests} onChange={setSelectedTests}/>

    <div className="section-head"><div><h2>Execução dos ensaios</h2><p>Somente os módulos selecionados aparecem abaixo.</p></div></div>
    {selected("granulometria")&&<GranulometryEditor band={band} onBandChange={changeBand} sample1MassG={sample1MassG} sample2MassG={sample2MassG} onSample1MassChange={setSample1MassG} onSample2MassChange={setSample2MassG} bottom1G={bottom1G} bottom2G={bottom2G} onBottom1Change={setBottom1G} onBottom2Change={setBottom2G} sieves={sieves} onSievesChange={setSieves} calculation={granCalc}/>} 
    {selected("forma")&&<ShapeEditor data={shape} onChange={setShape} calculation={shapeCalc} granulometry={selected("granulometria")?granCalc:undefined}/>} 
    {selected("massa_especifica")&&<PhysicalEditor data={physicalProperties} onChange={setPhysicalProperties} calculation={physicalCalc}/>} 
    {selected("material_pulverulento")&&<PowderEditor data={powder} onChange={setPowder} calculation={powderCalc}/>} 
    {selected("torroes_argila")&&<ClayEditor data={clay} onChange={setClay} calculation={clayCalc}/>} 
    {selected("massa_unitaria")&&<BulkDensityEditor data={bulkDensity} onChange={setBulkDensity} calculation={bulkCalc}/>} 
    {selected("intemperie")&&<NumericTestEditor title={TEST_CATALOG.intemperie.shortLabel} reference={TEST_CATALOG.intemperie.reference} description={TEST_CATALOG.intemperie.description} criterion="≤ 10%" data={weathering} onChange={setWeathering} status={status("intemperie")}/>} 
    {selected("los_angeles")&&<NumericTestEditor title={TEST_CATALOG.los_angeles.shortLabel} reference={TEST_CATALOG.los_angeles.reference} description={TEST_CATALOG.los_angeles.description} criterion="Limite automático conforme litologia" data={losAngeles} onChange={setLosAngeles} status={status("los_angeles")}/>} 
    {selected("treton")&&<NumericTestEditor title={TEST_CATALOG.treton.shortLabel} reference={TEST_CATALOG.treton.reference} description={TEST_CATALOG.treton.description} criterion="Referência ≤ 25%" data={treton} onChange={setTreton} status={status("treton")}/>} 
    {selected("fragmentos_macios")&&<NumericTestEditor title={TEST_CATALOG.fragmentos_macios.shortLabel} reference={TEST_CATALOG.fragmentos_macios.reference} description={TEST_CATALOG.fragmentos_macios.description} criterion="Referência ≤ 5%" data={softFragments} onChange={setSoftFragments} status={status("fragmentos_macios")}/>} 
    {selected("micro_deval")&&<NumericTestEditor title={TEST_CATALOG.micro_deval.shortLabel} reference={TEST_CATALOG.micro_deval.reference} description={TEST_CATALOG.micro_deval.description} criterion="Valor de referência" data={microDeval} onChange={setMicroDeval} status={status("micro_deval")}/>} 
    {selected("point_load")&&<NumericTestEditor title={TEST_CATALOG.point_load.shortLabel} reference={TEST_CATALOG.point_load.reference} description={TEST_CATALOG.point_load.description} criterion="Valor de referência" unit="MPa" data={pointLoad} onChange={setPointLoad} status={status("point_load")}/>} 

    <section className="card final-check"><div className="card-title-row"><div><h3>Pré-validação do relatório</h3><p>O PDF oficial só deve ser emitido depois que as pendências forem resolvidas.</p></div><span className={`badge ${preflight.canIssue?"ok":"warn"}`}>{preflight.canIssue?"APTO PARA REVISÃO/EMISSÃO":"PENDENTE"}</span></div>
      {preflight.errors.length>0&&<div className="notice warn"><strong>Pendências:</strong> {preflight.errors.join(" • ")}</div>}{preflight.warnings.length>0&&<div className="notice bad" style={{marginTop:8}}>{preflight.warnings.join(" • ")}</div>}
      <div className="summary-grid">{labCalc.summaries.map((s,i)=><div className="summary-item" key={`${s.type}-${i}`}><small>{s.label}</small><strong>{s.result} {s.unit!=="—"?s.unit:""}</strong><span className={`badge ${s.status==="CONFORME"?"ok":s.status==="NÃO CONFORME"?"bad":"info"}`}>{s.status}</span></div>)}</div>
    </section>
  </main>;
}
