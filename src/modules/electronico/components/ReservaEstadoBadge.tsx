import { Badge } from '@/shared/components/ui/Badge'
import type { EstadoReserva } from '../types'

const ESTADOS: Record<EstadoReserva, { label: string; tone: 'success' | 'warning' | 'danger' | 'neutral' }> = {
  PENDIENTE: { label: 'Pendiente de anticipo', tone: 'warning' },
  PAGADA: { label: 'Anticipo pagado', tone: 'neutral' },
  COMPLETADA: { label: 'Completada', tone: 'success' },
  CANCELADA: { label: 'Cancelada', tone: 'danger' },
}

export function ReservaEstadoBadge({ estado }: { estado: EstadoReserva }) {
  const { label, tone } = ESTADOS[estado]
  return <Badge tone={tone}>{label}</Badge>
}
