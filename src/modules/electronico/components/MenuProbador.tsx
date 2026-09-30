import { Button } from '@/shared/components/ui/Button'
import { Modal } from '@/shared/components/ui/Modal'
import type { DisponibilidadIA } from '../utils/probador-ia'

export type ModoProbador = 'ar' | 'ia'

interface MenuProbadorProps {
  open: boolean
  nombreProducto: string
  disponibilidadIA: DisponibilidadIA
  onCerrar: () => void
  onElegir: (modo: ModoProbador) => void
}

/** Antes de abrir la cámara el cliente elige cómo probarse la prenda (CU19), igual que en la app móvil. */
export function MenuProbador({ open, nombreProducto, disponibilidadIA, onCerrar, onElegir }: MenuProbadorProps) {
  return (
    <Modal open={open} title="Probar prenda" onClose={onCerrar} maxWidthClassName="sm:max-w-md">
      <div className="space-y-3">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Elige cómo quieres probarte {nombreProducto}.</p>

        <OpcionProbador
          titulo="Realidad aumentada"
          descripcion="Pruébatela con la cámara: el modelo 3D de la prenda sigue tu cuerpo."
          onClick={() => onElegir('ar')}
        />
        <OpcionProbador
          titulo="Probar con IA"
          descripcion="Mírate con esta prenda en video en vivo."
          etiqueta={disponibilidadIA.habilitado ? undefined : disponibilidadIA.motivo}
          deshabilitado={!disponibilidadIA.habilitado}
          onClick={() => onElegir('ia')}
        />

        <div className="flex justify-end border-t border-neutral-200 pt-4 dark:border-neutral-800">
          <Button variant="secondary" onClick={onCerrar}>
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  )
}

interface OpcionProbadorProps {
  titulo: string
  descripcion: string
  etiqueta?: string
  deshabilitado?: boolean
  onClick: () => void
}

function OpcionProbador({ titulo, descripcion, etiqueta, deshabilitado = false, onClick }: OpcionProbadorProps) {
  return (
    <button
      type="button"
      disabled={deshabilitado}
      onClick={onClick}
      className="w-full rounded-xl border border-neutral-200 p-4 text-left transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent dark:border-neutral-700 dark:hover:bg-neutral-900"
    >
      <span className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-neutral-900 dark:text-white">{titulo}</span>
        {etiqueta && (
          <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">{etiqueta}</span>
        )}
      </span>
      <span className="mt-1 block text-sm text-neutral-500 dark:text-neutral-400">{descripcion}</span>
    </button>
  )
}
