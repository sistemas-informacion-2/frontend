import type { FormEvent } from 'react'
import { CambiarPasswordForm } from '@/modules/acceso/components/CambiarPasswordForm'
import { PerfilForm } from '@/modules/acceso/components/PerfilForm'
import { TIPO_USUARIO_LABEL } from '@/modules/acceso/services/usuarios.service'
import type {
  CambiarPasswordFormValues,
  Perfil,
  PerfilFormValues,
} from '@/modules/acceso/types'
import { Button } from '@/shared/components/ui/Button'
import { Skeleton } from '@/shared/components/ui/Skeleton'

interface PerfilPageViewProps {
  perfil?: Perfil
  loading: boolean
  loadError: string | null
  form: PerfilFormValues
  editing: boolean
  savingPerfil: boolean
  perfilError: string | null
  perfilSuccess: string | null
  passwordForm: CambiarPasswordFormValues
  editingPassword: boolean
  savingPassword: boolean
  passwordError: string | null
  passwordSuccess: string | null
  onChange: <K extends keyof PerfilFormValues>(field: K, value: PerfilFormValues[K]) => void
  onChangePassword: <K extends keyof CambiarPasswordFormValues>(
    field: K,
    value: CambiarPasswordFormValues[K],
  ) => void
  onEdit: () => void
  onCancelEdit: () => void
  onEditPassword: () => void
  onCancelEditPassword: () => void
  onSubmitPerfil: (event: FormEvent<HTMLFormElement>) => void
  onSubmitPassword: (event: FormEvent<HTMLFormElement>) => void
}

export function PerfilPageView({
  perfil,
  loading,
  loadError,
  form,
  editing,
  savingPerfil,
  perfilError,
  perfilSuccess,
  passwordForm,
  editingPassword,
  savingPassword,
  passwordError,
  passwordSuccess,
  onChange,
  onChangePassword,
  onEdit,
  onCancelEdit,
  onEditPassword,
  onCancelEditPassword,
  onSubmitPerfil,
  onSubmitPassword,
}: PerfilPageViewProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Mi perfil</h1>
          {perfil && (
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              {perfil.email} · {TIPO_USUARIO_LABEL[perfil.tipoUsuario]}
            </p>
          )}
        </div>
        {perfil && !editing && <Button onClick={onEdit}>Editar perfil</Button>}
      </div>

      {loadError && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{loadError}</p>}

      <section className="rounded-lg border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
        <h2 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-white">Datos personales</h2>

        {editing ? (
          <PerfilForm
            values={form}
            showDireccion={perfil?.tipoUsuario === 'C'}
            loading={savingPerfil}
            error={perfilError}
            success={null}
            onChange={onChange}
            onSubmit={onSubmitPerfil}
            onCancel={onCancelEdit}
          />
        ) : (
          <div className="space-y-4">
            {perfilSuccess && <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">{perfilSuccess}</p>}
            <dl className="grid gap-4 sm:grid-cols-2">
              <Campo label="Nombre" valor={perfil?.nombre} />
              <Campo label="Apellido" valor={perfil?.apellido} />
              <Campo label="Correo electrónico" valor={perfil?.email} />
              <Campo label="Teléfono" valor={perfil?.telefono} />
              {perfil?.tipoUsuario === 'C' && <Campo label="Dirección principal" valor={perfil?.direccion} />}
              <Campo label="Tipo de usuario" valor={perfil ? TIPO_USUARIO_LABEL[perfil.tipoUsuario] : undefined} />
              {perfil?.sucursalNombre && <Campo label="Sucursal" valor={perfil.sucursalNombre} />}
              {perfil?.tipoUsuario === 'C' && (
                <Campo label="Puntos de fidelidad" valor={perfil?.puntosFidelidad ?? 0} />
              )}
            </dl>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
        <h2 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-white">Cambiar contraseña</h2>

        {editingPassword ? (
          <CambiarPasswordForm
            values={passwordForm}
            loading={savingPassword}
            error={passwordError}
            success={null}
            onChange={onChangePassword}
            onSubmit={onSubmitPassword}
            onCancel={onCancelEditPassword}
          />
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {passwordSuccess && <p className="mb-2 text-sm text-emerald-700 dark:text-emerald-300">{passwordSuccess}</p>}
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Actualiza tu contraseña de acceso. Se pedirá tu contraseña actual.
              </p>
            </div>
            <Button variant="secondary" onClick={onEditPassword}>
              Cambiar contraseña
            </Button>
          </div>
        )}
      </section>
    </div>
  )
}

function Campo({ label, valor }: { label: string; valor?: string | number | null }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-neutral-400">{label}</dt>
      <dd className="mt-1 text-sm text-neutral-800 dark:text-neutral-100">{valor ?? '—'}</dd>
    </div>
  )
}
