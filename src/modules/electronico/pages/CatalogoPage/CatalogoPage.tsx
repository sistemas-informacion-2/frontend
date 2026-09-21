import { useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/core/store/authStore'
import { useTemporadasPublicas } from '../../hooks'
import { useCategorias, useProductos } from '@/modules/inventario/hooks'
import { buscarCategoriaPorId } from '@/modules/inventario/services/categorias.service'
import { CatalogoPageView, type FiltroActivo } from './CatalogoPage.view'

function leerId(valor: string | null): number | undefined {
  const id = Number(valor)
  return Number.isInteger(id) && id > 0 ? id : undefined
}

export function CatalogoPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const idCategoria = leerId(searchParams.get('categoria'))
  const idTemporada = leerId(searchParams.get('temporada'))
  const soloOfertas = searchParams.get('ofertas') === '1'
  const busqueda = searchParams.get('q')?.trim() || undefined

  const { categorias, isLoading: cargandoCategorias } = useCategorias()
  const { temporadas } = useTemporadasPublicas()
  const { productos, isLoading: cargandoProductos } = useProductos({ idCategoria, idTemporada, soloOfertas, search: busqueda })
  // Todas las ofertas (sin otros filtros) para calcular el descuento que muestra el banner.
  const { productos: ofertas } = useProductos({ soloOfertas: true })
  const estaAutenticado = useAuthStore((state) => state.isAuthenticated)

  const filtros: FiltroActivo[] = []
  if (idCategoria) {
    filtros.push({ clave: 'categoria', etiqueta: buscarCategoriaPorId(categorias, idCategoria)?.nombre ?? '…' })
  }
  if (idTemporada) {
    filtros.push({ clave: 'temporada', etiqueta: temporadas.find((temporada) => temporada.id === idTemporada)?.nombre ?? '…' })
  }

  if (busqueda) {
    filtros.push({ clave: 'q', etiqueta: `Búsqueda: ${busqueda}` })
  }
  if (soloOfertas) {
    filtros.push({ clave: 'ofertas', etiqueta: 'Ofertas' })
  }

  const quitarFiltro = (clave: FiltroActivo['clave']) => {
    const params = new URLSearchParams(searchParams)
    params.delete(clave)
    setSearchParams(params)
  }

  const descuentoMaximo = ofertas.reduce((maximo, producto) => Math.max(maximo, producto.descuentoPorcentaje), 0)
  const temporadaVigente = temporadas.find((temporada) => temporada.estado === 'VIGENTE')

  const verOfertas = () => {
    const params = new URLSearchParams(searchParams)
    params.set('ofertas', '1')
    setSearchParams(params)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <CatalogoPageView
      categorias={categorias}
      productos={productos}
      cargando={cargandoCategorias || cargandoProductos}
      mostrarInvitacionAdmin={!estaAutenticado}
      filtros={filtros}
      onQuitarFiltro={quitarFiltro}
      onQuitarTodos={() => setSearchParams({})}
      descuentoMaximo={descuentoMaximo}
      temporadaVigente={temporadaVigente?.nombre}
      onVerOfertas={verOfertas}
    />
  )
}
