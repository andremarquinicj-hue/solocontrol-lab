import ExcelJS from "exceljs";
import html2canvas from "html2canvas";
import { COMPANY } from "@/config/company";
import { MASTER_SIEVES, TRACK_BANDS } from "@/lib/granulometry";
import { TEST_CATALOG } from "@/lib/testCatalog";
import type {
  GranulometryCalculation,
  LabReportCalculation,
  LabReportData,
  TestType,
} from "@/types";

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const BLUE = "0B3B70";
const BLUE_2 = "0F5796";
const ORANGE = "FF5A0A";
const LIGHT_BLUE = "EAF2F8";
const LIGHT_GRAY = "F3F5F7";
const DARK = "263746";
const GREEN = "16834B";
const RED = "C62828";
const AMBER = "A86A00";
const WHITE = "FFFFFF";
const BORDER = "8A9AAA";

type FormulaResult = string | number | boolean | null;
type FormulaRefs = Partial<Record<TestType | "summary", string>>;

export interface ExcelBuildOptions {
  logoBase64?: string;
  granulometryChartBase64?: string;
  /** Capturas JPEG das páginas do relatório oficial. Quando presentes, a primeira aba do Excel vira um espelho visual 1:1 do PDF. */
  officialReportPagesBase64?: string[];
}

function excelDate(v: string) {
  if (!v) return "";
  const [y, m, d] = v.split("-").map(Number);
  return y && m && d ? new Date(y, m - 1, d, 12, 0, 0) : v;
}

function safeFileName(value: string) {
  return value.replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, " ").trim();
}

function formula(formulaText: string, result: FormulaResult): ExcelJS.CellFormulaValue {
  return { formula: formulaText, result: result ?? undefined } as ExcelJS.CellFormulaValue;
}

function statusFill(status: string) {
  if (status === "CONFORME") return { fgColor: { argb: "FFE8F5ED" }, font: GREEN };
  if (status === "NÃO CONFORME") return { fgColor: { argb: "FFFDECEC" }, font: RED };
  if (status.includes("PENDENTE") || status.includes("REPETIR")) return { fgColor: { argb: "FFFFF3D9" }, font: AMBER };
  return { fgColor: { argb: "FFEAF2F8" }, font: BLUE_2 };
}

function applyBorder(range: ExcelJS.Cell[]) {
  for (const cell of range) {
    cell.border = {
      top: { style: "thin", color: { argb: BORDER } },
      left: { style: "thin", color: { argb: BORDER } },
      bottom: { style: "thin", color: { argb: BORDER } },
      right: { style: "thin", color: { argb: BORDER } },
    };
  }
}

function styleTableHeader(row: ExcelJS.Row, from = 1, to = row.cellCount) {
  row.height = 24;
  for (let c = from; c <= to; c++) {
    const cell = row.getCell(c);
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BLUE } };
    cell.font = { bold: true, color: { argb: WHITE }, size: 9 };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    applyBorder([cell]);
  }
}

function styleDataArea(ws: ExcelJS.Worksheet, startRow: number, endRow: number, startCol: number, endCol: number) {
  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      const cell = ws.getCell(r, c);
      cell.alignment = { vertical: "middle", horizontal: c === 1 ? "left" : "center", wrapText: true };
      cell.font = { size: 9, color: { argb: DARK } };
      applyBorder([cell]);
    }
  }
}

function setPtNumber(cell: ExcelJS.Cell, decimals = 1) {
  cell.numFmt = decimals === 0 ? "#,##0" : `#,##0.${"0".repeat(decimals)}`;
}

function setPercent(cell: ExcelJS.Cell, decimals = 1) {
  cell.numFmt = decimals === 0 ? "0\"%\"" : `0.${"0".repeat(decimals)}\"%\"`;
}

function setupWorksheet(ws: ExcelJS.Worksheet, portrait = true) {
  ws.views = [{ showGridLines: false, zoomScale: 90 }];
  ws.pageSetup = {
    paperSize: 9,
    orientation: portrait ? "portrait" : "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: { left: 0.25, right: 0.25, top: 0.35, bottom: 0.35, header: 0.15, footer: 0.15 },
    horizontalCentered: true,
  };
  ws.properties.defaultRowHeight = 18;
}

function addLogo(workbook: ExcelJS.Workbook, ws: ExcelJS.Worksheet, base64: string | undefined, row: number) {
  if (!base64) return;
  const id = workbook.addImage({ base64, extension: "png" });
  ws.addImage(id, { tl: { col: 0.2, row: row - 1 + 0.1 }, ext: { width: 145, height: 76 } });
}

function mergeValue(ws: ExcelJS.Worksheet, range: string, value: ExcelJS.CellValue, style?: Partial<ExcelJS.Style>) {
  ws.mergeCells(range);
  const c = ws.getCell(range.split(":")[0]);
  c.value = value;
  if (style) Object.assign(c, style);
  return c;
}

function sectionTitle(ws: ExcelJS.Worksheet, row: number, text: string, endCol = 10) {
  ws.mergeCells(row, 1, row, endCol);
  const c = ws.getCell(row, 1);
  c.value = text;
  c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ORANGE } };
  c.font = { bold: true, color: { argb: WHITE }, size: 11 };
  c.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  ws.getRow(row).height = 25;
  return c;
}

function reportHeader(workbook: ExcelJS.Workbook, ws: ExcelJS.Worksheet, data: LabReportData, row: number, title: string, page: number, total: number, logoBase64?: string) {
  addLogo(workbook, ws, logoBase64, row);
  ws.mergeCells(row, 3, row + 1, 8);
  const t = ws.getCell(row, 3);
  t.value = "RELATÓRIO DE ENSAIO - LASTRO FERROVIÁRIO";
  t.font = { bold: true, size: 15, color: { argb: BLUE } };
  t.alignment = { horizontal: "center", vertical: "middle" };
  ws.mergeCells(row + 2, 3, row + 2, 8);
  const sub = ws.getCell(row + 2, 3); sub.value = title; sub.font = { bold: true, size: 10, color: { argb: DARK } }; sub.alignment = { horizontal: "center" };
  ws.mergeCells(row, 9, row, 10); ws.getCell(row, 9).value = `Relatório: ${data.header.reportNumber || "—"} / Rev. ${data.header.revision || "00"}`;
  ws.mergeCells(row + 1, 9, row + 1, 10); ws.getCell(row + 1, 9).value = `Página ${page} de ${total}`;
  for (const rr of [row, row + 1]) { const c = ws.getCell(rr, 9); c.font = { size: 9, color: { argb: DARK }, bold: rr === row }; c.alignment = { horizontal: "right" }; }
  ws.getRow(row + 3).height = 8;
  ws.mergeCells(row + 3, 1, row + 3, 10); ws.getCell(row + 3, 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: BLUE } };

  const h = data.header;
  const rows: Array<[string, ExcelJS.CellValue, string, ExcelJS.CellValue]> = [
    ["Interessado", h.interested, "Data final", excelDate(h.completionDate)],
    ["Obra", h.work, "Amostra", h.sample],
    ["Procedência/Fornecedor", h.supplierOrigin, "Material", h.material],
    ["Tipo/Designação", h.sampleType || "—", "Litologia", h.lithology],
  ];
  rows.forEach((x, i) => {
    const r = row + 4 + i;
    ws.mergeCells(r, 1, r, 2); ws.getCell(r, 1).value = x[0];
    ws.mergeCells(r, 3, r, 6); ws.getCell(r, 3).value = x[1];
    ws.mergeCells(r, 7, r, 8); ws.getCell(r, 7).value = x[2];
    ws.mergeCells(r, 9, r, 10); ws.getCell(r, 9).value = x[3];
    for (const col of [1, 3, 7, 9]) {
      const c = ws.getCell(r, col);
      c.font = { size: 9, bold: col === 1 || col === 7, color: { argb: DARK } };
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: col === 1 || col === 7 ? LIGHT_BLUE : WHITE } };
      c.alignment = { vertical: "middle", wrapText: true };
      // Apply borders to all merged cells in the row segment.
    }
    for (let c = 1; c <= 10; c++) applyBorder([ws.getCell(r, c)]);
    if (i === 0 && h.completionDate) ws.getCell(r, 9).numFmt = "dd/mm/yyyy";
  });
  return row + 9;
}

