import { NextResponse } from 'next/server'
import { getDbData } from '@/lib/cloudDb'
import * as XLSX from 'xlsx'

export const dynamic = 'force-dynamic'

function formatDateTime(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  const offset = -5 * 60 * 60 * 1000
  const localDate = new Date(d.getTime() + offset)
  const yyyy = localDate.getUTCFullYear()
  const mm = String(localDate.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(localDate.getUTCDate()).padStart(2, '0')
  let hours = localDate.getUTCHours()
  const minutes = String(localDate.getUTCMinutes()).padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12
  hours = hours ? hours : 12
  return `${yyyy}-${mm}-${dd} a las ${hours}:${minutes} ${ampm}`
}

export function generateExcelBuffer(db: any) {
  const recibos = db.recibos || []
  const operadoras = db.operadoras || []

  const getOperadoraName = (val: string) => {
    if (!val) return ''
    const op = operadoras.find((o: any) => o.id === val || o.nombre === val)
    return op ? op.nombre : val
  }

  // HOJA 1: RECIBOS
  const excelRows = recibos.map((r: any) => ({
    'Número Recibo': r.numeroRecibo || r.id,
    'Fecha': r.fechaRegistro || r.fechaRecibido || r.fecha,
    'Cliente Nombre': r.cliente || r.clienteNombre,
    'Cliente Teléfono': r.telefono || r.clienteTelefono || '',
    'Operaria': getOperadoraName(r.operaria || r.operadoraId),
    'Total Prendas': r.totalPrendas || 1,
    'Gran Total ($)': r.valorPagar || r.granTotal || 0,
    'Abono ($)': r.abono || 0,
    'Método Pago': r.metodoPago || '',
    'Cantidades por Prenda': Array.isArray(r.prendas)
      ? r.prendas.map((p: any) => `${p.cantidad || 1}`).join('\n')
      : (r.totalPrendas || 1).toString(),
    'Detalle Prendas': Array.isArray(r.prendas)
      ? r.prendas.map((p: any) => {
          let str = `${p.descripcion} ($${p.valorTotal || p.valorUnitario || 0})`
          if (p.asignadoPorNombre) {
            str += ` [Delegado a ${getOperadoraName(p.operadoraId || p.operaria)} por ${p.asignadoPorNombre}]`
          }
          return str
        }).join('\n')
      : r.descripcion || '',
    'Estado': r.estado || 'Pendiente',
    'Fecha Terminado': r.fechaTerminado ? formatDateTime(r.fechaTerminado) : '',
    'Fecha Entregado': r.fechaEntregado ? formatDateTime(r.fechaEntregado) : '',
    'Observaciones': r.observaciones || ''
  }))

  // HOJA 2: CAJA REGISTRADORA
  const cajaRows = recibos.map((r: any) => ({
    'Número Recibo': r.numeroRecibo || r.id,
    'Fecha': r.fechaRegistro || r.fechaRecibido,
    'Cliente': r.cliente || r.clienteNombre,
    'Servicios': Array.isArray(r.prendas) ? r.prendas.map((p:any) => p.descripcion).join(' / ') : r.descripcion,
    'Gran Total ($)': r.valorPagar || r.granTotal || 0,
    'Abono ($)': r.abono || 0,
    'Saldo ($)': (r.valorPagar || r.granTotal || 0) - (r.abono || 0),
    'Método Pago': r.metodoPago || '',
    'Estado': r.estado
  }))

  // HOJA 3: AUXILIARES Y OPERARIAS
  const prendasRows: any[] = []
  recibos.forEach((r: any) => {
    if (Array.isArray(r.prendas)) {
      r.prendas.forEach((p: any) => {
        const responsable = p.operadoraId || p.operaria || r.operadoraId || r.operaria
        if (responsable) {
          prendasRows.push({
            'Número Recibo': r.numeroRecibo || r.id,
            'Fecha': r.fechaRegistro || r.fechaRecibido,
            'Operaria / Auxiliar': getOperadoraName(responsable),
            'Prenda': p.descripcion,
            'Cantidad': p.cantidad || 1,
            'Valor ($)': p.valorTotal || p.valorUnitario || 0,
            'Asignado Por': p.asignadoPorNombre || 'Administrador',
            'Estado': p.estado || r.estado || 'Pendiente'
          })
        }
      })
    }
  })

  // HOJA 4: EGRESOS
  const egresosRows = (db.egresos || []).map((e: any) => ({
    'Fecha': e.fecha,
    'Descripción': e.descripcion,
    'Valor ($)': e.valor
  }))

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(excelRows), 'Recibos Generales')
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(cajaRows), 'Caja Registradora')
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(prendasRows), 'Auxiliares y Operarias')
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(egresosRows), 'Egresos')

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
}

export async function GET() {
  try {
    const db = await getDbData()
    const fileBuffer = generateExcelBuffer(db)

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="base_datos_el_vestier.xlsx"',
      },
    })
  } catch (error) {
    console.error('Error Excel:', error)
    return NextResponse.json({ error: 'Error al generar el archivo Excel' }, { status: 500 })
  }
}
