import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

/**
 * Firebase Web config.
 *
 * Os valores NEXT_PUBLIC_* continuam tendo prioridade quando existirem na Vercel.
 * Como a configuração Web do Firebase é pública por natureza (ela é enviada ao
 * navegador), mantemos os valores do projeto Solocontrol Lab como fallback para
 * impedir que o build da Vercel quebre quando alguma variável ainda não estiver
 * cadastrada no ambiente de build.
 */
const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    "AIzaSyA2uljn0Ygzx9IXVwLcJjjdUDCf3V8qUY0",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    "solocontrol-lab.firebaseapp.com",
  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    "solocontrol-lab",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    "solocontrol-lab.firebasestorage.app",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    "538792010012",
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
    "1:538792010012:web:0d27e635165d02e6f89ad9",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
