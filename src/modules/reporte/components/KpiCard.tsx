import type { ReactNode } from 'react'

interface KpiCardProps {
  titulo: string
  valor: ReactNode
  detalle?: string
  /** `alerta` resalta el indicador cuando requiere atención (ej. stock crítico > 0). */
  tono?: 'normal' | 'alerta'
}

export function KpiCard({ titulo, valor, detalle, tono = 'normal' }: KpiCardProps) {
  return (
    <div
      className={`rounded-lg border bg-white p-4 dark:bg-neutral-950 ${
        tono === 'alerta' ? 'border-red-300 dark:border-red-900' : 'border-neutral-200 dark:border-neutral-800'
      }`}
    >
      <p className="text-sm text-neutral-500 dark:text-neutral-400">{titulo}</p>
      <p
        className={`mt-1 text-2xl font-semibold ${
          tono === 'alerta' ? 'text-red-700 dark:text-red-400' : 'text-neutral-900 dark:text-white'
        }`}
      >
        {valor}
      </p>
      {detalle && <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{detalle}</p>}
    </div>
  )
}
