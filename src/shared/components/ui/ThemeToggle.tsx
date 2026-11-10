import { Moon, Sun } from 'lucide-react'
import { useAppStore } from '@/core/store/appStore'

export function ThemeToggle() {
  const theme = useAppStore((state) => state.theme)
  const toggleTheme = useAppStore((state) => state.toggleTheme)
  const Icono = theme === 'light' ? Moon : Sun

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Cambiar tema"
      title={theme === 'light' ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro'}
      className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-600 outline-none transition-colors hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-brand dark:text-neutral-300 dark:hover:bg-neutral-800"
    >
      <Icono className="h-[18px] w-[18px]" aria-hidden="true" />
    </button>
  )
}
