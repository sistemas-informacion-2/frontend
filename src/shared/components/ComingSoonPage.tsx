import { EmptyState } from '@/shared/components/ui/EmptyState'

export function ComingSoonPage() {
  return (
    <EmptyState
      icon={<span className="text-4xl">🚧</span>}
      title="Módulo en construcción"
      description="Esta sección se habilitará en un próximo ciclo de desarrollo."
    />
  )
}
