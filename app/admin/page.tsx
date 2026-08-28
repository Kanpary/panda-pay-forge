'use client'

import { FormEvent, useEffect, useState } from 'react'
import { getSupabaseBrowser } from '@/lib/supabase-browser'

export default function AdminPage() {
  const supabase = getSupabaseBrowser()
  const [session, setSession] = useState<any>(null)
  const [email, setEmail] = useState('detroit.system@gmail.com')
  const [password, setPassword] = useState('')
  const [sandbox, setSandbox] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => { supabase.auth.getSession().then(({ data }) => setSession(data.session)) }, [supabase.auth])
  useEffect(() => {
    if (!session) return
    fetch('/api/admin/settings', { headers: { Authorization: `Bearer ${session.access_token}` } }).then(r => r.json()).then(d => setSandbox(d.sandbox ?? true))
  }, [session])

  async function login(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('')
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) setError('E-mail ou senha inválidos.')
    else setSession(data.session)
    setBusy(false)
  }

  async function toggle(next: boolean) {
    if (!next && !window.confirm('Você está mudando para PRODUÇÃO. As próximas operações poderão movimentar dinheiro real. Continuar?')) return
    setBusy(true); setError('')
    const response = await fetch('/api/admin/settings', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ sandbox: next }) })
    if (!response.ok) setError('Não foi possível alterar o ambiente.')
    else setSandbox(next)
    setBusy(false)
  }

  if (!session) return <main className="admin-page"><form className="admin-login" onSubmit={login}><p className="eyebrow">POU ONIX · ADMIN</p><h1>Acesso administrativo</h1><label>E-mail<input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></label><label>Senha<input type="password" value={password} onChange={e => setPassword(e.target.value)} required /></label>{error && <p className="admin-error">{error}</p>}<button disabled={busy}>{busy ? 'Entrando...' : 'Entrar no painel'}</button></form></main>

  return <main className="admin-page"><header className="admin-header"><div><p className="eyebrow">POU ONIX · CONTROLE</p><h1>Painel administrativo</h1></div><button className="secondary" onClick={() => supabase.auth.signOut()}>Sair</button></header><section className="admin-grid"><article className="admin-card environment-card"><div><p className="eyebrow">ONIXPAY</p><h2>Ambiente de pagamentos</h2><p className="muted">Escolha onde depósitos e saques serão processados.</p></div><label className="sandbox-toggle"><input type="checkbox" checked={sandbox} disabled={busy} onChange={e => toggle(e.target.checked)} /><span>{sandbox ? 'Sandbox ativo' : 'Produção ativa'}</span></label><p className={sandbox ? 'status safe' : 'status danger'}>{sandbox ? 'Modo seguro para testes. Nenhum dinheiro real será movimentado.' : 'Modo produção. Operações financeiras reais estão habilitadas.'}</p></article><article className="admin-card"><p className="eyebrow">VISÃO GERAL</p><h2>Operações</h2><div className="metric-row"><span>Depósitos</span><strong>Prontos para consulta</strong></div><div className="metric-row"><span>Saques</span><strong>Controle server-side</strong></div><div className="metric-row"><span>Jogo Pou</span><strong>Sessões protegidas</strong></div></article></section>{error && <p className="admin-error">{error}</p>}</main>
}
