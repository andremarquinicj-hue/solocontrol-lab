import type { PhysicalPropertiesCalculation, PhysicalPropertiesTestData, PhysicalSpecimenInput } from "@/types";
import { coefficientVariation, mean, round, sampleStd } from "@/lib/math";
import { LITHOLOGY_LIMITS, normalizedLithology } from "@/lib/testCatalog";

export function emptyPhysicalSpecimens(count = 10): PhysicalSpecimenInput[] {
  return Array.from({ length: count }, (_, i) => ({ id: `cp-${Date.now()}-${i}`, dryMassG: null, saturatedMassG: null, submergedMassG: null }));
}

export function calculatePhysicalProperties(data: PhysicalPropertiesTestData | undefined, lithology: string): PhysicalPropertiesCalculation {
  const specimens = data?.specimens ?? [];
  const rows = specimens.map((s) => {
    let densityGcm3: number | null = null;
    let densityKgM3: number | null = null;
    let porosityPct: number | null = null;
    let absorptionPct: number | null = null;
    if (
      s.dryMassG !== null && s.saturatedMassG !== null && s.submergedMassG !== null &&
      s.dryMassG > 0 && s.saturatedMassG > s.submergedMassG && s.saturatedMassG >= s.dryMassG
    ) {
      densityGcm3 = round(s.dryMassG / (s.saturatedMassG - s.submergedMassG), 3);
      densityKgM3 = round(densityGcm3 * 1000, 0);
      porosityPct = round(((s.saturatedMassG - s.dryMassG) / (s.saturatedMassG - s.submergedMassG)) * 100, 2);
      absorptionPct = round(((s.saturatedMassG - s.dryMassG) / s.dryMassG) * 100, 2);
    }
    return { ...s, densityGcm3, densityKgM3, porosityPct, absorptionPct };
  });
  const valid = rows.filter((r) => r.densityKgM3 !== null && r.porosityPct !== null && r.absorptionPct !== null);
  const d = valid.map((r) => r.densityKgM3 as number);
  const p = valid.map((r) => r.porosityPct as number);
  const a = valid.map((r) => r.absorptionPct as number);
  const md = mean(d), mp = mean(p), ma = mean(a);
  const limits = LITHOLOGY_LIMITS[normalizedLithology(lithology)];
  const complete = valid.length >= 10;
  const densityStatus = md === null ? "PENDENTE" : md >= limits.apparentDensityMinKgM3 ? "CONFORME" : "NÃO CONFORME";
  const porosityStatus = mp === null ? "PENDENTE" : mp <= limits.porosityMaxPct ? "CONFORME" : "NÃO CONFORME";
  const absorptionStatus = ma === null ? "PENDENTE" : ma <= limits.absorptionMaxPct ? "CONFORME" : "NÃO CONFORME";
  const overallStatus = !complete ? "PENDENTE" : [densityStatus, porosityStatus, absorptionStatus].includes("NÃO CONFORME") ? "NÃO CONFORME" : "CONFORME";
  return {
    rows,
    validCount: valid.length,
    meanDensityKgM3: md === null ? null : round(md, 0),
    meanPorosityPct: mp === null ? null : round(mp, 2),
    meanAbsorptionPct: ma === null ? null : round(ma, 2),
    stdDensityKgM3: d.length >= 2 ? round(sampleStd(d)!, 1) : null,
    stdPorosityPct: p.length >= 2 ? round(sampleStd(p)!, 3) : null,
    stdAbsorptionPct: a.length >= 2 ? round(sampleStd(a)!, 3) : null,
    cvDensityPct: d.length >= 2 ? round(coefficientVariation(d)!, 1) : null,
    cvPorosityPct: p.length >= 2 ? round(coefficientVariation(p)!, 1) : null,
    cvAbsorptionPct: a.length >= 2 ? round(coefficientVariation(a)!, 1) : null,
    densityLimitKgM3: limits.apparentDensityMinKgM3,
    porosityLimitPct: limits.porosityMaxPct,
    absorptionLimitPct: limits.absorptionMaxPct,
    densityStatus,
    porosityStatus,
    absorptionStatus,
    overallStatus,
    complete,
  };
}
