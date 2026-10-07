import { NextResponse } from 'next/server'
import { getDbData } from '@/lib/cloudDb'
import { generateExcelBuffer } from '@/lib/excelUtils'

export const dynamic = 'force-dynamic'

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
