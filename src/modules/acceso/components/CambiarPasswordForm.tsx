import type { FormEvent } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import type { CambiarPasswordFormValues } from '../types'

interface CambiarPasswordFormProps {
  values: CambiarPasswordFormValues
  loading: boolean
  error: string | null
  success: string | null
  onChange: <K extends keyof CambiarPasswordFormValues>(
    field: K,
    value: CambiarPasswordFormValues[K],
  ) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
}

export function CambiarPasswordForm({ values, loading, error, success, onChange, onSubmit, onCancel }: CambiarPasswordFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Contraseña actual"
          type="password"
          required
          autoComplete="current-password"
          value={values.passwordActual}
          onChange={(event) => onChange('passwordActual', event.target.value)}
        />
        <Input
          label="Nueva contraseña"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          value={values.nuevaPassword}
          onChange={(event) => onChange('nuevaPassword', event.target.value)}
        />
        <Input
          label="Confirmar nueva contraseña"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          value={values.confirmarPassword}
          onChange={(event) => onChange('confirmarPassword', event.target.value)}
        />
      </div>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">{error}</p>}
      {success && <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">{success}</p>}

      <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          Cambiar contraseña
        </Button>
      </div>
    </form>
  )
}
