import type {
  AnalysisStatus,
  LabReportCalculation,
  LabReportData,
  NumericResultTestData,
  TestSummaryItem,
  TestType,
} from "@/types";
import { calculateGranulometry } from "@/lib/granulometry";
import { calculateShape } from "@/lib/shape";
import { calculatePhysicalProperties } from "@/lib/physical";
import { calculatePowder } from "@/lib/powder";
import { calculateClay } from "@/lib/clay";
import { calculateBulkDensity } from "@/lib/bulkDensity";
import { LITHOLOGY_LIMITS, TEST_CATALOG, normalizedLithology } from "@/lib/testCatalog";

const fmt = (n: number | null, digits = 1) =>
  n === null ? "—" : n.toLocaleString("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits });

function numericComplete(data: NumericResultTestData | undefined) {
  return data?.result !== null && data?.result !== undefined && Number.isFinite(data.result);
}

function numericStatus(
  data: NumericResultTestData | undefined,
  mode: "max" | "min" | "reference",
  limit?: number,
): AnalysisStatus {
  if (!numericComplete(data)) return "PENDENTE";
  if (mode === "reference") return "REFERÊNCIA";
  if (limit === undefined) return "REFERÊNCIA";
  if (mode === "max") return (data!.result as number) <= limit ? "CONFORME" : "NÃO CONFORME";
  return (data!.result as number) >= limit ? "CONFORME" : "NÃO CONFORME";
}

function summary(
  type: TestType,
  label: string,
  result: string,
  unit: string,
  criterion: string,
  reference: string,
  status: AnalysisStatus,
): TestSummaryItem {
  return { type, label, result, unit, criterion, reference, status };
}

export function calculateLabReport(data: LabReportData): LabReportCalculation {
  const selected = new Set(data.selectedTests ?? []);
  const lithology = normalizedLithology(data.header.lithology);
  const limits = LITHOLOGY_LIMITS[lithology];
  const summaries: TestSummaryItem[] = [];

  const granulometry = selected.has("granulometria") ? calculateGranulometry(data) : undefined;
  if (granulometry) {
    summaries.push(summary(
      "granulometria",
      "Granulometria",
      granulometry.overallStatus,
      "—",
      `Faixa ${data.band}`,
      TEST_CATALOG.granulometria.reference,
      granulometry.overallStatus === "REPETIR ENSAIO" ? "REPETIR ENSAIO" : granulometry.overallStatus,
    ));
  }

  const shape = selected.has("forma") ? calculateShape(data.shape, data.header.lithology) : undefined;
  if (shape) {
    summaries.push(summary(
      "forma",
      "Forma média das partículas",
      shape.meanClassification,
      "—",
      "CÚBICA",
      TEST_CATALOG.forma.reference,
      shape.complete ? (shape.meanClassification === "CÚBICA" ? "CONFORME" : "NÃO CONFORME") : "PENDENTE",
    ));
    summaries.push(summary(
      "forma",
      "Partículas não cúbicas",
      fmt(shape.nonCubicPct, 1),
      "%",
      `≤ ${fmt(shape.nonCubicLimitPct, 0)}%`,
      TEST_CATALOG.forma.reference,
      shape.overallStatus,
    ));
  }

  const physicalProperties = selected.has("massa_especifica")
    ? calculatePhysicalProperties(data.physicalProperties, data.header.lithology)
    : undefined;
  if (physicalProperties) {
    summaries.push(summary(
      "massa_especifica",
      "Massa específica aparente",
      fmt(physicalProperties.meanDensityKgM3, 0),
      "kg/m³",
      `≥ ${fmt(physicalProperties.densityLimitKgM3, 0)}`,
      TEST_CATALOG.massa_especifica.reference,
      physicalProperties.densityStatus,
    ));
    summaries.push(summary(
      "massa_especifica",
      "Porosidade aparente",
      fmt(physicalProperties.meanPorosityPct, 2),
      "%",
      `≤ ${fmt(physicalProperties.porosityLimitPct, 1)}%`,
      TEST_CATALOG.massa_especifica.reference,
      physicalProperties.porosityStatus,
    ));
    summaries.push(summary(
      "massa_especifica",
      "Absorção de água",
      fmt(physicalProperties.meanAbsorptionPct, 2),
      "%",
      `≤ ${fmt(physicalProperties.absorptionLimitPct, 1)}%`,
      TEST_CATALOG.massa_especifica.reference,
      physicalProperties.absorptionStatus,
    ));
  }

  const powder = selected.has("material_pulverulento") ? calculatePowder(data.powder) : undefined;
  if (powder) {
    summaries.push(summary(
      "material_pulverulento",
      "Material pulverulento",
      fmt(powder.reportedResultPct, 1),
      "%",
      "≤ 1,0%",
      TEST_CATALOG.material_pulverulento.reference,
      powder.overallStatus,
    ));
  }

  const clay = selected.has("torroes_argila") ? calculateClay(data.clay) : undefined;
  if (clay) {
    summaries.push(summary(
      "torroes_argila",
      "Torrões de argila e materiais friáveis",
      fmt(clay.totalPct, 3),
      "%",
      "≤ 0,50%",
      TEST_CATALOG.torroes_argila.reference,
      clay.overallStatus,
    ));
  }

  const bulkDensity = selected.has("massa_unitaria") ? calculateBulkDensity(data.bulkDensity) : undefined;
  if (bulkDensity) {
    summaries.push(summary(
      "massa_unitaria",
      "Massa unitária no estado solto",
      fmt(bulkDensity.resultKgM3, 0),
      "kg/m³",
      "≥ 1.250",
      TEST_CATALOG.massa_unitaria.reference,
      bulkDensity.overallStatus,
    ));
  }

  if (selected.has("intemperie")) {
    const status = numericStatus(data.weathering, "max", 10);
    summaries.push(summary(
      "intemperie",
      "Resistência à intempérie",
      fmt(data.weathering?.result ?? null, 1),
      "%",
      "≤ 10%",
      TEST_CATALOG.intemperie.reference,
      status,
    ));
  }

  if (selected.has("los_angeles")) {
    const status = numericStatus(data.losAngeles, "max", limits.losAngelesMaxPct);
    summaries.push(summary(
      "los_angeles",
      "Abrasão Los Angeles",
      fmt(data.losAngeles?.result ?? null, 1),
      "%",
      `≤ ${limits.losAngelesMaxPct}%`,
      TEST_CATALOG.los_angeles.reference,
      status,
    ));
  }

  if (selected.has("treton")) {
    summaries.push(summary(
      "treton",
      "Índice de tenacidade Treton",
      fmt(data.treton?.result ?? null, 1),
      "%",
      "Referência ≤ 25%",
      TEST_CATALOG.treton.reference,
      numericStatus(data.treton, "reference"),
    ));
  }

  if (selected.has("fragmentos_macios")) {
    summaries.push(summary(
      "fragmentos_macios",
      "Fragmentos macios e friáveis",
      fmt(data.softFragments?.result ?? null, 1),
      "%",
      "Referência ≤ 5%",
      TEST_CATALOG.fragmentos_macios.reference,
      numericStatus(data.softFragments, "reference"),
    ));
  }

  if (selected.has("micro_deval")) {
    summaries.push(summary(
      "micro_deval",
      "Micro-Deval",
      fmt(data.microDeval?.result ?? null, 1),
      "%",
      "Valor de referência",
      TEST_CATALOG.micro_deval.reference,
      numericStatus(data.microDeval, "reference"),
    ));
  }

  if (selected.has("point_load")) {
    summaries.push(summary(
      "point_load",
      "Point Load",
      fmt(data.pointLoad?.result ?? null, 2),
      "MPa",
      "Valor de referência",
      TEST_CATALOG.point_load.reference,
      numericStatus(data.pointLoad, "reference"),
    ));
  }

  const completionByType: Record<TestType, boolean> = {
    granulometria: !selected.has("granulometria") || !!granulometry?.complete,
    forma: !selected.has("forma") || !!shape?.complete,
    massa_especifica: !selected.has("massa_especifica") || !!physicalProperties?.complete,
    intemperie: !selected.has("intemperie") || numericComplete(data.weathering),
    massa_unitaria: !selected.has("massa_unitaria") || !!bulkDensity?.complete,
    material_pulverulento: !selected.has("material_pulverulento") || !!powder?.complete,
    torroes_argila: !selected.has("torroes_argila") || !!clay?.complete,
    los_angeles: !selected.has("los_angeles") || numericComplete(data.losAngeles),
    treton: !selected.has("treton") || numericComplete(data.treton),
    fragmentos_macios: !selected.has("fragmentos_macios") || numericComplete(data.softFragments),
    micro_deval: !selected.has("micro_deval") || numericComplete(data.microDeval),
    point_load: !selected.has("point_load") || numericComplete(data.pointLoad),
  };

  const complete = selected.size > 0 && [...selected].every((t) => completionByType[t]);
  const evaluated = summaries.filter((s) => s.status !== "REFERÊNCIA");
  let overallStatus: AnalysisStatus = "PENDENTE";
  if (complete) {
    if (evaluated.some((s) => s.status === "REPETIR ENSAIO")) overallStatus = "REPETIR ENSAIO";
    else if (evaluated.some((s) => s.status === "NÃO CONFORME")) overallStatus = "NÃO CONFORME";
    else if (evaluated.length === 0 && summaries.length > 0) overallStatus = "REFERÊNCIA";
    else overallStatus = "CONFORME";
  }

  return { granulometry, shape, physicalProperties, powder, clay, bulkDensity, summaries, overallStatus, complete };
}

export function labReportPreflight(data: LabReportData, calc: LabReportCalculation) {
  const errors: string[] = [];
  const warnings: string[] = [];
  const h = data.header;
  const required: Array<[string, string]> = [
    ["Nº do relatório", h.reportNumber],
    ["Interessado", h.interested],
    ["Endereço do contratante", h.contractorAddress],
    ["Obra", h.work],
    ["Procedência/fornecedor", h.supplierOrigin],
    ["Litologia/tipo petrográfico", h.lithology],
    ["Material", h.material],
    ["Amostra", h.sample],
    ["Data final do ensaio", h.completionDate],
    ["Responsável pelo ensaio", h.responsibleTechnician],
    ["Responsável técnico", h.technicalManager],
    ["CREA", h.crea],
  ];
  required.forEach(([name, value]) => { if (!value?.trim()) errors.push(`${name} não preenchido.`); });

  if (!data.selectedTests?.length) errors.push("Selecione pelo menos um ensaio.");

  if (data.selectedTests?.includes("forma") && calc.shape && calc.granulometry?.complete) {
    const relevantFractions = calc.granulometry.rows.filter((r) => (r.averageRetainedPct ?? 0) >= 10).map((r) => r.mm);
    for (const fraction of relevantFractions) {
      const count = calc.shape.rows.filter((r) => r.fractionMm === fraction && r.classification !== "PENDENTE").length;
      if (count === 0) errors.push(`Índice de forma: inclua os fragmentos da fração ${fraction.toLocaleString("pt-BR")} mm (retenção ≥ 10%).`);
      else if (count < 100) warnings.push(`Índice de forma: fração ${fraction.toLocaleString("pt-BR")} mm possui ${count} fragmento(s) medido(s). O alvo normativo é 100 por fração, salvo quando a fração disponível não alcançar essa quantidade.`);
    }
  }
  if (!calc.complete) {
    for (const t of data.selectedTests ?? []) {
      const label = TEST_CATALOG[t].shortLabel;
      const related = calc.summaries.filter((s) => s.type === t);
      if (related.length === 0 || related.some((s) => s.status === "PENDENTE")) errors.push(`${label}: existem dados obrigatórios pendentes.`);
    }
  }
  if (calc.summaries.some((s) => s.status === "REPETIR ENSAIO")) errors.push("Há ensaio com condição de repetição/verificação. Corrija antes da emissão.");
  if (calc.summaries.some((s) => s.status === "NÃO CONFORME")) warnings.push("Há resultado NÃO CONFORME. O documento pode ser emitido, desde que o resultado seja mantido explicitamente no relatório.");
  if (calc.summaries.some((s) => s.status === "REFERÊNCIA")) warnings.push("Ensaios opcionais de referência não determinam, isoladamente, a rejeição do agregado.");

  return { errors: [...new Set(errors)], warnings: [...new Set(warnings)], canIssue: errors.length === 0 };
}
