import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { COMPANY } from "@/config/company";
import { db, storage } from "@/lib/firebase";
import type { LabReportData, StoredReport } from "@/types";

function sanitizeForFirestore<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => item === undefined ? null : sanitizeForFirestore(item)) as T;
  }
  if (value && typeof value === "object") {
    const proto = Object.getPrototypeOf(value);
    if (proto === Object.prototype || proto === null) {
      const out: Record<string, unknown> = {};
      for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
        if (item === undefined) continue;
        out[key] = sanitizeForFirestore(item);
      }
      return out as T;
    }
  }
  return value;
}

export async function createReport(data: LabReportData) {
  // O Firestore rejeita qualquer `undefined`, inclusive dentro de objetos
  // aninhados como calculationSnapshot. Limpamos o payload antes da gravação.
  const cleanData = sanitizeForFirestore(data);
  const refDoc = await addDoc(collection(db, "reports"), {
    ...cleanData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await addAudit(refDoc.id, cleanData.createdBy, "CREATE", null, cleanData);
  return refDoc.id;
}

export async function updateReport(id: string, patch: Partial<LabReportData>, userId: string) {
  const current = await getReport(id);
  const cleanPatch = sanitizeForFirestore(patch);
  await updateDoc(doc(db, "reports", id), {
    ...cleanPatch,
    updatedAt: serverTimestamp(),
  });
  await addAudit(id, userId, "UPDATE", current, cleanPatch);
}

export async function getReport(id: string): Promise<StoredReport | null> {
  const snap = await getDoc(doc(db, "reports", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as LabReportData) };
}

export function subscribeReports(callback: (items: StoredReport[]) => void) {
  const q = query(
    collection(db, "reports"),
    where("companyId", "==", COMPANY.id),
    orderBy("createdAt", "desc"),
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...(d.data() as LabReportData) })));
  });
}

export async function uploadPdf(reportId: string, revision: string, blob: Blob) {
  const storageRef = ref(storage, `reports/${COMPANY.id}/${reportId}/relatorio-rev-${revision || "00"}.pdf`);
  await uploadBytes(storageRef, blob, { contentType: "application/pdf" });
  return getDownloadURL(storageRef);
}


export async function uploadEvidencePhoto(reportId: string, file: File) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-");
  const storageRef = ref(storage, `reports/${COMPANY.id}/${reportId}/evidencias/${Date.now()}-${safeName}`);
  await uploadBytes(storageRef, file, { contentType: file.type || "image/jpeg" });
  const url = await getDownloadURL(storageRef);
  return { url, name: file.name };
}

export async function issueReport(reportId: string, pdfUrl: string, userId: string) {
  await updateDoc(doc(db, "reports", reportId), {
    status: "issued",
    pdfUrl,
    issuedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await addAudit(reportId, userId, "ISSUE", null, { pdfUrl });
}

async function addAudit(reportId: string, userId: string, action: string, before: unknown, after: unknown) {
  await addDoc(collection(db, "auditLogs"), sanitizeForFirestore({
    companyId: COMPANY.id,
    reportId,
    userId,
    action,
    before,
    after,
    createdAt: serverTimestamp(),
  }));
}

export async function seedCompanySettings() {
  await setDoc(
    doc(db, "companySettings", COMPANY.id),
    { ...COMPANY, updatedAt: serverTimestamp() },
    { merge: true },
  );
}
