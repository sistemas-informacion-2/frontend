import type { FormEvent } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'

interface CerrarCajaFormProps {
  montoEsperado: number
  montoFinal: string
  loading: boolean
  error: string | null
  onChange: (montoFinal: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
}

export function CerrarCajaForm({
  montoEsperado,
  montoFinal,
  loading,
  error,
  onChange,
  onSubmit,
  onCancel,
}: CerrarCajaFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Monto esperado en caja: <span className="font-semibold text-neutral-900 dark:text-white">Bs {montoEsperado.toFixed(2)}</span>
      </p>

      <Input
        label="Monto final contado (Bs)"
        type="number"
        min={0}
        step="0.01"
        placeholder={montoEsperado.toFixed(2)}
        value={montoFinal}
        onChange={(event) => onChange(event.target.value)}
      />
      <p className="text-xs text-neutral-500 dark:text-neutral-400">
        Déjalo vacío para cerrar con el monto esperado.
      </p>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">{error}</p>}

      <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          Cerrar caja
        </Button>
      </div>
    </form>
  )
}
