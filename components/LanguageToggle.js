import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'   // keep this — will work after package fix

export default function LanguageToggle({ style = {} }) {
  const router = useRouter()
  const { i18n } = useTranslation()

  const toggle = () => {
    const next = router.locale === 'en' ? 'hi' : 'en'
    router.push(router.pathname, router.asPath, { locale: next })
  }

  return (
    <button onClick={toggle} style={style}>
      {router.locale === 'en' ? 'हिन्दी' : 'English'}
    </button>
  )
}