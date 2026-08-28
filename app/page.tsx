'use client'

import { FormEvent, useState } from 'react'

const navigation = ['Roleta', 'Depósitos', 'Saques', 'Histórico', 'Afiliados']

export default function Home() {
  const [active, setActive] = useState('Roleta')
  const [amount, setAmount] = useState('20')
  const [name, setName] = useState('')
  const [cpf, setCpf] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function createPix(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const response = await fetch('/api/onixpay/qrcode', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ nome: name, cpf: cpf.replace(/\\D/g, ''), valor: Number(amount), descricao: 'Depósito Roleta' }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message ?? 'Não foi possível criar o pagamento.')
      setMessage(data.qrcode ?? data.pix_code ?? data.pixCopiaECola ?? 'Pagamento criado. Aguarde os dados retornados pela OnixPay.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erro ao comunicar com a OnixPay.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="/">PANDA<span>ROULETTE</span></a>
        <div className="account"><span>Saldo disponível</span><strong>Consulte após entrar</strong></div>
        <button className="outline-button">Entrar</button>
      </header>
      <div className="layout">
        <aside className="sidebar">
          <div className="profile"><div className="avatar">P</div><div><strong>Minha conta</strong><span>Área do jogador</span></div></div>
          <nav aria-label="Navegação principal">{navigation.map((item) => <button key={item} className={active === item ? 'nav-item active' : 'nav-item'} onClick={() => setActive(item)}>{item}</button>)}</nav>
          <div className="support"><span>Suporte</span><strong>Precisa de ajuda?</strong><small>Fale com nossa equipe</small></div>
        </aside>
        <section className="content">
          <div className="heading"><div><p className="eyebrow">PANDA ROULETTE / {active.toUpperCase()}</p><h1>{active}</h1><p className="muted">Acesse sua conta para consultar dados reais e jogar.</p></div><span className="status"><i /> Sistema online</span></div>
          {active === 'Roleta' && <div className="grid"><section className="roulette-card"><div className="card-label">JOGO PRINCIPAL</div><div className="wheel" aria-label="Roleta"><div className="wheel-center">LOGIN<br /><small>PARA JOGAR</small></div></div><button className="primary-button" onClick={() => setMessage('Entre na sua conta para iniciar uma rodada.')}>Entrar para jogar</button></section><section className="side-stack"><div className="info-card"><div className="card-label">SALDO</div><h2>Consulte após entrar</h2><p>Seu saldo é carregado com segurança pela sua sessão.</p></div><div className="info-card"><div className="card-label">DEPÓSITO VIA PIX</div><h2>Adicione saldo</h2><p>Gere um pagamento diretamente pela integração OnixPay.</p><button className="text-button" onClick={() => setActive('Depósitos')}>Fazer depósito →</button></div></section></div>}
          {active === 'Depósitos' && <section className="panel"><div className="card-label">ONIXPAY / PIX</div><h2>Adicionar saldo</h2><p className="muted">Preencha seus dados para criar um pagamento PIX real.</p><form onSubmit={createPix} className="form"><label>Nome completo<input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Seu nome" /></label><label>CPF<input required value={cpf} onChange={(event) => setCpf(event.target.value)} placeholder="00000000000" inputMode="numeric" maxLength={11} /></label><label>Valor<input required type="number" min="1" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} /></label><button className="primary-button" disabled={loading}>{loading ? 'Criando pagamento...' : 'Gerar PIX'}</button></form>{message && <div className="notice" role="status">{message}</div>}</section>}
          {active !== 'Roleta' && active !== 'Depósitos' && <section className="panel empty"><div className="card-label">{active.toUpperCase()}</div><h2>Entre para continuar</h2><p className="muted">Esta área consulta os dados da sua conta autenticada. Nenhum dado fictício é exibido.</p><button className="outline-button">Entrar</button></section>}
        </section>
      </div>
    </main>
  )
}
