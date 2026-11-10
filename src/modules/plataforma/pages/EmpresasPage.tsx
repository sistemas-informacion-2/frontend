import { type FormEvent, useState } from 'react'
import useSWR from 'swr'
import { env } from '@/core/config/env'
import { getApiErrorMessage } from '@/core/http/errors'
import { useAuthStore } from '@/core/store/authStore'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { Modal } from '@/shared/components/ui/Modal'
import { actualizarEmpresa, cambiarEstadoEmpresa, crearEmpresa, listarEmpresas } from '../api/plataforma.api'
import type { Empresa } from '../types'

/** Panel del superadmin: alta de empresas, marca y suspension. */
export function EmpresasPage() {
  const { data: empresas, error, isLoading, mutate } = useSWR('plataforma/empresas', listarEmpresas)
  const [creando, setCreando] = useState(false)
  const [editando, setEditando] = useState<Empresa | null>(null)
  const [accion, setAccion] = useState<string | null>(null)
  const perfil = useAuthStore((state) => state.perfil)
  const clear = useAuthStore((state) => state.clear)

  const alternarEstado = async (empresa: Empresa) => {
    const suspender = empresa.estado === 'ACTIVA'
    if (suspender && !window.confirm(`¿Suspender "${empresa.nombre}"? Su tienda y su panel dejan de responder hasta que la reactives. No se borra nada.`)) return
    setAccion(null)
    try {
      await cambiarEstadoEmpresa(empresa.id, suspender ? 'SUSPENDIDA' : 'ACTIVA')
      await mutate()
    } catch (err) {
      setAccion(getApiErrorMessage(err, 'No se pudo cambiar el estado'))
    }
  }

  return (
    <div className="min-h-svh bg-neutral-50 dark:bg-neutral-950">
      <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900 sm:px-6">
        <span className="font-semibold text-neutral-900 dark:text-neutral-100">{env.appName} · Plataforma</span>
        <div className="flex items-center gap-3 text-sm text-neutral-500">
          <span className="hidden sm:inline">{perfil?.email}</span>
          <Button variant="secondary" onClick={clear}>
            Salir
          </Button>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-6 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Empresas</h1>
          <Button onClick={() => setCreando(true)}>Nueva empresa</Button>
        </div>
        {accion && <p className="text-sm text-red-600" role="alert">{accion}</p>}
        {error && <p className="text-sm text-red-600">{getApiErrorMessage(error, 'No se pudieron cargar las empresas')}</p>}
        {isLoading && <p className="text-sm text-neutral-500">Cargando…</p>}

        {empresas && (
          <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-neutral-200 text-neutral-500 dark:border-neutral-800">
                <tr>
                  <th className="px-4 py-3 font-medium">Empresa</th>
                  <th className="px-4 py-3 font-medium">Tienda</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {empresas.map((empresa) => (
                  <tr key={empresa.id} className="border-b border-neutral-100 last:border-0 dark:border-neutral-800">
                    <td className="px-4 py-3">
                      <div className="font-medium text-neutral-900 dark:text-neutral-100">{empresa.nombre}</div>
                      <div className="text-xs text-neutral-500">{empresa.nit ? `NIT ${empresa.nit}` : 'Sin NIT'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <a href={`/t/${empresa.slug}`} target="_blank" rel="noreferrer" className="underline">
                        /t/{empresa.slug}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={empresa.estado === 'ACTIVA' ? 'success' : 'danger'}>{empresa.estado === 'ACTIVA' ? 'Activa' : 'Suspendida'}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setEditando(empresa)}>
                          Editar
                        </Button>
                        <Button variant="secondary" onClick={() => void alternarEstado(empresa)}>
                          {empresa.estado === 'ACTIVA' ? 'Suspender' : 'Reactivar'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <CrearEmpresaModal open={creando} onClose={() => setCreando(false)} onCreada={() => void mutate()} />
      {editando && <EditarEmpresaModal empresa={editando} onClose={() => setEditando(null)} onGuardada={() => void mutate()} />}
    </div>
  )
}

const VACIO = { slug: '', nombre: '', nit: '', adminNombre: '', adminApellido: '', adminEmail: '', adminPassword: '' }

function CrearEmpresaModal({ open, onClose, onCreada }: { open: boolean; onClose: () => void; onCreada: () => void }) {
  const [form, setForm] = useState(VACIO)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const set = (campo: keyof typeof VACIO) => (event: { target: { value: string } }) => setForm({ ...form, [campo]: event.target.value })

  const cerrar = () => {
    setForm(VACIO)
    setError(null)
    onClose()
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await crearEmpresa({
        slug: form.slug.trim(),
        nombre: form.nombre.trim(),
        nit: form.nit.trim() || undefined,
        admin: { nombre: form.adminNombre.trim(), apellido: form.adminApellido.trim(), email: form.adminEmail.trim(), password: form.adminPassword },
      })
      onCreada()
      cerrar()
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo crear la empresa'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} title="Nueva empresa" onClose={cerrar} maxWidthClassName="sm:max-w-lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-sm text-neutral-500">
          Se crea lista para operar: roles base, su administrador, métodos de pago (Stripe apagado), categorías y temporadas.
        </p>
        <Input label="Nombre" value={form.nombre} onChange={set('nombre')} required maxLength={120} />
        <Input
          label="Slug (dirección de la tienda)"
          value={form.slug}
          onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })}
          required
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          title="Solo minúsculas, números y guiones (ej. moda-andina)"
          minLength={3}
          maxLength={60}
          placeholder="moda-andina"
        />
        <p className="-mt-2 text-xs text-neutral-500">La tienda quedará en /t/{form.slug || 'slug'}. No se puede cambiar después.</p>
        <Input label="NIT (opcional)" value={form.nit} onChange={set('nit')} maxLength={30} />
        <fieldset className="flex flex-col gap-3 rounded-md border border-neutral-200 p-3 dark:border-neutral-800">
          <legend className="px-1 text-sm font-medium">Administrador de la tienda</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Nombre del admin" value={form.adminNombre} onChange={set('adminNombre')} required maxLength={100} />
            <Input label="Apellido del admin" value={form.adminApellido} onChange={set('adminApellido')} required maxLength={100} />
          </div>
          <Input label="Correo del admin" type="email" value={form.adminEmail} onChange={set('adminEmail')} required maxLength={150} />
          <Input label="Contraseña inicial" type="password" value={form.adminPassword} onChange={set('adminPassword')} required minLength={8} autoComplete="new-password" />
        </fieldset>
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={cerrar}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading}>
            Crear empresa
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function EditarEmpresaModal({ empresa, onClose, onGuardada }: { empresa: Empresa; onClose: () => void; onGuardada: () => void }) {
  const [nombre, setNombre] = useState(empresa.nombre)
  const [nit, setNit] = useState(empresa.nit ?? '')
  const [logoUrl, setLogoUrl] = useState(empresa.logoUrl ?? '')
  const [color, setColor] = useState(empresa.colorPrimario ?? '#171717')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await actualizarEmpresa(empresa.id, { nombre: nombre.trim(), nit: nit.trim(), logoUrl: logoUrl.trim(), colorPrimario: color })
      onGuardada()
      onClose()
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo guardar'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open title={`Editar ${empresa.nombre}`} onClose={onClose} maxWidthClassName="sm:max-w-lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required maxLength={120} />
        <Input label="NIT" value={nit} onChange={(e) => setNit(e.target.value)} maxLength={30} />
        <Input label="URL del logo" type="url" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} maxLength={500} placeholder="https://…" />
        <label className="flex items-center gap-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Color de la marca
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-9 w-14 cursor-pointer rounded border border-neutral-300" />
          <span className="font-mono text-xs text-neutral-500">{color}</span>
        </label>
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading}>
            Guardar
          </Button>
        </div>
      </form>
    </Modal>
  )
}
