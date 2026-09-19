import { isAxiosError } from 'axios'
import { useState, type FormEvent } from 'react'
import useSWR from 'swr'
import { useAuthStore } from '@/core/store/authStore'
import { cambiarPassword, obtenerPerfil, actualizarPerfil } from '@/modules/acceso/services/perfil.service'
import type {
  CambiarPasswordFormValues,
  CambiarPasswordPayload,
  Perfil,
  PerfilFormValues,
} from '@/modules/acceso/types'
import { PerfilPageView } from './PerfilPage.view'

const EMPTY_PASSWORD_FORM: CambiarPasswordFormValues = {
  passwordActual: '',
  nuevaPassword: '',
  confirmarPassword: '',
}

export function PerfilPage() {
  const setPerfil = useAuthStore((state) => state.setPerfil)
  const { data, error, isLoading, mutate } = useSWR('perfil', obtenerPerfil, { revalidateOnFocus: false })

  const [form, setForm] = useState<PerfilFormValues>({ nombre: '', apellido: '', telefono: '', direccion: '' })
  const [savingPerfil, setSavingPerfil] = useState(false)
  const [perfilError, setPerfilError] = useState<string | null>(null)
  const [perfilSuccess, setPerfilSuccess] = useState<string | null>(null)

  const [passwordForm, setPasswordForm] = useState<CambiarPasswordFormValues>({ ...EMPTY_PASSWORD_FORM })
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)

  const [editing, setEditing] = useState(false)
  const [editingPassword, setEditingPassword] = useState(false)

  const [syncedPerfil, setSyncedPerfil] = useState<Perfil | undefined>(undefined)
  if (data && data !== syncedPerfil) {
    setSyncedPerfil(data)
    setForm({
      nombre: data.nombre,
      apellido: data.apellido,
      telefono: data.telefono ?? '',
      direccion: data.direccion ?? '',
    })
  }

  const updateForm = <K extends keyof PerfilFormValues>(field: K, value: PerfilFormValues[K]) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const updatePasswordForm = <K extends keyof CambiarPasswordFormValues>(
    field: K,
    value: CambiarPasswordFormValues[K],
  ) => {
    setPasswordForm((current) => ({ ...current, [field]: value }))
  }

  const openEdit = () => {
    setPerfilError(null)
    setPerfilSuccess(null)
    setEditing(true)
  }

  const cancelEdit = () => {
    if (data) {
      setForm({
        nombre: data.nombre,
        apellido: data.apellido,
        telefono: data.telefono ?? '',
        direccion: data.direccion ?? '',
      })
    }
    setPerfilError(null)
    setEditing(false)
  }

  const openPassword = () => {
    setPasswordError(null)
    setPasswordSuccess(null)
    setEditingPassword(true)
  }

  const cancelPassword = () => {
    setPasswordForm({ ...EMPTY_PASSWORD_FORM })
    setPasswordError(null)
    setEditingPassword(false)
  }

  const handleSubmitPerfil = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSavingPerfil(true)
    setPerfilError(null)
    setPerfilSuccess(null)

    try {
      const actualizado = await actualizarPerfil({
        nombre: form.nombre,
        apellido: form.apellido,
        telefono: form.telefono || null,
        ...(data?.tipoUsuario === 'C' ? { direccion: form.direccion || null } : {}),
      })
      setPerfil(actualizado)
      await mutate(actualizado, false)
      setPerfilSuccess('Datos actualizados correctamente.')
      setEditing(false)
    } catch (requestError) {
      setPerfilError(extraerMensajeError(requestError))
    } finally {
      setSavingPerfil(false)
    }
  }

  const handleSubmitPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(null)

    if (passwordForm.nuevaPassword !== passwordForm.confirmarPassword) {
      setPasswordError('La confirmación no coincide con la nueva contraseña.')
      return
    }

    setSavingPassword(true)
    try {
      const payload: CambiarPasswordPayload = {
        passwordActual: passwordForm.passwordActual,
        nuevaPassword: passwordForm.nuevaPassword,
      }
      await cambiarPassword(payload)
      setPasswordForm({ ...EMPTY_PASSWORD_FORM })
      setPasswordSuccess('Contraseña actualizada correctamente.')
      setEditingPassword(false)
    } catch (requestError) {
      setPasswordError(extraerMensajeError(requestError))
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <PerfilPageView
      perfil={data}
      loading={isLoading}
      loadError={error ? extraerMensajeError(error) : null}
      form={form}
      editing={editing}
      savingPerfil={savingPerfil}
      perfilError={perfilError}
      perfilSuccess={perfilSuccess}
      passwordForm={passwordForm}
      editingPassword={editingPassword}
      savingPassword={savingPassword}
      passwordError={passwordError}
      passwordSuccess={passwordSuccess}
      onChange={updateForm}
      onChangePassword={updatePasswordForm}
      onEdit={openEdit}
      onCancelEdit={cancelEdit}
      onEditPassword={openPassword}
      onCancelEditPassword={cancelPassword}
      onSubmitPerfil={handleSubmitPerfil}
      onSubmitPassword={handleSubmitPassword}
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
