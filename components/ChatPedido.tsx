"use client"
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function ChatPedido({ pedidoId, soy, estadoPedido }: { pedidoId: string, soy: 'comercio' | 'cliente', estadoPedido: string }) {
  const [msgs, setMsgs] = useState<any[]>([])
  const [texto, setTexto] = useState('')
  const chatAbierto = estadoPedido !== 'entregado'
  const idNormalizado = String(pedidoId)

  async function cargar() {
    const { data, error } = await supabase.from('mensajes_pedido').select('*').eq('pedido_id', idNormalizado).order('created_at')
    if (error) console.log('Error cargar chat:', error.message)
    if (data) setMsgs(data)
  }

  useEffect(() => {
    cargar()
    if (!chatAbierto) return
    const id = setInterval(cargar, 2000)
    return () => clearInterval(id)
  }, [idNormalizado, chatAbierto])

  async function enviar() {
    if (!chatAbierto) return
    if (!texto.trim()) return
    const { error } = await supabase.from('mensajes_pedido').insert({ pedido_id: idNormalizado, remitente: soy, mensaje: texto })
    if (error) {
      alert('Error al enviar mensaje: ' + error.message)
      console.log('Error enviar:', error)
      return
    }
    setTexto('')
    cargar()
  }

  return (
    <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '10px', border: '1px solid #e2e8f0', marginTop: '10px' }}>
      <div style={{ fontWeight: 900, fontSize: '12px', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
        <span>💬 Chat del pedido</span>
        {!chatAbierto ? <span style={{ color: '#64748b' }}>🔒 Cerrado - Entregado</span> : <span style={{ color: '#22c55e' }}>● Activo</span>}
      </div>
      <div style={{ fontSize: '10px', color: '#94a3b8' }}>Pedido: {idNormalizado} - Soy: {soy}</div>
      {msgs.length === 0 && chatAbierto && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>Sin mensajes todavía. Si al kiosco le falta algo te va a escribir acá.</div>}
      {msgs.length === 0 && !chatAbierto && <div style={{ fontSize: '12px', color: '#64748b' }}>Este chat ya se cerró porque el pedido se entregó.</div>}
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