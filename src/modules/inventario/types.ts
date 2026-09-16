export interface Categoria {
  id: number
  nombre: string
  slug: string
  categoriaPadreId: number | null
  imagenUrl: string | null
}

export interface Producto {
  id: number
  nombre: string
  precioBase: number
  imagenPrincipalUrl: string | null
}
