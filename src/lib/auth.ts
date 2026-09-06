import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { AppUser } from "@/types";

export async function loadAppUser(uid: string): Promise<AppUser | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return { uid, ...(snap.data() as Omit<AppUser, "uid">) };
}
