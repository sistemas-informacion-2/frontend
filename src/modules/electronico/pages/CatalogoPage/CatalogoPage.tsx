import { useSearchParams } from 'react-router-dom'
import { useSucursalActiva, useTemporadasPublicas } from '../../hooks'
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
  const busqueda = searchParams.get('q')?.trim() || undefined

  const { categorias, isLoading: cargandoCategorias } = useCategorias()
  const { temporadas } = useTemporadasPublicas()
  // La sucursal ya no es un filtro que se pueda "quitar": siempre hay una elegida (barra de categorías/CU08).
  const { idSucursal, isLoading: cargandoSucursal } = useSucursalActiva()
  const { productos: catalogo, isLoading: cargandoProductos } = useProductos({
    idCategoria,
    idTemporada,
    idSucursal: idSucursal ?? undefined,
    search: busqueda,
  })

  // El carrusel de Ofertas solo tiene sentido en "Todas" (sin categoría/temporada
  // ni búsqueda; la sucursal no cuenta, porque siempre hay una puesta): apenas
  // se filtra o se busca algo, desaparece. Mientras está visible, la grilla de
  // abajo excluye las prendas con descuento para no duplicarlas; en cuanto se
  // filtra/busca, esas prendas vuelven a la grilla (si no, se perderían: el
  // carrusel que las mostraba ya no está).
  const sinFiltros = !idCategoria && !idTemporada && !busqueda
  const productos = sinFiltros ? catalogo.filter((producto) => producto.descuentoPorcentaje <= 0) : catalogo

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

  const quitarFiltro = (clave: FiltroActivo['clave']) => {
    const params = new URLSearchParams(searchParams)
    params.delete(clave)
    setSearchParams(params)
  }

  return (
    <CatalogoPageView
      categorias={categorias}
      productos={productos}
      cargando={cargandoCategorias || cargandoProductos || cargandoSucursal}
      mostrarOfertas={sinFiltros}
      filtros={filtros}
      onQuitarFiltro={quitarFiltro}
      onQuitarTodos={() => setSearchParams({})}
    />
  )
}