function reportFooter(ws: ExcelJS.Worksheet, row: number, data: LabReportData) {
  ws.mergeCells(row, 1, row + 2, 4);
  ws.getCell(row, 1).value = `NOTAS:\n1- ${COMPANY.reportNotes[0]}\n2- ${COMPANY.reportNotes[1]}`;
  ws.getCell(row, 1).font = { size: 8, color: { argb: DARK }, bold: false };
  ws.getCell(row, 1).alignment = { vertical: "top", wrapText: true };
  ws.mergeCells(row, 5, row + 2, 7);
  ws.getCell(row, 5).value = `________________________________\nRESPONSÁVEL PELO ENSAIO\n${data.header.responsibleTechnician || "—"}`;
  ws.mergeCells(row, 8, row + 2, 10);
  ws.getCell(row, 8).value = `________________________________\nRESPONSÁVEL TÉCNICO\n${data.header.technicalManager || "—"}\nCREA: ${data.header.crea || "—"}`;
  for (const c of [5, 8]) { ws.getCell(row, c).font = { size: 8, color: { argb: DARK }, bold: true }; ws.getCell(row, c).alignment = { horizontal: "center", vertical: "top", wrapText: true }; }
  ws.mergeCells(row + 3, 1, row + 3, 10); ws.getCell(row + 3, 1).value = `${COMPANY.tradeName} • Fone: ${COMPANY.phone} • ${COMPANY.email}`; ws.getCell(row + 3, 1).font = { size: 8, bold: true, color: { argb: BLUE } }; ws.getCell(row + 3, 1).alignment = { horizontal: "center" };
  ws.mergeCells(row + 4, 1, row + 4, 10); ws.getCell(row + 4, 1).value = COMPANY.address; ws.getCell(row + 4, 1).font = { size: 7, color: { argb: DARK } }; ws.getCell(row + 4, 1).alignment = { horizontal: "center" };
  ws.mergeCells(row + 5, 1, row + 5, 10); ws.getCell(row + 5, 1).value = COMPANY.footerNotice; ws.getCell(row + 5, 1).font = { size: 8, bold: true, color: { argb: BLUE } }; ws.getCell(row + 5, 1).alignment = { horizontal: "center" };
  return row + 6;
}

function addSummarySheet(workbook: ExcelJS.Workbook, data: LabReportData, calc: LabReportCalculation): string {
  const ws = workbook.addWorksheet("Resultados Gerais"); setupWorksheet(ws, false);
  ws.columns = [{ width: 31 }, { width: 18 }, { width: 12 }, { width: 25 }, { width: 38 }, { width: 18 }];
  ws.mergeCells("A1:F2"); ws.getCell("A1").value = "MATRIZ DE RESULTADOS E CONFORMIDADE"; ws.getCell("A1").font = { bold: true, size: 15, color: { argb: BLUE } }; ws.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(4).values = ["Ensaio", "Resultado", "Unidade", "Critério", "Método / referência", "Situação"]; styleTableHeader(ws.getRow(4), 1, 6);
  calc.summaries.forEach((s, i) => {
    const r = 5 + i; ws.getRow(r).values = [s.label, s.result, s.unit, s.criterion, s.reference, s.status]; styleDataArea(ws, r, r, 1, 6);
    const st = statusFill(s.status); ws.getCell(r, 6).fill = { type: "pattern", pattern: "solid", fgColor: st.fgColor }; ws.getCell(r, 6).font = { bold: true, color: { argb: st.font } };
  });
  const total = 5 + calc.summaries.length + 1;
  ws.getCell(total, 1).value = "CONFORMIDADE GERAL"; ws.getCell(total, 1).font = { bold: true, color: { argb: WHITE } }; ws.getCell(total, 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: BLUE } };
  ws.mergeCells(total, 2, total, 6); ws.getCell(total, 2).value = calc.overallStatus; const st = statusFill(calc.overallStatus); ws.getCell(total, 2).fill = { type: "pattern", pattern: "solid", fgColor: st.fgColor }; ws.getCell(total, 2).font = { bold: true, color: { argb: st.font }, size: 11 }; ws.getCell(total, 2).alignment = { horizontal: "center" };
  for (let c = 1; c <= 6; c++) applyBorder([ws.getCell(total, c)]);
  ws.autoFilter = { from: "A4", to: `F${4 + calc.summaries.length}` };
  ws.freezePanes = undefined;
  return `'Resultados Gerais'!$B$${total}`;
}

