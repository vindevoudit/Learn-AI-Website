import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** Every route change starts at the top, the way a new page would. */
export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname])

  return null
}
