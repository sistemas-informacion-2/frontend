import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react'

interface CampoProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string
  obligatorio?: boolean
  ayuda?: ReactNode
  error?: string | null
  /** Texto fijo antes del valor (p. ej. la URL de la tienda). */
  prefijo?: string
  onValor: (valor: string) => void
}

const BASE =
  'w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 disabled:bg-neutral-100 disabled:text-neutral-500 dark:bg-neutral-900 dark:text-white dark:placeholder:text-neutral-500 dark:focus:border-white dark:focus:ring-white/10 dark:disabled:bg-neutral-800'

/** Campo de texto del portal, con etiqueta, ayuda, error y modo oscuro. */
export function Campo({ label, obligatorio, ayuda, error, prefijo, onValor, type = 'text', className = '', ...rest }: CampoProps) {
  const id = useId()
  const [visible, setVisible] = useState(false)
  const esPassword = type === 'password'
  const borde = error ? 'border-red-500 dark:border-red-500' : 'border-neutral-300 dark:border-neutral-700'

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
        {label}
        {obligatorio && <span className="text-red-600 dark:text-red-400"> *</span>}
      </label>
      <div className="relative flex">
        {prefijo && (
          <span className="inline-flex shrink-0 items-center rounded-l-lg border border-r-0 border-neutral-300 bg-neutral-50 px-3 text-sm text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400">
            {prefijo}
          </span>
        )}
        <input
          id={id}
          type={esPassword && visible ? 'text' : type}
          required={obligatorio}
          aria-invalid={error ? true : undefined}
          aria-describedby={ayuda || error ? `${id}-ayuda` : undefined}
          onChange={(event) => onValor(event.target.value)}
          className={`${BASE} ${borde} ${prefijo ? 'min-w-0 rounded-l-none' : ''} ${esPassword ? 'pr-11' : ''}`}
          {...rest}
        />
        {esPassword && (
          <button
            type="button"
            onClick={() => setVisible((actual) => !actual)}
            className="absolute inset-y-0 right-0 px-3 text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
            aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {visible ? 'Ocultar' : 'Ver'}
          </button>
        )}
      </div>
      {(error || ayuda) && (
        <p id={`${id}-ayuda`} className={`text-xs ${error ? 'text-red-600 dark:text-red-400' : 'text-neutral-500 dark:text-neutral-400'}`}>
          {error || ayuda}
        </p>
      )}
    </div>
  )
}

interface SelectorProps {
  label: string
  obligatorio?: boolean
  valor: string
  opciones: Array<{ valor: string; texto: string }>
  onValor?: (valor: string) => void
  disabled?: boolean
  ayuda?: ReactNode
}

export function Selector({ label, obligatorio, valor, opciones, onValor, disabled, ayuda }: SelectorProps) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
        {label}
        {obligatorio && <span className="text-red-600 dark:text-red-400"> *</span>}
      </label>
      <select
        id={id}
        value={valor}
        disabled={disabled}
        onChange={(event) => onValor?.(event.target.value)}
        className={`${BASE} border-neutral-300 dark:border-neutral-700`}
      >
        {opciones.map((opcion) => (
          <option key={opcion.valor} value={opcion.valor}>
            {opcion.texto}
          </option>
        ))}
      </select>
      {ayuda && <p className="text-xs text-neutral-500 dark:text-neutral-400">{ayuda}</p>}
    </div>
  )
}