function addGranulometrySheet(workbook: ExcelJS.Workbook, data: LabReportData, calc: GranulometryCalculation, chartBase64?: string): string {
  const ws = workbook.addWorksheet("Granulometria"); setupWorksheet(ws, false);
  ws.columns = [
    { width: 11 }, { width: 10 }, { width: 15 }, { width: 12 }, { width: 15 }, { width: 12 }, { width: 11 }, { width: 13 }, { width: 13 }, { width: 13 }, { width: 12 }, { width: 12 }, { width: 17 },
  ];
  ws.mergeCells("A1:M2"); ws.getCell("A1").value = `GRANULOMETRIA • ${TRACK_BANDS[data.band].label}`; ws.getCell("A1").font = { bold: true, size: 15, color: { argb: BLUE } }; ws.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };
  ws.getCell("A4").value = "Massa inicial A1 (g)"; ws.getCell("B4").value = data.sample1MassG; setPtNumber(ws.getCell("B4"), 1);
  ws.getCell("C4").value = "Massa inicial A2 (g)"; ws.getCell("D4").value = data.sample2MassG; setPtNumber(ws.getCell("D4"), 1);
  ws.getCell("E4").value = "Fundo A1 (g)"; ws.getCell("F4").value = data.bottom1G; setPtNumber(ws.getCell("F4"), 1);
  ws.getCell("G4").value = "Fundo A2 (g)"; ws.getCell("H4").value = data.bottom2G; setPtNumber(ws.getCell("H4"), 1);
  ws.getCell("I4").value = "Faixa"; ws.mergeCells("J4:M4"); ws.getCell("J4").value = TRACK_BANDS[data.band].label;
  for (let c = 1; c <= 13; c++) { const cell=ws.getCell(4,c); cell.fill={type:"pattern",pattern:"solid",fgColor:{argb:c%2===1?LIGHT_BLUE:WHITE}}; cell.font={bold:c%2===1,color:{argb:DARK},size:9}; applyBorder([cell]); }
  const headerRow = 7;
  ws.getRow(headerRow).values = ["Peneira", "mm", "Peso A1 (g)", "% ret. A1", "Peso A2 (g)", "% ret. A2", "Dif. (%)", "% média retida", "% retida acum.", "% passante", "Faixa mín.", "Faixa máx.", "Status"]; styleTableHeader(ws.getRow(headerRow), 1, 13);
  const start = headerRow + 1;
  calc.rows.forEach((r, i) => {
    const rr = start + i;
    ws.getCell(rr,1).value=r.label; ws.getCell(rr,2).value=r.mm; setPtNumber(ws.getCell(rr,2),1);
    ws.getCell(rr,3).value=r.retained1G; setPtNumber(ws.getCell(rr,3),1);
    ws.getCell(rr,4).value=formula(`IF(OR($B$4="",$B$4<=0,C${rr}=""),"",ROUND(C${rr}/$B$4*100,1))`,r.retained1Pct); setPercent(ws.getCell(rr,4),1);
    ws.getCell(rr,5).value=r.retained2G; setPtNumber(ws.getCell(rr,5),1);
    ws.getCell(rr,6).value=formula(`IF(OR($D$4="",$D$4<=0,E${rr}=""),"",ROUND(E${rr}/$D$4*100,1))`,r.retained2Pct); setPercent(ws.getCell(rr,6),1);
    ws.getCell(rr,7).value=formula(`IF(OR(D${rr}="",F${rr}=""),"",ROUND(ABS(D${rr}-F${rr}),1))`,r.differencePct); setPercent(ws.getCell(rr,7),1);
    ws.getCell(rr,8).value=formula(`IF(OR(D${rr}="",F${rr}=""),"",ROUND((D${rr}+F${rr})/2,0))`,r.averageRetainedPct); setPercent(ws.getCell(rr,8),0);
    ws.getCell(rr,9).value=formula(i===0?`IF(H${rr}="","",H${rr})`:`IF(H${rr}="","",I${rr-1}+H${rr})`,r.accumulatedRetainedPct); setPercent(ws.getCell(rr,9),0);
    ws.getCell(rr,10).value=formula(`IF(I${rr}="","",100-I${rr})`,r.passingPct); setPercent(ws.getCell(rr,10),0);
    const minPass=100-r.maxRetainedAccum,maxPass=100-r.minRetainedAccum;
    ws.getCell(rr,11).value=minPass; ws.getCell(rr,12).value=maxPass; setPercent(ws.getCell(rr,11),0); setPercent(ws.getCell(rr,12),0);
    ws.getCell(rr,13).value=formula(`IF(J${rr}="","PENDENTE",IF(AND(J${rr}>=K${rr},J${rr}<=L${rr}),"CONFORME","NÃO CONFORME"))`,r.conformityStatus);
    const st=statusFill(r.conformityStatus); ws.getCell(rr,13).fill={type:"pattern",pattern:"solid",fgColor: st.fgColor}; ws.getCell(rr,13).font={bold:true,color:{argb:st.font},size:9};
  });
  const end=start+calc.rows.length-1; styleDataArea(ws,start,end,1,13);
  const summary=end+2;
  ws.getCell(summary,1).value="Balanço A1 (%)"; ws.getCell(summary,2).value=formula(`IF(OR($B$4="",$F$4=""),"",ROUND(ABS($B$4-(SUM(C${start}:C${end})+$F$4))/$B$4*100,1))`,calc.sample1BalancePct); setPercent(ws.getCell(summary,2),1);
  ws.getCell(summary,3).value="Balanço A2 (%)"; ws.getCell(summary,4).value=formula(`IF(OR($D$4="",$H$4=""),"",ROUND(ABS($D$4-(SUM(E${start}:E${end})+$H$4))/$D$4*100,1))`,calc.sample2BalancePct); setPercent(ws.getCell(summary,4),1);
  ws.getCell(summary,5).value="Repetibilidade"; ws.getCell(summary,6).value=formula(`IF(COUNT(G${start}:G${end})<>${calc.rows.length},"PENDENTE",IF(MAX(G${start}:G${end})<=4,"OK","REPETIR"))`,calc.repeatabilityStatus);
  ws.getCell(summary,7).value="Status geral"; ws.mergeCells(summary,8,summary,10); ws.getCell(summary,8).value=calc.overallStatus;
  for(let c=1;c<=10;c++){const cell=ws.getCell(summary,c);cell.fill={type:"pattern",pattern:"solid",fgColor:{argb:c%2===1?BLUE:LIGHT_BLUE}};cell.font={bold:true,color:{argb:c%2===1?WHITE:DARK},size:9};applyBorder([cell]);}
  if(chartBase64){const id=workbook.addImage({base64:chartBase64,extension:"png"});ws.addImage(id,{tl:{col:1,row:summary+2},ext:{width:900,height:430}});}
  ws.autoFilter={from:`A${headerRow}`,to:`M${end}`}; ws.views=[{showGridLines:false,state:"frozen",ySplit:7,zoomScale:90}];
  return `'Granulometria'!$H$${summary}`;
}

function addShapeSheet(workbook: ExcelJS.Workbook, data: LabReportData, calc: NonNullable<LabReportCalculation["shape"]>): string {
  const ws=workbook.addWorksheet("Índice de Forma");setupWorksheet(ws,false);
  ws.columns=[{width:8},{width:14},{width:13},{width:13},{width:13},{width:11},{width:11},{width:24},{width:3},{width:21},{width:16},{width:16}];
  ws.mergeCells("A1:L2");ws.getCell("A1").value="ÍNDICE DE FORMA • MEDIÇÃO DOS FRAGMENTOS (PEDRAS)";ws.getCell("A1").font={bold:true,size:15,color:{argb:BLUE}};ws.getCell("A1").alignment={horizontal:"center",vertical:"middle"};
  ws.getRow(4).values=["#","Fração (mm)","a (mm)","b (mm)","c (mm)","b/a","c/b","Classificação"];styleTableHeader(ws.getRow(4),1,8);
  const rows=calc.rows.length?calc.rows:[];const start=5;
  rows.forEach((r,i)=>{const rr=start+i;ws.getCell(rr,1).value=i+1;ws.getCell(rr,2).value=r.fractionMm;ws.getCell(rr,3).value=r.aMm;ws.getCell(rr,4).value=r.bMm;ws.getCell(rr,5).value=r.cMm;[2,3,4,5].forEach(c=>setPtNumber(ws.getCell(rr,c),1));ws.getCell(rr,6).value=formula(`IF(OR(C${rr}="",D${rr}="",C${rr}<=0),"",ROUND(D${rr}/C${rr},1))`,r.ba);ws.getCell(rr,7).value=formula(`IF(OR(D${rr}="",E${rr}="",D${rr}<=0),"",ROUND(E${rr}/D${rr},1))`,r.cb);setPtNumber(ws.getCell(rr,6),1);setPtNumber(ws.getCell(rr,7),1);ws.getCell(rr,8).value=formula(`IF(OR(F${rr}="",G${rr}=""),"",IF(AND(F${rr}>=0.5,G${rr}>=0.5),"CÚBICA",IF(AND(F${rr}<0.5,G${rr}>=0.5),"ALONGADA",IF(AND(F${rr}>=0.5,G${rr}<0.5),"LAMELAR","ALONGADA LAMELAR"))))`,r.classification==="PENDENTE"?"":r.classification);});
  const end=Math.max(start,start+rows.length-1);if(rows.length)styleDataArea(ws,start,end,1,8);
  const srow=4;
  ws.getCell(srow,10).value="Indicador";ws.getCell(srow,11).value="b/a";ws.getCell(srow,12).value="c/b";styleTableHeader(ws.getRow(srow),10,12);
  const count=rows.length?`COUNT(F${start}:F${end})`:"0";
  const stats:Array<[string,string,string,number|null,number|null]>=[
    ["Média",rows.length?`IF(${count}=0,"",AVERAGE(F${start}:F${end}))`:"\"\"",rows.length?`IF(${count}=0,"",AVERAGE(G${start}:G${end}))`:"\"\"",calc.meanBA,calc.meanCB],
    ["Desvio-padrão",rows.length?`IF(${count}<2,"",STDEV.S(F${start}:F${end}))`:"\"\"",rows.length?`IF(${count}<2,"",STDEV.S(G${start}:G${end}))`:"\"\"",calc.stdBA,calc.stdCB],
    ["Coef. variação (%)",rows.length?`IFERROR(STDEV.S(F${start}:F${end})/AVERAGE(F${start}:F${end})*100,"")`:"\"\"",rows.length?`IFERROR(STDEV.S(G${start}:G${end})/AVERAGE(G${start}:G${end})*100,"")`:"\"\"",calc.cvBA,calc.cvCB],
  ];
  stats.forEach((x,i)=>{const rr=5+i;ws.getCell(rr,10).value=x[0];ws.getCell(rr,11).value=formula(x[1],x[3]);ws.getCell(rr,12).value=formula(x[2],x[4]);setPtNumber(ws.getCell(rr,11),i===2?1:i===1?3:2);setPtNumber(ws.getCell(rr,12),i===2?1:i===1?3:2);styleDataArea(ws,rr,rr,10,12);});
  const out=9;ws.getCell(out,10).value="Forma média";ws.getCell(out,11).value=calc.meanClassification;ws.mergeCells(out,11,out,12);ws.getCell(out+1,10).value="Não cúbicas (%)";ws.getCell(out+1,11).value=calc.nonCubicPct;setPtNumber(ws.getCell(out+1,11),1);ws.getCell(out+2,10).value="Limite (%)";ws.getCell(out+2,11).value=calc.nonCubicLimitPct;setPtNumber(ws.getCell(out+2,11),0);ws.getCell(out+3,10).value="Status";ws.getCell(out+3,11).value=calc.overallStatus;ws.mergeCells(out+3,11,out+3,12);for(let r=out;r<=out+3;r++)styleDataArea(ws,r,r,10,12);
  ws.views=[{showGridLines:false,state:"frozen",ySplit:4,zoomScale:90}];
  return `'Índice de Forma'!$K$${out+3}`;
}

