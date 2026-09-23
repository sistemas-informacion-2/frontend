import type { FormEvent } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'

interface CajaAperturaFormProps {
  sucursalNombre: string
  montoInicial: string
  loading: boolean
  error: string | null
  onChange: (montoInicial: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
}

export function CajaAperturaForm({
  sucursalNombre,
  montoInicial,
  loading,
  error,
  onChange,
  onSubmit,
  onCancel,
}: CajaAperturaFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Se abrirá una caja para <span className="font-medium text-neutral-900 dark:text-white">{sucursalNombre}</span> a tu
        nombre.
      </p>

      <Input
        label="Monto inicial (Bs)"
        type="number"
        min={0}
        step="0.01"
        required
        value={montoInicial}
        onChange={(event) => onChange(event.target.value)}
      />

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">{error}</p>}

      <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          Abrir caja
        </Button>
      </div>
    </form>
  )
}
