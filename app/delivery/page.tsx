"use client"
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function Delivery(){
  const [pedidos,setPedidos]=useState<any[]>([])
  const [tab,setTab]=useState<'listo'|'retirado'|'entregado'>('listo')
  const [busqueda,setBusqueda]=useState('')
  const [online,setOnline]=useState(true)
  const [fotoEntrega,setFotoEntrega]=useState<string | null>(null)

  async function cargar(){
    if(!online) return
    // SOLO los que el comercio ya aprobó. No muestra NUEVO ni PENDIENTE.
    const { data } = await supabase.from('pedidos').select('*, comercios(nombre_comercio, direccion)').eq('estado','listo').order('created_at',{ascending:false})
    const { data: ret } = await supabase.from('pedidos').select('*, comercios(nombre_comercio, direccion)').eq('estado','retirado').order('created_at',{ascending:false})
    const { data: ent } = await supabase.from('pedidos').select('*, comercios(nombre_comercio, direccion)').eq('estado','entregado').order('created_at',{ascending:false})
    const todos = [...(data||[]), ...(ret||[]), ...(ent||[])]
    setPedidos(todos)
  }

  useEffect(()=>{
    const saved = localStorage.getItem('jandes-delivery-online')
    if(saved !== null) setOnline(saved === 'true')
  },[])

  useEffect(()=>{
    cargar()
    if(!online) return
    const id = setInterval(cargar, 4000)
    return ()=>clearInterval(id)
  },[online])

  function cambiarOnline(v:boolean){
    setOnline(v)
    localStorage.setItem('jandes-delivery-online', String(v))
  }

  async function retirar(p:any){
    if(!confirm('¿Retiraste el pedido del comercio?')) return
    await supabase.from('pedidos').update({ estado: 'retirado' }).eq('id', p.id)
    cargar()
  }

  async function entregar(p:any){
    let fotoUrl = null
    if(fotoEntrega){
      const nombre = `entrega-${p.id}-${Date.now()}.jpg`
      const res = await fetch(fotoEntrega)
      const blob = await res.blob()
      const { error } = await supabase.storage.from('pedidos').upload(nombre, blob)
      if(!error){
        const { data } = supabase.storage.from('pedidos').getPublicUrl(nombre)
        fotoUrl = data.publicUrl
      }
    }
    await supabase.from('pedidos').update({ estado: 'entregado', entrega_foto_url: fotoUrl }).eq('id', p.id)
    setFotoEntrega(null)
    cargar()
  }

  function subirFotoEntrega(e:any){
    const file = e.target.files[0]
    if(!file) return
    setFotoEntrega(URL.createObjectURL(file))
  }

  const porTab = pedidos.filter(p=> p.estado===tab)
  const filtrados = porTab.filter(p=>{
    const txt = `${p.nombre_cliente||''} ${p.direccion_entrega||''} ${p.comercios?.nombre_comercio||''}`.toLowerCase()
    return txt.includes(busqueda.toLowerCase())
  })

  return(
    <div style={{minHeight:'100vh', background:'#0A1931', color:'white', fontFamily:'system-ui', paddingBottom:'40px'}}>
      <div style={{padding:'14px 16px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div style={{fontWeight:900, fontStyle:'italic'}}>▲ JANDES <span style={{fontStyle:'normal', fontWeight:400, fontSize:'12px'}}>DELIVERY</span></div>
        <button onClick={()=>cambiarOnline(!online)} style={{padding:'8px 14px', borderRadius:'20px', border:'none', fontWeight:900, background: online?'#22c55e':'#ef4444', color:'white', fontSize:'12px'}}>{online?'● ONLINE':'○ FUERA DE LÍNEA'}</button>
      </div>

      {!online && (
        <div style={{margin:'0 14px', background:'#1e293b', borderRadius:'12px', padding:'16px', textAlign:'center'}}>
          <div style={{fontSize:'22px'}}>😴 Estás FUERA DE LÍNEA</div>
          <div style={{fontSize:'13px', color:'#94a3b8', marginTop:'4px'}}>No te van a llegar pedidos hasta que vuelvas.</div>
          <button onClick={()=>cambiarOnline(true)} style={{marginTop:'10px', padding:'10px 16px', background:'#22c55e', color:'white', border:'none', borderRadius:'10px', fontWeight:900}}>VOLVER A ONLINE</button>
        </div>
      )}

      <div style={{padding:'0 14px'}}>
        <input value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="Buscar dirección o cliente..." style={{width:'100%', padding:'12px', borderRadius:'12px', border:'none', background:'#1e293b', color:'white', marginTop:'10px'}}/>
      </div>

      <div style={{display:'flex', gap:'6px', padding:'14px'}}>
        {(['listo','retirado','entregado'] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{flex:1, padding:'11px', borderRadius:'10px', border:'none', fontWeight:900, fontSize:'11px', textTransform:'uppercase', background: tab===t?'white':'#1e293b', color: tab===t?'#0A1931':'#94a3b8'}}>{t==='listo' ? `Listo (${pedidos.filter(p=>p.estado==='listo').length})` : `${t} (${pedidos.filter(p=>p.estado===t).length})`}</button>
        ))}
      </div>

      <div style={{padding:'0 14px', maxWidth:'440px', margin:'0 auto'}}>
        {filtrados.length===0 && <p style={{textAlign:'center', color:'#94a3b8', marginTop:'20px'}}>{online ? 'No hay pedidos listos. Cuando un kiosco apruebe, te aparece acá.' : 'Estás fuera de línea.'}</p>}
        {filtrados.map((p:any)=>(
          <div key={p.id} style={{background:'white', color:'#0A1931', borderRadius:'14px', padding:'14px', marginBottom:'10px'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <span style={{fontWeight:900}}>Pedido #{String(p.id).substring(0,4)} - ${p.total}</span>
              <a href={`https://wa.me/${p.whatsapp_cliente||''}`} target="_blank" rel="noreferrer" style={{background:'#22c55e', color:'white', padding:'6px 10px', borderRadius:'8px', fontWeight:900, fontSize:'12px', textDecoration:'none'}}>WA</a>
            </div>
            <div style={{fontSize:'12px', color:'#64748b', marginTop:'2px'}}>{new Date(p.created_at).toLocaleString()}</div>
            <div style={{marginTop:'10px', fontSize:'13px'}}>
              <div>🏪 <b>RETIRAR EN:</b></div>
              <div style={{fontWeight:800}}>{p.comercios?.nombre_comercio} - {p.comercios?.direccion}</div>
              <div style={{marginTop:'8px'}}>📍 <b>ENTREGAR EN:</b></div>
              <div style={{fontWeight:800, color:'#0A3CC1'}}>{p.direccion_entrega}</div>
              <div style={{marginTop:'4px'}}>👤 {p.nombre_cliente} - {p.whatsapp_cliente}</div>
            </div>
            {p.comprobante_url && <a href={p.comprobante_url} target="_blank" rel="noreferrer" style={{fontSize:'12px', color:'#0A3CC1', fontWeight:700}}>Ver comprobante de pago →</a>}
            {p.estado==='listo' && (
              <button onClick={()=>retirar(p)} style={{width:'100%', marginTop:'10px', padding:'12px', background:'#0A3CC1', color:'white', border:'none', borderRadius:'10px', fontWeight:900}}>🛵 RETIRÉ DEL COMERCIO → PASAR A RETIRADO</button>
            )}
            {p.estado==='retirado' && (
              <>
                <div style={{marginTop:'10px'}}>
                  <label style={{fontSize:'12px', fontWeight:800}}>📸 Foto de entrega (opcional)</label>
                  <input type="file" accept="image/*" onChange={subirFotoEntrega} style={{width:'100%', marginTop:'4px'}} />
                  {fotoEntrega && <img src={fotoEntrega} alt="Entrega" style={{width:'100%', borderRadius:'8px', marginTop:'6px'}} />}
                </div>
                <button onClick={()=>entregar(p)} style={{width:'100%', marginTop:'10px', padding:'12px', background:'#22c55e', color:'white', border:'none', borderRadius:'10px', fontWeight:900}}>✅ ENTREGADO</button>
              </>
            )}
            {p.estado==='entregado' && <div style={{marginTop:'8px', fontSize:'12px', color:'#15803d', fontWeight:800}}>Entregado ✓</div>}
          </div>
        ))}
      </div>
    </div>
  )
}