function addPhysicalSheet(workbook:ExcelJS.Workbook,data:LabReportData,calc:NonNullable<LabReportCalculation["physicalProperties"]>):string{
 const ws=workbook.addWorksheet("Propriedades Físicas");setupWorksheet(ws,false);ws.columns=[{width:8},{width:16},{width:18},{width:19},{width:23},{width:17},{width:17},{width:3},{width:24},{width:18}];
 ws.mergeCells("A1:J2");ws.getCell("A1").value="MASSA ESPECÍFICA APARENTE • POROSIDADE • ABSORÇÃO";ws.getCell("A1").font={bold:true,size:15,color:{argb:BLUE}};ws.getCell("A1").alignment={horizontal:"center",vertical:"middle"};
 ws.getRow(4).values=["CP","Massa seca (g)","Massa saturada (g)","Massa submersa (g)","Massa específica (kg/m³)","Porosidade (%)","Absorção (%)"];styleTableHeader(ws.getRow(4),1,7);const start=5;
 calc.rows.forEach((r,i)=>{const rr=start+i;ws.getCell(rr,1).value=i+1;ws.getCell(rr,2).value=r.dryMassG;ws.getCell(rr,3).value=r.saturatedMassG;ws.getCell(rr,4).value=r.submergedMassG;[2,3,4].forEach(c=>setPtNumber(ws.getCell(rr,c),2));const cond=`AND(B${rr}>0,C${rr}>D${rr},C${rr}>=B${rr})`;ws.getCell(rr,5).value=formula(`IF(${cond},ROUND(B${rr}/(C${rr}-D${rr})*1000,0),"")`,r.densityKgM3);ws.getCell(rr,6).value=formula(`IF(${cond},ROUND((C${rr}-B${rr})/(C${rr}-D${rr})*100,2),"")`,r.porosityPct);ws.getCell(rr,7).value=formula(`IF(${cond},ROUND((C${rr}-B${rr})/B${rr}*100,2),"")`,r.absorptionPct);setPtNumber(ws.getCell(rr,5),0);setPtNumber(ws.getCell(rr,6),2);setPtNumber(ws.getCell(rr,7),2);});const end=Math.max(start,start+calc.rows.length-1);if(calc.rows.length)styleDataArea(ws,start,end,1,7);
 const avg=5;ws.getCell(avg,9).value="Massa específica média";ws.getCell(avg,10).value=formula(`IFERROR(ROUND(AVERAGE(E${start}:E${end}),0),"")`,calc.meanDensityKgM3);setPtNumber(ws.getCell(avg,10),0);ws.getCell(avg+1,9).value="Porosidade média (%)";ws.getCell(avg+1,10).value=formula(`IFERROR(ROUND(AVERAGE(F${start}:F${end}),2),"")`,calc.meanPorosityPct);setPtNumber(ws.getCell(avg+1,10),2);ws.getCell(avg+2,9).value="Absorção média (%)";ws.getCell(avg+2,10).value=formula(`IFERROR(ROUND(AVERAGE(G${start}:G${end}),2),"")`,calc.meanAbsorptionPct);setPtNumber(ws.getCell(avg+2,10),2);ws.getCell(avg+3,9).value="Status";ws.getCell(avg+3,10).value=calc.overallStatus;for(let r=avg;r<=avg+3;r++)styleDataArea(ws,r,r,9,10);return `'Propriedades Físicas'!$J$${avg+3}`;
}

function addPowderSheet(workbook:ExcelJS.Workbook,data:LabReportData,calc:NonNullable<LabReportCalculation["powder"]>):string{
 const ws=workbook.addWorksheet("Material Pulverulento");setupWorksheet(ws,true);ws.columns=[{width:18},{width:22},{width:25},{width:18},{width:23}];ws.mergeCells("A1:E2");ws.getCell("A1").value=`MATERIAL PULVERULENTO • ${TEST_CATALOG.material_pulverulento.reference}`;ws.getCell("A1").font={bold:true,size:14,color:{argb:BLUE}};ws.getCell("A1").alignment={horizontal:"center",vertical:"middle"};ws.getCell("A4").value="Tolerância (%)";ws.getCell("B4").value=calc.repeatabilityTolerancePct;setPtNumber(ws.getCell("B4"),1);ws.getCell("C4").value="Massa mínima (g)";ws.getCell("D4").value=calc.minimumMassG;setPtNumber(ws.getCell("D4"),0);
 ws.getRow(6).values=["Determinação","Massa seca inicial (g)","Massa após lavagem/seca (g)","Resultado (%)","Verificação"];styleTableHeader(ws.getRow(6),1,5);const ds=data.powder?.determinations??[];ds.forEach((d,i)=>{const rr=7+i;ws.getCell(rr,1).value=`${i+1}ª`;ws.getCell(rr,2).value=d.initialDryG;ws.getCell(rr,3).value=d.afterWashDryG;setPtNumber(ws.getCell(rr,2),1);setPtNumber(ws.getCell(rr,3),1);ws.getCell(rr,4).value=formula(`IF(OR(B${rr}="",C${rr}="",B${rr}<=0,C${rr}<0,C${rr}>B${rr}),"",ROUND((B${rr}-C${rr})/B${rr}*100,3))`,calc.valuesPct[i]);setPtNumber(ws.getCell(rr,4),3);ws.getCell(rr,5).value=formula(`IF(B${rr}="","PENDENTE",IF(B${rr}>=$D$4,"OK","MASSA INSUFICIENTE"))`,d.initialDryG==null?"PENDENTE":d.initialDryG>=calc.minimumMassG?"OK":"MASSA INSUFICIENTE")});styleDataArea(ws,7,9,1,5);
 ws.getCell("A11").value="Par adotado";ws.getCell("B11").value=calc.adoptedPair||calc.repeatabilityStatus;ws.getCell("A12").value="Resultado adotado (%)";let resFormula="\"\"";if(calc.adoptedPair==="1ª + 2ª")resFormula="AVERAGE(D7,D8)";else if(calc.adoptedPair==="1ª + 3ª")resFormula="AVERAGE(D7,D9)";else if(calc.adoptedPair==="2ª + 3ª")resFormula="AVERAGE(D8,D9)";ws.getCell("B12").value=formula(resFormula,calc.adoptedResultPct);setPtNumber(ws.getCell("B12"),3);ws.getCell("A13").value="Resultado reportado (%)";ws.getCell("B13").value=calc.reportedResultPct;setPtNumber(ws.getCell("B13"),1);ws.getCell("A14").value="Status";ws.getCell("B14").value=calc.overallStatus;for(let r=11;r<=14;r++)styleDataArea(ws,r,r,1,2);return `'Material Pulverulento'!$B$14`;
}

