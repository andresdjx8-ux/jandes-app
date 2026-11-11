"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

function LogoJandes() {
  return (
    <div style={{ textAlign: "center", marginBottom: 18 }}>
      {/* MONTAÑITA */[STRIPPED 19 bytes]"88" height="56" viewBox="0 0 88 56" fill="none" style={{ display: "block", margin: "0 auto 4px" }}>
        <path d="M4 52 L28 16 L40 34 L52 10 L84 52 Z" fill="#2563eb" />
        <path d="M28 16 L34 24 L29 27 L25 23 L21 27 L22 28 L28 16 Z" fill="white" />
        <path d="M52 10 L58 19 L53 22 L49 18 L45 22 L46 23 L52 10 Z" fill="white" />
        <ellipse cx="44" cy="52" rx="42" ry="3" fill="#22c55e" opacity="0.25" />
      </svg>
      <h1 style={{ fontSize: 38, fontWeight: 900, letterSpacing: 3, margin: 0, lineHeight: 1 }}>
        <span style={{ color: "#2563eb" }}>JAN</span><span style={{ color: "#1d4ed8" }}>DES</span>
      </h1>
      <p style={{ color: "#64748b", fontSize: 13, margin: "6px 0 0", fontWeight: 600 }}>Delivery Junín de los Andes 🛵</p>
    </div>
  );
}

export default function Login() {
  const router = useRouter();
  const [modo, setModo] = useState<"cliente" | "comercio" | "delivery">("cliente");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [mostrarRegistro, setMostrarRegistro] = useState(false);
  const [cargando, setCargando] = useState(false);

  async function entrar() {
    if (!email || !password) return alert("Completá correo y clave");
    setCargando(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setCargando(false); return alert("Correo o clave incorrectos. Probá de nuevo."); }

    if (modo === "delivery") { router.push("/delivery"); return; }

    if (modo === "comercio") {
      const { data: comercio } = await supabase.from("comercios").select("*").eq("user_id", data.user.id).maybeSingle();
      if (!comercio) { setCargando(false); return alert("Este correo no tiene comercio. Registrate como comercio."); }
      router.push("/comercio"); return;
    }

    // CLIENTE va a la HOME ( / ) que es donde vive el cliente
    router.push("/");
  }

  async function registrarse() {
    if (!nombre || !email || !password) return alert("Completá nombre, correo y clave");
    setCargando(true);
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { nombre, rol: modo } }
    });
    if (error) {
      setCargando(false);
      if (error.message.toLowerCase().includes("already") || error.message.toLowerCase().includes("exists") || error.message.toLowerCase().includes("registered")) {
        return alert("Este correo ya tiene una cuenta. Iniciá sesión con tu clave.");
      }
      return alert("Error: " + error.message);
    }
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setCargando(false);
      return alert("Este correo ya tiene una cuenta. Iniciá sesión con tu clave.");
    }
    if (!data.user) { setCargando(false); return alert("Error al crear cuenta"); }
    if (modo === "comercio") {
      await supabase.from("comercios").insert({ user_id: data.user.id, nombre, email, abierto: true });
    }
    alert("¡Cuenta creada! Ahora iniciá sesión con tu correo y tu clave.");
    setMostrarRegistro(false);
    setCargando(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)", display: "flex", justifyContent: "center", alignItems: "center", padding: 16 }}>
      <div style={{ background: "white", borderRadius: 20, padding: 26, width: "100%", maxWidth: 400, boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}>
        <LogoJandes />

        <div style={{ display: "flex", gap: 6, marginBottom: 20, background: "#f1f5f9", padding: 4, borderRadius: 12 }}>
          <button onClick={() => setModo("cliente")} style={{ flex: 1, padding: "10px 4px", borderRadius: 9, border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer", background: modo === "cliente" ? "#2563eb" : "transparent", color: modo === "cliente" ? "white" : "#333" }}>Soy Cliente</button>
          <button onClick={() => setModo("comercio")} style={{ flex: 1, padding: "10px 4px", borderRadius: 9, border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer", background: modo === "comercio" ? "#2563eb" : "transparent", color: modo === "comercio" ? "white" : "#333" }}>Soy Comercio</button>
          <button onClick={() => setModo("delivery")} style={{ flex: 1, padding: "10px 4px", borderRadius: 9, border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer", background: modo === "delivery" ? "#22c55e" : "transparent", color: modo === "delivery" ? "white" : "#333" }}>Soy Delivery 🛵</button>
        </div>

        {mostrarRegistro && <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre" style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid #ddd", marginBottom: 10, color: "black" }} />}
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Correo" type="email" style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid #ddd", marginBottom: 10, color: "black" }} />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Clave" type="password" style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid #ddd", marginBottom: 16, color: "black" }} />

        {!mostrarRegistro ? (
          <>
            <button onClick={entrar} disabled={cargando} style={{ width: "100%", padding: 13, borderRadius: 12, border: "none", background: modo === "delivery" ? "#22c55e" : "#2563eb", color: "white", fontWeight: 800, cursor: "pointer" }}>{cargando ? "Entrando..." : "Entrar"}</button>
            <button onClick={() => setMostrarRegistro(true)} style={{ width: "100%", padding: 10, marginTop: 10, border: "none", background: "none", color: "#2563eb", fontWeight: 700, cursor: "pointer" }}>Crear cuenta</button>
          </>
        ) : (
          <>
            <button onClick={registrarse} disabled={cargando} style={{ width: "100%", padding: 13, borderRadius: 12, border: "none", background: "#16a34a", color: "white", fontWeight: 800, cursor: "pointer" }}>{cargando ? "Creando..." : "Crear cuenta"}</button>
            <button onClick={() => setMostrarRegistro(false)} style={{ width: "100%", padding: 10, marginTop: 10, border: "none", background: "none", color: "#666", cursor: "pointer" }}>Ya tengo cuenta</button>
          </>
        )}
        <p style={{ textAlign: "center", fontSize: 11, color: "#999", marginTop: 14 }}>Un correo = una cuenta. La clave tiene que coincidir con ese correo.</p>
      </div>
    </div>
  );
}
