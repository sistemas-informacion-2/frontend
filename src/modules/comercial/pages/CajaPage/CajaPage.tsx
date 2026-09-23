import { isAxiosError } from 'axios'
import { useState, type FormEvent, type ReactNode } from 'react'
import useSWR from 'swr'
import { useAppStore } from '@/core/store/appStore'
import { useAuthStore } from '@/core/store/authStore'
import { listarSucursales } from '@/modules/operaciones/services/sucursales.service'
import { CajaAperturaForm } from '@/modules/comercial/components/CajaAperturaForm'
import { CerrarCajaForm } from '@/modules/comercial/components/CerrarCajaForm'
import { MovimientoCajaForm } from '@/modules/comercial/components/MovimientoCajaForm'
import {
  abrirCaja,
  cerrarCaja,
  listarCajas,
  obtenerCajaAbierta,
  registrarMovimientoCaja,
} from '@/modules/comercial/services/caja.service'
import type { MovimientoCajaFormValues } from '@/modules/comercial/types'
import { CajaPageView } from './CajaPage.view'

type ModalKind = 'abrir' | 'movimiento' | 'cerrar' | null

const EMPTY_MOVIMIENTO: MovimientoCajaFormValues = {
  tipo: 'INGRESO',
  concepto: '',
  monto: '',
  observaciones: '',
}

export function CajaPage() {
  const perfil = useAuthStore((state) => state.perfil)
  const canManage = useAuthStore((state) => state.hasPermission('comercial:caja:gestionar'))

  // Parte de la sucursal elegida en el selector global; la caja siempre opera sobre una sucursal concreta.
  const sucursalActivaId = useAppStore((state) => state.sucursalActivaId)
  const setSucursalActiva = useAppStore((state) => state.setSucursalActiva)
  const [idSucursal, setIdSucursal] = useState<number | ''>(sucursalActivaId ?? perfil?.sucursalId ?? '')
  const [modal, setModal] = useState<ModalKind>(null)
  const [montoInicial, setMontoInicial] = useState('')
  const [movimiento, setMovimiento] = useState<MovimientoCajaFormValues>(EMPTY_MOVIMIENTO)
  const [montoFinal, setMontoFinal] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: sucursales = [] } = useSWR('sucursales-caja', listarSucursales)

  const sucursalEfectiva = typeof idSucursal === 'number' ? idSucursal : (sucursales[0]?.id ?? null)
  const sucursalNombre = sucursales.find((sucursal) => sucursal.id === sucursalEfectiva)?.nombre ?? ''

  const {
    data: cajaAbierta = null,
    isLoading: loadingAbierta,
    mutate: mutarAbierta,
  } = useSWR(sucursalEfectiva ? ['caja-abierta', sucursalEfectiva] : null, () => obtenerCajaAbierta(sucursalEfectiva as number), {
    revalidateOnFocus: false,
  })

  const {
    data: cajas = [],
    isLoading: loadingCajas,
    mutate: mutarCajas,
  } = useSWR(sucursalEfectiva ? ['cajas', sucursalEfectiva] : null, () => listarCajas({ idSucursal: sucursalEfectiva as number }), {
    keepPreviousData: true,
    revalidateOnFocus: false,
  })

  const refrescar = async () => {
    await Promise.all([mutarAbierta(), mutarCajas()])
  }

  const cerrarModal = () => {
    if (saving) return
    setModal(null)
    setError(null)
  }

  const abrirModal = (kind: ModalKind) => {
    setError(null)
    if (kind === 'abrir') setMontoInicial('0')
    if (kind === 'movimiento') setMovimiento({ ...EMPTY_MOVIMIENTO })
    if (kind === 'cerrar') setMontoFinal('')
    setModal(kind)
  }

  const handleAbrir = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (sucursalEfectiva === null) return
    setSaving(true)
    setError(null)
    try {
      await abrirCaja({ idSucursal: sucursalEfectiva, montoInicial })
      setModal(null)
      await refrescar()
    } catch (requestError) {
      setError(extraerMensajeError(requestError))
    } finally {
      setSaving(false)
    }
  }

  const handleMovimiento = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!cajaAbierta) return
    setSaving(true)
    setError(null)
    try {
      await registrarMovimientoCaja(cajaAbierta.id, movimiento)
      setModal(null)
      await refrescar()
    } catch (requestError) {
      setError(extraerMensajeError(requestError))
    } finally {
      setSaving(false)
    }
  }

  const handleCerrar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!cajaAbierta) return
    setSaving(true)
    setError(null)
    try {
      await cerrarCaja(cajaAbierta.id, montoFinal.trim() === '' ? undefined : Number(montoFinal))
      setModal(null)
      await refrescar()
    } catch (requestError) {
      setError(extraerMensajeError(requestError))
    } finally {
      setSaving(false)
    }
  }

  let modalTitle = ''
  let modalContent: ReactNode = null
  if (modal === 'abrir') {
    modalTitle = 'Abrir caja'
    modalContent = (
      <CajaAperturaForm
        sucursalNombre={sucursalNombre}
        montoInicial={montoInicial}
        loading={saving}
        error={error}
        onChange={setMontoInicial}
        onSubmit={handleAbrir}
        onCancel={cerrarModal}
      />
    )
  } else if (modal === 'movimiento' && cajaAbierta) {
    modalTitle = 'Registrar movimiento'
    modalContent = (
      <MovimientoCajaForm
        values={movimiento}
        loading={saving}
        error={error}
        onChange={(field, value) => setMovimiento((current) => ({ ...current, [field]: value }))}
        onSubmit={handleMovimiento}
        onCancel={cerrarModal}
      />
    )
  } else if (modal === 'cerrar' && cajaAbierta) {
    modalTitle = 'Cerrar caja'
    modalContent = (
      <CerrarCajaForm
        montoEsperado={cajaAbierta.montoEsperado}
        montoFinal={montoFinal}
        loading={saving}
        error={error}
        onChange={setMontoFinal}
        onSubmit={handleCerrar}
        onCancel={cerrarModal}
      />
    )
  }

  return (
    <CajaPageView
      sucursales={sucursales}
      idSucursal={sucursalEfectiva ?? ''}
      cajaAbierta={cajaAbierta}
      cajas={cajas}
      loadingAbierta={loadingAbierta}
      loadingCajas={loadingCajas}
      canManage={canManage}
      error={error}
      modalTitle={modalTitle}
      modalContent={modalContent}
      onSucursalChange={(value) => {
        setIdSucursal(value)
        setSucursalActiva(value === '' ? null : value)
      }}
      onAbrir={() => abrirModal('abrir')}
      onMovimiento={() => abrirModal('movimiento')}
      onCerrar={() => abrirModal('cerrar')}
      onCloseModal={cerrarModal}
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
