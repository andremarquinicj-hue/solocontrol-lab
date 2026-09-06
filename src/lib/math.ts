export const round = (value: number, decimals = 1) => {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};

export const mean = (values: number[]) => values.length ? values.reduce((a,b)=>a+b,0)/values.length : null;

export function sampleStd(values: number[]) {
  if (values.length < 2) return null;
  const m = mean(values)!;
  const variance = values.reduce((acc, value) => acc + (value - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export function coefficientVariation(values: number[]) {
  const m = mean(values);
  const s = sampleStd(values);
  if (m === null || s === null || m === 0) return null;
  return (s / Math.abs(m)) * 100;
}

export const formatPt = (value: number | null | undefined, decimals = 1) =>
  value === null || value === undefined || Number.isNaN(value)
    ? "—"
    : value.toLocaleString("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
