"use client";

import { FormEvent, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => onAuthStateChanged(auth, (u) => { if (u) router.replace("/dashboard"); }), [router]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace("/dashboard");
    } catch {
      setError("E-mail ou senha inválidos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={submit}>
        <img src="/logo-solocontrol.png" alt="Solocontrol" />
        <h1>Solocontrol Lab</h1>
        <p>Acesso seguro aos ensaios e relatórios salvos na nuvem.</p>
        <div className="field">
          <label>E-mail</label>
          <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
        </div>
        <div className="field" style={{marginTop:12}}>
          <label>Senha</label>
          <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required />
        </div>
        {error && <div className="notice bad" style={{marginTop:12}}>{error}</div>}
        <button className="btn primary" disabled={loading} style={{width:"100%",marginTop:17}}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}
