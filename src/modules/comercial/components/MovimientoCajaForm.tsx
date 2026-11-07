import type { FormEvent } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { Select } from '@/shared/components/ui/Select'
import { CATEGORIA_CAJA_LABEL, CATEGORIAS_MANUALES, SUBCATEGORIA_GASTO_LABEL } from '../categoriasCaja'
import type { CategoriaMovimientoCaja, MovimientoCajaFormValues, SubcategoriaGasto, TipoMovimientoCaja } from '../types'

interface MovimientoCajaFormProps {
  values: MovimientoCajaFormValues
  loading: boolean
  error: string | null
  onChange: <K extends keyof MovimientoCajaFormValues>(field: K, value: MovimientoCajaFormValues[K]) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
}

export function MovimientoCajaForm({
  values,
  loading,
  error,
  onChange,
  onSubmit,
  onCancel,
}: MovimientoCajaFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Tipo"
          value={values.tipo}
          onChange={(event) => {
            const tipo = event.target.value as TipoMovimientoCaja
            onChange('tipo', tipo)
            // Cada tipo tiene sus propias categorias: un retiro no puede ser un ingreso.
            onChange('categoria', tipo === 'INGRESO' ? 'OTRO_INGRESO' : 'GASTO_OPERATIVO')
          }}
        >
          <option value="INGRESO">Ingreso</option>
          <option value="EGRESO">Egreso</option>
        </Select>
        <Input
          label="Monto (Bs)"
          type="number"
          min={0.01}
          step="0.01"
          required
          value={values.monto}
          onChange={(event) => onChange('monto', event.target.value)}
        />
        <Select
          label="Categoría"
          value={values.categoria}
          onChange={(event) => onChange('categoria', event.target.value as CategoriaMovimientoCaja)}
        >
          {CATEGORIAS_MANUALES[values.tipo].map((categoria) => (
            <option key={categoria} value={categoria}>
              {CATEGORIA_CAJA_LABEL[categoria]}
            </option>
          ))}
        </Select>
        {values.categoria === 'GASTO_OPERATIVO' ? (
          <Select
            label="Tipo de gasto"
            required
            value={values.subcategoriaGasto}
            onChange={(event) => onChange('subcategoriaGasto', event.target.value as SubcategoriaGasto | '')}
          >
            <option value="">Elige el tipo de gasto</option>
            {(Object.keys(SUBCATEGORIA_GASTO_LABEL) as SubcategoriaGasto[]).map((subcategoria) => (
              <option key={subcategoria} value={subcategoria}>
                {SUBCATEGORIA_GASTO_LABEL[subcategoria]}
              </option>
            ))}
          </Select>
        ) : (
          <div className="hidden sm:block" />
        )}
        <div className="sm:col-span-2">
          <Input
            label="Concepto"
            required
            maxLength={150}
            value={values.concepto}
            onChange={(event) => onChange('concepto', event.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <Input
            label="Observaciones"
            maxLength={500}
            value={values.observaciones}
            onChange={(event) => onChange('observaciones', event.target.value)}
          />
        </div>
      </div>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">{error}</p>}

      <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          Registrar movimiento
        </Button>
      </div>
    </form>
  )
}
