"use client"
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function Kiosco(){
  const params = useParams()
  const id = params.id as string
  const [comercio,setComercio]=useState<any>(null)
  const [productos,setProductos]=useState<any[]>([])
  const [carrito,setCarrito]=useState<any[]>([])
  const [busqueda,setBusqueda]=useState('')

  useEffect(()=>{
    (async()=>{
      const { data: c } = await supabase.from('comercios').select('*').eq('id', id).single()
      if(c) setComercio(c)
      const { data: p } = await supabase.from('comercio_productos').select('*').eq('comercio_id', id).eq('stock', true).order('nombre')
      if(p) setProductos(p)
      const guardado = JSON.parse(localStorage.getItem('jandes-carrito') || '[]')
      setCarrito(guardado)
    })()
  },[id])

  function agregar(p:any){
    const nuevo = [...carrito, {...p, comercio_id: id, comercio_nombre: comercio?.nombre_comercio}]
    setCarrito(nuevo)
    localStorage.setItem('jandes-carrito', JSON.stringify(nuevo))
  }

  function quitar(index:number){
    const nuevo = carrito.filter((_,i)=> i!==index)
    setCarrito(nuevo)
    localStorage.setItem('jandes-carrito', JSON.stringify(nuevo))
  }

  const filtrados = productos.filter(p=> (p.nombre||'').toLowerCase().includes(busqueda.toLowerCase()))
  const total = carrito.reduce((a,b)=> a + (Number(b.precio)||0), 0)

  if(!comercio) return <div style={{padding:'20px', textAlign:'center'}}>Cargando kiosco...</div>

  return(
    <div style={{minHeight:'100vh', background:'#f1f5f9', fontFamily:'system-ui', paddingBottom:'100px'}}>
      <div style={{background:'#0A1931', padding:'14px 16px', display:'flex', gap:'10px', alignItems:'center'}}>
        <button onClick={()=>window.location.href='/'} style={{background:'white', border:'none', borderRadius:'10px', padding:'8px 12px', fontWeight:900}}>← Volver</button>
        <div style={{color:'white', fontWeight:900, fontSize:'18px'}}>▲ JANDES</div>
      </div>

      <div style={{background:'white', padding:'16px', borderBottom:'1px solid #e2e8f0'}}>
        <div style={{display:'flex', gap:'12px', alignItems:'center', maxWidth:'440px', margin:'0 auto'}}>
          <div style={{width:'64px', height:'64px', borderRadius:'16px', background:'#f1f5f9', overflow:'hidden', display:'grid', placeItems:'center', fontSize:'24px'}}>{comercio.foto_url ? <img src={comercio.foto_url} style={{width:'100%', height:'100%', objectFit:'cover'}} alt=""/> : '🏪'}</div>
          <div>
            <div style={{fontWeight:900, fontSize:'20px', color:'#0A1931'}}>{comercio.nombre_comercio}</div>
            <div style={{fontSize:'13px', color:'#475569'}}>📍 {comercio.direccion}</div>
            <div style={{fontSize:'12px', color:'#059669', fontWeight:800, marginTop:'2px'}}>● Abierto • Entrega 15-25 min</div>
          </div>
        </div>
      </div>

      <div style={{padding:'14px', maxWidth:'440px', margin:'0 auto'}}>
        <input value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="Buscar en este kiosco... Ej: Coca" style={{width:'100%', padding:'12px', borderRadius:'12px', border:'1.5px solid #cbd5e1', background:'white', color:'#0A1931'}}/>

        <div style={{fontWeight:900, margin:'14px 0 8px 0', color:'#0A1931'}}>Menú ({filtrados.length})</div>
        {filtrados.length===0 && <div style={{background:'white', padding:'20px', borderRadius:'14px', textAlign:'center', color:'#64748b'}}>Este kiosco todavía no cargó productos.</div>}
        {filtrados.map((p:any)=>(
          <div key={p.id} style={{background:'white', borderRadius:'14px', padding:'12px', border:'1px solid #e2e8f0', marginBottom:'10px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
              <div style={{width:'52px', height:'52px', borderRadius:'10px', background:'#f1f5f9', overflow:'hidden', display:'grid', placeItems:'center'}}>{p.foto_url ? <img src={p.foto_url} style={{width:'100%', height:'100%', objectFit:'cover'}} alt=""/> : '🍔'}</div>
              <div>
                <div style={{fontWeight:800, color:'#0A1931'}}>{p.nombre}</div>
                <div style={{fontWeight:900, color:'#0A3CC1', marginTop:'2px'}}>${p.precio}</div>
              </div>
            </div>
            <button onClick={()=>agregar(p)} style={{background:'#0A1931', color:'white', border:'none', padding:'10px 14px', borderRadius:'10px', fontWeight:900}}>+ Agregar</button>
          </div>
        ))}

        {carrito.length>0 && (
          <div style={{background:'white', borderRadius:'14px', padding:'14px', border:'1px solid #e2e8f0', marginTop:'16px'}}>
            <div style={{fontWeight:900, color:'#0A1931'}}>🛒 Tu pedido ({carrito.length})</div>
            {carrito.map((item,i)=>(
              <div key={i} style={{display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #f1f5f9', fontSize:'13px'}}>
                <span>{item.nombre} <span style={{color:'#64748b'}}>({item.comercio_nombre})</span></span>
                <span style={{display:'flex', gap:'8px', alignItems:'center'}}><b>${item.precio}</b><button onClick={()=>quitar(i)} style={{background:'none', border:'none', cursor:'pointer'}}>✕</button></span>
              </div>
            ))}
            <div style={{display:'flex', justifyContent:'space-between', fontWeight:900, marginTop:'10px'}}><span>Total</span><span>${total}</span></div>
            <button onClick={()=>window.location.href=`/checkout?comercio=${id}`} style={{width:'100%', marginTop:'10px', padding:'14px', background:'#22c55e', color:'white', border:'none', borderRadius:'12px', fontWeight:900}}>Ir a pagar →</button>
          </div>
        )}
      </div>
    </div>
  )
}