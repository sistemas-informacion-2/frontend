import { useId, useMemo, useState, type KeyboardEvent } from 'react'
import type { InventarioItem } from '../types'

interface VarianteComboboxProps {
  label: string
  opciones: InventarioItem[]
  value: number | ''
  onChange: (idVariante: number | '') => void
  placeholder?: string
}

/** Minúsculas y sin tildes, para que "camiseta" encuentre "Camiseta" y "poleré" encuentre "polere". */
function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

function etiqueta(opcion: InventarioItem): string {
  return `${opcion.productoNombre} (${opcion.talla}/${opcion.color})`
}

/**
 * Selector de variante con búsqueda en tiempo real. Escribe parte del nombre, la talla, el color o el SKU (en
 * cualquier orden: "polera negra M") y la lista se filtra al instante. Se maneja también con el teclado.
 */
export function VarianteCombobox({ label, opciones, value, onChange, placeholder = 'Busca por nombre, talla, color o SKU' }: VarianteComboboxProps) {
  const id = useId()
  const listaId = `${id}-lista`
  const [abierto, setAbierto] = useState(false)
  const [consulta, setConsulta] = useState('')
  const [resaltado, setResaltado] = useState(0)

  const seleccionada = value === '' ? undefined : opciones.find((opcion) => opcion.idVarianteProducto === value)

  const filtradas = useMemo(() => {
    const terminos = normalizar(consulta).split(/\s+/).filter(Boolean)
    if (terminos.length === 0) return opciones
    return opciones.filter((opcion) => {
      const texto = normalizar(`${opcion.productoNombre} ${opcion.talla} ${opcion.color} ${opcion.sku}`)
      return terminos.every((termino) => texto.includes(termino))
    })
  }, [opciones, consulta])

  const abrir = () => {
    setConsulta('')
    setResaltado(0)
    setAbierto(true)
  }

  const cerrar = () => {
    setAbierto(false)
    setConsulta('')
  }

  const elegir = (opcion: InventarioItem) => {
    onChange(opcion.idVarianteProducto)
    cerrar()
  }

  const alPulsar = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!abierto) return abrir()
      const paso = event.key === 'ArrowDown' ? 1 : -1
      setResaltado((actual) => (filtradas.length === 0 ? 0 : (actual + paso + filtradas.length) % filtradas.length))
    } else if (event.key === 'Enter') {
      // Dentro de un formulario, Enter enviaría la venta: aquí solo confirma la opción resaltada.
      event.preventDefault()
      if (abierto && filtradas[resaltado]) elegir(filtradas[resaltado])
    } else if (event.key === 'Escape') {
      if (abierto) {
        event.preventDefault()
        // Escape también cierra el modal que contiene el formulario: se frena para cerrar solo la lista.
        event.stopPropagation()
        cerrar()
      }
    }
  }

  return (
    <div className="relative flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={abierto}
          aria-controls={listaId}
          aria-autocomplete="list"
          autoComplete="off"
          value={abierto ? consulta : seleccionada ? etiqueta(seleccionada) : ''}
          placeholder={abierto || !seleccionada ? placeholder : undefined}
          onFocus={abrir}
          onBlur={cerrar}
          onChange={(event) => {
            setConsulta(event.target.value)
            setResaltado(0)
            setAbierto(true)
          }}
          onKeyDown={alPulsar}
          className="w-full min-w-0 truncate rounded-md border border-neutral-300 bg-white py-2.5 pl-3 pr-9 text-sm outline-none transition-colors focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:focus:border-white"
        />
        {seleccionada && !abierto ? (
          <button
            type="button"
            aria-label="Quitar la variante elegida"
            // mouseDown evita que el input pierda el foco antes de procesar el clic.
            onMouseDown={(event) => {
              event.preventDefault()
              onChange('')
            }}
            className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
          >
            ✕
          </button>
        ) : (
          <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 flex w-9 items-center justify-center text-neutral-400">
            🔍
          </span>
        )}
      </div>

      {abierto && (
        <ul
          id={listaId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-30 mt-1 max-h-60 overflow-y-auto rounded-md border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
        >
          {filtradas.length === 0 ? (
            <li className="px-3 py-2 text-sm text-neutral-500 dark:text-neutral-400">Sin resultados para “{consulta.trim()}”</li>
          ) : (
            filtradas.map((opcion, indice) => (
              <li
                key={opcion.idVarianteProducto}
                role="option"
                aria-selected={opcion.idVarianteProducto === value}
                // mouseDown y no click: así la selección ocurre antes de que el input pierda el foco y cierre la lista.
                onMouseDown={(event) => {
                  event.preventDefault()
                  elegir(opcion)
                }}
                onMouseEnter={() => setResaltado(indice)}
                className={`flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-sm ${
                  indice === resaltado ? 'bg-neutral-100 dark:bg-neutral-800' : ''
                } ${opcion.idVarianteProducto === value ? 'font-semibold' : ''} text-neutral-900 dark:text-white`}
              >
                <span className="min-w-0 truncate">{etiqueta(opcion)}</span>
                <span className="shrink-0 text-xs text-neutral-500 dark:text-neutral-400">stock {opcion.stockDisponible}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
