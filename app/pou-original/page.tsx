import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pou',
  description: 'Jogo Pou.',
}

export default function PouOriginalPage() {
  return (
    <main className="pou-shell">
      <iframe
        title="Jogo do Pou"
        src="/pou-game"
        className="h-screen w-full border-0"
      />
    </main>
  )
}
