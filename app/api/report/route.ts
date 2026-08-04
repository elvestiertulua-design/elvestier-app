import { NextResponse } from 'next/server'
import { getDbData } from '@/lib/cloudDb'
import * as XLSX from 'xlsx'

export const dynamic = 'force-dynamic'

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const start = searchParams.get('start')
    const end = searchParams.get('end')
    const opId = searchParams.get('opId')

    const db = await getDbData()
    let recibos = db.recibos || []

    // Filtrar por fecha de registro/recibido (cuando entró la prenda al taller)
    if (start) {
      recibos = recibos.filter((r: any) => {
        const d = r.fechaRegistro || r.fechaRecibido || r.fecha
        return d && d >= start
      })
    }
    if (end) {
      recibos = recibos.filter((r: any) => {
        const d = r.fechaRegistro || r.fechaRecibido || r.fecha
        return d && d <= end + 'T23:59:59'
      })
    }

    // Filtrar y desglosar por prendas
    let excelRows: any[] = []

    recibos.forEach((r: any) => {
      const operadora = (db.operadoras || []).find((o: any) => o.id === r.operadoraId)
      const baseName = operadora ? operadora.nombre : (r.operaria || 'Sin Asignar')

      if (r.prendas && r.prendas.length > 0) {
        r.prendas.forEach((p: any) => {
          const isDelegated = !!p.operadoraId
          const pOpId = isDelegated ? p.operadoraId : r.operadoraId
          const pName = isDelegated ? p.operaria : baseName

          if (opId && opId !== 'ALL' && opId !== 'unassigned') {
            if (pOpId !== opId) return
          }
          if (opId === 'unassigned' && pOpId) return

          const estadoStr = p.estado || r.estado || 'Pendiente'
          if (estadoStr === 'Entregado') return

          const rawFechaTerminado = p.fechaTerminado || (r.estado === 'Terminado' ? r.fechaTerminado : '') || ''
          const fechaTerminadoStr = rawFechaTerminado ? formatDateTime(rawFechaTerminado) : ''

          excelRows.push({
            'Número Recibo': r.numeroRecibo || r.id,
            'Fecha de Entrega': r.fechaEntrega ? formatDateTime(r.fechaEntrega) : '',
            'Nombre Cliente': r.cliente || r.clienteNombre || '',
            'Nombre Operadora': pName,
            'Cantidad': Number(p.cantidad) || 1,
            'Detalle': p.descripcion || 'Arreglos',
            'Valor Prenda ($)': Number(p.valorTotal || p.valorUnitario || 0),
            'Estado': estadoStr,
            'Fecha Terminado': fechaTerminadoStr,
            'Notas': isDelegated ? `Delegado por ${p.asignadoPorNombre || baseName}` : ''
          })
        })
      } else {
        if (opId && opId !== 'ALL' && opId !== 'unassigned' && r.operadoraId !== opId) return
        if (opId === 'unassigned' && r.operadoraId) return

        const estadoStr = r.estado || 'Pendiente'
        if (estadoStr === 'Entregado') return

        const rawFechaTerminado = r.fechaTerminado || ''
        const fechaTerminadoStr = rawFechaTerminado ? formatDateTime(rawFechaTerminado) : ''

        excelRows.push({
          'Número Recibo': r.numeroRecibo || r.id,
          'Fecha de Entrega': r.fechaEntrega ? formatDateTime(r.fechaEntrega) : '',
          'Nombre Cliente': r.cliente || r.clienteNombre || '',
          'Nombre Operadora': baseName,
          'Cantidad': r.totalPrendas || 1,
          'Detalle': r.descripcion || 'Arreglos',
          'Valor Prenda ($)': Number(r.valorPagar || r.granTotal || 0),
          'Estado': estadoStr,
          'Fecha Terminado': fechaTerminadoStr,
          'Notas': ''
        })
      }
    })

    const worksheet = XLSX.utils.json_to_sheet(excelRows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte Operadoras')

    const fileBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="reporte_operadoras.xlsx"',
      },
    })
  } catch (error) {
    console.error('Error Reporte:', error)
    return NextResponse.json({ error: 'Error al generar el reporte' }, { status: 500 })
  }
}
