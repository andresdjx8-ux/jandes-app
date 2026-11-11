"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function Login() {
  const router = useRouter();
  const [modo, setModo] = useState<"cliente" | "comercio" | "delivery">("cliente");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarRegistro, setMostrarRegistro] = useState(false);
  const [nombre, setNombre] = useState("");
  const [cargando, setCargando] = useState(false);

  async function entrar() {
    if (!email || !password) return alert("Completá mail y contraseña");
    setCargando(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setCargando(false); return alert("Error: " + error.message); }

    const userId = data.user.id;

    if (modo === "delivery") {
      router.push("/delivery");
      return;
    }

    if (modo === "comercio") {
      const { data: comercio } = await supabase.from("comercios").select("*").eq("user_id", userId).maybeSingle();
      if (!comercio) {
        setCargando(false);
        return alert("Este usuario no tiene comercio. Registrate como comercio primero.");
      }
      router.push("/comercio");
      return;
    }

    router.push("/cliente");
  }

  async function registrarse() {
    if (!email || !password || !nombre) return alert("Completá nombre, mail y contraseña");
    setCargando(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nombre, rol: modo } }
    });
    if (error) { setCargando(false); return alert("Error: " + error.message); }

    if (modo === "comercio" && data.user) {
      await supabase.from("comercios").insert({
        user_id: data.user.id,
        nombre: nombre,
        email: email,
        abierto: true,
      });
    }

    alert("¡Cuenta creada! Ahora iniciá sesión");
    setMostrarRegistro(false);
    setCargando(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", display: "flex", justifyContent: "center", alignItems: "center", padding: 16 }}>
      <div style={{ background: "white", borderRadius: 16, padding: 24, width: "100%", maxWidth: 400 }}>
        <h1 style={{ textAlign: "center", fontSize: 28, fontWeight: 900, marginBottom: 4 }}>JANDES</h1>
        <p style={{ textAlign: "center", color: "#666", marginBottom: 20, fontSize: 13 }}>Delivery Junín de los Andes</p>

        <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
          <button onClick={() => setModo("cliente")} style={{ flex: 1, padding: "10px 4px", borderRadius: 10, border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer", background: modo === "cliente" ? "#0f172a" : "#e5e7eb", color: modo === "cliente" ? "white" : "#333" }}>
            Soy Cliente
          </button>
          <button onClick={() => setModo("comercio")} style={{ flex: 1, padding: "10px 4px", borderRadius: 10, border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer", background: modo === "comercio" ? "#0f172a" : "#e5e7eb", color: modo === "comercio" ? "white" : "#333" }}>
            Soy Comercio
          </button>
          <button onClick={() => setModo("delivery")} style={{ flex: 1, padding: "10px 4px", borderRadius: 10, border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer", background: modo === "delivery" ? "#22c55e" : "#e5e7eb", color: modo === "delivery" ? "white" : "#333" }}>
            Soy Delivery 🛵
          </button>
        </div>

        {mostrarRegistro && (
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre" style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #ddd", marginBottom: 10, color: "black" }} />
        )}
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Mail" type="email" style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #ddd", marginBottom: 10, color: "black" }} />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña" type="password" style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #ddd", marginBottom: 16, color: "black" }} />

        {!mostrarRegistro ? (
          <>
            <button onClick={entrar} disabled={cargando} style={{ width: "100%", padding: 13, borderRadius: 10, border: "none", background: modo === "delivery" ? "#22c55e" : "#2563eb", color: "white", fontWeight: 800, cursor: "pointer" }}>
              {cargando ? "Entrando..." : modo === "delivery" ? "Entrar como Delivery 🛵" : "Entrar a mi " + (modo === "comercio" ? "Comercio" : "Cuenta")}
            </button>
            <button onClick={() => setMostrarRegistro(true)} style={{ width: "100%", padding: 10, marginTop: 10, border: "none", background: "none", color: "#2563eb", fontWeight: 700, cursor: "pointer" }}>
              Crear cuenta
            </button>
          </>
        ) : (
          <>
            <button onClick={registrarse} disabled={cargando} style={{ width: "100%", padding: 13, borderRadius: 10, border: "none", background: "#16a34a", color: "white", fontWeight: 800, cursor: "pointer" }}>
              {cargando ? "Creando..." : "Crear cuenta de " + modo}
            </button>
            <button onClick={() => setMostrarRegistro(false)} style={{ width: "100%", padding: 10, marginTop: 10, border: "none", background: "none", color: "#666", cursor: "pointer" }}>
              Ya tengo cuenta
            </button>
          </>
        )}
      </div>
    </div>
  );
}