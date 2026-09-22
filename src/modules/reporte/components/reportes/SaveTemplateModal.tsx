import { useState } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { Modal } from '@/shared/components/ui/Modal'

interface SaveTemplateModalProps {
  open: boolean
  esActualizacion: boolean
  guardando: boolean
  onClose: () => void
  onGuardar: (nombre: string) => void
}

/** Pide el nombre y guarda (o actualiza) la plantilla con la configuración actual. */
export function SaveTemplateModal({ open, esActualizacion, guardando, onClose, onGuardar }: SaveTemplateModalProps) {
  const [nombre, setNombre] = useState('')

  const valido = nombre.trim().length > 0

  return (
    <Modal open={open} title={esActualizacion ? 'Actualizar plantilla' : 'Guardar plantilla'} onClose={onClose}>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          if (valido && !guardando) onGuardar(nombre.trim())
        }}
        className="space-y-4"
      >
        <Input
          label="Nombre de la plantilla"
          value={nombre}
          onChange={(event) => setNombre(event.target.value)}
          placeholder="Ej: Ventas semanales por sucursal"
          disabled={guardando}
          autoFocus
        />
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={guardando}>
            Cancelar
          </Button>
          <Button type="submit" loading={guardando} disabled={!valido}>
            {esActualizacion ? 'Actualizar' : 'Guardar'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}