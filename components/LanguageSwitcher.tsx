import { useRouter } from 'next/router'

export default function LanguageSwitcher() {
  const router = useRouter()

  const toggle = () => {
    const next = router.locale === 'en' ? 'hi' : 'en'
    router.push(router.pathname, router.asPath, { locale: next })
  }

  return (
    <button onClick={toggle} className="lang-btn">
      {router.locale === 'en' ? '🇮🇳 हिन्दी' : '🇬🇧 English'}
    </button>
  )
}