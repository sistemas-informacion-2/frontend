import { Campo } from '../Campo'
import type { AdministradorRegistro, Plan } from '../../types'
import { formatoBs, periodoDelPlan } from '../../utils/formato'
import type { Errores } from '../../utils/registro'

interface PasoAdministradorProps {
  admin: AdministradorRegistro
  errores: Errores<AdministradorRegistro>
  plan: Plan
  onCampo: (campo: keyof AdministradorRegistro, valor: string) => void
}

/** Paso 3: el administrador general de la tienda y el resumen de lo que se va a crear. */
export function PasoAdministrador({ admin, errores, plan, onCampo }: PasoAdministradorProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <Campo label="Nombre" obligatorio placeholder="Ej. Carlos" value={admin.nombre} onValor={(v) => onCampo('nombre', v)} error={errores.nombre} maxLength={100} autoComplete="given-name" />
        <Campo label="Apellido" obligatorio placeholder="Ej. Mendoza Vaca" value={admin.apellido} onValor={(v) => onCampo('apellido', v)} error={errores.apellido} maxLength={100} autoComplete="family-name" />
        <Campo
          className="sm:col-span-2"
          label="Correo electrónico de acceso"
          obligatorio
          type="email"
          placeholder="admin@tuempresa.bo"
          ayuda="Se utilizará para iniciar sesión en el sistema."
          value={admin.email}
          onValor={(v) => onCampo('email', v)}
          error={errores.email}
          maxLength={150}
          autoComplete="email"
        />
        <Campo
          label="Celular / teléfono de recuperación"
          placeholder="Ej. +591 76012345"
          inputMode="tel"
          value={admin.telefono}
          onValor={(v) => onCampo('telefono', v)}
          error={errores.telefono}
          maxLength={20}
          autoComplete="tel"
        />
        <Campo
          label="Contraseña de administrador"
          obligatorio
          type="password"
          placeholder="Mínimo 8 caracteres"
          ayuda="Mínimo 8 caracteres, con letras y números."
          value={admin.password}
          onValor={(v) => onCampo('password', v)}
          error={errores.password}
          maxLength={72}
          autoComplete="new-password"
        />
      </div>

      <dl className="grid gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm sm:grid-cols-3 dark:border-neutral-800 dark:bg-neutral-800/40">
        <div>
          <dt className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Plan a aprovisionar</dt>
          <dd className="mt-1 font-semibold">
            {plan.nombre} ({plan.esPrueba ? `${plan.duracionDias} días` : 'mensual'})
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Total a pagar</dt>
          <dd className="mt-1 font-semibold">
            {plan.esPrueba ? `Bs 0 (prueba gratuita de ${plan.duracionDias} días)` : `${formatoBs(plan.precio)} / ${periodoDelPlan(plan)}`}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Rol asignado automáticamente</dt>
          <dd className="mt-1 font-semibold">ADMINISTRADOR (acceso total)</dd>
        </div>
      </dl>
      {!plan.esPrueba && (
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Al continuar irás a Stripe para pagar con tarjeta. Stripe cobra el equivalente en dólares. Tu tienda se crea en cuanto se confirma el pago.
        </p>
      )}
    </div>
  )
}
