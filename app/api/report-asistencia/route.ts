import { NextResponse } from 'next/server'
import { getDbData } from '@/lib/cloudDb'
import * as XLSX from 'xlsx'

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
  return `${datePart} ${hours}:${minutes} ${ampm}`
}

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const start = searchParams.get('start')
    const end = searchParams.get('end')

    const db = await getDbData()
    let asistencia = db.asistencia || []

    if (start) {
      asistencia = asistencia.filter((a: any) => a.fecha >= start)
    }
    if (end) {
      asistencia = asistencia.filter((a: any) => a.fecha <= end)
    }

    const excelRows = asistencia.map((a: any) => {
      let hours = 0
      if (a.horaEntrada && a.horaSalida) {
        const ent = new Date(a.horaEntrada).getTime()
        const sal = new Date(a.horaSalida).getTime()
        hours = (sal - ent) / (1000 * 60 * 60)
      }

      return {
        'Operadora': a.operariaNombre || '',
        'Fecha': a.fecha || '',
        'Hora Entrada': a.horaEntrada ? formatDateTime(a.horaEntrada) : '',
        'Hora Salida': a.horaSalida ? formatDateTime(a.horaSalida) : 'En Turno',
        'Horas Trabajadas': a.horaSalida ? hours.toFixed(2) : 0
      }
    })

    const worksheet = XLSX.utils.json_to_sheet(excelRows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte Asistencia')

    const fileBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="reporte_asistencia.xlsx"',
      },
    })
  } catch (error) {
    console.error('Error Asistencia:', error)
    return NextResponse.json({ error: 'Error al generar el reporte de asistencia' }, { status: 500 })
  }
}
