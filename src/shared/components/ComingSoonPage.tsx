import { Construction } from 'lucide-react'
import { EmptyState } from '@/shared/components/ui/EmptyState'

export function ComingSoonPage() {
  return (
    <EmptyState
      icon={<Construction className="h-7 w-7" strokeWidth={1.5} aria-hidden="true" />}
      title="Módulo en construcción"
      description="Esta sección se habilitará en un próximo ciclo de desarrollo."
    />
  )
}
