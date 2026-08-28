import { redirect } from 'next/navigation'

export default function PouHtmlFallback() {
  redirect('/pou-original')
}