function addClaySheet(workbook:ExcelJS.Workbook,data:LabReportData,calc:NonNullable<LabReportCalculation["clay"]>):string{
 const ws=workbook.addWorksheet("Torrões de Argila");setupWorksheet(ws,false);ws.columns=[{width:28},{width:15},{width:17},{width:18},{width:18},{width:18},{width:16},{width:16},{width:17},{width:22}];ws.mergeCells("A1:J2");ws.getCell("A1").value=`TORRÕES DE ARGILA E MATERIAIS FRIÁVEIS • ${TEST_CATALOG.torroes_argila.reference}`;ws.getCell("A1").font={bold:true,size:14,color:{argb:BLUE}};ws.getCell("A1").alignment={horizontal:"center",vertical:"middle"};ws.getRow(4).values=["Intervalo granulométrico","% retida","Massa mínima (g)","Massa inicial mi (g)","Massa final mf (g)","% adotado (<5%)","mt (%)","% usado","Teor parcial (%)","Situação"];styleTableHeader(ws.getRow(4),1,10);const inputs=data.clay?.intervals??[];const inputMap=new Map(inputs.map(x=>[x.key,x]));const start=5;calc.rows.forEach((r,i)=>{const rr=start+i;const input=inputMap.get(r.key);ws.getCell(rr,1).value=r.label;ws.getCell(rr,2).value=r.retainedPct;ws.getCell(rr,3).value=r.minimumMassG;ws.getCell(rr,4).value=input?.initialMassG??null;ws.getCell(rr,5).value=input?.finalMassG??null;ws.getCell(rr,6).value=input?.adoptedPct??null;[2,6].forEach(c=>setPtNumber(ws.getCell(rr,c),1));[3,4,5].forEach(c=>setPtNumber(ws.getCell(rr,c),1));ws.getCell(rr,7).value=formula(`IF(OR(B${rr}<5,D${rr}="",E${rr}="",D${rr}<=0,E${rr}<0,E${rr}>D${rr}),"",ROUND((D${rr}-E${rr})/D${rr}*100,1))`,r.clayPct);setPtNumber(ws.getCell(rr,7),1);ws.getCell(rr,8).value=formula(`IF(B${rr}="","",IF(B${rr}<5,F${rr},G${rr}))`,r.usedPct);setPtNumber(ws.getCell(rr,8),1);ws.getCell(rr,9).value=formula(`IF(OR(B${rr}="",H${rr}=""),"",ROUND(H${rr}*B${rr}/100,3))`,r.partialPct);setPtNumber(ws.getCell(rr,9),3);ws.getCell(rr,10).value=r.massStatus;});const end=start+calc.rows.length-1;styleDataArea(ws,start,end,1,10);const tr=end+2;ws.getCell(tr,1).value="TEOR TOTAL (%)";ws.mergeCells(tr,2,tr,4);ws.getCell(tr,2).value=formula(`IF(COUNT(I${start}:I${end})=0,"",ROUND(SUM(I${start}:I${end}),3))`,calc.totalPct);setPtNumber(ws.getCell(tr,2),3);ws.getCell(tr,5).value="STATUS";ws.mergeCells(tr,6,tr,10);ws.getCell(tr,6).value=calc.overallStatus;for(let c=1;c<=10;c++){const cell=ws.getCell(tr,c);cell.fill={type:"pattern",pattern:"solid",fgColor:{argb:c===1||c===5?BLUE:LIGHT_BLUE}};cell.font={bold:true,color:{argb:c===1||c===5?WHITE:DARK}};applyBorder([cell]);}return `'Torrões de Argila'!$F$${tr}`;
}

function addBulkDensitySheet(workbook:ExcelJS.Workbook,data:LabReportData,calc:NonNullable<LabReportCalculation["bulkDensity"]>):string{
 const ws=workbook.addWorksheet("Massa Unitária");setupWorksheet(ws,true);ws.columns=[{width:32},{width:22}];ws.mergeCells("A1:B2");ws.getCell("A1").value=`MASSA UNITÁRIA NO ESTADO SOLTO • ${TEST_CATALOG.massa_unitaria.reference}`;ws.getCell("A1").font={bold:true,size:14,color:{argb:BLUE}};ws.getCell("A1").alignment={horizontal:"center",vertical:"middle"};const vals=[data.bulkDensity?.containerVolumeL??null,data.bulkDensity?.containerMassKg??null,data.bulkDensity?.containerPlusAggregateKg??null];ws.getCell("A4").value="Volume do recipiente (L)";ws.getCell("B4").value=vals[0];ws.getCell("A5").value="Massa do recipiente (kg)";ws.getCell("B5").value=vals[1];ws.getCell("A6").value="Recipiente + agregado (kg)";ws.getCell("B6").value=vals[2];[4,5,6].forEach(r=>setPtNumber(ws.getCell(r,2),3));ws.getCell("A8").value="Massa do agregado (kg)";ws.getCell("B8").value=formula(`IF(OR(B5="",B6=""),"",ROUND(B6-B5,3))`,calc.aggregateMassKg);setPtNumber(ws.getCell("B8"),3);ws.getCell("A9").value="Massa unitária (kg/m³)";ws.getCell("B9").value=formula(`IF(OR(B4="",B8="",B4<=0),"",ROUND(B8/(B4/1000),0))`,calc.resultKgM3);setPtNumber(ws.getCell("B9"),0);ws.getCell("A10").value="Status";ws.getCell("B10").value=calc.overallStatus;for(let r=4;r<=10;r++)styleDataArea(ws,r,r,1,2);return `'Massa Unitária'!$B$10`;
}

