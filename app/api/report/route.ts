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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const start = searchParams.get('start')
    const end = searchParams.get('end')
    const opId = searchParams.get('opId')

    const db = await getDbData()
    let recibos = db.recibos || []

    // El filtro de fechas se aplicará individualmente a cada prenda más adelante

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

          let estadoStr = p.estado || r.estado || 'Pendiente'

          // Si está Entregado, para este reporte se cuenta como Terminado (porque ya se hizo el trabajo)
          if (estadoStr === 'Entregado') {
            estadoStr = 'Terminado'
          }

          // SOLO incluir prendas terminadas
          if (estadoStr !== 'Terminado') return

          const rawFechaTerminado = p.fechaTerminado || (r.estado === 'Terminado' || r.estado === 'Entregado' ? r.fechaTerminado : '') || ''
          const fechaTerminadoStr = rawFechaTerminado ? formatDateTime(rawFechaTerminado) : ''

          // El filtro de fechas ahora es estrictamente sobre la fecha en que se terminó
          const refDate = rawFechaTerminado || ''
          
          if (!refDate) return // Si no tiene fecha de terminado, no sale en el reporte de terminados
          if (start && refDate < start) return
          if (end && refDate > end + 'T23:59:59') return

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

        let estadoStr = r.estado || 'Pendiente'
        if (estadoStr === 'Entregado') {
          estadoStr = 'Terminado'
        }

        if (estadoStr !== 'Terminado') return

        const rawFechaTerminado = r.fechaTerminado || ''
        const fechaTerminadoStr = rawFechaTerminado ? formatDateTime(rawFechaTerminado) : ''

        const refDate = rawFechaTerminado || ''
        
        if (!refDate) return
        if (start && refDate < start) return
        if (end && refDate > end + 'T23:59:59') return

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
