'use client'
import { useState } from 'react'

export default function Home() {
  const [amount, setAmount] = useState('10')
  const [message, setMessage] = useState('')
  async function deposit() {
    setMessage('Gerando QR Code PIX...')
    const response = await fetch('/api/onixpay/qrcode', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ nome:'Cliente', cpf:'00000000000', valor:Number(amount), descricao:'Depósito Roleta' }) })
    const data = await response.json()
    setMessage(data.qrcode ? `QR Code gerado: ${data.qrcode}` : (data.message ?? 'Não foi possível gerar o pagamento.'))
  }
  return <main style={{maxWidth:520,margin:'0 auto',padding:24}}><header style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}><strong>ROLETA</strong><span style={{color:'var(--muted)'}}>Saldo: R$ 0,00</span></header><section style={{background:'var(--panel)',border:'1px solid var(--line)',padding:24,borderRadius:8}}><h1 style={{marginTop:0}}>Roleta</h1><p style={{color:'var(--muted)'}}>Frontend adaptado do pacote ROLETA-ONIX com OnixPay server-side.</p><div style={{display:'grid',gap:12}}><label>Valor do depósito<input value={amount} onChange={e=>setAmount(e.target.value)} type="number" min="1" step="0.01" style={{display:'block',width:'100%',marginTop:6,padding:12,background:'#0b1220',color:'white',border:'1px solid var(--line)',borderRadius:6}} /></label><button onClick={deposit} style={{padding:12,background:'var(--accent)',border:0,borderRadius:6,fontWeight:700}}>Gerar PIX</button>{message && <pre style={{whiteSpace:'pre-wrap',color:'var(--muted)'}}>{message}</pre>}</div></section></main>
}
