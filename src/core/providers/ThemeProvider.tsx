import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { useAppStore } from '@/core/store/appStore'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useAppStore((state) => state.theme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return children
}