function addNumericSheet(workbook:ExcelJS.Workbook,type:TestType,data:LabReportData,calc:LabReportCalculation):string{
 const cat=TEST_CATALOG[type];const name=cat.shortLabel.slice(0,31);const ws=workbook.addWorksheet(name);setupWorksheet(ws,true);ws.columns=[{width:32},{width:28}];ws.mergeCells("A1:B2");ws.getCell("A1").value=`${cat.label.toUpperCase()} • ${cat.reference}`;ws.getCell("A1").font={bold:true,size:14,color:{argb:BLUE}};ws.getCell("A1").alignment={horizontal:"center",vertical:"middle"};const map:Record<string,number|null>={intemperie:data.weathering?.result??null,los_angeles:data.losAngeles?.result??null,treton:data.treton?.result??null,fragmentos_macios:data.softFragments?.result??null,micro_deval:data.microDeval?.result??null,point_load:data.pointLoad?.result??null};const s=calc.summaries.find(x=>x.type===type);ws.getCell("A4").value="Resultado";ws.getCell("B4").value=map[type]??null;setPtNumber(ws.getCell("B4"),type==="point_load"?2:1);ws.getCell("A5").value="Unidade";ws.getCell("B5").value=s?.unit??"—";ws.getCell("A6").value="Critério";ws.getCell("B6").value=s?.criterion??"—";ws.getCell("A7").value="Referência";ws.getCell("B7").value=cat.reference;ws.getCell("A8").value="Situação";ws.getCell("B8").value=s?.status??"PENDENTE";for(let r=4;r<=8;r++)styleDataArea(ws,r,r,1,2);return `'${name.replace(/'/g,"''")}'!$B$8`;
}

function officialSectionStatus(ws:ExcelJS.Worksheet,row:number,label:string,ref:string,result:string,criterion:string,status:string){
 ws.getCell(row,1).value=label;ws.mergeCells(row,2,row,5);ws.getCell(row,2).value=ref;ws.getCell(row,6).value=result;ws.mergeCells(row,6,row,7);ws.getCell(row,8).value=criterion;ws.mergeCells(row,8,row,9);ws.getCell(row,10).value=status;styleDataArea(ws,row,row,1,10);const st=statusFill(status);ws.getCell(row,10).fill={type:"pattern",pattern:"solid",fgColor: st.fgColor};ws.getCell(row,10).font={bold:true,color:{argb:st.font},size:9};
}

function addOfficialReportSnapshot(workbook: ExcelJS.Workbook, ws: ExcelJS.Worksheet, pagesBase64: string[]) {
  // Mantém o mesmo aspecto A4 do PDF: cada página do relatório é capturada do próprio DOM
  // e inserida como imagem na aba oficial. As abas técnicas continuam contendo as fórmulas reais.
  setupWorksheet(ws, true);
  ws.views = [{ showGridLines: false, zoomScale: 70 }];
  ws.columns = Array.from({ length: 10 }, () => ({ width: 10.6 }));
  const rowsPerPage = 59;
  const imageWidthPx = 720;
  const imageHeightPx = Math.round(imageWidthPx * 297 / 210);
  pagesBase64.forEach((base64, index) => {
    const startRow = index * rowsPerPage + 1;
    for (let r = startRow; r < startRow + rowsPerPage; r++) ws.getRow(r).height = 13.1;
    const id = workbook.addImage({ base64, extension: "jpeg" });
    ws.addImage(id, { tl: { col: 0, row: startRow - 1 }, ext: { width: imageWidthPx, height: imageHeightPx } });
    if (index < pagesBase64.length - 1) ws.getRow(startRow + rowsPerPage - 1).addPageBreak();
  });
  const lastRow = Math.max(1, pagesBase64.length * rowsPerPage);
  ws.pageSetup = {
    paperSize: 9, orientation: "portrait", fitToPage: true, fitToWidth: 1, fitToHeight: 0,
    margins: { left: 0, right: 0, top: 0, bottom: 0, header: 0, footer: 0 }, horizontalCentered: true, verticalCentered: false,
    printArea: `A1:J${lastRow}`,
  };
}

function addOfficialReportCells(workbook:ExcelJS.Workbook,ws:ExcelJS.Worksheet,data:LabReportData,calc:LabReportCalculation,refs:FormulaRefs,options:ExcelBuildOptions){
 setupWorksheet(ws,true);ws.columns=[{width:16},{width:14},{width:16},{width:16},{width:16},{width:16},{width:16},{width:16},{width:16},{width:18}];
 const selected=new Set(data.selectedTests??[]);
 type PageBuilder=(row:number,page:number,total:number)=>number;const pages:PageBuilder[]=[];
 if(selected.has("granulometria")&&calc.granulometry){pages.push((row,page,total)=>{let r=reportHeader(workbook,ws,data,row,"Composição granulométrica",page,total,options.logoBase64);sectionTitle(ws,r,"1. GRANULOMETRIA • "+TEST_CATALOG.granulometria.reference);r+=2;ws.getRow(r).values=["Peneira","mm","Peso A1 (g)","% ret. A1","Peso A2 (g)","% ret. A2","% passante","Faixa mín.","Faixa máx.","Status"];styleTableHeader(ws.getRow(r),1,10);const gr=calc.granulometry!;gr.rows.forEach((x,i)=>{const rr=r+1+i;const tech=8+i;ws.getCell(rr,1).value=x.label;ws.getCell(rr,2).value=x.mm;ws.getCell(rr,3).value=formula(`'Granulometria'!C${tech}`,x.retained1G);ws.getCell(rr,4).value=formula(`'Granulometria'!D${tech}`,x.retained1Pct);ws.getCell(rr,5).value=formula(`'Granulometria'!E${tech}`,x.retained2G);ws.getCell(rr,6).value=formula(`'Granulometria'!F${tech}`,x.retained2Pct);ws.getCell(rr,7).value=formula(`'Granulometria'!J${tech}`,x.passingPct);ws.getCell(rr,8).value=100-x.maxRetainedAccum;ws.getCell(rr,9).value=100-x.minRetainedAccum;ws.getCell(rr,10).value=formula(`'Granulometria'!M${tech}`,x.conformityStatus);[2,3,5].forEach(c=>setPtNumber(ws.getCell(rr,c),1));[4,6].forEach(c=>setPercent(ws.getCell(rr,c),1));[7,8,9].forEach(c=>setPercent(ws.getCell(rr,c),0));});styleDataArea(ws,r+1,r+gr.rows.length,1,10);r+=gr.rows.length+2;ws.mergeCells(r,1,r,3);ws.getCell(r,1).value=`Massa inicial A1: ${data.sample1MassG?.toLocaleString("pt-BR")??"—"} g`;ws.mergeCells(r,4,r,6);ws.getCell(r,4).value=`Massa inicial A2: ${data.sample2MassG?.toLocaleString("pt-BR")??"—"} g`;ws.mergeCells(r,7,r,10);ws.getCell(r,7).value=`Status: ${gr.overallStatus}`;for(let c=1;c<=10;c++){ws.getCell(r,c).fill={type:"pattern",pattern:"solid",fgColor:{argb:LIGHT_BLUE}};applyBorder([ws.getCell(r,c)]);}if(options.granulometryChartBase64){const id=workbook.addImage({base64:options.granulometryChartBase64,extension:"png"});ws.addImage(id,{tl:{col:1,row:r+1},ext:{width:760,height:350}});r+=22;}else r+=2;return reportFooter(ws,r,data);});}
 if(selected.has("forma")&&calc.shape){const c=calc.shape;pages.push((row,page,total)=>{let r=reportHeader(workbook,ws,data,row,"Índice de forma",page,total,options.logoBase64);sectionTitle(ws,r,"2. ÍNDICE DE FORMA • "+TEST_CATALOG.forma.reference);r+=2;ws.getRow(r).values=["Fragmentos","Média b/a","Média c/b","Forma média","Não cúbicas (%)","Limite (%)","Status"];styleTableHeader(ws.getRow(r),1,7);const rr=r+1;ws.getCell(rr,1).value=c.validCount;ws.getCell(rr,2).value=c.meanBA;ws.getCell(rr,3).value=c.meanCB;ws.getCell(rr,4).value=c.meanClassification;ws.getCell(rr,5).value=c.nonCubicPct;ws.getCell(rr,6).value=c.nonCubicLimitPct;ws.getCell(rr,7).value=c.overallStatus;[2,3].forEach(col=>setPtNumber(ws.getCell(rr,col),2));[5,6].forEach(col=>setPtNumber(ws.getCell(rr,col),1));styleDataArea(ws,rr,rr,1,7);r+=4;ws.mergeCells(r,1,r,10);ws.getCell(r,1).value="As medições individuais a, b e c e as fórmulas b/a e c/b estão na aba 'Índice de Forma'.";ws.getCell(r,1).font={italic:true,size:9,color:{argb:DARK}};ws.getCell(r,1).alignment={horizontal:"center"};return reportFooter(ws,r+3,data);});}
 const simpleSelected=(data.selectedTests??[]).filter(t=>!["granulometria","forma"].includes(t));if(simpleSelected.length){pages.push((row,page,total)=>{let r=reportHeader(workbook,ws,data,row,"Resultados dos ensaios",page,total,options.logoBase64);sectionTitle(ws,r,"RESULTADOS DOS ENSAIOS SELECIONADOS");r+=2;ws.getRow(r).values=["Ensaio","Método / referência","Resultado","","","Critério","","","","Situação"];styleTableHeader(ws.getRow(r),1,10);for(const t of simpleSelected){const summaries=calc.summaries.filter(s=>s.type===t);for(const s of summaries){r++;officialSectionStatus(ws,r,s.label,s.reference,`${s.result}${s.unit!=="—"?` ${s.unit}`:""}`,s.criterion,s.status);}}return reportFooter(ws,r+3,data);});}
 pages.push((row,page,total)=>{let r=reportHeader(workbook,ws,data,row,"Matriz de conformidade e conclusão",page,total,options.logoBase64);sectionTitle(ws,r,"MATRIZ DE CONFORMIDADE • RESULTADOS CONSOLIDADOS");r+=2;ws.getRow(r).values=["Ensaio","Resultado","Unidade","Critério","Método / referência","","","","","Situação"];styleTableHeader(ws.getRow(r),1,10);calc.summaries.forEach(s=>{r++;ws.getCell(r,1).value=s.label;ws.getCell(r,2).value=s.result;ws.getCell(r,3).value=s.unit;ws.getCell(r,4).value=s.criterion;ws.mergeCells(r,5,r,9);ws.getCell(r,5).value=s.reference;ws.getCell(r,10).value=s.status;styleDataArea(ws,r,r,1,10);const st=statusFill(s.status);ws.getCell(r,10).fill={type:"pattern",pattern:"solid",fgColor: st.fgColor};ws.getCell(r,10).font={bold:true,color:{argb:st.font}};});r+=2;ws.mergeCells(r,1,r,4);ws.getCell(r,1).value="CONFORMIDADE GERAL";ws.getCell(r,1).fill={type:"pattern",pattern:"solid",fgColor:{argb:BLUE}};ws.getCell(r,1).font={bold:true,color:{argb:WHITE}};ws.mergeCells(r,5,r,10);ws.getCell(r,5).value=calc.overallStatus;const st=statusFill(calc.overallStatus);ws.getCell(r,5).fill={type:"pattern",pattern:"solid",fgColor: st.fgColor};ws.getCell(r,5).font={bold:true,color:{argb:st.font},size:12};ws.getCell(r,5).alignment={horizontal:"center"};for(let c=1;c<=10;c++)applyBorder([ws.getCell(r,c)]);return reportFooter(ws,r+3,data);});

 const total=pages.length;let row=1;pages.forEach((build,i)=>{const end=build(row,i+1,total);if(i<pages.length-1){ws.getRow(end).addPageBreak();row=end+2;}else row=end;});ws.pageSetup.printArea=`A1:J${row}`;ws.getColumn(1).width=17;ws.getColumn(2).width=14;ws.getColumn(10).width=18;
}

