'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

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

function AuxiliaresContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [auxiliares, setAuxiliares] = useState<any[]>([])
  const [asistencia, setAsistencia] = useState<any[]>([])
  const [recibos, setRecibos] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  const [filterCliente, setFilterCliente] = useState('')
  const [filterRecibido, setFilterRecibido] = useState('')
  const [filterEntrega, setFilterEntrega] = useState('')

  const [errorDb, setErrorDb] = useState<string | null>(null)
  const [tokenError, setTokenError] = useState(false)
  const [selectedAuxiliar, setSelectedAuxiliar] = useState<string>('')
  const [currentDate, setCurrentDate] = useState<string>('')

  const loadData = () => {
    setLoading(true)
    fetch('/api/db')
      .then((res) => {
        if (!res.ok) throw new Error('Error de conexión a la base de datos')
        return res.json()
      })
      .then((data) => {
        setErrorDb(null)
        setAsistencia(data.asistencia || [])
        setRecibos(data.recibos || [])
        
        const loadedAuxiliares = data.auxiliares || []
        setAuxiliares(loadedAuxiliares)

        if (token) {
          const aux = loadedAuxiliares.find((a: any) => a.token === token && a.activa)
          if (aux) {
            setSelectedAuxiliar(aux.nombre)
          } else {
            setTokenError(true)
          }
        } else {
          setTokenError(true)
        }
      })
      .catch((err) => {
        setErrorDb('Error al cargar la base de datos. Por favor recarga la página.')
        console.error(err)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
    // Set current date
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = new Date().toLocaleDateString('es-ES', options);
    setCurrentDate(dateStr.charAt(0).toUpperCase() + dateStr.slice(1));
  }, [token])

  const openShift = selectedAuxiliar
    ? asistencia.find(a => (a.operariaNombre || '').toLowerCase() === selectedAuxiliar.toLowerCase() && !a.horaSalida)
    : null

  const handleEntrada = async () => {
    if (!selectedAuxiliar) return
    if (openShift) {
      alert("Ya tienes un turno abierto. Por favor registra tu salida primero.")
      return
    }
    const now = new Date()
    const newRecord = {
      id: Date.now().toString(),
      operariaId: selectedAuxiliar.toLowerCase(),
      operariaNombre: selectedAuxiliar,
      fecha: now.toISOString().slice(0, 10),
      horaEntrada: now.toISOString(),
      horaSalida: null
    }
    const updatedAsistencia = [...asistencia, newRecord]
    setAsistencia(updatedAsistencia)

    await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ asistencia: updatedAsistencia }),
    })
    
    alert(`Entrada registrada con éxito para ${selectedAuxiliar}`)
  }

  const handleSalida = async () => {
    if (!selectedAuxiliar || !openShift) return
    if (!confirm(`¿Estás segura de registrar tu salida?`)) return
    
    const now = new Date()
    
    const updatedAsistencia = asistencia.map(a => {
      if (a.id === openShift.id) {
        return { ...a, horaSalida: now.toISOString() }
      }
      return a
    })
    
    setAsistencia(updatedAsistencia)

    await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ asistencia: updatedAsistencia }),
    })
    
    alert(`Salida registrada con éxito para ${selectedAuxiliar}`)
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Cargando datos...</div>
  }

  if (tokenError && !loading) {
    return (
      <main className="main-container" style={{ maxWidth: '800px' }}>
        <div className="glass-panel animate-fade-in panel-inner" style={{ textAlign: 'center', padding: '3rem' }}>
          <h2 style={{ color: '#991b1b', marginBottom: '1rem' }}>❌ Acceso Denegado</h2>
          <p style={{ color: '#334155', fontSize: '1.1rem', marginBottom: '2rem' }}>
            Este panel ahora es privado. Por favor, solicita tu <strong>enlace personal único</strong> a la administradora para poder ingresar.
          </p>
          <a href="/" className="btn btn-secondary">Volver al Inicio</a>
        </div>
      </main>
    )
  }

  if (!selectedAuxiliar) {
    return null;
  }

  const normalizeStr = (str: string) => str ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "").toLowerCase() : ""

  const filteredRecibos = recibos.filter((r) => {
    let match = true
    if (filterCliente) {
      const term = normalizeStr(filterCliente.trim())
      const matchesCliente = r.cliente && normalizeStr(r.cliente).includes(term)
      const matchesClienteNombre = r.clienteNombre && normalizeStr(r.clienteNombre).includes(term)
      const matchesRecibo = r.numeroRecibo && normalizeStr(r.numeroRecibo.toString()) === term
      if (!matchesCliente && !matchesClienteNombre && !matchesRecibo) {
        match = false
      }
    }
    if (filterRecibido && r.fechaRecibido && !r.fechaRecibido.startsWith(filterRecibido)) match = false
    if (filterEntrega && r.fechaEntrega && !r.fechaEntrega.startsWith(filterEntrega)) match = false
    return match
  })

  return (
    <main className="main-container" style={{ maxWidth: '1000px' }}>
      <div className="glass-panel animate-fade-in panel-inner">
        <div className="header-container">
          <div className="header-left">
            <img src="/logo.png.jpeg" alt="Logo El Vestier" style={{ width: '90px', height: 'auto', borderRadius: '8px' }} onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png' }} />
            <div>
              <h1 style={{ color: 'var(--primary-pink)', fontSize: '2.5rem', fontWeight: '800', margin: 0 }}>El Vestier</h1>
              <p style={{ margin: 0, color: '#64748b', fontSize: '1rem', fontWeight: '600' }}>Clínica de Ropa</p>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Calle 27 No. 33-57 Tuluá - Valle &bull; Tel: 3163464571</p>
            </div>
          </div>
          <div className="header-right">
            <h2 style={{ color: 'var(--primary-pink)', margin: '0 0 10px 0', fontSize: '1.5rem', textAlign: 'right' }}>Panel de {selectedAuxiliar}</h2>
            <a href="/" className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }}>
              Ir al Inicio
            </a>
          </div>
        </div>

        {errorDb && (
          <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #f87171', fontWeight: 'bold', textAlign: 'center' }}>
            ⚠️ {errorDb}
          </div>
        )}

        <div style={{ textAlign: 'center', padding: '1rem 0', maxWidth: '500px', margin: '0 auto', backgroundColor: '#f8fafc', borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h2 style={{ color: '#334155', fontSize: '1.3rem', margin: '0 0 1rem 0', textTransform: 'capitalize' }}>{currentDate}</h2>
          
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', padding: '0 2rem' }}>
            {!openShift ? (
              <button 
                onClick={handleEntrada}
                className="btn btn-primary" 
                style={{ width: '100%', padding: '1rem', fontSize: '1.2rem', backgroundColor: '#10b981', boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.39)' }}
              >
                ▶️ Registrar Entrada
              </button>
            ) : (
              <button 
                onClick={handleSalida}
                className="btn btn-primary" 
                style={{ width: '100%', padding: '1rem', fontSize: '1.2rem', backgroundColor: '#ef4444', boxShadow: '0 4px 14px 0 rgba(239, 68, 68, 0.39)' }}
              >
                ⏹️ Terminar Jornada
              </button>
            )}
          </div>
          
          {openShift && (
            <div style={{ marginTop: '1.5rem', padding: '1rem', color: '#16a34a', fontWeight: 'bold' }}>
              🟢 Tienes un turno abierto (Iniciado: {formatDateTime(openShift.horaEntrada)})
            </div>
          )}
        </div>

        <hr style={{ margin: '3rem 0', borderColor: '#e2e8f0' }} />

        <div style={{ marginTop: '2rem' }}>
          <h2 style={{ color: 'var(--primary-pink)', marginBottom: '1.5rem' }}>Buscador de Pedidos</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#64748b' }}>Buscar Cliente o Recibo</label>
              <input
                type="text"
                placeholder="Ej. María o #123..."
                className="form-input"
                value={filterCliente}
                onChange={(e) => setFilterCliente(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#64748b' }}>Fecha de Ingreso</label>
              <input
                type="date"
                className="form-input"
                value={filterRecibido}
                onChange={(e) => setFilterRecibido(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#64748b' }}>Fecha de Entrega</label>
              <input
                type="date"
                className="form-input"
                value={filterEntrega}
                onChange={(e) => setFilterEntrega(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button 
                className="btn btn-secondary" 
                style={{ width: '100%', height: '42px' }}
                onClick={() => { setFilterCliente(''); setFilterRecibido(''); setFilterEntrega(''); }}
              >
                Limpiar Filtros
              </button>
            </div>
          </div>

          <div className="table-container">
            <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', borderRadius: '0.5rem', overflow: 'hidden' }}>
              <thead style={{ backgroundColor: '#f1f5f9' }}>
                <tr>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}># Recibo</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Cliente</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Fecha Recibido</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Fecha Entrega</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Estado</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Descripción</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecibos.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                      No se encontraron pedidos con esos filtros.
                    </td>
                  </tr>
                ) : (
                  filteredRecibos.map((r: any) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{r.numeroRecibo || '-'}</td>
                      <td style={{ padding: '0.75rem' }}>{r.cliente}</td>
                      <td style={{ padding: '0.75rem' }}>{r.fechaRecibido}</td>
                      <td style={{ padding: '0.75rem' }}>{formatDateTime(r.fechaEntrega)}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '9999px',
                          fontSize: '0.8rem',
                          fontWeight: 'bold',
                          backgroundColor: r.estado === 'Entregado' ? '#dcfce7' : '#fef3c7',
                          color: r.estado === 'Entregado' ? '#166534' : '#92400e'
                        }}>
                          {r.estado || 'Pendiente'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.9rem', color: '#475569' }}>
                        {Array.isArray(r.prendas)
                          ? r.prendas.map((p: any) => `${p.cantidad}x ${p.descripcion}`).join(', ')
                          : r.descripcion}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function AsistenciaPageWrapper() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <AuxiliaresContent />
    </Suspense>
  )
}
