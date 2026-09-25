'use client'

import React, { useState, useEffect } from 'react'

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

export default function OperadorasPage() {
  const [operadoras, setOperadoras] = useState<any[]>([])
  const [selectedOperaria, setSelectedOperaria] = useState<string>('')
  const [recibos, setRecibos] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [tokenError, setTokenError] = useState<boolean>(false)

  const [activeTab, setActiveTab] = useState<'pendientes' | 'terminados'>('pendientes')
  const [filterStartDate, setFilterStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [filterEndDate, setFilterEndDate] = useState(new Date().toISOString().slice(0, 10))
  const [filterCliente, setFilterCliente] = useState('')
  const [filterRecibo, setFilterRecibo] = useState('')

  const [obsModal, setObsModal] = useState({
    isOpen: false,
    reciboId: '',
    operadoraText: '',
    adminText: '',
  })

  const [errorDb, setErrorDb] = useState<string | null>(null)

  const loadData = () => {
    setLoading(true)
    fetch('/api/db?t=' + Date.now())
      .then((res) => {
        if (!res.ok) throw new Error('Error en la conexión con la base de datos')
        return res.json()
      })
      .then((data) => {
        setErrorDb(null)
        const activas = (data.operadoras || []).filter((o: any) => o.activa)
        setOperadoras(activas)
        setRecibos(data.recibos || [])
        
        // Verificar token en URL
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search)
          const token = params.get('token')
          if (token) {
            const op = activas.find((o: any) => o.token === token)
            if (op) {
              setSelectedOperaria(op.nombre)
            } else {
              setTokenError(true)
            }
          } else {
            setTokenError(true)
          }
        }
      })
      .catch((err) => {
        setErrorDb('Error al cargar la base de datos. Por favor recarga la página.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleUpdateEstado = async (reciboId: string, nuevoEstado: string) => {
    const nowIso = new Date().toISOString()
    const updatedRecibos = recibos.map((r) => {
      if (r.id === reciboId) {
        return {
          ...r,
          estado: nuevoEstado,
          fechaTerminado: nuevoEstado === 'Terminado' ? (r.fechaTerminado || nowIso) : r.fechaTerminado,
          prendas: Array.isArray(r.prendas)
            ? r.prendas.map((p: any) => ({
                ...p,
                estado: nuevoEstado === 'Terminado' ? 'Terminado' : p.estado,
                fechaTerminado: nuevoEstado === 'Terminado' ? (p.fechaTerminado || nowIso) : p.fechaTerminado,
              }))
            : r.prendas,
        }
      }
      return r
    })
    setRecibos(updatedRecibos)

    try {
      await fetch('/api/db', {
        method: 'PUT',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'UPDATE_ESTADO_RECIBO_Y_PRENDAS', reciboId, nuevoEstado }),
      })
    } catch (e) {
      console.error(e)
    }
  }

  const handleObsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const updatedRecibos = recibos.map((r) => {
      if (r.id === obsModal.reciboId) {
        return { ...r, observacionOperadora: obsModal.operadoraText }
      }
      return r
    })
    setRecibos(updatedRecibos)

    try {
      await fetch('/api/db', {
        method: 'PUT',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'UPDATE_OBS_OPERADORA', reciboId: obsModal.reciboId, observacionOperadora: obsModal.operadoraText }),
      })
    } catch (e) {
      console.error(e)
    }
    
    setObsModal({ ...obsModal, isOpen: false })
  }

  // Encontrar el ID de la operadora seleccionada
  const currentOp = operadoras.find(op => op.nombre.toLowerCase() === selectedOperaria.toLowerCase())
  
  const handleDelegatePrenda = async (reciboId: string, prendaIndex: number, toOperadoraId: string) => {
    if (!toOperadoraId || !currentOp) return
    if (!confirm('¿Estás segura de que deseas asignar esta prenda a otra operaria?')) return
    
    // Optimistic update
    setRecibos((prev) =>
      prev.map((r) => {
        if (r.id !== reciboId) return r
        const newPrendas = [...(r.prendas || [])]
        if (newPrendas[prendaIndex]) {
          newPrendas[prendaIndex] = { ...newPrendas[prendaIndex], operadoraId: toOperadoraId }
        }
        return { ...r, prendas: newPrendas }
      })
    )

    try {
      await fetch('/api/db', {
        method: 'PUT',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'DELEGATE_PRENDA', reciboId, prendaIndex, toOperadoraId, fromOperadoraId: currentOp.id, fromOperadoraNombre: currentOp.nombre }),
      })
    } catch (e) {
      console.error(e)
      loadData() // Revert
    }
  }

  const handleMarkPrendaFinished = async (reciboId: string, prendaIndex: number) => {
    // Optimistic update
    setRecibos((prev) =>
      prev.map((r) => {
        if (r.id !== reciboId) return r
        const newPrendas = [...(r.prendas || [])]
        if (newPrendas[prendaIndex]) {
          newPrendas[prendaIndex] = { ...newPrendas[prendaIndex], terminada: true }
        }
        
        // Verificar si todas las prendas estn terminadas
        const allFinished = newPrendas.every(p => p.terminada === true)
        const newEstado = allFinished ? 'Terminado' : r.estado
        
        return { ...r, prendas: newPrendas, estado: newEstado }
      })
    )

    try {
      await fetch('/api/db', {
        method: 'PUT',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'MARK_PRENDA_FINISHED', reciboId, prendaIndex }),
      })
    } catch (e) {
      console.error(e)
      loadData() // Revert
    }
  }

  const normalizeStr = (str: string) => str ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "").toLowerCase() : ""

  const misRecibosTotales = recibos.filter((r) => {
    if (!currentOp) return false
    const isMainOp = r.operadoraId === currentOp.id || (r.operaria && r.operaria.toLowerCase() === selectedOperaria.toLowerCase())
    const hasDelegatedPrenda = r.prendas && r.prendas.some((p: any) => p.operadoraId === currentOp.id)
    if (!isMainOp && !hasDelegatedPrenda) return false

    if (filterCliente && !normalizeStr(r.cliente).includes(normalizeStr(filterCliente))) return false
    if (filterRecibo && !(r.numeroRecibo || '').toLowerCase().includes(filterRecibo.toLowerCase())) return false

    return true
  })

  const misPendientes = misRecibosTotales.filter(
    (r) => r.estado !== 'Terminado' && r.estado !== 'Entregado'
  )

  const misTerminados = misRecibosTotales.filter((r) => {
    if (r.estado !== 'Terminado' && r.estado !== 'Entregado') return false
    
    // Filtro por fecha (usando fechaTerminado o fechaRegistro como fallback)
    const refDateStr = r.fechaTerminado || r.fechaRegistro
    if (refDateStr) {
      const dateOnly = refDateStr.split('T')[0]
      if (filterStartDate && dateOnly < filterStartDate) return false
      if (filterEndDate && dateOnly > filterEndDate) return false
    }
    return true
  })

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

  if (!selectedOperaria) {
    return null; // Esperando a que el token asigne la operadora
  }

  return (
    <main className="main-container" style={{ maxWidth: '800px' }}>
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
            <h2 style={{ color: 'var(--primary-pink)', margin: '0 0 10px 0', fontSize: '1.5rem', textAlign: 'right' }}>Panel de Taller</h2>
            <a href="/" className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }}>
              Ir al Inicio
            </a>
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: 'var(--primary-pink)', fontSize: '1.5rem', margin: 0 }}>
            Panel de {selectedOperaria}
          </h2>
        </div>

        {errorDb && (
          <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #f87171', fontWeight: 'bold', textAlign: 'center' }}>
            ⚠️ {errorDb}
          </div>
        )}

        <div>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
              <button
                onClick={() => setActiveTab('pendientes')}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  color: activeTab === 'pendientes' ? 'var(--primary-pink)' : '#64748b',
                  borderBottom: activeTab === 'pendientes' ? '3px solid var(--primary-pink)' : 'none',
                  paddingBottom: '0.5rem',
                  marginBottom: '-0.65rem',
                }}
              >
                Mis Pendientes ({misPendientes.length})
              </button>
              <button
                onClick={() => setActiveTab('terminados')}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  color: activeTab === 'terminados' ? 'var(--primary-pink)' : '#64748b',
                  borderBottom: activeTab === 'terminados' ? '3px solid var(--primary-pink)' : 'none',
                  paddingBottom: '0.5rem',
                  marginBottom: '-0.65rem',
                }}
              >
                Mis Terminados
              </button>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 1, minWidth: '200px', marginBottom: 0 }}>
                <input type="text" className="form-input" placeholder="Buscar por cliente..." value={filterCliente} onChange={(e) => setFilterCliente(e.target.value)} />
              </div>
              <div className="form-group" style={{ flex: 1, minWidth: '150px', marginBottom: 0 }}>
                <input type="text" className="form-input" placeholder="Buscar N° recibo..." value={filterRecibo} onChange={(e) => setFilterRecibo(e.target.value)} />
              </div>
            </div>

            {activeTab === 'pendientes' && (
              <div>
                {misPendientes.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {misPendientes.map((r) => {
                      const misPrendas = Array.isArray(r.prendas) ? r.prendas.filter((p: any) => {
                        const isMainOp = r.operadoraId === currentOp?.id || (r.operaria && r.operaria.toLowerCase() === selectedOperaria.toLowerCase())
                        const isDelegatedToMe = p.operadoraId === currentOp?.id
                        const isDelegatedToSomeoneElse = p.operadoraId && p.operadoraId !== currentOp?.id
                        if (isMainOp && isDelegatedToSomeoneElse) return false;
                        if (!isMainOp && !isDelegatedToMe) return false;
                        return true;
                      }) : [];
                      const valorMisPrendas = misPrendas.reduce((acc: number, p: any) => acc + (Number(p.valorTotal) || Number(p.valorUnitario) || 0), 0)
                      const displayTotal = misPrendas.length > 0 ? valorMisPrendas : (r.valorPagar || r.granTotal || 0)

                      return (
                      <div
                        key={r.id}
                        style={{
                          backgroundColor: r.estado === 'En elaboración' ? '#fefce8' : '#fff',
                          border: r.estado === 'En elaboración' ? '1px solid #fef08a' : '1px solid #e2e8f0',
                          padding: '1.5rem',
                          borderRadius: '0.75rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                          <div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--primary-pink)', fontWeight: 'bold' }}>
                              RECIBO #{r.numeroRecibo}
                            </div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#0f172a' }}>{r.cliente || r.clienteNombre}</div>
                            {r.fechaEntrega && (
                              <div style={{ fontSize: '0.9rem', color: '#ef4444', marginTop: '0.2rem', fontWeight: 'bold' }}>
                                ⏱️ Entrega: {formatDateTime(r.fechaEntrega)}
                              </div>
                            )}
                            <div style={{ fontSize: '1rem', color: '#16a34a', marginTop: '0.3rem', fontWeight: 'bold' }}>
                              Total Asignado: ${displayTotal.toLocaleString('es-CO')}
                            </div>
                          </div>
                          <span
                            style={{
                              padding: '0.3rem 0.8rem',
                              borderRadius: '1rem',
                              fontSize: '0.8rem',
                              fontWeight: 'bold',
                              backgroundColor: r.estado === 'En elaboración' ? '#fef08a' : '#f1f5f9',
                              color: r.estado === 'En elaboración' ? '#854d0e' : '#475569',
                            }}
                          >
                            {r.estado || 'Pendiente'}
                          </span>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                          <strong style={{ fontSize: '0.9rem', color: '#64748b' }}>DETALLE DEL TRABAJO:</strong>
                          <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', marginTop: '0.5rem' }}>
                            {Array.isArray(r.prendas) && r.prendas.length > 0 ? (
                              <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#334155' }}>
                                {r.prendas.map((p: any, idx: number) => {
                                  const isMainOp = r.operadoraId === currentOp?.id || (r.operaria && r.operaria.toLowerCase() === selectedOperaria.toLowerCase())
                                  const isDelegatedToMe = p.operadoraId === currentOp?.id
                                  const isDelegatedToSomeoneElse = p.operadoraId && p.operadoraId !== currentOp?.id
                                  
                                  if (isMainOp && isDelegatedToSomeoneElse) return null;
                                  if (!isMainOp && !isDelegatedToMe) return null;

                                  return (
                                    <li key={idx} style={{ marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        <div>
                                          <strong>{p.cantidad}x</strong> {p.descripcion} - <strong>${(Number(p.valorTotal) || Number(p.valorUnitario) || 0).toLocaleString('es-CO')}</strong>
                                          {isDelegatedToMe && !isMainOp && <span style={{ display: 'block', color: '#0284c7', fontSize: '0.75rem', marginTop: '0.2rem' }}>↳ Asignado a ti por {p.asignadoPorNombre || 'Administración'}</span>}
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                          {p.estado === 'Terminado' ? (
                                            <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 'bold' }}>✓ Terminado</span>
                                          ) : (
                                            <>
                                              {isMainOp && (
                                                <select
                                                  onChange={(e) => handleDelegatePrenda(r.id, idx, e.target.value)}
                                                  value=""
                                                  style={{ padding: '0.3rem', fontSize: '0.8rem', borderRadius: '0.25rem', border: '1px solid #cbd5e1' }}
                                                >
                                                  <option value="">Delegar a...</option>
                                                  {operadoras.filter(op => op.activa && op.id !== currentOp?.id).map(op => (
                                                    <option key={op.id} value={op.id}>{op.nombre}</option>
                                                  ))}
                                                </select>
                                              )}
                                              {isDelegatedToMe && !isMainOp && (
                                                <button onClick={() => handleMarkPrendaFinished(r.id, idx)} className="btn btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', backgroundColor: '#10b981', borderColor: '#10b981' }}>
                                                  ✓ Terminar Prenda
                                                </button>
                                              )}
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </li>
                                  )
                                })}
                              </ul>
                            ) : (
                              <span style={{ color: '#64748b', fontStyle: 'italic' }}>{r.descripcion || 'Sin prendas'}</span>
                            )}
                          </div>
                        </div>

                        {r.observaciones && (
                          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem', color: '#991b1b', fontSize: '0.9rem' }}>
                            <strong>Observación:</strong> {r.observaciones}
                          </div>
                        )}

                        {(r.operadoraId === currentOp?.id || (r.operaria && r.operaria.toLowerCase() === selectedOperaria.toLowerCase())) && (
                          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => setObsModal({ isOpen: true, reciboId: r.id, operadoraText: r.observacionOperadora || '', adminText: r.respuestaAdministradora || '' })}
                              className="btn"
                              style={{ flex: '1 1 100%', backgroundColor: r.respuestaAdministradora ? '#f97316' : '#f1f5f9', color: r.respuestaAdministradora ? '#fff' : '#475569', border: 'none', fontWeight: 'bold', marginBottom: '0.5rem' }}
                            >
                              📝 Observaciones {r.respuestaAdministradora ? '⚠️' : ''}
                            </button>
                            <button
                              onClick={() => handleUpdateEstado(r.id, 'En elaboración')}
                              disabled={r.estado === 'En elaboración'}
                              className="btn btn-secondary"
                              style={{ flex: 1, backgroundColor: r.estado === 'En elaboración' ? '#e2e8f0' : '#fff', color: r.estado === 'En elaboración' ? '#94a3b8' : '#f59e0b', borderColor: r.estado === 'En elaboración' ? '#e2e8f0' : '#fcd34d' }}
                            >
                              Empezar "En Elaboración"
                            </button>
                            <button
                              onClick={() => handleUpdateEstado(r.id, 'Terminado')}
                              className="btn btn-primary"
                              style={{ flex: 1, backgroundColor: '#10b981', boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.39)' }}
                            >
                              ✓ Marcar como Terminado
                            </button>
                          </div>
                        )}
                      </div>
                      )
                    })}
                  </div>
                ) : (
                  <div style={{ backgroundColor: '#fff', padding: '3rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', textAlign: 'center', color: '#64748b' }}>
                    <p style={{ fontSize: '1.1rem', fontWeight: '500' }}>¡Buen trabajo! No tienes prendas pendientes en este momento.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'terminados' && (
              <div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.85rem' }}>Desde:</label>
                    <input type="date" className="form-input" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.85rem' }}>Hasta:</label>
                    <input type="date" className="form-input" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} />
                  </div>
                </div>

                {misTerminados.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {misTerminados.map((r) => {
                      const misPrendas = Array.isArray(r.prendas) ? r.prendas.filter((p: any) => {
                        const isMainOp = r.operadoraId === currentOp?.id || (r.operaria && r.operaria.toLowerCase() === selectedOperaria.toLowerCase())
                        const isDelegatedToMe = p.operadoraId === currentOp?.id
                        const isDelegatedToSomeoneElse = p.operadoraId && p.operadoraId !== currentOp?.id
                        if (isMainOp && isDelegatedToSomeoneElse) return false;
                        if (!isMainOp && !isDelegatedToMe) return false;
                        return true;
                      }) : [];
                      const valorMisPrendas = misPrendas.reduce((acc: number, p: any) => acc + (Number(p.valorTotal) || Number(p.valorUnitario) || 0), 0)
                      const displayTotal = misPrendas.length > 0 ? valorMisPrendas : (r.valorPagar || r.granTotal || 0)

                      return (
                      <div
                        key={r.id}
                        style={{
                          backgroundColor: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          padding: '1.25rem',
                          borderRadius: '0.75rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>RECIBO #{r.numeroRecibo}</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#334155' }}>{r.cliente || r.clienteNombre}</div>
                            {r.fechaEntrega && (
                              <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.2rem' }}>
                                <strong>Entrega:</strong> {formatDateTime(r.fechaEntrega)}
                              </div>
                            )}
                          </div>
                          <span style={{ padding: '0.3rem 0.8rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 'bold', backgroundColor: '#dcfce7', color: '#166534' }}>
                            ✓ {r.estado}
                          </span>
                        </div>
                        <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#64748b' }}>
                          Terminado el: {r.fechaTerminado ? formatDateTime(r.fechaTerminado) : 'Sin fecha registrada'}
                        </div>
                        
                        <div style={{ marginBottom: '1rem', marginTop: '1rem' }}>
                          <strong style={{ fontSize: '0.9rem', color: '#64748b' }}>DETALLE DEL TRABAJO:</strong>
                          <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', marginTop: '0.5rem' }}>
                            {Array.isArray(r.prendas) && r.prendas.length > 0 ? (
                              <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#334155' }}>
                                {r.prendas.map((p: any, idx: number) => {
                                  const isMainOp = r.operadoraId === currentOp?.id || (r.operaria && r.operaria.toLowerCase() === selectedOperaria.toLowerCase())
                                  const isDelegatedToMe = p.operadoraId === currentOp?.id
                                  const isDelegatedToSomeoneElse = p.operadoraId && p.operadoraId !== currentOp?.id
                                  
                                  if (isMainOp && isDelegatedToSomeoneElse) return null;
                                  if (!isMainOp && !isDelegatedToMe) return null;

                                  return (
                                    <li key={idx} style={{ marginBottom: '0.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        <div>
                                          <strong>{p.cantidad}x</strong> {p.descripcion} - <strong>${(Number(p.valorTotal) || Number(p.valorUnitario) || 0).toLocaleString('es-CO')}</strong>
                                          {isDelegatedToMe && !isMainOp && <span style={{ display: 'block', color: '#0284c7', fontSize: '0.75rem', marginTop: '0.2rem' }}>↳ Asignado a ti por {p.asignadoPorNombre || 'Administración'}</span>}
                                        </div>
                                      </div>
                                    </li>
                                  )
                                })}
                              </ul>
                            ) : (
                              <span style={{ color: '#64748b', fontStyle: 'italic' }}>{r.descripcion || 'Sin prendas'}</span>
                            )}
                          </div>
                        </div>

                        <div style={{ marginTop: '0.2rem', fontSize: '1rem', color: '#16a34a', fontWeight: 'bold' }}>
                          Total Pagado: ${displayTotal.toLocaleString('es-CO')}
                        </div>
                      </div>
                      )
                    })}
                  </div>
                ) : (
                  <div style={{ backgroundColor: '#f8fafc', padding: '2rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', textAlign: 'center', color: '#64748b' }}>
                    <p>No tienes prendas terminadas en este rango de fechas.</p>
                  </div>
                )}
              </div>
            )}
          </div>
      </div>

      {tokenError && (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444', backgroundColor: '#fee2e2', borderRadius: '0.5rem', margin: '2rem' }}>
          <strong>Error:</strong> {tokenError}
        </div>
      )}

        {obsModal.isOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
            <div style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '0.5rem', width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
              <h2 style={{ marginTop: 0, color: 'var(--primary-pink)' }}>Observaciones del Paquete</h2>
              <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                <strong style={{ display: 'block', marginBottom: '0.5rem', color: '#334155', fontSize: '0.9rem' }}>Respuesta de Administradora:</strong>
                <p style={{ margin: 0, fontSize: '0.95rem', color: obsModal.adminText ? '#0f172a' : '#94a3b8', fontStyle: obsModal.adminText ? 'normal' : 'italic' }}>
                  {obsModal.adminText || 'La administradora no ha respondido.'}
                </p>
              </div>
              <form onSubmit={handleObsSubmit}>
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label" style={{ fontWeight: 'bold' }}>Tu Mensaje (Operadora):</label>
                  <textarea className="form-input" placeholder="Escribe aquí si hay algún problema o duda con el paquete..." style={{ minHeight: '80px' }} value={obsModal.operadoraText} onChange={(e) => setObsModal({ ...obsModal, operadoraText: e.target.value })} />
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setObsModal({ ...obsModal, isOpen: false })}>
                    Cerrar
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    Guardar y Enviar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

    </main>
  )
}
