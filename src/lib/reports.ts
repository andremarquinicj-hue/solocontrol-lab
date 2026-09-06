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
import type { GranulometryReportData, StoredReport } from "@/types";

export async function createReport(data: GranulometryReportData) {
  const refDoc = await addDoc(collection(db, "reports"), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await addAudit(refDoc.id, data.createdBy, "CREATE", null, data);
  return refDoc.id;
}

export async function updateReport(id: string, patch: Partial<GranulometryReportData>, userId: string) {
  const current = await getReport(id);
  await updateDoc(doc(db, "reports", id), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
  await addAudit(id, userId, "UPDATE", current, patch);
}

export async function getReport(id: string): Promise<StoredReport | null> {
  const snap = await getDoc(doc(db, "reports", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as GranulometryReportData) };
}

export function subscribeReports(callback: (items: StoredReport[]) => void) {
  const q = query(
    collection(db, "reports"),
    where("companyId", "==", COMPANY.id),
    orderBy("createdAt", "desc"),
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...(d.data() as GranulometryReportData) })));
  });
}

export async function uploadPdf(reportId: string, revision: string, blob: Blob) {
  const storageRef = ref(storage, `reports/${COMPANY.id}/${reportId}/relatorio-rev-${revision || "00"}.pdf`);
  await uploadBytes(storageRef, blob, { contentType: "application/pdf" });
  return getDownloadURL(storageRef);
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
  await addDoc(collection(db, "auditLogs"), {
    companyId: COMPANY.id,
    reportId,
    userId,
    action,
    before,
    after,
    createdAt: serverTimestamp(),
  });
}

export async function seedCompanySettings() {
  await setDoc(
    doc(db, "companySettings", COMPANY.id),
    { ...COMPANY, updatedAt: serverTimestamp() },
    { merge: true },
  );
}
