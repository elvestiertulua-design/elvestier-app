import { NextResponse } from 'next/server'
import { getDbData } from '@/lib/cloudDb'
import * as XLSX from 'xlsx'

export const dynamic = 'force-dynamic'

function formatDateTime(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  
  // Convert to UTC-5 (Colombia)
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

export async function GET() {
  try {
    const db = await getDbData()
    const recibos = db.recibos || []
    const operadoras = db.operadoras || []

    const getOperadoraName = (val: string) => {
      if (!val) return ''
      const op = operadoras.find((o: any) => o.id === val || o.nombre === val)
      return op ? op.nombre : val
    }

    const excelRows = recibos.map((r: any) => ({
      'Número Recibo': r.numeroRecibo || r.id,
      'Fecha': r.fechaRegistro || r.fecha,
      'Cliente Nombre': r.cliente || r.clienteNombre,
      'Cliente Teléfono': r.telefono || r.clienteTelefono || '',
      'Operaria': getOperadoraName(r.operaria || r.operadoraId),
      'Total Prendas': r.totalPrendas || 1,
      'Gran Total ($)': r.valorPagar || r.granTotal || 0,
      'Cantidades por Prenda': Array.isArray(r.prendas)
        ? r.prendas.map((p: any) => `${p.cantidad || 1}`).join('\n')
        : (r.totalPrendas || 1).toString(),
      'Detalle Prendas': Array.isArray(r.prendas)
        ? r.prendas.map((p: any) => {
            let str = `${p.descripcion} ($${p.valorTotal || p.valorUnitario || 0})`
            if (p.asignadoPorNombre) {
              str += ` [Delegado a ${p.operaria || p.operadoraId} por ${p.asignadoPorNombre}]`
            }
            return str
          }).join('\n')
        : r.descripcion || '',
      'Estado': r.estado || 'Pendiente',
      'Fecha Terminado': r.fechaTerminado ? formatDateTime(r.fechaTerminado) : '',
      'Observaciones': r.observaciones || ''
    }))

    const worksheet = XLSX.utils.json_to_sheet(excelRows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Recibos El Vestier')

    // Generate Excel file in memory as a buffer
    const fileBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

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

