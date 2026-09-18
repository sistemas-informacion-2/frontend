import { httpClient } from '@/core/http/httpClient'
import type { Categoria, CategoriaFormValues, CategoriaPlana } from '../types'

interface Envelope<T> {
  data: T
  timestamp?: string
}

export async function listarCategoriasTodas(): Promise<Categoria[]> {
  const response = await httpClient.get<Envelope<Categoria[]>>('/inventario/categorias/todas')
  return response.data.data
}

export async function crearCategoria(values: CategoriaFormValues): Promise<Categoria> {
  const response = await httpClient.post<Envelope<Categoria>>('/inventario/categorias', {
    nombre: values.nombre,
    slug: values.slug,
    descripcion: values.descripcion || undefined,
    imagenUrl: values.imagenUrl || undefined,
    categoriaPadreId: values.categoriaPadreId || undefined,
    temporadaIds: values.temporadaIds,
  })
  return response.data.data
}

export async function actualizarCategoria(id: number, values: CategoriaFormValues): Promise<Categoria> {
  const response = await httpClient.put<Envelope<Categoria>>(`/inventario/categorias/${id}`, {
    nombre: values.nombre,
    slug: values.slug,
    descripcion: values.descripcion || undefined,
    imagenUrl: values.imagenUrl || undefined,
    categoriaPadreId: values.categoriaPadreId || null,
    activo: values.activo,
    temporadaIds: values.temporadaIds,
  })
  return response.data.data
}

/** Aplana el árbol en una lista ordenada con el nivel de anidamiento, para selects y tablas. */
export function aplanarCategorias(categorias: Categoria[], nivel = 0): CategoriaPlana[] {
  const resultado: CategoriaPlana[] = []
  for (const categoria of categorias) {
    resultado.push({ id: categoria.id, nombre: categoria.nombre, nivel })
    resultado.push(...aplanarCategorias(categoria.hijos, nivel + 1))
  }
  return resultado
}

/** IDs de una categoría y todos sus descendientes, para evitar que se elija a sí misma o a un hijo como padre. */
export function obtenerDescendientesIds(categoria: Categoria): Set<number> {
  const ids = new Set<number>([categoria.id])
  for (const hijo of categoria.hijos) {
    for (const id of obtenerDescendientesIds(hijo)) ids.add(id)
  }
  return ids
}

export function buscarCategoriaPorId(categorias: Categoria[], id: number): Categoria | null {
  for (const categoria of categorias) {
    if (categoria.id === id) return categoria
    const encontrada = buscarCategoriaPorId(categoria.hijos, id)
    if (encontrada) return encontrada
  }
  return null
}

export function generarSlug(nombre: string): string {
  return nombre
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
