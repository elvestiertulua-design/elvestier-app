import { NextResponse } from 'next/server'
import { getDbData, saveDbData } from '@/lib/cloudDb'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const envVars = {
      kvUrl: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
      redisUrl: process.env.REDIS_URL
    }
    const data = await getDbData()
    return NextResponse.json({ ...data, envVars })
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
    if (body.auxiliares) {
      currentData.auxiliares = body.auxiliares
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
    } else if (body.type === 'UPDATE_ESTADO_RECIBO_Y_PRENDAS') {
      const nowIso = new Date().toISOString()
      currentData.recibos = (currentData.recibos || []).map((r: any) => {
        if (r.id === body.reciboId) {
          return {
            ...r,
            estado: body.nuevoEstado,
            fechaTerminado: body.nuevoEstado === 'Terminado' ? (r.fechaTerminado || nowIso) : r.fechaTerminado,
            prendas: Array.isArray(r.prendas)
              ? r.prendas.map((p: any) => ({
                  ...p,
                  estado: body.nuevoEstado === 'Terminado' ? 'Terminado' : p.estado,
                  fechaTerminado: body.nuevoEstado === 'Terminado' ? (p.fechaTerminado || nowIso) : p.fechaTerminado,
                }))
              : r.prendas,
          }
        }
        return r
      })
    } else if (body.type === 'UPDATE_OBS_OPERADORA') {
      currentData.recibos = (currentData.recibos || []).map((r: any) => {
        if (r.id === body.reciboId) {
          return { ...r, observacionOperadora: body.observacionOperadora }
        }
        return r
      })
    } else if (body.type === 'MANAGE_OPERATORS') {
      currentData.operadoras = body.operadoras
    } else if (body.type === 'MANAGE_AUXILIARES') {
      currentData.auxiliares = body.auxiliares
    }

    const savedData = await saveDbData(currentData)
    return NextResponse.json({ success: true, data: savedData })
  } catch (error) {
    return NextResponse.json({ error: 'Error procesando actualización' }, { status: 500 })
  }
}
