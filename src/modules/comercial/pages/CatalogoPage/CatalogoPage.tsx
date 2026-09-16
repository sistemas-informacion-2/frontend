import { useAuthStore } from '@/core/store/authStore'
import { useCategorias, useProductos } from '@/modules/inventario/api'
import { CatalogoPageView } from './CatalogoPage.view'

export function CatalogoPage() {
  const { categorias, isLoading: cargandoCategorias } = useCategorias()
  const { productos, isLoading: cargandoProductos } = useProductos()
  const estaAutenticado = useAuthStore((state) => state.isAuthenticated)

  return (
    <CatalogoPageView
      categorias={categorias}
      productos={productos}
      cargando={cargandoCategorias || cargandoProductos}
      mostrarInvitacionAdmin={!estaAutenticado}
    />
  )
}
