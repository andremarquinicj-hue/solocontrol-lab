export type UserRole = "admin" | "coordenador" | "tecnico";

export type ReportStatus = "draft" | "review" | "issued";
export type TrackBand = "A" | "B";
export type Lithology =
  | "GRANITO"
  | "BASALTO"
  | "CALCÁRIO CALCÍTICO"
  | "CALCÁRIO DOLOMÍTICO"
  | "OUTRAS LITOLOGIAS";

export type TestType =
  | "granulometria"
  | "forma"
  | "massa_especifica"
  | "intemperie"
  | "massa_unitaria"
  | "material_pulverulento"
  | "torroes_argila"
  | "los_angeles"
  | "treton"
  | "fragmentos_macios"
  | "micro_deval"
  | "point_load";

export type AnalysisStatus =
  | "CONFORME"
  | "NÃO CONFORME"
  | "PENDENTE"
  | "REPETIR ENSAIO"
  | "REFERÊNCIA";

export interface AppUser {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  companyId: string;
  active: boolean;
}

export interface SieveDefinition {
  mm: number;
  label: string;
  minRetainedAccum: number;
  maxRetainedAccum: number;
}

export interface SieveInput {
  mm: number;
  retained1G: number | null;
  retained2G: number | null;
}

export interface GranulometryHeader {
  reportNumber: string;
  revision: string;
  interested: string;
  contractorAddress: string;
  work: string;
  supplierOrigin: string;
  material: string;
  sample: string;
  sampleType: string;
  completionDate: string;
  lithology: Lithology | string;
  responsibleTechnician: string;
  technicalManager: string;
  crea: string;
  observations: string;
  latitude?: number | null;
  longitude?: number | null;
  locationCapturedAt?: string;
}

export interface ShapeParticleInput {
  id: string;
  fractionMm: number | null;
  aMm: number | null;
  bMm: number | null;
  cMm: number | null;
}

export interface ShapeTestData {
  method: "paquimetro";
  particles: ShapeParticleInput[];
}

export interface PhysicalSpecimenInput {
  id: string;
  dryMassG: number | null;
  saturatedMassG: number | null;
  submergedMassG: number | null;
}

export interface PhysicalPropertiesTestData {
  specimens: PhysicalSpecimenInput[];
}

export interface PowderDeterminationInput {
  initialDryG: number | null;
  afterWashDryG: number | null;
}

export interface PowderTestData {
  nominalMaxSizeMm: number | null;
  aggregateType: "GRAÚDO" | "MIÚDO";
  determinations: [PowderDeterminationInput, PowderDeterminationInput, PowderDeterminationInput];
}

export interface ClayIntervalInput {
  key: string;
  label: string;
  retainedPct: number | null;
  initialMassG: number | null;
  finalMassG: number | null;
  adoptedPct: number | null;
}

export interface ClayTestData {
  intervals: ClayIntervalInput[];
}

export interface BulkDensityTestData {
  containerVolumeL: number | null;
  containerMassKg: number | null;
  containerPlusAggregateKg: number | null;
}

export interface NumericResultTestData {
  result: number | null;
  observations: string;
}


export interface EvidencePhoto {
  url: string;
  name: string;
  caption?: string;
}

export interface GranulometryReportData {
  companyId: string;
  status: ReportStatus;
  band: TrackBand;
  header: GranulometryHeader;
  sample1MassG: number | null;
  sample2MassG: number | null;
  sieves: SieveInput[];
  bottom1G: number | null;
  bottom2G: number | null;
  createdBy: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  issuedAt?: unknown;
  pdfUrl?: string;
  evidencePhotos?: EvidencePhoto[];
  calculationSnapshot?: GranulometryCalculation | LabReportCalculation;
}

export interface LabReportData extends GranulometryReportData {
  selectedTests: TestType[];
  shape?: ShapeTestData;
  physicalProperties?: PhysicalPropertiesTestData;
  weathering?: NumericResultTestData;
  bulkDensity?: BulkDensityTestData;
  powder?: PowderTestData;
  clay?: ClayTestData;
  losAngeles?: NumericResultTestData;
  treton?: NumericResultTestData;
  softFragments?: NumericResultTestData;
  microDeval?: NumericResultTestData;
  pointLoad?: NumericResultTestData;
}