export async function buildLabReportWorkbook(data: LabReportData, calculation: LabReportCalculation, options: ExcelBuildOptions = {}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = COMPANY.name;
  workbook.company = COMPANY.name;
  workbook.subject = `Relatório ${data.header.reportNumber || "sem número"}`;
  workbook.title = `Solocontrol Lab - ${data.header.reportNumber || data.header.sample}`;
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.calcProperties.fullCalcOnLoad = true;
  workbook.calcProperties.forceFullCalc = true;
  const official = workbook.addWorksheet("Relatório Oficial");
  const refs: FormulaRefs = {};
  const selected = new Set(data.selectedTests ?? []);
  if (selected.has("granulometria") && calculation.granulometry) refs.granulometria = addGranulometrySheet(workbook, data, calculation.granulometry, options.granulometryChartBase64);
  if (selected.has("forma") && calculation.shape) refs.forma = addShapeSheet(workbook, data, calculation.shape);
  if (selected.has("massa_especifica") && calculation.physicalProperties) refs.massa_especifica = addPhysicalSheet(workbook, data, calculation.physicalProperties);
  if (selected.has("material_pulverulento") && calculation.powder) refs.material_pulverulento = addPowderSheet(workbook, data, calculation.powder);
  if (selected.has("torroes_argila") && calculation.clay) refs.torroes_argila = addClaySheet(workbook, data, calculation.clay);
  if (selected.has("massa_unitaria") && calculation.bulkDensity) refs.massa_unitaria = addBulkDensitySheet(workbook, data, calculation.bulkDensity);
  for (const t of ["intemperie","los_angeles","treton","fragmentos_macios","micro_deval","point_load"] as TestType[]) if (selected.has(t)) refs[t] = addNumericSheet(workbook, t, data, calculation);
  refs.summary = addSummarySheet(workbook, data, calculation);
  if (options.officialReportPagesBase64?.length) addOfficialReportSnapshot(workbook, official, options.officialReportPagesBase64);
  else addOfficialReportCells(workbook, official, data, calculation, refs, options);
  official.orderNo = 0;
  return workbook;
}

async function imageUrlToBase64(url: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) return undefined;
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return undefined;
  }
}

