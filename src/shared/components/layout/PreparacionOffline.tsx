import { useEstadoOffline } from '@/core/offline/estadoOffline'
import { useEnLinea } from '@/modules/electronico/hooks'

/** Dice si ya se puede cortar la red: sin este aviso no hay forma de saber cuando termino la descarga. */
export function PreparacionOffline() {
  const enLinea = useEnLinea()
  const preparacion = useEstadoOffline((estado) => estado.preparacion)
  const hechas = useEstadoOffline((estado) => estado.hechas)
  const total = useEstadoOffline((estado) => estado.total)
  if (!enLinea || preparacion === 'inactiva') return null

  const vista = {
    preparando: { texto: `Preparando modo sin conexión… ${total > 0 ? `${hechas}/${total}` : ''}`, clase: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200' },
    lista: { texto: 'Listo para usar sin conexión', clase: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' },
    incompleta: { texto: 'Modo sin conexión incompleto', clase: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200' },
  }[preparacion]

  return (
    <span role="status" className={`hidden shrink-0 rounded-full px-3 py-1 text-xs font-medium lg:inline ${vista.clase}`}>
      {vista.texto}
    </span>
  )
}