export interface CalculatedSieveRow extends SieveDefinition {
  retained1G: number | null;
  retained2G: number | null;
  retained1Pct: number | null;
  retained2Pct: number | null;
  differencePct: number | null;
  averageRetainedPct: number | null;
  accumulatedRetainedPct: number | null;
  passingPct: number | null;
  repeatabilityStatus: "OK" | "REPETIR" | "PENDENTE";
  conformityStatus: "CONFORME" | "NÃO CONFORME" | "PENDENTE";
}

export interface GranulometryCalculation {
  rows: CalculatedSieveRow[];
  sample1BalancePct: number | null;
  sample2BalancePct: number | null;
  massBalanceStatus: "CONFORME" | "REPETIR" | "PENDENTE";
  repeatabilityStatus: "OK" | "REPETIR" | "PENDENTE";
  standardStatus: "CONFORME" | "NÃO CONFORME" | "PENDENTE";
  overallStatus: "CONFORME" | "NÃO CONFORME" | "REPETIR ENSAIO" | "PENDENTE";
  complete: boolean;
}

export interface ShapeCalculatedRow extends ShapeParticleInput {
  ba: number | null;
  cb: number | null;
  classification: "CÚBICA" | "ALONGADA" | "LAMELAR" | "ALONGADA LAMELAR" | "PENDENTE";
}

export interface ShapeCalculation {
  rows: ShapeCalculatedRow[];
  validCount: number;
  meanBA: number | null;
  meanCB: number | null;
  stdBA: number | null;
  stdCB: number | null;
  cvBA: number | null;
  cvCB: number | null;
  meanClassification: ShapeCalculatedRow["classification"];
  cubicCount: number;
  nonCubicCount: number;
  cubicPct: number | null;
  nonCubicPct: number | null;
  nonCubicLimitPct: number;
  overallStatus: AnalysisStatus;
  complete: boolean;
}

export interface PhysicalCalculatedRow extends PhysicalSpecimenInput {
  densityGcm3: number | null;
  densityKgM3: number | null;
  porosityPct: number | null;
  absorptionPct: number | null;
}

export interface PhysicalPropertiesCalculation {
  rows: PhysicalCalculatedRow[];
  validCount: number;
  meanDensityKgM3: number | null;
  meanPorosityPct: number | null;
  meanAbsorptionPct: number | null;
  stdDensityKgM3: number | null;
  stdPorosityPct: number | null;
  stdAbsorptionPct: number | null;
  cvDensityPct: number | null;
  cvPorosityPct: number | null;
  cvAbsorptionPct: number | null;
  densityLimitKgM3: number;
  porosityLimitPct: number;
  absorptionLimitPct: number;
  densityStatus: AnalysisStatus;
  porosityStatus: AnalysisStatus;
  absorptionStatus: AnalysisStatus;
  overallStatus: AnalysisStatus;
  complete: boolean;
}

export interface PowderCalculation {
  valuesPct: Array<number | null>;
  minimumMassG: number;
  repeatabilityTolerancePct: number;
  repeatabilityStatus: "OK" | "3ª DETERMINAÇÃO NECESSÁRIA" | "PENDENTE";
  adoptedPair: "1ª + 2ª" | "1ª + 3ª" | "2ª + 3ª" | "";
  adoptedResultPct: number | null;
  reportedResultPct: number | null;
  overallStatus: AnalysisStatus;
  complete: boolean;
}

export interface ClayCalculatedRow extends ClayIntervalInput {
  minimumMassG: number;
  tested: boolean;
  clayPct: number | null;
  usedPct: number | null;
  partialPct: number | null;
  massStatus: "OK" | "MASSA INSUFICIENTE" | "DISPENSADA <5%" | "PENDENTE";
}

export interface ClayCalculation {
  rows: ClayCalculatedRow[];
  totalPct: number | null;
  overallStatus: AnalysisStatus;
  complete: boolean;
}

export interface BulkDensityCalculation {
  aggregateMassKg: number | null;
  resultKgM3: number | null;
  overallStatus: AnalysisStatus;
  complete: boolean;
}

export interface TestSummaryItem {
  type: TestType;
  label: string;
  result: string;
  unit: string;
  criterion: string;
  reference: string;
  status: AnalysisStatus;
}

export interface LabReportCalculation {
  granulometry?: GranulometryCalculation;
  shape?: ShapeCalculation;
  physicalProperties?: PhysicalPropertiesCalculation;
  powder?: PowderCalculation;
  clay?: ClayCalculation;
  bulkDensity?: BulkDensityCalculation;
  summaries: TestSummaryItem[];
  overallStatus: AnalysisStatus;
  complete: boolean;
}

export interface StoredReport extends LabReportData {
  id: string;
}
