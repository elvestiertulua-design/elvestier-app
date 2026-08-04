'use client'

import React, { useState, useEffect } from 'react'

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

export default function AsistenciaPage() {
  const [operariaNombre, setOperariaNombre] = useState<string>('')
  const [asistencia, setAsistencia] = useState<any[]>([])
  const [recibos, setRecibos] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  const [filterCliente, setFilterCliente] = useState('')
  const [filterRecibido, setFilterRecibido] = useState('')
  const [filterEntrega, setFilterEntrega] = useState('')

  const loadData = () => {
    setLoading(true)
    fetch('/api/db')
      .then((res) => res.json())
      .then((data) => {
        setAsistencia(data.asistencia || [])
        setRecibos(data.recibos || [])
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [])

  const nombreLimpio = operariaNombre.trim().toLowerCase()
  const openShift = nombreLimpio 
    ? asistencia.find(a => (a.operariaNombre || '').toLowerCase() === nombreLimpio && !a.horaSalida)
    : null

  const handleEntrada = async () => {
    if (!operariaNombre.trim()) {
      alert("Por favor ingresa tu nombre primero.")
      return
    }
    if (openShift) {
      alert("Ya tienes un turno abierto. Por favor registra tu salida primero.")
      return
    }
    const now = new Date()
    const newRecord = {
      id: Date.now().toString(),
      operariaId: operariaNombre.trim().toLowerCase(), // Use name as ID since we don't have IDs
      operariaNombre: operariaNombre.trim(),
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
    
    alert(`Entrada registrada con éxito para ${operariaNombre.trim()}`)
    setOperariaNombre('')
  }

  const handleSalida = async () => {
    if (!operariaNombre.trim()) {
      alert("Por favor ingresa tu nombre primero.")
      return
    }
    if (!openShift) {
      alert("No tienes ningún turno abierto para registrar salida.")
      return
    }
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
    
    alert(`Salida registrada con éxito para ${operariaNombre.trim()}`)
    setOperariaNombre('')
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Cargando datos...</div>
  }

  const filteredRecibos = recibos.filter((r) => {
    let match = true
    if (filterCliente) {
      const term = filterCliente.toLowerCase().trim()
      const matchesCliente = r.cliente && r.cliente.toLowerCase().includes(term)
      const matchesClienteNombre = r.clienteNombre && r.clienteNombre.toLowerCase().includes(term)
      const matchesRecibo = r.numeroRecibo && r.numeroRecibo.toString().toLowerCase() === term
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
            <h2 style={{ color: 'var(--primary-pink)', margin: '0 0 10px 0', fontSize: '1.5rem', textAlign: 'right' }}>Reloj de Asistencia</h2>
            <a href="/" className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }}>
              Ir al Inicio
            </a>
          </div>
        </div>

        <div style={{ textAlign: 'center', padding: '1rem 0', maxWidth: '400px', margin: '0 auto' }}>
          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label" style={{ fontSize: '1.1rem', color: '#334155', textAlign: 'center', display: 'block', marginBottom: '1rem' }}>
              INGRESA TU NOMBRE PARA REGISTRAR ENTRADA/SALIDA:
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Ej. María Pérez"
              value={operariaNombre}
              onChange={(e) => setOperariaNombre(e.target.value)}
              style={{ textAlign: 'center', fontSize: '1.2rem', padding: '1rem' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button 
              onClick={handleEntrada}
              className="btn btn-primary" 
              style={{ flex: 1, padding: '1rem', fontSize: '1.2rem', backgroundColor: '#10b981', boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.39)' }}
            >
              ▶️ Entrada
            </button>
            <button 
              onClick={handleSalida}
              className="btn btn-primary" 
              style={{ flex: 1, padding: '1rem', fontSize: '1.2rem', backgroundColor: '#ef4444', boxShadow: '0 4px 14px 0 rgba(239, 68, 68, 0.39)' }}
            >
              ⏹️ Salida
            </button>
          </div>
          
          {openShift && (
            <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0', color: '#16a34a', fontWeight: 'bold' }}>
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
