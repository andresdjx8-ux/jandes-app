"use client"
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function Login(){
  const [modo,setModo]=useState<'entrar'|'crear'>('entrar')
  const [rol,setRol]=useState<'cliente'|'comercio'>('comercio')
  const [nombre,setNombre]=useState('andres')
  const [direccion,setDireccion]=useState('')
  const [whatsapp,setWhatsapp]=useState('')
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [cargando,setCargando]=useState(false)

  async function entrar(){
    if(!email || !password){ alert('Poné mail y contraseña'); return }
    setCargando(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    setCargando(false)
    if(error) return alert('Error al entrar: '+error.message)
    // Si es comercio, lo llevo a SU perfil de comercio con sus datos guardados
    // Si es cliente, lo llevo al inicio
    if(rol==='comercio'){
      window.location.href='/comercio'
    } else {
      window.location.href='/'
    }
  }

  async function crear(){
    if(!email || !password || !nombre){ alert('Completá nombre, mail y contraseña'); return }
    setCargando(true)
    const { data, error } = await supabase.auth.signUp({ email, password })
    if(error){ setCargando(false); return alert('Error al crear: '+error.message) }
    // Si es comercio, crearle SU fila en comercios con SU id de usuario
    // Así cuando entra, ya tiene su perfil creado y no da error de FK
    if(rol==='comercio' && data.user){
const { error: e2 } = await supabase.from('comercios').upsert({        id: data.user.id,
        nombre_comercio: nombre,
        direccion: direccion,
        whatsapp: whatsapp,
        alias_mp: '',
        abierto: false,
      })
      if(e2) alert('Cuenta creada, pero no se pudo crear el perfil del comercio: '+e2.message)
    }
    setCargando(false)
    alert('¡Cuenta creada! Ahora entrá con tu mail y contraseña.')
    setModo('entrar')
  }

  return(
    <div style={{minHeight:'100vh', background:'#0A1931', display:'grid', placeItems:'center', padding:'16px', fontFamily:'system-ui'}}>
      <div style={{width:'100%', maxWidth:'380px', background:'white', borderRadius:'20px', padding:'22px'}}>
        <div style={{textAlign:'center', fontWeight:900, fontSize:'22px', fontStyle:'italic'}}>▲ JANDES</div>
        <div style={{textAlign:'center', fontSize:'12px', color:'#64748b', marginTop:'4px'}}>Junín de los Andes</div>

        {/* SOY CLIENTE / SOY COMERCIO */}
        <div style={{display:'flex', gap:'6px', marginTop:'16px', background:'#f1f5f9', padding:'5px', borderRadius:'12px'}}>
          <button onClick={()=>setRol('cliente')} style={{flex:1, padding:'10px', borderRadius:'9px', border:'none', fontWeight:900, fontSize:'13px', background: rol==='cliente'?'#0A1931':'transparent', color: rol==='cliente'?'white':'#64748b'}}>Soy Cliente</button>
          <button onClick={()=>setRol('comercio')} style={{flex:1, padding:'10px', borderRadius:'9px', border:'none', fontWeight:900, fontSize:'13px', background: rol==='comercio'?'#0A1931':'transparent', color: rol==='comercio'?'white':'#64748b'}}>Soy Comercio</button>
        </div>

        {/* ENTRAR / CREAR */}
        <div style={{display:'flex', gap:'6px', marginTop:'10px'}}>
          <button onClick={()=>setModo('entrar')} style={{flex:1, padding:'10px', borderRadius:'10px', border:'1px solid #e2e8f0', fontWeight:900, fontSize:'13px', background: modo==='entrar'?'#0A3CC1':'white', color: modo==='entrar'?'white':'#0A1931'}}>Ya tengo cuenta - Entrar</button>
          <button onClick={()=>setModo('crear')} style={{flex:1, padding:'10px', borderRadius:'10px', border:'1px solid #e2e8f0', fontWeight:900, fontSize:'13px', background: modo==='crear'?'#0A3CC1':'white', color: modo==='crear'?'white':'#0A1931'}}>Crear cuenta</button>
        </div>

        {modo==='crear' && (
          <>
            <input value={nombre} onChange={e=>setNombre(e.target.value)} placeholder={rol==='comercio' ? 'Nombre del comercio (ej: Kiosco Andres)' : 'Tu nombre'} style={inp}/>
            {rol==='comercio' && <>
              <input value={direccion} onChange={e=>setDireccion(e.target.value)} placeholder="Dirección del comercio" style={inp}/>
              <input value={whatsapp} onChange={e=>setWhatsapp(e.target.value)} placeholder="WhatsApp" style={inp}/>
            </>}
          </>
        )}

        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Mail (ej: andresdjx8@gmail.com)" style={inp}/>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Contraseña" style={inp}/>

        <button onClick={modo==='entrar' ? entrar : crear} disabled={cargando} style={{width:'100%', marginTop:'16px', padding:'14px', background:'#0A3CC1', color:'white', border:'none', borderRadius:'12px', fontWeight:900, fontSize:'15px'}}>
          {cargando ? 'Cargando...' : modo==='entrar' ? (rol==='comercio' ? 'Entrar a mi Comercio' : 'Entrar') : 'Crear cuenta'}
        </button>

        {modo==='entrar' && <p style={{fontSize:'12px', color:'#64748b', textAlign:'center', marginTop:'10px'}}>Si ya te registraste, usá ENTRAR, no CREAR. Si apretás Crear con el mismo mail te dice "User already registered".</p>}
        {modo==='crear' && rol==='comercio' && <p style={{fontSize:'12px', color:'#64748b', textAlign:'center', marginTop:'10px'}}>Al crear, ya te dejamos tu perfil de comercio creado con tu nombre, para que cuando entres vayas directo a tu perfil.</p>}
      </div>
    </div>
  )
}
const inp={width:'100%', padding:'12px', borderRadius:'10px', border:'1.5px solid #cbd5e1', marginTop:'10px', background:'white', color:'#0A1931'} as any

