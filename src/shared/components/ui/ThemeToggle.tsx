import { useAppStore } from '@/core/store/appStore'

export function ThemeToggle() {
  const theme = useAppStore((state) => state.theme)
  const toggleTheme = useAppStore((state) => state.toggleTheme)

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Cambiar tema"
      title={theme === 'light' ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro'}
      className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  )
}
