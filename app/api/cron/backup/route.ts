import { NextResponse } from 'next/server'
import { getDbData } from '@/lib/cloudDb'
import nodemailer from 'nodemailer'
import { generateExcelBuffer } from '@/lib/excelUtils'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Simple security check (Vercel Cron sends a Bearer token, or we can use a custom secret)
  const authHeader = request.headers.get('authorization')
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = await getDbData()
    const fileBuffer = generateExcelBuffer(db)

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_EMAIL || 'elvestiertulua@gmail.com',
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    })

    const todayStr = new Date().toISOString().split('T')[0]

    await transporter.sendMail({
      from: `"El Vestier Web" <${process.env.GMAIL_EMAIL || 'elvestiertulua@gmail.com'}>`,
      to: process.env.GMAIL_EMAIL || 'elvestiertulua@gmail.com',
      subject: `📦 Copia de Seguridad Diaria - El Vestier - ${todayStr}`,
      text: 'Hola,\n\nAdjunto encontrarás la copia de seguridad de la base de datos de la Clínica de Ropa El Vestier generada automáticamente.\n\nEste archivo incluye los recibos, registros de operarias, caja registradora y egresos.\n\nSaludos,\nEl Vestier Web',
      attachments: [
        {
          filename: `Backup_El_Vestier_${todayStr}.xlsx`,
          content: fileBuffer,
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      ]
    })

    return NextResponse.json({ success: true, message: 'Backup sent successfully!' })
  } catch (error) {
    console.error('Error enviando backup:', error)
    return NextResponse.json({ error: 'Failed to send backup' }, { status: 500 })
  }
}
