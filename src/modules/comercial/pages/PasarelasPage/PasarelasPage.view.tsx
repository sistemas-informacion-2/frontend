import type { ReactNode } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { Input } from '@/shared/components/ui/Input'
import { Modal } from '@/shared/components/ui/Modal'
import { Select } from '@/shared/components/ui/Select'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import type { IntegracionPago, Pasarela } from '@/modules/comercial/types'

type CanalFiltro = '' | 'presencial' | 'linea'

interface PasarelasPageViewProps {
  pasarelas: Pasarela[]
  loading: boolean
  error: string | null
  search: string
  integracion: '' | IntegracionPago
  canal: CanalFiltro
  canManage: boolean
  modal: ReactNode
  onSearch: (value: string) => void
  onIntegracion: (value: '' | IntegracionPago) => void
  onCanal: (value: CanalFiltro) => void
  onCreate: () => void
  onEdit: (pasarela: Pasarela) => void
  onToggleCanal: (pasarela: Pasarela, canal: 'presencial' | 'linea') => void
  onCloseModal: () => void
}

export function PasarelasPageView({
  pasarelas,
  loading,
  error,
  search,
  integracion,
  canal,
  canManage,
  modal,
  onSearch,
  onIntegracion,
  onCanal,
  onCreate,
  onEdit,
  onToggleCanal,
  onCloseModal,
}: PasarelasPageViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Métodos de pago</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Habilita cada método para cobrar en caja (presencial) o en la tienda en línea.
          </p>
        </div>
        {canManage && <Button onClick={onCreate}>Nuevo método</Button>}
      </div>

      <section className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="grid gap-4 md:grid-cols-3">
          <Input label="Buscar" placeholder="Código o nombre" value={search} onChange={(event) => onSearch(event.target.value)} />
          <Select label="Integración" value={integracion} onChange={(event) => onIntegracion(event.target.value as '' | IntegracionPago)}>
            <option value="">Todas</option>
            <option value="NINGUNA">Ninguna</option>
            <option value="API">API / pasarela</option>
          </Select>
          <Select label="Canal" value={canal} onChange={(event) => onCanal(event.target.value as CanalFiltro)}>
            <option value="">Todos</option>
            <option value="presencial">Presencial</option>
            <option value="linea">En línea</option>
          </Select>
        </div>
      </section>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}

      <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-14 w-full" />)}
          </div>
        ) : pasarelas.length === 0 ? (
          <div className="p-4">
            <EmptyState title="No hay métodos de pago" description="No se encontraron métodos con los filtros seleccionados." action={canManage ? <Button onClick={onCreate}>Crear método</Button> : undefined} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Código</th>
                  <th className="px-4 py-3 font-medium">Método</th>
                  <th className="px-4 py-3 font-medium">Integración</th>
                  <th className="px-4 py-3 font-medium">Comisión</th>
                  <th className="px-4 py-3 font-medium">Credenciales</th>
                  <th className="px-4 py-3 font-medium">Presencial</th>
                  <th className="px-4 py-3 font-medium">En línea</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {pasarelas.map((pasarela) => (
                  <tr key={pasarela.id} className="text-neutral-700 dark:text-neutral-300">
                    <td className="px-4 py-3 font-mono text-xs text-neutral-500 dark:text-neutral-400">{pasarela.codigo}</td>
                    <td className="px-4 py-3 font-medium text-neutral-900 dark:text-white">{pasarela.metodo}</td>
                    <td className="px-4 py-3">{pasarela.integracion === 'API' ? 'API' : 'Ninguna'}</td>
                    <td className="px-4 py-3">{pasarela.comisionPorcentaje}%</td>
                    <td className="px-4 py-3">
                      {pasarela.integracion === 'API' ? (pasarela.tieneApiKey ? 'Configuradas' : 'Pendientes') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        aria-label={`Habilitar ${pasarela.metodo} en presencial`}
                        className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 disabled:opacity-50 dark:border-neutral-700"
                        checked={pasarela.disponiblePresencial}
                        disabled={!canManage}
                        onChange={() => onToggleCanal(pasarela, 'presencial')}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        aria-label={`Habilitar ${pasarela.metodo} en línea`}
                        className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 disabled:opacity-50 dark:border-neutral-700"
                        checked={pasarela.disponibleLinea}
                        disabled={!canManage}
                        onChange={() => onToggleCanal(pasarela, 'linea')}
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canManage && (
                        <button type="button" onClick={() => onEdit(pasarela)} className="text-sm font-medium text-neutral-700 underline hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white">Editar</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal open={!!modal} title={modal ? 'Gestionar método de pago' : ''} onClose={onCloseModal}>
        {modal}
      </Modal>
    </div>
  )
}
