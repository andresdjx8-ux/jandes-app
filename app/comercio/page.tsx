"use client"
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

// ============ CHAT POR PEDIDO ============
function ChatPedido({ pedidoId, soy, estadoPedido }: { pedidoId: string, soy: 'comercio' | 'cliente', estadoPedido: string }) {
  const [msgs, setMsgs] = useState<any[]>([])
  const [texto, setTexto] = useState('')
  const chatAbierto = estadoPedido !== 'entregado'
  async function cargar() {
    const { data } = await supabase.from('mensajes_pedido').select('*').eq('pedido_id', pedidoId).order('created_at')
    if (data) setMsgs(data)
  }
  useEffect(() => {
    cargar()
    if (!chatAbierto) return
    const id = setInterval(cargar, 3000)
    return () => clearInterval(id)
  }, [pedidoId, chatAbierto])
  async function enviar() {
    if (!chatAbierto) return
    if (!texto.trim()) return
    await supabase.from('mensajes_pedido').insert({ pedido_id: pedidoId, remitente: soy, mensaje: texto })
    setTexto('')
    cargar()
  }
  return (
    <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '10px', border: '1px solid #e2e8f0', marginTop: '10px' }}>
      <div style={{ fontWeight: 900, fontSize: '12px', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
        <span>💬 Chat del pedido</span>
        {!chatAbierto ? <span style={{ color: '#64748b' }}>🔒 Cerrado - Entregado</span> : <span style={{ color: '#22c55e' }}>● Activo</span>}
      </div>
{msgs.length === 0 && chatAbierto && <div style={{ fontSize: '12px', color: '#64748b' }}>Sin mensajes todavía.</div>}      {msgs.length === 0 && !chatAbierto && <div style={{ fontSize: '12px', color: '#64748b' }}>Este chat ya se cerró porque el pedido se entregó.</div>}
      {msgs.map((m: any) => (
        <div key={m.id} style={{ textAlign: m.remitente === soy ? 'right' : 'left', margin: '4px 0' }}>
          <span style={{ display: 'inline-block', padding: '7px 10px', borderRadius: '12px', fontSize: '13px', background: m.remitente === soy ? '#0A3CC1' : 'white', color: m.remitente === soy ? 'white' : '#0A1931', border: '1px solid #e2e8f0' }}>{m.mensaje}</span>
        </div>
      ))}
      {chatAbierto ? (
        <>
          <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
            <input value={texto} onChange={e => setTexto(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') enviar() }} placeholder="Escribí acá..." style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', color: '#0A1931', background: 'white' }} />
            <button onClick={enviar} style={{ padding: '10px 14px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 900 }}>Enviar</button>
          </div>
          {soy === 'comercio' && (
            <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
<button onClick={() => setTexto('No me quedó eso, ¿te lo cambio por otra cosa?')} style={{ padding: '6px 10px', borderRadius: '20px', border: '1px solid #cbd5e1', background: 'white', fontSize: '11px', fontWeight: 700, color: '#0A1931' }}>No me quedó 😬</button>
<button onClick={() => setTexto('Ya está saliendo tu pedido 🛵')} style={{ padding: '6px 10px', borderRadius: '20px', border: '1px solid #cbd5e1', background: 'white', fontSize: '11px', fontWeight: 700, color: '#0A1931' }}>Ya sale 🛵</button>
            </div>
          )}
        </>
      ) : (
        <div style={{ marginTop: '8px', padding: '8px', background: '#e2e8f0', borderRadius: '8px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#475569' }}>🔒 Chat cerrado - El pedido ya se entregó</div>
      )}
    </div>
  )
}

export default function Comercio(){
  const [userId,setUserId]=useState<any>(null)
  const [tab,setTab]=useState<'perfil'|'productos'|'pedidos'>('pedidos')
  const [subTab,setSubTab]=useState<'stock'|'agregar'>('stock')
  const [pedidoTab,setPedidoTab]=useState<'pendiente'|'retirado'|'entregado'>('pendiente')
  const [datos,setDatos]=useState<any>({nombre_comercio:'', direccion:'', whatsapp:'', alias_mp:'', horario:'', abierto:false, foto_url:''})
  const [busqueda,setBusqueda]=useState('')
  const [catalogo,setCatalogo]=useState<any[]>([])
  const [misProductos,setMisProductos]=useState<any[]>([])
  const [pedidos,setPedidos]=useState<any[]>([])
  const [precioTemp,setPrecioTemp]=useState<{[key:string]:string}>({})
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoPrecio, setNuevoPrecio] = useState('')
  const [nuevaFotoUrl, setNuevaFotoUrl] = useState('')
  const [subiendoFotoProducto, setSubiendoFotoProducto] = useState(false)

  async function cargarPedidos(uid:string){
    const { data } = await supabase.from('pedidos').select('*').eq('comercio_id', String(uid)).order('created_at',{ascending:false})
    if(data) setPedidos(data)
  }

  useEffect(()=>{
    let interval: any
    ;(async()=>{
      const { data: { user } } = await supabase.auth.getUser()
      if(!user){ window.location.href='/login'; return }
      setUserId(user.id)
      const { data: com } = await supabase.from('comercios').select('*').eq('id', user.id).single()
      if(com) setDatos(com)
      const { data: cat } = await supabase.from('catalogo_maestro').select('*').limit(500)
      if(cat) setCatalogo(cat)
      const { data: mis } = await supabase.from('comercio_productos').select('*').eq('comercio_id', String(user.id))
      if(mis) setMisProductos(mis)
      await cargarPedidos(user.id)
      interval = setInterval(()=>cargarPedidos(user.id), 4000)
    })()
    return ()=>{ if(interval) clearInterval(interval) }
  },[])

  async function guardarPerfil(){
    const { error } = await supabase.from('comercios').upsert({ id: userId, ...datos }, { onConflict: 'id' })
    if(error) return alert('Error: '+error.message)
    alert('¡Perfil Guardado!')
  }

  async function subirFoto(e:any){
    const file=e.target.files[0]; if(!file) return
    const nombre=`${userId}-${Date.now()}.jpg`
    const { error } = await supabase.storage.from('comercio-fotos').upload(nombre,file)
    if(error) return alert(error.message)
    const { data } = supabase.storage.from('comercio-fotos').getPublicUrl(nombre)
    setDatos({...datos, foto_url: data.publicUrl})
  }

  async function subirFotoProducto(e:any){
    const file=e.target.files[0]; if(!file) return
    setSubiendoFotoProducto(true)
    const nombre=`prod-${userId}-${Date.now()}.jpg`
    const { error } = await supabase.storage.from('comercio-fotos').upload(nombre,file)
    if(error){ alert(error.message); setSubiendoFotoProducto(false); return }
    const { data } = supabase.storage.from('comercio-fotos').getPublicUrl(nombre)
    if(data) setNuevaFotoUrl(data.publicUrl)
    setSubiendoFotoProducto(false)
  }

  async function crearProductoPersonalizado(e: React.FormEvent){
    e.preventDefault()
    const precio = Number(nuevoPrecio)
    if(!nuevoNombre){ alert('Poné el nombre del producto'); return }
    if(!precio || precio <= 0){ alert('Poné un precio válido che'); return }
    const { error } = await supabase.from('comercio_productos').insert({
      comercio_id: String(userId), catalogo_id: null, nombre: nuevoNombre, precio, stock: true, foto_url: nuevaFotoUrl || null
    })
    if(error) return alert(error.message)
    setNuevoNombre(''); setNuevoPrecio(''); setNuevaFotoUrl('')
    const { data: mis } = await supabase.from('comercio_productos').select('*').eq('comercio_id', String(userId))
    if(mis) setMisProductos(mis)
    setSubTab('stock')
    alert('¡Producto agregado!')
  }

  async function agregarProducto(prod:any){
    const precio=Number(precioTemp[prod.id]||0); if(precio<=0){ alert('Poné precio che'); return }
    const { error } = await supabase.from('comercio_productos').insert({ comercio_id: String(userId), catalogo_id: String(prod.id), nombre: prod.nombre, precio, stock:true })
    if(error) return alert(error.message)
    const { data: mis } = await supabase.from('comercio_productos').select('*').eq('comercio_id', String(userId))
    if(mis){ setMisProductos(mis); setSubTab('stock') }
    setPrecioTemp({...precioTemp, [prod.id]:''})
  }

  async function cambiarStock(id: any, estadoActual: boolean) {
    const nuevoEstado = !estadoActual
    await supabase.from('comercio_productos').update({ stock: nuevoEstado }).eq('id', id)
    setMisProductos(misProductos.map(m => m.id === id ? { ...m, stock: nuevoEstado } : m))
  }

  async function cambiarPrecioStock(id: any, nuevoPrecio: string) {
    const precioNum = Number(nuevoPrecio)
    if (isNaN(precioNum)) return
    setMisProductos(misProductos.map(m => m.id === id ? { ...m, precio: precioNum } : m))
  }
  async function guardarPrecioStock(id:any, precio:number){
    await supabase.from('comercio_productos').update({ precio }).eq('id', id)
  }

  async function borrar(id:any){
    if(!confirm('¿Borrar este producto?')) return
    await supabase.from('comercio_productos').delete().eq('id', id)
    setMisProductos(misProductos.filter(m=>m.id!==id))
  }

  async function actualizarEstadoPedido(id: any, nuevoEstado: string) {
    await supabase.from('pedidos').update({ estado: nuevoEstado }).eq('id', id)
    setPedidos(pedidos.map(x => x.id === id ? { ...x, estado: nuevoEstado } : x))
  }

  const idsEnStock=new Set(misProductos.filter(m=>m.catalogo_id).map(m=>String(m.catalogo_id)))
  const filtrados=catalogo.filter(c=>!idsEnStock.has(String(c.id)) && (c.nombre||'').toLowerCase().includes(busqueda.toLowerCase()))
  const stockFiltrado=misProductos.filter(m=> (m.nombre||'').toLowerCase().includes(busqueda.toLowerCase()))
  const pedidosPendiente = pedidos.filter(p=> p.estado==='nuevo' || p.estado==='pendiente' || p.estado==='listo')
  const pedidosRetirado = pedidos.filter(p=> p.estado==='retirado')
  const pedidosEntregado = pedidos.filter(p=> p.estado==='entregado')
  const listaPedidos = pedidoTab==='pendiente'? pedidosPendiente : pedidoTab==='retirado'? pedidosRetirado : pedidosEntregado
  const l = { display: 'block', fontWeight: 700, fontSize: '13px', color: '#1e293b', marginTop: '10px' } as const
  const i = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', background: '#f8fafc', color: '#0A1931' } as const

  return(
    <div style={{minHeight:'100vh', background:'#f1f5f9', fontFamily:'system-ui', paddingBottom: '40px'}}>
      <div style={{background:'#0A1931', padding:'14px 16px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div style={{color:'white', fontWeight:900, fontStyle:'italic'}}>▲ JANDES</div>
        <button onClick={async()=>{ const n=!datos.abierto; setDatos({...datos, abierto:n}); await supabase.from('comercios').update({abierto:n}).eq('id', userId) }} style={{padding:'8px 14px', borderRadius:'20px', border:'none', fontWeight:900, background: datos.abierto?'#22c55e':'#ef4444', color:'white', fontSize:'12px'}}>{datos.abierto?'● ABIERTO':'● CERRADO'}</button>
      </div>
      <div style={{display:'flex', background:'white', padding:'6px', gap:'6px', borderBottom:'1px solid #e2e8f0'}}>
        {(['perfil','productos','pedidos'] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{flex:1, padding:'11px', borderRadius:'10px', border:'none', fontWeight:900, fontSize:'12px', textTransform:'uppercase', background: tab===t?'#0A1931':'#f1f5f9', color: tab===t?'white':'#64748b'}}>{t}</button>
        ))}
      </div>
      <div style={{padding:'12px', maxWidth:'440px', margin:'0 auto'}}>
        {tab==='perfil' && (
          <div style={{background:'white', borderRadius:'16px', padding:'16px', border:'1px solid #e2e8f0'}}>
            <div style={{textAlign:'center'}}>
              <div style={{width:'70px', height:'70px', borderRadius:'16px', margin:'0 auto', overflow:'hidden', background:'#f1f5f9', display:'grid', placeItems:'center'}}>{datos.foto_url? <img src={datos.foto_url} style={{width:'100%', height:'100%', objectFit:'cover'}} alt=""/> : '🏪'}</div>
              <label style={{display:'inline-block', marginTop:'8px', background:'#0A1931', color:'white', padding:'6px 12px', borderRadius:'8px', fontWeight:800, fontSize:'11px', cursor:'pointer'}}>Cambiar foto<input type="file" accept="image/*" onChange={subirFoto} style={{display:'none'}}/></label>
            </div>
            <label style={l}>Nombre</label><input value={datos.nombre_comercio||''} onChange={e=>setDatos({...datos, nombre_comercio:e.target.value})} style={i}/>
            <label style={l}>Dirección</label><input value={datos.direccion||''} onChange={e=>setDatos({...datos, direccion:e.target.value})} style={i}/>
            <label style={l}>WhatsApp</label><input value={datos.whatsapp||''} onChange={e=>setDatos({...datos, whatsapp:e.target.value})} style={i}/>
            <label style={l}>Alias MP para cobrar</label><input value={datos.alias_mp||''} onChange={e=>setDatos({...datos, alias_mp:e.target.value})} style={i}/>
            <button onClick={guardarPerfil} style={{width:'100%', padding:'13px', background:'#0A3CC1', color:'white', borderRadius:'10px', border:'none', fontWeight:900, marginTop:'12px'}}>Guardar</button>
          </div>
        )}
        {tab==='productos' && (
          <>
            <div style={{display:'flex', gap:'8px', marginBottom:'10px'}}>
              <button onClick={()=>setSubTab('stock')} style={{flex:1, padding:'12px', borderRadius:'12px', border:'1px solid #e2e8f0', fontWeight:900, background: subTab==='stock'?'#0A3CC1':'white', color: subTab==='stock'?'white':'#0A1931'}}>EN STOCK ({misProductos.length})</button>
              <button onClick={()=>setSubTab('agregar')} style={{flex:1, padding:'12px', borderRadius:'12px', border:'1px solid #e2e8f0', fontWeight:900, background: subTab==='agregar'?'#0A3CC1':'white', color: subTab==='agregar'?'white':'#0A1931'}}>+ AGREGAR</button>
            </div>
            {subTab==='stock' && (
              <>
                <input value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="Buscar en mi stock..." style={{width:'100%', padding:'12px', borderRadius:'12px', border:'1.5px solid #cbd5e1', background:'white', color:'#0A1931', marginBottom:'10px'}}/>
                {stockFiltrado.map((m:any)=>(
                  <div key={m.id} style={{background:'white', borderRadius:'12px', padding:'12px', marginTop:'8px', border:'1px solid #e2e8f0', display:'flex', alignItems:'center', justifyContent:'space-between', opacity: m.stock ? 1 : 0.5}}>
                    <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                      <div style={{width:'45px', height:'45px', borderRadius:'8px', background:'#f1f5f9', overflow:'hidden', display:'grid', placeItems:'center'}}>{m.foto_url ? <img src={m.foto_url} style={{width:'100%', height:'100%', objectFit:'cover'}} alt=""/> : '🍔'}</div>
                      <div>
                        <div style={{fontWeight:800, color:'#0A1931', fontSize:'14px'}}>{m.nombre}</div>
                        <div style={{display:'flex', alignItems:'center', gap:'2px', marginTop:'4px'}}>
                          <span style={{fontSize:'12px', fontWeight:700, color:'#0A1931'}}>$</span>
                          <input type="number" value={m.precio || ''} onChange={e => cambiarPrecioStock(m.id, e.target.value)} onBlur={e=>guardarPrecioStock(m.id, Number(e.target.value))} style={{width:'70px', padding:'2px 4px', border:'1px solid #cbd5e1', borderRadius: '4px', color:'#0A1931'}} />
                        </div>
                      </div>
                    </div>
                    <div style={{display:'flex', gap:'6px'}}>
                      <button onClick={()=>cambiarStock(m.id, m.stock)} style={{padding:'8px 10px', borderRadius:'8px', border:'none', fontWeight:700, fontSize:'11px', background: m.stock?'#dcfce7':'#fee2e2', color: m.stock?'#15803d':'#b91c1c'}}>{m.stock?'Disponible':'Pausado'}</button>
                      <button onClick={()=>borrar(m.id)} style={{background:'none', border:'none', cursor:'pointer'}}>🗑</button>
                    </div>
                  </div>
                ))}
              </>
            )}
            {subTab==='agregar' && (
              <>
                <form onSubmit={crearProductoPersonalizado} style={{background:'white', borderRadius:'12px', padding:'14px', marginBottom:'15px', border:'1px solid #cbd5e1'}}>
                  <h4 style={{margin:'0 0 10px 0', color:'#0A1931'}}>✨ Crear producto propio (con foto)</h4>
                  <div style={{textAlign:'center', marginBottom:'10px'}}>
                    <div style={{width:'60px', height:'60px', borderRadius:'8px', margin:'0 auto', overflow:'hidden', background:'#f1f5f9', display:'grid', placeItems:'center'}}>{nuevaFotoUrl ? <img src={nuevaFotoUrl} style={{width:'100%', height:'100%', objectFit:'cover'}} alt=""/> : '📸'}</div>
                    <label style={{display:'inline-block', marginTop:'6px', fontSize:'12px', fontWeight:700, color:'#0A3CC1', cursor:'pointer'}}>{subiendoFotoProducto ? 'Subiendo...' : 'Subir foto del plato'}<input type="file" accept="image/*" onChange={subirFotoProducto} style={{display:'none'}}/></label>
                  </div>
                  <input type="text" placeholder="Nombre (ej: Empanada de Carne Frita)" value={nuevoNombre} onChange={e=>setNuevoNombre(e.target.value)} style={{...i, marginTop:0}} />
                  <input type="number" placeholder="Precio ($)" value={nuevoPrecio} onChange={e=>setNuevoPrecio(e.target.value)} style={i} />
                  <button type="submit" style={{width:'100%', padding:'10px', background:'#22c55e', color:'white', border:'none', borderRadius: '8px', fontWeight:800, marginTop: '10px'}}>+ Crear e ingresar al Stock</button>
                </form>
                <h4 style={{margin:'10px 0 6px 0', color:'#64748b'}}>O seleccionar del catálogo maestro:</h4>
                <input value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="Buscar en catálogo general..." style={{width:'100%', padding:'12px', borderRadius:'12px', border:'1.5px solid #cbd5e1', background:'white', color:'#0A1931', marginBottom:'10px'}}/>
                {filtrados.map((c:any)=>(
                  <div key={c.id} style={{background:'white', borderRadius:'12px', padding:'12px', marginTop:'6px', border:'1px solid #e2e8f0', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <div style={{fontWeight:700, color:'#0A1931', fontSize:'13px'}}>{c.nombre}</div>
                    <div style={{display:'flex', gap:'4px', alignItems:'center'}}>
                      <input type="number" placeholder="$" value={precioTemp[c.id]||''} onChange={e=>setPrecioTemp({...precioTemp, [c.id]:e.target.value})} style={{width:'65px', padding:'6px', borderRadius:'6px', border:'1px solid #cbd5e1', color:'#0A1931'}} />
                      <button onClick={()=>agregarProducto(c)} style={{background:'#0A3CC1', color:'white', border:'none', padding:'7px 10px', borderRadius:'6px', fontWeight:800, fontSize:'12px'}}>+</button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </>
        )}
        {tab==='pedidos' && (
          <>
            <div style={{display:'flex', gap:'4px', background:'white', padding:'4px', borderRadius:'10px', marginBottom:'10px'}}>
              {(['pendiente', 'retirado', 'entregado'] as const).map(pt => (
                <button key={pt} onClick={()=>setPedidoTab(pt)} style={{flex:1, padding:'8px', borderRadius:'8px', border:'none', fontSize:'11px', fontWeight:800, background: pedidoTab===pt?'#0A1931':'transparent', color: pedidoTab===pt?'white':'#64748b'}}>{pt.toUpperCase()}</button>
              ))}
            </div>
            {listaPedidos.length === 0 ? <p style={{textAlign:'center', color:'#64748b', marginTop:'20px'}}>No hay pedidos en esta sección.</p> :
              listaPedidos.map((p:any)=>(
                <div key={p.id} style={{background:'white', borderRadius:'14px', padding:'14px', border:'1px solid #e2e8f0', marginTop:'8px'}}>
                  <div style={{display:'flex', justifyContent:'space-between'}}>
                    <span style={{fontWeight:800, color:'#0A1931'}}>Pedido #{String(p.id).substring(0,4)}</span>
                    <span style={{fontSize:'12px', color:'#64748b'}}>{new Date(p.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  <div style={{margin:'8px 0', fontSize:'13px', color:'#334155'}}>
                    <div>Cliente: {p.nombre_cliente || 'Usuario Jandes'}</div>
                    <div>Dirección: {p.direccion_entrega || 'Retira en local'}</div>
                    <div style={{marginTop:'6px', fontWeight:700}}>Total: ${p.total ?? '—'}</div>
                 <div style={{marginTop:'6px', fontWeight:700}}>Total: ${p.total ?? '—'}</div>

{(p.comprobante_url || p.comprobante || p.foto_comprobante) && (
  <div style={{marginTop:'10px', background:'#f8fafc', borderRadius:'10px', padding:'10px', border:'1px solid #e2e8f0'}}>
    <div style={{fontSize:'12px', fontWeight:800, color:'#0A1931', marginBottom:'6px'}}>🧾 Comprobante que subió el cliente:</div>
    <a href={p.comprobante_url || p.comprobante || p.foto_comprobante} target="_blank" rel="noreferrer">
      <img src={p.comprobante_url || p.comprobante || p.foto_comprobante} alt="Comprobante" style={{width:'100%', borderRadius:'8px', border:'1px solid #e2e8f0', maxHeight:'220px', objectFit:'cover'}} />
    </a>
    <div style={{fontSize:'11px', color:'#0A3CC1', marginTop:'4px', fontWeight:700}}>Tocar la imagen para verla grande →</div>
  </div>
)}
{!(p.comprobante_url || p.comprobante || p.foto_comprobante) && (
  <div style={{fontSize:'12px', color:'#b45309', marginTop:'6px'}}>⚠️ Este pedido no tiene comprobante cargado.</div>
)}
                  </div>
                  <div style={{display:'flex', gap:'6px', marginTop:'10px', flexDirection:'column'}}>
                    {(p.estado === 'pendiente' || p.estado === 'nuevo') && (
                      <>
                        <button onClick={()=>actualizarEstadoPedido(p.id, 'listo')} style={{width:'100%', padding:'12px', background:'#22c55e', color:'white', border:'none', borderRadius:'10px', fontWeight:900}}>✅ Aprobar transferencia - Listo para retirar</button>
                        <button onClick={()=>actualizarEstadoPedido(p.id, 'rechazado')} style={{width:'100%', padding:'10px', background:'white', color:'#ef4444', border:'1.5px solid #ef4444', borderRadius:'10px', fontWeight:900}}>❌ Rechazar - No pagó</button>
                      </>
                    )}
                    {p.estado === 'listo' && <span style={{fontSize:'12px', color:'#15803d', fontWeight:700}}>✅ Listo - Esperando delivery 🛵</span>}
                    {p.estado === 'retirado' && <span style={{fontSize:'12px', color:'#b45309', fontWeight:700}}>🛵 Retirado - En camino</span>}
                    {p.estado === 'entregado' && <span style={{fontSize:'12px', color:'#15803d', fontWeight:700}}>Entregado ✓</span>}
                  </div>
                  <ChatPedido pedidoId={String(p.id)} soy="comercio" estadoPedido={p.estado} />
                </div>
              ))
            }
          </>
        )}
      </div>
    </div>
  )
}