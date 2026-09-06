import type { PowderCalculation, PowderTestData } from "@/types";
import { round } from "@/lib/math";

export function initialPowderData(): PowderTestData {
  return {
    nominalMaxSizeMm: 63,
    aggregateType: "GRAÚDO",
    determinations: [
      { initialDryG: null, afterWashDryG: null },
      { initialDryG: null, afterWashDryG: null },
      { initialDryG: null, afterWashDryG: null },
    ],
  };
}

function minimumMass(dmc: number | null) {
  const d = dmc ?? 63;
  if (d <= 2.36) return 300;
  if (d <= 4.75) return 500;
  if (d <= 9.5) return 1000;
  if (d <= 19) return 2500;
  return 5000;
}

function value(initial: number | null, final: number | null) {
  if (initial === null || final === null || initial <= 0 || final < 0 || final > initial) return null;
  return round(((initial - final) / initial) * 100, 3);
}

export function calculatePowder(data: PowderTestData | undefined): PowderCalculation {
  const d = data ?? initialPowderData();
  const minimumMassG = minimumMass(d.nominalMaxSizeMm);
  const tolerance = d.aggregateType === "GRAÚDO" ? 0.5 : 1.0;
  const values = d.determinations.map((x) => value(x.initialDryG, x.afterWashDryG));
  const firstTwoMassOk = d.determinations.slice(0,2).every((x)=>x.initialDryG !== null && x.initialDryG >= minimumMassG);
  let repeatabilityStatus: PowderCalculation["repeatabilityStatus"] = "PENDENTE";
  let adoptedPair: PowderCalculation["adoptedPair"] = "";
  let adoptedResultPct: number | null = null;

  if (values[0] !== null && values[1] !== null && firstTwoMassOk) {
    const m = (values[0] + values[1]) / 2;
    if (Math.abs(values[0] - m) <= tolerance && Math.abs(values[1] - m) <= tolerance) {
      repeatabilityStatus = "OK";
      adoptedPair = "1ª + 2ª";
      adoptedResultPct = round(m, 3);
    } else {
      repeatabilityStatus = "3ª DETERMINAÇÃO NECESSÁRIA";
      const thirdMassOk = d.determinations[2].initialDryG !== null && d.determinations[2].initialDryG >= minimumMassG;
      if (values[2] !== null && thirdMassOk) {
        const pairs = [
          { pair: "1ª + 2ª" as const, a: values[0], b: values[1] },
          { pair: "1ª + 3ª" as const, a: values[0], b: values[2] },
          { pair: "2ª + 3ª" as const, a: values[1], b: values[2] },
        ];
        pairs.sort((x,y)=>Math.abs(x.a-x.b)-Math.abs(y.a-y.b));
        adoptedPair = pairs[0].pair;
        adoptedResultPct = round((pairs[0].a+pairs[0].b)/2, 3);
      }
    }
  }
  const reported = adoptedResultPct === null ? null : adoptedResultPct > 10 ? round(adoptedResultPct,0) : round(adoptedResultPct,1);
  const complete = adoptedResultPct !== null;
  const overallStatus = !complete ? "PENDENTE" : reported! <= 1 ? "CONFORME" : "NÃO CONFORME";
  return { valuesPct: values, minimumMassG, repeatabilityTolerancePct: tolerance, repeatabilityStatus, adoptedPair, adoptedResultPct, reportedResultPct: reported, overallStatus, complete };
}
