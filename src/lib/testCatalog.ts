import type { Lithology, TestType } from "@/types";

export const MANDATORY_TESTS: TestType[] = [
  "granulometria",
  "forma",
  "massa_especifica",
  "intemperie",
  "massa_unitaria",
  "material_pulverulento",
  "torroes_argila",
  "los_angeles",
];

export const OPTIONAL_TESTS: TestType[] = ["treton", "fragmentos_macios", "micro_deval", "point_load"];

export const TEST_CATALOG: Record<TestType, {
  label: string;
  shortLabel: string;
  reference: string;
  category: "obrigatorio" | "opcional";
  description: string;
}> = {
  granulometria: {
    label: "Composição granulométrica",
    shortLabel: "Granulometria",
    reference: "ABNT NBR 5564:2021 – Tabela 3 / ABNT NBR 17054:2022",
    category: "obrigatorio",
    description: "Duas determinações, balanço de massa, repetibilidade, faixa A/B e curva granulométrica.",
  },
  forma: {
    label: "Forma das partículas – método do paquímetro",
    shortLabel: "Índice de forma",
    reference: "ABNT NBR 5564:2021 – Anexo A",
    category: "obrigatorio",
    description: "Medições a, b e c, relações b/a e c/b, classificação individual e forma média.",
  },
  massa_especifica: {
    label: "Massa específica aparente, porosidade e absorção",
    shortLabel: "Massa específica / porosidade / absorção",
    reference: "ABNT NBR 5564:2021 – Anexo B",
    category: "obrigatorio",
    description: "Massa seca, saturada e submersa por corpo de prova, com médias e conformidade por litologia.",
  },
  intemperie: {
    label: "Resistência à intempérie",
    shortLabel: "Intempérie",
    reference: "ABNT NBR 5564:2021 – Anexo C",
    category: "obrigatorio",
    description: "Registro do resultado final do método executado e análise automática do limite de 10%.",
  },
  massa_unitaria: {
    label: "Massa unitária no estado solto",
    shortLabel: "Massa unitária",
    reference: "ABNT NBR 16972",
    category: "obrigatorio",
    description: "Volume do recipiente e pesagens para cálculo em kg/m³.",
  },
  material_pulverulento: {
    label: "Material pulverulento",
    shortLabel: "Material pulverulento",
    reference: "ABNT NBR 16973",
    category: "obrigatorio",
    description: "Duas determinações, repetibilidade, terceira determinação quando necessária e limite de 1,0%.",
  },
  torroes_argila: {
    label: "Torrões de argila e materiais friáveis",
    shortLabel: "Torrões de argila",
    reference: "ABNT NBR 7218:2025",
    category: "obrigatorio",
    description: "Faixas granulométricas, massas mínimas, teores parciais e teor total da amostra.",
  },
  los_angeles: {
    label: "Resistência ao desgaste – Abrasão Los Angeles",
    shortLabel: "Los Angeles",
    reference: "ABNT NBR 16974",
    category: "obrigatorio",
    description: "Registro do resultado do ensaio e comparação automática com o limite da litologia.",
  },
  treton: {
    label: "Resistência ao choque – Índice de tenacidade Treton",
    shortLabel: "Treton",
    reference: "ABNT NBR 5564:2021 – Anexo E",
    category: "opcional",
    description: "Ensaio opcional, referência máxima de 25%.",
  },
  fragmentos_macios: {
    label: "Teor de fragmentos macios e friáveis",
    shortLabel: "Fragmentos macios",
    reference: "ABNT NBR 5564:2021 – Anexo F",
    category: "opcional",
    description: "Ensaio opcional, referência máxima de 5%.",
  },
  micro_deval: {
    label: "Resistência ao desgaste – Micro-Deval",
    shortLabel: "Micro-Deval",
    reference: "ABNT NBR 5564:2021 – Anexo J",
    category: "opcional",
    description: "Resultado de referência, sem valor de rejeição definido na Tabela 2.",
  },
  point_load: {
    label: "Índice de resistência à compressão pontual – Point Load",
    shortLabel: "Point Load",
    reference: "ABNT NBR 5564:2021 – Anexo K",
    category: "opcional",
    description: "Resultado de referência, sem valor de rejeição definido na Tabela 2.",
  },
};

export const LITHOLOGY_LIMITS: Record<string, {
  nonCubicMaxPct: number;
  apparentDensityMinKgM3: number;
  porosityMaxPct: number;
  absorptionMaxPct: number;
  losAngelesMaxPct: number;
}> = {
  GRANITO: { nonCubicMaxPct: 15, apparentDensityMinKgM3: 2600, porosityMaxPct: 2, absorptionMaxPct: 1, losAngelesMaxPct: 35 },
  BASALTO: { nonCubicMaxPct: 17, apparentDensityMinKgM3: 2700, porosityMaxPct: 2, absorptionMaxPct: 1, losAngelesMaxPct: 30 },
  "CALCÁRIO CALCÍTICO": { nonCubicMaxPct: 15, apparentDensityMinKgM3: 2600, porosityMaxPct: 2, absorptionMaxPct: 2, losAngelesMaxPct: 30 },
  "CALCÁRIO DOLOMÍTICO": { nonCubicMaxPct: 15, apparentDensityMinKgM3: 2650, porosityMaxPct: 2, absorptionMaxPct: 2, losAngelesMaxPct: 30 },
  "OUTRAS LITOLOGIAS": { nonCubicMaxPct: 15, apparentDensityMinKgM3: 2500, porosityMaxPct: 2, absorptionMaxPct: 2, losAngelesMaxPct: 30 },
};

export function normalizedLithology(value: string): Lithology {
  return (Object.prototype.hasOwnProperty.call(LITHOLOGY_LIMITS, value) ? value : "OUTRAS LITOLOGIAS") as Lithology;
}
