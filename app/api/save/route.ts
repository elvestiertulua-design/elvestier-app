import { NextResponse } from 'next/server'
import { getDbData, saveDbData } from '@/lib/cloudDb'
import fs from 'fs'
import path from 'path'
import * as XLSX from 'xlsx'

const excelPath = path.join(process.cwd(), 'base_datos_el_vestier.xlsx')

function formatDateTime(dateStr: string) {
  if (!dateStr) return ''
  const parts = dateStr.split('T')
  if (parts.length !== 2) return dateStr
  const datePart = parts[0]
  const timeParts = parts[1].split(':')
  let hours = parseInt(timeParts[0], 10)
  const minutes = timeParts[1]
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12
  hours = hours ? hours : 12
  return `${datePart} a las ${hours}:${minutes} ${ampm}`
}

function updateExcel(recibos: any[]) {
  try {
    const excelRows = recibos.map((r: any) => {
      const detalleText = Array.isArray(r.prendas)
        ? r.prendas.map((p: any) => `${p.cantidad}x ${p.descripcion} ($${p.valorTotal || p.valorUnitario || 0})`).join(', ')
        : r.descripcion || ''

      return {
        'Número Recibo': r.numeroRecibo || r.id,
        'Fecha Registro': r.fechaRegistro || r.fechaRecibido || r.fecha,
        'Cliente Nombre': r.cliente || r.clienteNombre,
        'Cliente Teléfono': r.telefono || r.clienteTelefono || '',
        'Operaria': r.operaria || '',
        'Total Prendas': r.totalPrendas || (r.prendas ? r.prendas.reduce((acc: number, item: any) => acc + item.cantidad, 0) : 1),
        'Gran Total ($)': r.valorPagar || r.granTotal || 0,
        'Detalle Prendas': detalleText,
        'Estado': r.estado || 'Pendiente',
        'Fecha de Terminado': r.fechaTerminado ? formatDateTime(r.fechaTerminado) : '',
        'Observaciones': r.observaciones || ''
      }
    })

    const worksheet = XLSX.utils.json_to_sheet(excelRows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Recibos El Vestier')
    XLSX.writeFile(workbook, excelPath)
  } catch (err) {
    // Si la plataforma es read-only, ignoramos el fallo de archivo local
  }
}

export async function POST(request: Request) {
  try {
    const newReceipt = await request.json()
    const db = await getDbData()

    if (!newReceipt.id) {
      newReceipt.id = Date.now().toString()
    }
    if (!newReceipt.numeroRecibo) {
      const highestNum = (db.recibos || []).reduce((max: number, r: any) => {
        const num = parseInt(r.numeroRecibo || '0', 10)
        return !isNaN(num) && num > max ? num : max
      }, 1000)
      newReceipt.numeroRecibo = (highestNum + 1).toString()
    }
    if (!newReceipt.estado) {
      newReceipt.estado = 'Pendiente'
    }
    if (!newReceipt.fechaRegistro) {
      newReceipt.fechaRegistro = new Date().toISOString().slice(0, 10)
    }

    db.recibos.unshift(newReceipt)
    await saveDbData(db)
    updateExcel(db.recibos)

    return NextResponse.json({ success: true, recibo: newReceipt })
  } catch (error) {
    console.error('Error al guardar el recibo:', error)
    return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 })
  }
}