async function granulometryChartPng(data: LabReportData, calc: GranulometryCalculation) {
  if (typeof document === "undefined") return undefined;
  const canvas = document.createElement("canvas");
  const W=1200,H=560;canvas.width=W;canvas.height=H;const ctx=canvas.getContext("2d");if(!ctx)return undefined;
  const M={left:90,right:82,top:65,bottom:75};const xMin=.01,xMax=100;
  const xp=(x:number)=>M.left+((Math.log10(x)-Math.log10(xMin))/(Math.log10(xMax)-Math.log10(xMin)))*(W-M.left-M.right);
  const yp=(y:number)=>M.top+((100-y)/100)*(H-M.top-M.bottom);
  ctx.fillStyle="#fff";ctx.fillRect(0,0,W,H);ctx.strokeStyle="#333";ctx.lineWidth=1;ctx.strokeRect(M.left,M.top,W-M.left-M.right,H-M.top-M.bottom);
  ctx.font="14px Arial";ctx.fillStyle="#263746";ctx.textAlign="right";ctx.textBaseline="middle";
  for(let y=0;y<=100;y+=5){ctx.beginPath();ctx.moveTo(M.left,yp(y));ctx.lineTo(W-M.right,yp(y));ctx.strokeStyle=y%10===0?"#666":"#d0d0d0";ctx.lineWidth=y%10===0?1:.5;ctx.stroke();if(y%10===0){ctx.fillStyle="#263746";ctx.fillText(String(y),M.left-12,yp(y));ctx.textAlign="left";ctx.fillText(String(100-y),W-M.right+12,yp(y));ctx.textAlign="right";}}
  for(const decade of [.01,.1,1,10])for(let m=1;m<=9;m++){const x=decade*m;ctx.beginPath();ctx.moveTo(xp(x),M.top);ctx.lineTo(xp(x),H-M.bottom);ctx.strokeStyle=m===1?"#666":"#c5c5c5";ctx.lineWidth=m===1?1:.5;ctx.stroke();}
  ctx.beginPath();ctx.moveTo(xp(100),M.top);ctx.lineTo(xp(100),H-M.bottom);ctx.strokeStyle="#666";ctx.stroke();
  ctx.textAlign="center";ctx.textBaseline="alphabetic";ctx.font="bold 14px Arial";ctx.fillStyle="#263746";for(const s of MASTER_SIEVES){ctx.setLineDash([5,4]);ctx.beginPath();ctx.moveTo(xp(s.mm),M.top);ctx.lineTo(xp(s.mm),H-M.bottom);ctx.strokeStyle="#333";ctx.lineWidth=1;ctx.stroke();ctx.setLineDash([]);ctx.fillText(s.label,xp(s.mm),M.top-18);}ctx.font="13px Arial";for(const x of [.01,.1,1,10,100])ctx.fillText(String(x).replace(".",","),xp(x),H-M.bottom+28);
  ctx.font="bold 16px Arial";ctx.fillText("Diâmetro das partículas (mm)",(M.left+W-M.right)/2,H-18);ctx.save();ctx.translate(28,(M.top+H-M.bottom)/2);ctx.rotate(-Math.PI/2);ctx.fillText("Porcentagem que passa (%)",0,0);ctx.restore();ctx.save();ctx.translate(W-22,(M.top+H-M.bottom)/2);ctx.rotate(Math.PI/2);ctx.fillText("Porcentagem retida (%)",0,0);ctx.restore();ctx.textAlign="left";ctx.fillText("Peneiras",M.left,M.top-42);
  const defs=TRACK_BANDS[data.band].sieves;const lower=defs.map(r=>({x:r.mm,y:100-r.maxRetainedAccum})).sort((a,b)=>a.x-b.x);const upper=defs.map(r=>({x:r.mm,y:100-r.minRetainedAccum})).sort((a,b)=>a.x-b.x);const obtained=calc.rows.filter(r=>r.passingPct!==null).map(r=>({x:r.mm,y:r.passingPct as number})).sort((a,b)=>a.x-b.x);
  const line=(pts:Array<{x:number;y:number}>,color:string,width:number)=>{if(!pts.length)return;ctx.beginPath();ctx.moveTo(xp(pts[0].x),yp(pts[0].y));for(const p of pts.slice(1))ctx.lineTo(xp(p.x),yp(p.y));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();};line(lower,"#e04747",2.2);line(upper,"#e04747",2.2);line(obtained,"#123f80",3);ctx.fillStyle="#123f80";for(const p of obtained){ctx.beginPath();ctx.arc(xp(p.x),yp(p.y),5,0,Math.PI*2);ctx.fill();}
  return canvas.toDataURL("image/png").split(",")[1];
}

async function waitForReportAssets(root: HTMLElement) {
  if (typeof document !== "undefined" && "fonts" in document) {
    try { await (document as Document & { fonts: FontFaceSet }).fonts.ready; } catch { /* best effort */ }
  }
  const images = Array.from(root.querySelectorAll<HTMLImageElement>("img"));
  await Promise.all(images.map((img) => {
    if (img.complete && img.naturalWidth > 0) return Promise.resolve();
    return new Promise<void>((resolve) => {
      const done = () => resolve();
      img.addEventListener("load", done, { once: true });
      img.addEventListener("error", done, { once: true });
      setTimeout(done, 8000);
    });
  }));
}

async function captureOfficialReportPages() {
  if (typeof document === "undefined") return [] as string[];
  const root = document.getElementById("official-report");
  if (!root) return [] as string[];
  await waitForReportAssets(root);
  const pageEls = Array.from(root.querySelectorAll<HTMLElement>(".report-a4"));
  const targets = pageEls.length ? pageEls : [root];
  const pages: string[] = [];
  for (const target of targets) {
    const canvas = await html2canvas(target, {
      scale: 1.65,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
      imageTimeout: 15000,
      scrollX: 0,
      scrollY: -window.scrollY,
    });
    // A aba oficial usa a mesma página A4 renderizada no sistema/PDF.
    // JPEG reduz o tamanho do XLSX sem perder legibilidade para impressão.
    pages.push(canvas.toDataURL("image/jpeg", 0.94).split(",")[1] || "");
  }
  return pages.filter(Boolean);
}

function requiredExcelSheets(data: LabReportData) {
  const names = ["Relatório Oficial", "Resultados Gerais"];
  const selected = new Set(data.selectedTests ?? []);
  if (selected.has("granulometria")) names.push("Granulometria");
  if (selected.has("forma")) names.push("Índice de Forma");
  if (selected.has("massa_especifica")) names.push("Propriedades Físicas");
  if (selected.has("material_pulverulento")) names.push("Material Pulverulento");
  if (selected.has("torroes_argila")) names.push("Torrões de Argila");
  if (selected.has("massa_unitaria")) names.push("Massa Unitária");
  for (const t of ["intemperie","los_angeles","treton","fragmentos_macios","micro_deval","point_load"] as TestType[]) {
    if (selected.has(t)) names.push(TEST_CATALOG[t].shortLabel.slice(0, 31));
  }
  return names;
}

async function validateExcelBuffer(raw: ExcelJS.Buffer, data: LabReportData) {
  const check = new ExcelJS.Workbook();
  await check.xlsx.load(raw);
  for (const name of requiredExcelSheets(data)) {
    if (!check.getWorksheet(name)) throw new Error(`Falha de validação do Excel: aba ausente (${name}).`);
  }
  let formulas = 0;
  check.eachSheet((ws) => ws.eachRow((row) => row.eachCell((cell) => {
    const value = cell.value as ExcelJS.CellValue;
    if (value && typeof value === "object" && "formula" in value) formulas += 1;
  })));
  if ((data.selectedTests ?? []).some((t) => ["granulometria","forma","massa_especifica","material_pulverulento","torroes_argila","massa_unitaria"].includes(t)) && formulas === 0) {
    throw new Error("Falha de validação do Excel: nenhuma fórmula técnica foi encontrada.");
  }
  if (check.worksheets.length < 2) throw new Error("Falha de validação do Excel: estrutura incompleta.");
}

export async function downloadLabReportExcel(data: LabReportData, calculation: LabReportCalculation) {
  const [logoBase64, granulometryChartBase64, officialReportPagesBase64] = await Promise.all([
    imageUrlToBase64("/logo-solocontrol.png"),
    calculation.granulometry ? granulometryChartPng(data, calculation.granulometry) : Promise.resolve(undefined),
    captureOfficialReportPages(),
  ]);
  const workbook = await buildLabReportWorkbook(data, calculation, { logoBase64, granulometryChartBase64, officialReportPagesBase64 });
  const raw = await workbook.xlsx.writeBuffer();
  await validateExcelBuffer(raw, data);
  const bytes = raw instanceof Uint8Array ? raw : new Uint8Array(raw as ArrayBuffer);
  const blob = new Blob([bytes], { type: XLSX_MIME });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = safeFileName(`Solocontrol-${data.header.reportNumber || data.header.sample || "relatorio"}-rev-${data.header.revision || "00"}.xlsx`);
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
