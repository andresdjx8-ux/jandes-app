"use client"
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function Admin(){
  const [tab,setTab]=useState<'pedidos'|'comercios'|'caja'|'promos'>('pedidos')
  const [pedidos,setPedidos]=useState<any[]>([])
  const [comercios,setComercios]=useState<any[]>([])
  const [filtro,setFiltro]=useState('todos')
  const [busqueda,setBusqueda]=useState('')
  // PROMOS
  const [promos,setPromos]=useState<any[]>([])
  const [titulo,setTitulo]=useState('')
  const [precioPromo,setPrecioPromo]=useState('')
  const [fotoPromo,setFotoPromo]=useState('')
  const [comercioPromo,setComercioPromo]=useState('')

  async function cargar(){
    const { data: p } = await supabase.from('pedidos').select('*, comercios(nombre_comercio)').order('created_at',{ascending:false}).limit(100)
    if(p) setPedidos(p)
    const { data: c } = await supabase.from('comercios').select('*').order('nombre_comercio')
    if(c) setComercios(c)
    const { data: pr } = await supabase.from('promos').select('*, comercios(nombre_comercio)').order('created_at',{ascending:false})
    if(pr) setPromos(pr)
  }

  useEffect(()=>{
    cargar()
    const id = setInterval(cargar, 5000)
    return ()=>clearInterval(id)
  },[])

  async function cambiarEstadoPedido(id:any, estado:string){
    await supabase.from('pedidos').update({ estado }).eq('id', id)
    cargar()
  }

  async function cambiarAbierto(id:any, abierto:boolean){
    await supabase.from('comercios').update({ abierto: !abierto }).eq('id', id)
    cargar()
  }

  async function crearPromo(e:React.FormEvent){
    e.preventDefault()
    if(!titulo.trim()) return alert('Poné el título de la promo')
    const precio = Number(precioPromo)
    if(!precio || precio<=0) return alert('Poné un precio válido')
    const { error } = await supabase.from('promos').insert({ titulo: titulo.trim(), precio, foto_url: fotoPromo || null, comercio_id: comercioPromo || null, activo: true })
    if(error) return alert('Error: '+error.message)
    setTitulo(''); setPrecioPromo(''); setFotoPromo(''); setComercioPromo('')
    cargar()
    alert('¡Promo creada!')
  }

  async function togglePromo(id:any, activo:boolean){
    await supabase.from('promos').update({ activo: !activo }).eq('id', id)
    cargar()
  }

  async function borrarPromo(id:any){
    if(!confirm('¿Borrar esta promo?')) return
    await supabase.from('promos').delete().eq('id', id)
    cargar()
  }

  const hoy = new Date().toISOString().slice(0,10)
  const pedidosHoy = pedidos.filter(p=> (p.created_at||'').slice(0,10)===hoy)
  const vendidoHoy = pedidosHoy.filter(p=> p.estado==='entregado').reduce((a,b)=> a + (Number(b.total)||0), 0)
  const pendientes = pedidos.filter(p=> ['nuevo','pendiente','listo'].includes(p.estado)).length
  const entregados = pedidos.filter(p=> p.estado==='entregado').length
  const abiertos = comercios.filter(c=> c.abierto).length
  const comision = vendidoHoy * 0.10

  const pedidosFiltrados = pedidos.filter(p=>{
    const pasaFiltro = filtro==='todos' || p.estado===filtro
    const txt = `${p.nombre_cliente||''} ${p.direccion_entrega||''} ${p.comercios?.nombre_comercio||''}`.toLowerCase()
    return pasaFiltro && txt.includes(busqueda.toLowerCase())
  })

  return(
    <div style={{minHeight:'100vh', background:'#f1f5f9', fontFamily:'system-ui', paddingBottom:'40px'}}>
      <div style={{background:'#0A1931', padding:'14px 16px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div style={{color:'white', fontWeight:900, fontStyle:'italic'}}>▲ JANDES <span style={{fontStyle:'normal', fontWeight:400, fontSize:'12px'}}>ADMIN</span></div>
        <span style={{background:'#22c55e', color:'white', padding:'6px 12px', borderRadius:'20px', fontWeight:900, fontSize:'12px'}}>{abiertos} ABIERTOS</span>
      </div>

      <div style={{padding:'14px', maxWidth:'520px', margin:'0 auto'}}>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'8px'}}>
          <div style={{background:'white', borderRadius:'12px', padding:'12px', textAlign:'center', border:'1px solid #e2e8f0'}}><div style={{fontWeight:900, fontSize:'18px', color:'#0A1931'}}>{pedidosHoy.length}</div><div style={{fontSize:'10px', color:'#64748b', fontWeight:700}}>PEDIDOS HOY</div></div>
          <div style={{background:'white', borderRadius:'12px', padding:'12px', textAlign:'center', border:'1px solid #e2e8f0'}}><div style={{fontWeight:900, fontSize:'18px', color:'#15803d'}}>${vendidoHoy}</div><div style={{fontSize:'10px', color:'#64748b', fontWeight:700}}>VENDIDO HOY</div></div>
          <div style={{background:'white', borderRadius:'12px', padding:'12px', textAlign:'center', border:'1px solid #e2e8f0'}}><div style={{fontWeight:900, fontSize:'18px', color:'#b45309'}}>{pendientes}</div><div style={{fontSize:'10px', color:'#64748b', fontWeight:700}}>PENDIENTES</div></div>
          <div style={{background:'white', borderRadius:'12px', padding:'12px', textAlign:'center', border:'1px solid #e2e8f0'}}><div style={{fontWeight:900, fontSize:'18px', color:'#0A3CC1'}}>{entregados}</div><div style={{fontSize:'10px', color:'#64748b', fontWeight:700}}>ENTREGADOS</div></div>
        </div>

        <div style={{display:'flex', gap:'6px', background:'white', padding:'6px', borderRadius:'12px', marginTop:'12px', border:'1px solid #e2e8f0'}}>
          {(['pedidos','comercios','caja','promos'] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{flex:1, padding:'10px 4px', borderRadius:'8px', border:'none', fontWeight:900, fontSize:'11px', textTransform:'uppercase', background: tab===t?'#0A1931':'transparent', color: tab===t?'white':'#64748b'}}>{t}</button>
          ))}
        </div>

        {tab==='pedidos' && (
          <>
            <input value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="Buscar pedido, cliente o comercio..." style={{width:'100%', padding:'12px', borderRadius:'12px', border:'1.5px solid #cbd5e1', background:'white', color:'#0A1931', marginTop:'12px'}}/>
            <div style={{display:'flex', gap:'6px', marginTop:'10px', flexWrap:'wrap'}}>
              {['todos','nuevo','pendiente','listo','retirado','entregado'].map(f=>(
                <button key={f} onClick={()=>setFiltro(f)} style={{padding:'7px 12px', borderRadius:'20px', border:'none', fontWeight:800, fontSize:'11px', textTransform:'uppercase', background: filtro===f?'#0A3CC1':'white', color: filtro===f?'white':'#64748b', borderBottom:'1px solid #e2e8f0'}}>{f}</button>
              ))}
            </div>
            {pedidosFiltrados.map((p:any)=>(
              <div key={p.id} style={{background:'white', borderRadius:'14px', padding:'14px', border:'1px solid #e2e8f0', marginTop:'10px'}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <span style={{fontWeight:900, color:'#0A1931'}}>Pedido #{String(p.id).substring(0,4)} - ${p.total}</span>
                  <span style={{fontSize:'11px', fontWeight:900, padding:'4px 8px', borderRadius:'20px', background: p.estado==='entregado'?'#dcfce7': p.estado==='listo'?'#dbeafe':'#fef3c7', color: p.estado==='entregado'?'#15803d': p.estado==='listo'?'#1d4ed8':'#92400e'}}>{(p.estado||'').toUpperCase()}</span>
                </div>
                <div style={{fontSize:'13px', color:'#334155', marginTop:'6px'}}>
                  <div>🏪 {p.comercios?.nombre_comercio}</div>
                  <div>👤 {p.nombre_cliente} - {p.whatsapp_cliente}</div>
                  <div>📍 {p.direccion_entrega}</div>
                  <div style={{fontSize:'11px', color:'#64748b'}}>{new Date(p.created_at).toLocaleString()}</div>
                </div>
                {p.comprobante_url && <a href={p.comprobante_url} target="_blank" rel="noreferrer" style={{fontSize:'12px', color:'#0A3CC1', fontWeight:700}}>Ver comprobante →</a>}
                <div style={{display:'flex', gap:'6px', marginTop:'10px'}}>
                  <button onClick={()=>cambiarEstadoPedido(p.id,'retirado')} style={{flex:1, padding:'9px', background:'#f59e0b', color:'white', border:'none', borderRadius:'8px', fontWeight:900, fontSize:'12px'}}>← Retirado</button>
                  <button onClick={()=>cambiarEstadoPedido(p.id,'entregado')} style={{flex:1, padding:'9px', background:'#22c55e', color:'white', border:'none', borderRadius:'8px', fontWeight:900, fontSize:'12px'}}>✓ Entregado</button>
                  <button onClick={()=>cambiarEstadoPedido(p.id,'listo')} style={{flex:1, padding:'9px', background:'#0A3CC1', color:'white', border:'none', borderRadius:'8px', fontWeight:900, fontSize:'12px'}}>Listo</button>
                </div>
              </div>
            ))}
          </>
        )}

        {tab==='comercios' && (
          <>
            {comercios.map((c:any)=>(
              <div key={c.id} style={{background:'white', borderRadius:'14px', padding:'14px', border:'1px solid #e2e8f0', marginTop:'10px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div>
                  <div style={{fontWeight:900, color:'#0A1931'}}>{c.nombre_comercio}</div>
                  <div style={{fontSize:'12px', color:'#64748b'}}>📍 {c.direccion} • 📱 {c.whatsapp}</div>
                  <div style={{fontSize:'11px', color:'#64748b'}}>Alias: {c.alias_mp || '-'}</div>
                </div>
                <button onClick={()=>cambiarAbierto(c.id, c.abierto)} style={{padding:'8px 12px', borderRadius:'20px', border:'none', fontWeight:900, fontSize:'11px', background: c.abierto?'#22c55e':'#ef4444', color:'white'}}>{c.abierto?'● ABIERTO':'● CERRADO'}</button>
              </div>
            ))}
          </>
        )}

        {tab==='caja' && (
          <div style={{background:'white', borderRadius:'14px', padding:'16px', border:'1px solid #e2e8f0', marginTop:'10px'}}>
            <div style={{fontWeight:900, color:'#0A1931', fontSize:'16px'}}>💰 Caja de hoy</div>
            <div style={{display:'flex', justifyContent:'space-between', marginTop:'12px', fontSize:'14px'}}><span>Vendido hoy (entregados)</span><b>${vendidoHoy}</b></div>
            <div style={{display:'flex', justifyContent:'space-between', marginTop:'6px', fontSize:'14px'}}><span>Tu comisión (10%)</span><b style={{color:'#15803d'}}>${comision.toFixed(0)}</b></div>
            <div style={{display:'flex', justifyContent:'space-between', marginTop:'6px', fontSize:'14px'}}><span>Para comercios</span><b>${(vendidoHoy - comision).toFixed(0)}</b></div>
            <div style={{fontSize:'12px', color:'#64748b', marginTop:'10px'}}>Solo cuenta pedidos en estado ENTREGADO.</div>
          </div>
        )}

        {tab==='promos' && (
          <>
            <form onSubmit={crearPromo} style={{background:'white', borderRadius:'14px', padding:'14px', border:'1px solid #e2e8f0', marginTop:'10px'}}>
              <div style={{fontWeight:900, color:'#0A1931'}}>🔥 Crear promo (solo vos)</div>
              <div style={{fontSize:'12px', color:'#64748b', marginTop:'2px'}}>Esta promo aparece en INICIO del cliente. Los comercios NO pueden crear promos.</div>
              <input value={titulo} onChange={e=>setTitulo(e.target.value)} placeholder="Título: Ej: 2x1 en empanadas" style={{width:'100%', padding:'11px', borderRadius:'10px', border:'1.5px solid #cbd5e1', marginTop:'10px', color:'#0A1931', background:'#f8fafc'}}/>
              <input value={precioPromo} onChange={e=>setPrecioPromo(e.target.value)} type="number" placeholder="Precio: Ej: 5000" style={{width:'100%', padding:'11px', borderRadius:'10px', border:'1.5px solid #cbd5e1', marginTop:'8px', color:'#0A1931', background:'#f8fafc'}}/>
              <input value={fotoPromo} onChange={e=>setFotoPromo(e.target.value)} placeholder="Link foto (opcional, pegá URL de imagen)" style={{width:'100%', padding:'11px', borderRadius:'10px', border:'1.5px solid #cbd5e1', marginTop:'8px', color:'#0A1931', background:'#f8fafc'}}/>
              <select value={comercioPromo} onChange={e=>setComercioPromo(e.target.value)} style={{width:'100%', padding:'11px', borderRadius:'10px', border:'1.5px solid #cbd5e1', marginTop:'8px', color:'#0A1931', background:'#f8fafc'}}>
                <option value="">Sin comercio (promo general de JANDES)</option>
                {comercios.map((c:any)=>(<option key={c.id} value={c.id}>{c.nombre_comercio}</option>))}
              </select>
              <button type="submit" style={{width:'100%', marginTop:'10px', padding:'12px', background:'#0A3CC1', color:'white', border:'none', borderRadius:'10px', fontWeight:900}}>+ PUBLICAR PROMO</button>
            </form>

            <div style={{fontWeight:900, marginTop:'14px', color:'#0A1931'}}>Promos publicadas ({promos.length})</div>
            {promos.length===0 && <div style={{background:'white', padding:'16px', borderRadius:'12px', textAlign:'center', color:'#64748b', marginTop:'8px', fontSize:'13px'}}>Todavía no hay promos. Creá la primera arriba.</div>}
            {promos.map((pr:any)=>(
              <div key={pr.id} style={{background:'white', borderRadius:'14px', padding:'12px', border:'1px solid #e2e8f0', marginTop:'8px', display:'flex', gap:'10px', alignItems:'center', opacity: pr.activo?1:0.55}}>
                <div style={{width:'56px', height:'56px', borderRadius:'10px', background:'#f1f5f9', overflow:'hidden', display:'grid', placeItems:'center', fontSize:'22px'}}>{pr.foto_url ? <img src={pr.foto_url} alt="" style={{width:'100%', height:'100%', objectFit:'cover'}}/> : '🔥'}</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:900, color:'#0A1931', fontSize:'14px'}}>{pr.titulo}</div>
                  <div style={{fontWeight:900, color:'#0A3CC1'}}>${pr.precio} • {pr.comercios?.nombre_comercio || 'JANDES'}</div>
                  <div style={{fontSize:'11px', color: pr.activo?'#15803d':'#b91c1c', fontWeight:800}}>{pr.activo?'● ACTIVA - Se ve en la app':'○ PAUSADA - No se ve'}</div>
                </div>
                <div style={{display:'flex', flexDirection:'column', gap:'6px'}}>
                  <button onClick={()=>togglePromo(pr.id, pr.activo)} style={{padding:'7px 10px', borderRadius:'8px', border:'none', fontWeight:800, fontSize:'11px', background: pr.activo?'#fef3c7':'#dcfce7', color: pr.activo?'#92400e':'#15803d'}}>{pr.activo?'Pausar':'Activar'}</button>
                  <button onClick={()=>borrarPromo(pr.id)} style={{padding:'7px 10px', borderRadius:'8px', border:'none', fontWeight:800, fontSize:'11px', background:'#fee2e2', color:'#b91c1c'}}>Borrar</button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
