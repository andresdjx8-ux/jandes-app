
"use client"
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function Checkout(){
  const [nombre,setNombre]=useState('')
  const [dir,setDir]=useState('')
  const [wa,setWa]=useState('')
  const [archivo,setArchivo]=useState<any>(null)
  const [enviando,setEnviando]=useState(false)
  const [comercios,setComercios]=useState<any[]>([])
  const [comercioId,setComercioId]=useState('')

  useEffect(()=>{
    (async()=>{
      const { data } = await supabase.from('comercios').select('id,nombre_comercio').eq('abierto', true)
      if(data){ setComercios(data); if(data[0]) setComercioId(data[0].id) }
    })()
  },[])

  async function enviar(){
    if(!nombre||!dir||!wa||!archivo||!comercioId){ alert('Completa todo, elegí kiosco y subí captura'); return }
    setEnviando(true)
    try{
      const nombreFile=`comp-${Date.now()}.jpg`
      const { error: upErr } = await supabase.storage.from('pedidos').upload(nombreFile, archivo)
      if(upErr) throw upErr
      const { data } = supabase.storage.from('pedidos').getPublicUrl(nombreFile)

      // FIX 1: .select().single() para que Supabase nos devuelva el ID del pedido que acabamos de crear
      // Sin esto, el cliente no sabe cuál es su pedido y no le aparece en MIS PEDIDOS ni puede chatear
      const { data: nuevoPedido, error: insErr } = await supabase.from('pedidos').insert({
        comercio_id: String(comercioId),
        // FIX 2: nombres correctos que usa Comercio: nombre_cliente / direccion_entrega / whatsapp_cliente
        // Antes guardabas cliente_nombre / cliente_direccion y Comercio lo veía en blanco
        nombre_cliente: nombre,
        direccion_entrega: dir,
        whatsapp_cliente: wa,
        total: 2500,
        estado: 'nuevo',
        comprobante_url: data.publicUrl
      }).select().single()
      if(insErr) throw insErr

      // FIX 3: Guardar este pedido como "mío" en este celu, para que aparezca en MIS PEDIDOS + chat
      if(nuevoPedido?.id){
        const mis = JSON.parse(localStorage.getItem('jandes-mis-pedidos') || '[]')
        mis.push(nuevoPedido.id)
        localStorage.setItem('jandes-mis-pedidos', JSON.stringify(mis))
      }

      alert('¡Pedido enviado! El kiosco ya lo ve en PENDIENTE. Andá a MIS PEDIDOS para chatear con el kiosco si te falta algo.')
      setNombre(''); setDir(''); setWa(''); setArchivo(null)
      // Te lleva directo a MIS PEDIDOS donde está el chat
      window.location.href = '/'
    }catch(e:any){
      alert('Error: '+ e.message)
    }finally{
      setEnviando(false)
    }
  }

  return(
    <div style={{padding:'20px', maxWidth:'400px', margin:'0 auto', fontFamily:'system-ui'}}>
      <h2 style={{fontWeight:900}}>Finalizar pedido</h2>

      <label style={{fontSize:'12px', fontWeight:800, marginTop:'12px', display:'block'}}>Elegí kiosco abierto:</label>
      <select value={comercioId} onChange={e=>setComercioId(e.target.value)} style={inp}>
        {comercios.map(c=><option key={c.id} value={c.id}>{c.nombre_comercio}</option>)}
      </select>

      <input value={nombre} onChange={e=>setNombre(e.target.value)} placeholder="Tu nombre" style={inp}/>
      <input value={dir} onChange={e=>setDir(e.target.value)} placeholder="Dirección entrega" style={inp}/>
      <input value={wa} onChange={e=>setWa(e.target.value)} placeholder="WhatsApp" style={inp}/>
      <div style={{marginTop:'12px', fontWeight:800}}>Subí captura del pago al alias</div>
      <input type="file" accept="image/*" onChange={e=>setArchivo(e.target.files?.[0])} style={{marginTop:'8px'}}/>
      <button onClick={enviar} disabled={enviando} style={{width:'100%', marginTop:'20px', padding:'14px', background:'black', color:'white', borderRadius:'12px', fontWeight:900}}>{enviando?'Enviando...':'ENVIAR PEDIDO'}</button>
    </div>
  )
}
const inp={width:'100%', padding:'12px', borderRadius:'10px', border:'1.5px solid #ccc', marginTop:'8px'} as any

