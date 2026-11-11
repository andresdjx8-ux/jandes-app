"use client"
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

// ============ CHAT POR PEDIDO - vive solo mientras el pedido no está entregado ============
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
        <span>💬 Chat con el kiosco</span>
        {!chatAbierto ? <span style={{ color: '#64748b' }}>🔒 Cerrado - Entregado</span> : <span style={{ color: '#22c55e' }}>● Activo</span>}
      </div>
      {msgs.length === 0 && chatAbierto && <div style={{ fontSize: '12px', color: '#64748b' }}>Sin mensajes todavía. Si al kiosco le falta algo te va a escribir acá.</div>}
      {msgs.length === 0 && !chatAbierto && <div style={{ fontSize: '12px', color: '#64748b' }}>Este chat ya se cerró porque el pedido se entregó.</div>}
      {msgs.map((m: any) => (
        <div key={m.id} style={{ textAlign: m.remitente === soy ? 'right' : 'left', margin: '4px 0' }}>
          <span style={{ display: 'inline-block', padding: '7px 10px', borderRadius: '12px', fontSize: '13px', background: m.remitente === soy ? '#0A3CC1' : 'white', color: m.remitente === soy ? 'white' : '#0A1931', border: '1px solid #e2e8f0' }}>{m.mensaje}</span>
        </div>
      ))}
      {chatAbierto ? (
        <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
          <input value={texto} onChange={e => setTexto(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') enviar() }} placeholder="Escribí acá..." style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1' }} />
          <button onClick={enviar} style={{ padding: '10px 14px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 900 }}>Enviar</button>
        </div>
      ) : (
        <div style={{ marginTop: '8px', padding: '8px', background: '#e2e8f0', borderRadius: '8px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#475569' }}>🔒 Chat cerrado - El pedido ya se entregó</div>
      )}
    </div>
  )
}

