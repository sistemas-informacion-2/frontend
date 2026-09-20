import type { AxiosResponse } from 'axios'
import { httpClient } from '@/core/http/httpClient'
import type { Envelope } from '@/core/http/envelope'

interface ImagenSubida {
  url: string
}

export async function subirImagen(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  const response = await httpClient.post<Envelope<ImagenSubida>, AxiosResponse<Envelope<ImagenSubida>>>(
    '/inventario/archivos/imagenes',
    formData,
  )
  return response.data.data.url
}