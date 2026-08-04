import { NextResponse } from 'next/server'
import { getDbData, saveDbData } from '@/lib/cloudDb'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const data = await getDbData()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Error al leer la base de datos' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const currentData = await getDbData()

    if (body.operadoras) {
      currentData.operadoras = body.operadoras
    }
    if (body.recibos) {
      currentData.recibos = body.recibos
    }
    if (body.asistencia) {
      currentData.asistencia = body.asistencia
    }

    const savedData = await saveDbData(currentData)
    return NextResponse.json({ success: true, data: savedData })
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar la base de datos' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const currentData = await getDbData()

    if (body.type === 'ASSIGN_OPERATOR') {
      const operadora = (currentData.operadoras || []).find((op: any) => op.id === body.operadoraId)
      const operadoraNombre = operadora ? operadora.nombre : body.operadoraId
      currentData.recibos = (currentData.recibos || []).map((r: any) =>
        r.id === body.id ? { ...r, operadoraId: body.operadoraId, operaria: operadoraNombre } : r
      )
    } else if (body.type === 'MARK_DELIVERED') {
      currentData.recibos = (currentData.recibos || []).map((r: any) =>
        r.id === body.id
          ? {
              ...r,
              estado: 'Entregado',
              fechaEntregado: body.fechaEntregado,
              quienRecogio: body.quienRecogio,
            }
          : r
      )
    } else if (body.type === 'UPDATE_OBSERVATIONS') {
      currentData.recibos = (currentData.recibos || []).map((r: any) =>
        r.id === body.id ? { ...r, respuestaAdministradora: body.respuestaAdministradora } : r
      )
    } else if (body.type === 'DELEGATE_PRENDA') {
      currentData.recibos = (currentData.recibos || []).map((r: any) => {
        if (r.id === body.reciboId && r.prendas) {
          const nuevasPrendas = [...r.prendas]
          if (nuevasPrendas[body.prendaIndex]) {
            const op = (currentData.operadoras || []).find((o: any) => o.id === body.toOperadoraId)
            nuevasPrendas[body.prendaIndex] = {
              ...nuevasPrendas[body.prendaIndex],
              operadoraId: body.toOperadoraId,
              operaria: op ? op.nombre : body.toOperadoraId,
              asignadoPorId: body.fromOperadoraId,
              asignadoPorNombre: body.fromOperadoraNombre
            }
          }
          return { ...r, prendas: nuevasPrendas }
        }
        return r
      })
    } else if (body.type === 'MARK_PRENDA_FINISHED') {
      currentData.recibos = (currentData.recibos || []).map((r: any) => {
        if (r.id === body.reciboId && r.prendas) {
          const nuevasPrendas = [...r.prendas]
          const nowIso = new Date().toISOString()
          if (nuevasPrendas[body.prendaIndex]) {
            nuevasPrendas[body.prendaIndex] = {
              ...nuevasPrendas[body.prendaIndex],
              estado: 'Terminado',
              fechaTerminado: nowIso
            }
          }
          const allFinished = nuevasPrendas.every((p: any) => p.estado === 'Terminado')
          return {
            ...r,
            prendas: nuevasPrendas,
            estado: allFinished ? 'Terminado' : r.estado,
            fechaTerminado: allFinished ? (r.fechaTerminado || nowIso) : r.fechaTerminado
          }
        }
        return r
      })
    } else if (body.type === 'MANAGE_OPERATORS') {
      currentData.operadoras = body.operadoras
    }

    const savedData = await saveDbData(currentData)
    return NextResponse.json({ success: true, data: savedData })
  } catch (error) {
    return NextResponse.json({ error: 'Error procesando actualización' }, { status: 500 })
  }
}
