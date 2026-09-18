import { isAxiosError } from 'axios'
import { useState, type FormEvent } from 'react'
import useSWR from 'swr'
import { useAuthStore } from '@/core/store/authStore'
import { SucursalForm } from '@/modules/operaciones/components/SucursalForm'
import {
  actualizarSucursal,
  crearCiudad,
  crearSucursal,
  listarCiudades,
  listarDepartamentos,
  listarSucursales,
} from '@/modules/operaciones/services/sucursales.service'
import type { Sucursal, SucursalFormValues } from '@/modules/operaciones/types'
import { SucursalesPageView } from './SucursalesPage.view'

const EMPTY_FORM: SucursalFormValues = {
  idCiudad: '',
  nombre: '',
  ubicacion: '',
  telefono: '',
  correo: '',
  horarioApertura: '',
  horarioCierre: '',
  activo: true,
}

export function SucursalesPage() {
  const canManage = useAuthStore((state) => state.hasPermission('operaciones:sucursales:gestionar'))
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Sucursal | null>(null)
  const [form, setForm] = useState<SucursalFormValues>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [creandoCiudad, setCreandoCiudad] = useState(false)

  const { data: sucursales = [], error: sucursalesError, isLoading, mutate } = useSWR('sucursales', listarSucursales, {
    revalidateOnFocus: false,
  })
  const { data: ciudades = [], error: ciudadesError, mutate: mutateCiudades } = useSWR('ciudades', listarCiudades, {
    revalidateOnFocus: false,
  })
  const { data: departamentos = [], error: departamentosError } = useSWR('departamentos', listarDepartamentos, {
    revalidateOnFocus: false,
  })

  const updateForm = <K extends keyof SucursalFormValues>(field: K, value: SucursalFormValues[K]) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const openCreate = () => {
    setEditing(null)
    setForm({ ...EMPTY_FORM })
    setError(null)
    setModalOpen(true)
  }

  const openEdit = (sucursal: Sucursal) => {
    setEditing(sucursal)
    setForm({
      idCiudad: sucursal.ciudadId,
      nombre: sucursal.nombre,
      ubicacion: sucursal.ubicacion,
      telefono: sucursal.telefono ?? '',
      correo: sucursal.correo ?? '',
      horarioApertura: sucursal.horarioApertura ?? '',
      horarioCierre: sucursal.horarioCierre ?? '',
      activo: sucursal.activo,
    })
    setError(null)
    setModalOpen(true)
  }

  const closeModal = () => {
    if (saving) return
    setModalOpen(false)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form.idCiudad) {
      setError('Selecciona una ciudad.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      if (editing) {
        await actualizarSucursal(editing.id, form)
      } else {
        await crearSucursal(form)
      }
      setModalOpen(false)
      await mutate()
    } catch (requestError) {
      setError(extraerMensajeError(requestError))
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActivo = async (sucursal: Sucursal) => {
    const accion = sucursal.activo ? 'deshabilitar' : 'habilitar'
    if (!window.confirm(`¿Deseas ${accion} la sucursal ${sucursal.nombre}?`)) return
    setError(null)
    try {
      await actualizarSucursal(sucursal.id, {
        idCiudad: sucursal.ciudadId,
        nombre: sucursal.nombre,
        ubicacion: sucursal.ubicacion,
        telefono: sucursal.telefono ?? '',
        correo: sucursal.correo ?? '',
        horarioApertura: sucursal.horarioApertura ?? '',
        horarioCierre: sucursal.horarioCierre ?? '',
        activo: !sucursal.activo,
      })
      await mutate()
    } catch (requestError) {
      setError(extraerMensajeError(requestError))
    }
  }

  const handleCrearCiudad = async (datos: { idDepartamento: number; nombre: string }) => {
    setCreandoCiudad(true)
    try {
      const nueva = await crearCiudad(datos)
      await mutateCiudades()
      updateForm('idCiudad', nueva.id)
    } finally {
      setCreandoCiudad(false)
    }
  }

  return (
    <SucursalesPageView
      sucursales={sucursales}
      ciudadesError={
        ciudadesError || departamentosError ? 'No se pudieron cargar las ciudades o departamentos.' : null
      }
      loading={isLoading}
      error={error || (sucursalesError ? extraerMensajeError(sucursalesError) : null)}
      canManage={canManage}
      onCreate={openCreate}
      onEdit={openEdit}
      onToggleActivo={handleToggleActivo}
      onCloseModal={closeModal}
      modal={
        modalOpen ? (
          <SucursalForm
            values={form}
            ciudades={ciudades}
            departamentos={departamentos}
            editing={!!editing}
            loading={saving}
            error={error}
            creandoCiudad={creandoCiudad}
            onChange={updateForm}
            onCrearCiudad={handleCrearCiudad}
            onSubmit={handleSubmit}
            onCancel={closeModal}
          />
        ) : null
      }
    />
  )
}

function extraerMensajeError(error: unknown): string {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message
    if (Array.isArray(message)) return message[0] ?? 'La solicitud no es válida.'
    if (typeof message === 'string') return message
  }
  return 'No se pudo completar la operación.'
}
