export type UserRole = "admin" | "coordenador" | "tecnico";

export type ReportStatus = "draft" | "review" | "issued";
export type TrackBand = "A" | "B";

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
  lithology: string;
  responsibleTechnician: string;
  technicalManager: string;
  crea: string;
  observations: string;
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
  calculationSnapshot?: GranulometryCalculation;
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

export interface StoredReport extends GranulometryReportData {
  id: string;
}
