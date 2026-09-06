import type {
  CalculatedSieveRow,
  GranulometryCalculation,
  GranulometryReportData,
  SieveDefinition,
  SieveInput,
  TrackBand,
} from "@/types";

export const MASTER_SIEVES = [
  { mm: 12.5, label: '½"' },
  { mm: 19.0, label: '¾"' },
  { mm: 25.4, label: '1"' },
  { mm: 38.0, label: '1½"' },
  { mm: 50.8, label: '2"' },
  { mm: 63.5, label: '2½"' },
  { mm: 76.2, label: '3"' },
] as const;

export const TRACK_BANDS: Record<TrackBand, { label: string; sieves: SieveDefinition[] }> = {
  A: {
    label: "PADRÃO A - LINHAS PRINCIPAIS",
    sieves: [
      { mm: 63.5, label: '2½"', minRetainedAccum: 0, maxRetainedAccum: 0 },
      { mm: 50.8, label: '2"', minRetainedAccum: 0, maxRetainedAccum: 10 },
      { mm: 38.0, label: '1½"', minRetainedAccum: 30, maxRetainedAccum: 65 },
      { mm: 25.4, label: '1"', minRetainedAccum: 85, maxRetainedAccum: 100 },
      { mm: 12.5, label: '½"', minRetainedAccum: 95, maxRetainedAccum: 100 },
    ],
  },
  B: {
    label: "PADRÃO B - PÁTIOS",
    sieves: [
      { mm: 76.2, label: '3"', minRetainedAccum: 0, maxRetainedAccum: 0 },
      { mm: 63.5, label: '2½"', minRetainedAccum: 0, maxRetainedAccum: 10 },
      { mm: 38.0, label: '1½"', minRetainedAccum: 40, maxRetainedAccum: 75 },
      { mm: 19.0, label: '¾"', minRetainedAccum: 90, maxRetainedAccum: 100 },
      { mm: 12.5, label: '½"', minRetainedAccum: 98, maxRetainedAccum: 100 },
    ],
  },
};

export function initialSievesForBand(band: TrackBand, previous: SieveInput[] = []): SieveInput[] {
  const previousByMm = new Map(previous.map((x) => [x.mm, x]));
  return TRACK_BANDS[band].sieves.map((s) => ({
    mm: s.mm,
    retained1G: previousByMm.get(s.mm)?.retained1G ?? null,
    retained2G: previousByMm.get(s.mm)?.retained2G ?? null,
  }));
}

function round1(v: number) {
  return Math.round((v + Number.EPSILON) * 10) / 10;
}

function round0(v: number) {
  return Math.round(v);
}

function pct(weight: number | null, mass: number | null): number | null {
  if (weight === null || mass === null || mass <= 0) return null;
  return round1((weight / mass) * 100);
}

function balance(initialMass: number | null, retained: Array<number | null>, bottom: number | null) {
  if (initialMass === null || initialMass <= 0 || bottom === null || retained.some((x) => x === null)) return null;
  const sum = retained.reduce<number>((acc, value) => acc + (value ?? 0), 0) + bottom;
  return round1((Math.abs(initialMass - sum) / initialMass) * 100);
}

export function calculateGranulometry(data: GranulometryReportData): GranulometryCalculation {
  const definitions = TRACK_BANDS[data.band].sieves;
  const inputByMm = new Map(data.sieves.map((s) => [s.mm, s]));

  let cumulative = 0;
  const rows: CalculatedSieveRow[] = definitions.map((def) => {
    const input = inputByMm.get(def.mm) ?? { mm: def.mm, retained1G: null, retained2G: null };
    const p1 = pct(input.retained1G, data.sample1MassG);
    const p2 = pct(input.retained2G, data.sample2MassG);
    const diff = p1 === null || p2 === null ? null : round1(Math.abs(p1 - p2));
    const avg = p1 === null || p2 === null ? null : round0((p1 + p2) / 2);

    let accumulated: number | null = null;
    let passing: number | null = null;
    if (avg !== null) {
      cumulative = round0(cumulative + avg);
      accumulated = cumulative;
      passing = Math.max(0, 100 - accumulated);
    }

    const repeatabilityStatus =
      diff === null ? "PENDENTE" : diff <= 4 ? "OK" : "REPETIR";

    const conformityStatus =
      accumulated === null
        ? "PENDENTE"
        : accumulated >= def.minRetainedAccum && accumulated <= def.maxRetainedAccum
          ? "CONFORME"
          : "NÃO CONFORME";

    return {
      ...def,
      retained1G: input.retained1G,
      retained2G: input.retained2G,
      retained1Pct: p1,
      retained2Pct: p2,
      differencePct: diff,
      averageRetainedPct: avg,
      accumulatedRetainedPct: accumulated,
      passingPct: passing,
      repeatabilityStatus,
      conformityStatus,
    };
  });

  const b1 = balance(data.sample1MassG, rows.map((r) => r.retained1G), data.bottom1G);
  const b2 = balance(data.sample2MassG, rows.map((r) => r.retained2G), data.bottom2G);
  const massBalanceStatus =
    b1 === null || b2 === null ? "PENDENTE" : b1 <= 0.3 && b2 <= 0.3 ? "CONFORME" : "REPETIR";

  const repeatabilityStatus = rows.some((r) => r.repeatabilityStatus === "PENDENTE")
    ? "PENDENTE"
    : rows.some((r) => r.repeatabilityStatus === "REPETIR")
      ? "REPETIR"
      : "OK";

  const standardStatus = rows.some((r) => r.conformityStatus === "PENDENTE")
    ? "PENDENTE"
    : rows.some((r) => r.conformityStatus === "NÃO CONFORME")
      ? "NÃO CONFORME"
      : "CONFORME";

  const complete =
    data.sample1MassG !== null &&
    data.sample2MassG !== null &&
    data.bottom1G !== null &&
    data.bottom2G !== null &&
    rows.every((r) => r.retained1G !== null && r.retained2G !== null);

  let overallStatus: GranulometryCalculation["overallStatus"] = "PENDENTE";
  if (complete && massBalanceStatus === "REPETIR") overallStatus = "REPETIR ENSAIO";
  else if (complete && repeatabilityStatus === "REPETIR") overallStatus = "REPETIR ENSAIO";
  else if (complete && massBalanceStatus === "CONFORME" && repeatabilityStatus === "OK") {
    overallStatus = standardStatus === "NÃO CONFORME" ? "NÃO CONFORME" : "CONFORME";
  }

  return {
    rows,
    sample1BalancePct: b1,
    sample2BalancePct: b2,
    massBalanceStatus,
    repeatabilityStatus,
    standardStatus,
    overallStatus,
    complete,
  };
}

export function reportPreflight(data: GranulometryReportData, calc: GranulometryCalculation) {
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
  required.forEach(([name, value]) => {
    if (!value?.trim()) errors.push(`${name} não preenchido.`);
  });

  if (!calc.complete) errors.push("Existem pesagens obrigatórias não preenchidas.");
  if (calc.massBalanceStatus === "REPETIR") errors.push("Balanço de massa acima de 0,3%. Repetir/verificar o ensaio.");
  if (calc.repeatabilityStatus === "REPETIR") errors.push("Diferença entre determinações acima de 4% em uma ou mais peneiras.");
  if (calc.standardStatus === "NÃO CONFORME") warnings.push("A granulometria está fora da faixa especificada. O relatório pode ser emitido como NÃO CONFORME.");

  return {
    errors,
    warnings,
    canIssue: errors.length === 0,
  };
}