export default function ClienteHome(){
  const [comercios,setComercios]=useState<any[]>([])
  const [productos,setProductos]=useState<any[]>([])
  const [busqueda,setBusqueda]=useState('')
  const [carrito,setCarrito]=useState<any[]>([])
  const [tab,setTab]=useState<'inicio'|'pedidos'>('inicio')
  const [misPedidos,setMisPedidos]=useState<any[]>([])
  const [userId,setUserId]=useState<string>('')

  async function cargarMisPedidos(){
    // Leemos los ids de pedidos que guardó el checkout en este celu
    try{
      const ids = JSON.parse(localStorage.getItem('jandes-mis-pedidos') || '[]')
      if(ids.length===0) return
      const { data } = await supabase.from('pedidos').select('*, comercios(nombre_comercio)').in('id', ids).order('created_at',{ascending:false})
      if(data) setMisPedidos(data)
    }catch{}
  }

  useEffect(()=>{
    (async()=>{
      const { data: { user } } = await supabase.auth.getUser()
      if(!user){ window.location.href='/login'; return }
      setUserId(user.id)
      const { data: com } = await supabase.from('comercios').select('*').eq('abierto', true)
      if(com) setComercios(com)
      const { data: prod } = await supabase.from('comercio_productos').select('*, comercios(nombre_comercio)').limit(6)
      if(prod) setProductos(prod)
      await cargarMisPedidos()
    })()
    const id = setInterval(cargarMisPedidos, 4000)
    return ()=>clearInterval(id)
  },[])

    const filtrados = comercios.filter(c => 
    (c.nombre_comercio || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (c.direccion || '').toLowerCase().includes(busqueda.toLowerCase())
  )

    const productosFiltrados = productos.filter(p =>
    (p.nombre || '').toLowerCase().includes(busqueda.toLowerCase())
  )

  function agregar(p:any){
    setCarrito([...carrito, p])
  }

  return(
    <div style={{minHeight:'100vh', background:'#f1f5f9', fontFamily:'system-ui'}}>
      <div style={{background:'#0A1931', padding:'14px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, zIndex:10}}>
        <div style={{fontWeight:900, fontSize:'20px', color:'white', fontStyle:'italic'}}>▲ JANDES</div>
        <div style={{background:'white', borderRadius:'20px', padding:'6px 12px', fontSize:'12px', fontWeight:800, color:'#0A1931'}}>🛒 {carrito.length}</div>
      </div>

      {/* PESTAÑAS INICIO / MIS PEDIDOS */}
      <div style={{display:'flex', background:'white', padding:'6px', gap:'6px', borderBottom:'1px solid #e2e8f0', maxWidth:'420px', margin:'0 auto'}}>
        <button onClick={()=>setTab('inicio')} style={{flex:1, padding:'11px', borderRadius:'10px', border:'none', fontWeight:900, fontSize:'12px', background: tab==='inicio'?'#0A1931':'#f1f5f9', color: tab==='inicio'?'white':'#64748b'}}>🏠 INICIO</button>
        <button onClick={()=>{setTab('pedidos'); cargarMisPedidos()}} style={{flex:1, padding:'11px', borderRadius:'10px', border:'none', fontWeight:900, fontSize:'12px', background: tab==='pedidos'?'#0A1931':'#f1f5f9', color: tab==='pedidos'?'white':'#64748b'}}>📦 MIS PEDIDOS {misPedidos.length>0 ? `(${misPedidos.length})` : ''}</button>
      </div>

      {tab==='pedidos' && (
        <div style={{padding:'14px', maxWidth:'420px', margin:'0 auto'}}>
          {misPedidos.length===0 ? (
            <div style={{background:'white', padding:'30px 20px', borderRadius:'16px', textAlign:'center', border:'1px solid #e2e8f0'}}>
              <div style={{fontSize:'36px'}}>📦</div>
              <div style={{fontWeight:900, color:'#0A1931', marginTop:'8px'}}>Todavía no tenés pedidos</div>
              <div style={{fontSize:'12px', color:'#64748b', marginTop:'6px'}}>Cuando pidas algo, acá te va a aparecer y vas a poder chatear con el kiosco.<br/>Si te falta Coca, te avisa acá.</div>
              <button onClick={()=>setTab('inicio')} style={{marginTop:'12px', padding:'10px 16px', background:'#0A3CC1', color:'white', border:'none', borderRadius:'10px', fontWeight:900}}>Ir a pedir</button>
            </div>
          ) : misPedidos.map((p:any)=>(
            <div key={p.id} style={{background:'white', borderRadius:'16px', padding:'14px', border:'1px solid #e2e8f0', marginBottom:'12px'}}>
              <div style={{display:'flex', justifyContent:'space-between'}}>
                <span style={{fontWeight:900, color:'#0A1931'}}>Pedido #{String(p.id).substring(0,4)} - ${p.total ?? '—'}</span>
                <span style={{fontSize:'11px', fontWeight:900, padding:'4px 8px', borderRadius:'20px', background: p.estado==='entregado' ? '#dcfce7' : '#dbeafe', color: p.estado==='entregado' ? '#15803d' : '#1e40af'}}>{String(p.estado||'').toUpperCase()}</span>
              </div>
              <div style={{fontSize:'13px', color:'#334155', marginTop:'6px'}}>
                <div>🏪 {p.comercios?.nombre_comercio || 'Kiosco'}</div>
                <div>📍 {p.direccion_entrega || 'Retira en local'}</div>
                <div style={{fontSize:'11px', color:'#94a3b8'}}>{p.created_at ? new Date(p.created_at).toLocaleString('es-AR') : ''}</div>
              </div>
              <ChatPedido pedidoId={p.id} soy="cliente" estadoPedido={p.estado} />
            </div>
          ))}
        </div>
      )}

      {tab==='inicio' && (
      <div style={{padding:'14px', maxWidth:'420px', margin:'0 auto'}}>
        <div style={{background:'white', borderRadius:'16px', padding:'14px', border:'1px solid #e2e8f0'}}>
          <div style={{fontWeight:900, fontSize:'14px', color:'#0A1931', display:'flex', justifyContent:'space-between'}}>
            <span>🔥 Promos del día</span>
            <span style={{fontWeight:600, fontSize:'11px', color:'#0A3CC1'}}>Ver todas</span>
          </div>
          <div style={{display:'flex', gap:'10px', overflowX:'auto', marginTop:'10px'}}>
            {productos.length===0 ? <div style={{fontSize:'12px', color:'#64748b'}}>No hay promos aún</div> :
              productos.slice(0,4).map((p,i)=>(
                <div key={i} style={{minWidth:'120px', background:'#f8fafc', borderRadius:'12px', padding:'10px', border:'1px solid #e2e8f0'}}>
                  <div style={{fontWeight:800, fontSize:'12px', color:'#0A1931', lineHeight:'14px'}}>{p.nombre}</div>
                  <div style={{fontWeight:900, fontSize:'13px', color:'#0A3CC1', marginTop:'4px'}}>${p.precio}</div>
                  <button onClick={()=>agregar(p)} style={{width:'100%', marginTop:'6px', background:'#0A1931', color:'white', border:'none', borderRadius:'8px', padding:'6px', fontWeight:800, fontSize:'11px'}}>+ Agregar</button>
                </div>
              ))
            }
          </div>
        </div>

        <div style={{marginTop:'14px', position:'relative'}}>
          <input 
            value={busqueda} onChange={e=>setBusqueda(e.target.value)}
            placeholder="Buscar kiosco o producto Ej: Coca, Don Carlos..." 
            style={{width:'100%', padding:'14px 14px 14px 38px', borderRadius:'14px', border:'1.5px solid #cbd5e1', background:'white', color:'#0A1931', fontWeight:600, fontSize:'14px'}}
          />
          <div style={{position:'absolute', left:'12px', top:'14px'}}>🔍</div>
        </div>

        {busqueda && productosFiltrados.length>0 && (
          <div style={{marginTop:'12px', background:'white', borderRadius:'14px', border:'1px solid #e2e8f0', padding:'8px'}}>
            <div style={{fontSize:'11px', fontWeight:800, color:'#64748b', padding:'4px 6px'}}>Productos que coinciden</div>
            {productosFiltrados.map((p,i)=>(
              <div key={i} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 6px', borderBottom:'1px solid #f1f5f9'}}>
                <div>
                  <div style={{fontWeight:800, fontSize:'13px', color:'#0A1931'}}>{p.nombre}</div>
                  <div style={{fontSize:'11px', color:'#64748b'}}>{p.comercios?.nombre_comercio}</div>
                </div>
                <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                  <span style={{fontWeight:900, color:'#0A3CC1'}}>${p.precio}</span>
                  <button onClick={()=>agregar(p)} style={{background:'#0A1931', color:'white', border:'none', width:'28px', height:'28px', borderRadius:'8px', fontWeight:900}}>+</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{marginTop:'16px'}}>
          <div style={{fontWeight:900, fontSize:'15px', color:'#0A1931', marginBottom:'8px'}}>Kioscos abiertos ahora ({filtrados.length})</div>
          {filtrados.length===0 ? (
            <div style={{background:'white', padding:'20px', borderRadius:'14px', textAlign:'center', color:'#64748b', fontSize:'13px', fontWeight:600}}>No hay kioscos abiertos con "{busqueda}"</div>
          ) : filtrados.map(c=>(
            <div key={c.id} onClick={()=>window.location.href=`/kiosco/${c.id}`} style={{background:'white', borderRadius:'16px', padding:'14px', border:'1px solid #e2e8f0', marginBottom:'10px', display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer'}}>
              <div>
                <div style={{fontWeight:900, fontSize:'15px', color:'#0A1931'}}>{c.nombre_comercio}</div>
                <div style={{fontSize:'12px', color:'#475569', fontWeight:500, marginTop:'2px'}}>📍 {c.direccion}</div>
                <div style={{fontSize:'11px', color:'#059669', fontWeight:800, marginTop:'4px'}}>● Abierto • Entrega 15-25 min</div>
              </div>
              <div style={{background:'#f1f5f9', borderRadius:'10px', width:'36px', height:'36px', display:'grid', placeItems:'center', fontWeight:900, color:'#0A1931'}}>›</div>
            </div>
          ))}
        </div>

        {carrito.length>0 && (
          <div style={{position:'fixed', bottom:'16px', left:'50%', transform:'translateX(-50%)', width:'90%', maxWidth:'380px', background:'#0A1931', color:'white', borderRadius:'16px', padding:'14px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', boxShadow:'0 10px 30px rgba(0,0,0,0.3)'}}>
            <div>
              <div style={{fontWeight:900, fontSize:'14px'}}>{carrito.length} productos</div>
              <div style={{fontSize:'12px', opacity:0.8}}>${carrito.reduce((a,b)=>a+b.precio,0)}</div>
            </div>
            <button onClick={()=>alert('Pedido enviado! Te lo llevan')} style={{background:'#0A3CC1', color:'white', border:'none', borderRadius:'10px', padding:'10px 16px', fontWeight:900}}>Ver pedido</button>
          </div>
        )}
      </div>
      )}

      <style>{`input::placeholder{color:#64748b !important; opacity:1} input{color:#0A1931 !important}`}</style>
    </div>
  )
}
