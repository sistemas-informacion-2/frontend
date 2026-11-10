import { IconoEscudo } from '../Iconos'
import { Campo, Selector } from '../Campo'
import type { EmpresaRegistro } from '../../types'
import { CIUDADES_BOLIVIA, type Errores } from '../../utils/registro'

export type EstadoSlug = { estado: 'vacio' | 'revisando' | 'libre' | 'ocupado'; motivo?: string | null }

interface PasoEmpresaProps {
  empresa: EmpresaRegistro
  errores: Errores<EmpresaRegistro>
  estadoSlug: EstadoSlug
  onCampo: (campo: keyof EmpresaRegistro, valor: string) => void
}

/** Paso 2: datos legales y operativos de la empresa y la direccion de su tienda. */
export function PasoEmpresa({ empresa, errores, estadoSlug, onCampo }: PasoEmpresaProps) {
  const ayudaSlug =
    estadoSlug.estado === 'revisando'
      ? 'Revisando…'
      : estadoSlug.estado === 'libre'
        ? `✓ Disponible. Tu tienda quedará en ${window.location.host}/t/${empresa.slug}`
        : 'La dirección pública de tu tienda. No se puede cambiar después.'

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Campo
        className="sm:col-span-2"
        label="Razón social legal"
        obligatorio
        placeholder="Ej. ASUS BOLIVIA TECH SOLUTIONS S.R.L."
        ayuda="Nombre legal registrado ante Impuestos Nacionales."
        value={empresa.razonSocial}
        onValor={(valor) => onCampo('razonSocial', valor)}
        error={errores.razonSocial}
        maxLength={150}
        autoComplete="organization"
      />
      <Campo
        label="Nombre comercial / marca"
        placeholder="Ej. ASUS Tech Bolivia"
        ayuda="Es el nombre que verán tus clientes. Si lo dejas vacío, usamos la razón social."
        value={empresa.nombreComercial}
        onValor={(valor) => onCampo('nombreComercial', valor)}
        maxLength={120}
      />
      <Campo
        label="NIT (Número de Identificación Tributaria)"
        obligatorio
        placeholder="Ej. 3049182019"
        inputMode="numeric"
        value={empresa.nit}
        onValor={(valor) => onCampo('nit', valor.replace(/\D/g, ''))}
        error={errores.nit}
        maxLength={15}
      />
      <Selector label="País" obligatorio valor={empresa.pais} opciones={[{ valor: 'Bolivia', texto: 'Bolivia' }]} disabled ayuda="Por ahora operamos solo en Bolivia." />
      <div>
        <Campo
          label="Ciudad de sede principal"
          obligatorio
          placeholder="Escribe tu ciudad"
          list="ciudades-bolivia"
          value={empresa.ciudad}
          onValor={(valor) => onCampo('ciudad', valor)}
          error={errores.ciudad}
          maxLength={80}
          autoComplete="address-level2"
        />
        <datalist id="ciudades-bolivia">
          {CIUDADES_BOLIVIA.map((ciudad) => (
            <option key={ciudad} value={ciudad} />
          ))}
        </datalist>
      </div>
      <Selector label="Moneda principal" valor="BOB" opciones={[{ valor: 'BOB', texto: 'Boliviano (BOB)' }]} disabled ayuda="Toda la tienda trabaja en bolivianos." />
      <Campo
        label="Teléfono / PBX de la empresa"
        placeholder="Ej. 33458900"
        inputMode="tel"
        value={empresa.telefono}
        onValor={(valor) => onCampo('telefono', valor)}
        error={errores.telefono}
        maxLength={20}
        autoComplete="tel"
      />
      <Campo
        className="sm:col-span-2"
        label="Dirección de la casa matriz"
        placeholder="Ej. Av. San Martín esq. Calle 4 Oeste, Equipetrol"
        value={empresa.direccion}
        onValor={(valor) => onCampo('direccion', valor)}
        maxLength={200}
        autoComplete="street-address"
      />
      <Campo
        className="sm:col-span-2"
        label="Dirección de tu tienda"
        obligatorio
        prefijo="/t/"
        placeholder="asus-tech-bolivia"
        value={empresa.slug}
        onValor={(valor) => onCampo('slug', valor.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
        error={errores.slug ?? (estadoSlug.estado === 'ocupado' ? estadoSlug.motivo ?? 'Esa dirección no está disponible.' : null)}
        ayuda={ayudaSlug}
        maxLength={60}
      />

      <div className="flex gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4 sm:col-span-2 dark:border-neutral-800 dark:bg-neutral-800/40">
        <IconoEscudo className="mt-0.5 h-5 w-5 shrink-0" />
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          <strong className="font-semibold text-neutral-900 dark:text-white">Tus datos, solo tuyos.</strong> Cada consulta del sistema se filtra por tu
          empresa: ningún otro cliente puede ver tus productos, ventas ni clientes.
        </p>
      </div>
    </div>
  )
}
