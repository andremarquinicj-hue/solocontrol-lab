import type { ShapeCalculation, ShapeParticleInput, ShapeTestData } from "@/types";
import { coefficientVariation, mean, round, sampleStd } from "@/lib/math";
import { LITHOLOGY_LIMITS, normalizedLithology } from "@/lib/testCatalog";

function classify(ba: number | null, cb: number | null): ShapeCalculation["meanClassification"] {
  if (ba === null || cb === null) return "PENDENTE";
  if (ba >= 0.5 && cb >= 0.5) return "CÚBICA";
  if (ba < 0.5 && cb >= 0.5) return "ALONGADA";
  if (ba >= 0.5 && cb < 0.5) return "LAMELAR";
  return "ALONGADA LAMELAR";
}

export function emptyShapeParticles(count = 10): ShapeParticleInput[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `p-${Date.now()}-${i}`,
    fractionMm: null,
    aMm: null,
    bMm: null,
    cMm: null,
  }));
}

export function calculateShape(data: ShapeTestData | undefined, lithology: string): ShapeCalculation {
  const particles = data?.particles ?? [];
  const rows = particles.map((p) => {
    const ba = p.aMm && p.bMm !== null && p.aMm > 0 ? round(p.bMm / p.aMm, 1) : null;
    const cb = p.bMm && p.cMm !== null && p.bMm > 0 ? round(p.cMm / p.bMm, 1) : null;
    return { ...p, ba, cb, classification: classify(ba, cb) };
  });
  const valid = rows.filter((r) => r.ba !== null && r.cb !== null && r.classification !== "PENDENTE");
  const baValues = valid.map((r) => r.ba as number);
  const cbValues = valid.map((r) => r.cb as number);
  const meanBAraw = mean(baValues);
  const meanCBraw = mean(cbValues);
  const meanBA = meanBAraw === null ? null : round(meanBAraw, 2);
  const meanCB = meanCBraw === null ? null : round(meanCBraw, 2);
  const meanClassification = classify(
    meanBAraw === null ? null : round(meanBAraw, 1),
    meanCBraw === null ? null : round(meanCBraw, 1),
  );
  const cubicCount = valid.filter((r) => r.classification === "CÚBICA").length;
  const nonCubicCount = valid.length - cubicCount;
  const cubicPct = valid.length ? round((cubicCount / valid.length) * 100, 1) : null;
  const nonCubicPct = valid.length ? round((nonCubicCount / valid.length) * 100, 1) : null;
  const limits = LITHOLOGY_LIMITS[normalizedLithology(lithology)];
  const complete = valid.length > 0 && valid.length === particles.filter((p)=>p.aMm!==null||p.bMm!==null||p.cMm!==null).length;

  let overallStatus: ShapeCalculation["overallStatus"] = "PENDENTE";
  if (complete && meanClassification !== "PENDENTE" && nonCubicPct !== null) {
    overallStatus = meanClassification === "CÚBICA" && nonCubicPct <= limits.nonCubicMaxPct ? "CONFORME" : "NÃO CONFORME";
  }

  return {
    rows,
    validCount: valid.length,
    meanBA,
    meanCB,
    stdBA: baValues.length >= 2 ? round(sampleStd(baValues)!, 3) : null,
    stdCB: cbValues.length >= 2 ? round(sampleStd(cbValues)!, 3) : null,
    cvBA: baValues.length >= 2 ? round(coefficientVariation(baValues)!, 1) : null,
    cvCB: cbValues.length >= 2 ? round(coefficientVariation(cbValues)!, 1) : null,
    meanClassification,
    cubicCount,
    nonCubicCount,
    cubicPct,
    nonCubicPct,
    nonCubicLimitPct: limits.nonCubicMaxPct,
    overallStatus,
    complete,
  };
}
