import type { FormEvent } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { Select } from '@/shared/components/ui/Select'
import type { Destinatario, DestinatarioTipo, NotificacionFormValues } from '../types'

interface NotificacionFormProps {
  values: NotificacionFormValues
  destinatarios: Destinatario[]
  loading: boolean
  error: string | null
  onChange: <K extends keyof NotificacionFormValues>(field: K, value: NotificacionFormValues[K]) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
}

export function NotificacionForm({ values, destinatarios, loading, error, onChange, onSubmit, onCancel }: NotificacionFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Input
        label="Título"
        required
        maxLength={150}
        value={values.titulo}
        onChange={(event) => onChange('titulo', event.target.value)}
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="mensaje" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Mensaje
        </label>
        <textarea
          id="mensaje"
          required
          maxLength={1000}
          rows={4}
          value={values.mensaje}
          onChange={(event) => onChange('mensaje', event.target.value)}
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:focus:border-white"
        />
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          Puedes personalizar con variables: <code>{'{{nombre}}'}</code>, <code>{'{{apellido}}'}</code>, <code>{'{{email}}'}</code>.
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Destinatario"
          value={values.destinatario}
          onChange={(event) => onChange('destinatario', event.target.value as DestinatarioTipo)}
        >
          <option value="CLIENTES">Todos los clientes</option>
          <option value="USUARIO">Un usuario específico</option>
        </Select>
        {values.destinatario === 'USUARIO' && (
          <Select
            label="Cliente"
            required
            value={values.idUsuario}
            onChange={(event) => onChange('idUsuario', event.target.value)}
          >
            <option value="">Selecciona un cliente…</option>
            {destinatarios.map((destinatario) => (
              <option key={destinatario.id} value={String(destinatario.id)}>
                {destinatario.etiqueta}
              </option>
            ))}
          </Select>
        )}
      </div>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">{error}</p>}

      <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          Enviar notificación
        </Button>
      </div>
    </form>
  )
}
