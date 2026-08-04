import fs from 'fs'
import path from 'path'
import Redis from 'ioredis'

const localDbPath = path.join(process.cwd(), 'data', 'db.json')

const initialDbData = {
  operadoras: [
    { id: '1', nombre: 'Eliza', activa: true },
    { id: '2', nombre: 'Isabel', activa: true },
    { id: '3', nombre: 'Angie', activa: true },
    { id: '4', nombre: 'Marisol', activa: true },
    { id: '5', nombre: 'Made', activa: true },
    { id: '6', nombre: 'Ara', activa: true }
  ],
  recibos: [],
  asistencia: []
}

/**
 * Lee la base de datos desde la Nube (Vercel KV / Upstash / Supabase) o desde el archivo local (db.json)
 */
export async function getDbData() {
  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
  const redisUrl = process.env.REDIS_URL

  // Opción 1.5: Si hay REDIS_URL de la integración nativa de Redis
  if (redisUrl) {
    let redis: Redis | null = null
    try {
      redis = new Redis(redisUrl, {
        connectTimeout: 3000,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        retryStrategy: () => null,
      })
      const dataStr = await redis.get('elvestier_db')
      if (dataStr) {
        const parsed = JSON.parse(dataStr)
        return {
          operadoras: parsed.operadoras || initialDbData.operadoras,
          recibos: parsed.recibos || [],
          asistencia: parsed.asistencia || []
        }
      }
    } catch (e) {
      console.error('Error al leer de Redis URL:', e)
    } finally {
      if (redis) {
        try { redis.disconnect() } catch (err) {}
      }
    }
  }

  // Opción 1: Nube con Vercel KV / Upstash Redis (REST)
  if (kvUrl && kvToken) {
    try {
      const response = await fetch(`${kvUrl}/get/elvestier_db`, {
        headers: { Authorization: `Bearer ${kvToken}` },
        cache: 'no-store',
        signal: AbortSignal.timeout(4000)
      })
      if (response.ok) {
        const resJson = await response.json()
        if (resJson.result) {
          const parsed = typeof resJson.result === 'string' ? JSON.parse(resJson.result) : resJson.result
          return {
            operadoras: parsed.operadoras || initialDbData.operadoras,
            recibos: parsed.recibos || [],
            asistencia: parsed.asistencia || []
          }
        }
      }
    } catch (e) {
      console.error('Error al leer de Vercel KV en la nube:', e)
    }
  }

  // Opción 2: Fallback local (db.json)
  if (!fs.existsSync(localDbPath)) {
    try {
      fs.mkdirSync(path.dirname(localDbPath), { recursive: true })
      fs.writeFileSync(localDbPath, JSON.stringify(initialDbData, null, 2), 'utf-8')
    } catch (e) {
      // En Vercel el sistema de archivos es de solo lectura. Silenciar el error.
    }
    return initialDbData
  }

  try {
    const fileContent = fs.readFileSync(localDbPath, 'utf-8')
    const parsed = JSON.parse(fileContent)
    return {
      operadoras: parsed.operadoras || initialDbData.operadoras,
      recibos: parsed.recibos || [],
      asistencia: parsed.asistencia || []
    }
  } catch (e) {
    return initialDbData
  }
}

/**
 * Guarda la base de datos en la Nube (Vercel KV / Upstash / Supabase) y también en el disco local
 */
export async function saveDbData(data: any) {
  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
  const redisUrl = process.env.REDIS_URL

  const cleanData = {
    operadoras: data.operadoras || initialDbData.operadoras,
    recibos: data.recibos || [],
    asistencia: data.asistencia || []
  }

  // Guardar con REDIS_URL nativo
  if (redisUrl) {
    let redis: Redis | null = null
    try {
      redis = new Redis(redisUrl, {
        connectTimeout: 3000,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        retryStrategy: () => null,
      })
      await redis.set('elvestier_db', JSON.stringify(cleanData))
    } catch (e) {
      console.error('Error al guardar en Redis URL:', e)
    } finally {
      if (redis) {
        try { redis.disconnect() } catch (err) {}
      }
    }
  }

  // Guardar en la Nube si las llaves de Vercel KV (REST) están configuradas
  if (kvUrl && kvToken) {
    try {
      await fetch(`${kvUrl}/set/elvestier_db`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${kvToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(JSON.stringify(cleanData)),
        signal: AbortSignal.timeout(4000)
      })
    } catch (e) {
      console.error('Error al guardar en Vercel KV en la nube:', e)
    }
  }

  // Guardar también copia local en archivo db.json
  try {
    const dataDir = path.dirname(localDbPath)
    fs.mkdirSync(dataDir, { recursive: true })
    const jsonString = JSON.stringify(cleanData, null, 2)
    fs.writeFileSync(localDbPath, jsonString, 'utf-8')

    // Crear backup local automático (Snapshot exacto)
    try {
      const backupDir = path.join(dataDir, 'backups')
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true })
      }
      
      const now = new Date()
      // Formato: 2026-07-28_15-30-45
      const timestamp = now.toISOString().replace(/T/, '_').replace(/:/g, '-').split('.')[0]
      const backupPath = path.join(backupDir, `db-${timestamp}.json`)
      
      fs.writeFileSync(backupPath, jsonString, 'utf-8')
    } catch (backupError) {
      console.error('Error al crear el backup local:', backupError)
    }

  } catch (e) {
    // En Vercel serverless el disco de solo lectura puede lanzar warning, es normal
  }

  return cleanData
}
