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

function getDayName(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  const days = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO']
  return days[d.getDay()]
}

function StickerPrintView({ data }: { data: any }) {
  const totalPrendas = data.prendas?.reduce((acc: number, item: any) => acc + (Number(item.cantidad) || 0), 0) || data.totalPrendas || 1
  const granTotal = data.prendas?.reduce((acc: number, item: any) => acc + (Number(item.valorTotal) || 0), 0) || data.valorPagar || data.granTotal || 0

  return (
    <div
      className="sticker-container"
      style={{
        width: '100%',
        maxWidth: '600px',
        minHeight: '400px',
        height: 'auto',
        margin: '0',
        padding: '24px',
        fontFamily: 'monospace',
        color: '#000',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
      }}
    >
      <style
        type="text/css"
        media="print"
        dangerouslySetInnerHTML={{
          __html: `
          @page { margin: 0; }
          html, body { margin: 0; padding: 0; }
        `,
        }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #000', paddingBottom: '10px' }}>
          <span style={{ fontSize: '24px', fontWeight: 'bold' }}>RECIBO #</span>
          <span style={{ fontSize: '32px', fontWeight: 'bold' }}>{data.numeroRecibo && data.numeroRecibo !== 'N/A' ? data.numeroRecibo : '____'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <span style={{ fontSize: '48px', fontWeight: 'bold', textAlign: 'center', maxWidth: '100%', lineHeight: '1.2', wordWrap: 'break-word', whiteSpace: 'normal' }}>
            {data.clienteNombre || data.cliente || '___________'}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <strong style={{ fontSize: '32px' }}>Entrega:</strong>
          <span style={{ fontSize: '32px', fontWeight: 'bold', textAlign: 'right', maxWidth: '350px' }}>
            {data.fechaEntrega ? `${getDayName(data.fechaEntrega)}, ${formatDateTime(data.fechaEntrega)}` : '___________'}
          </span>
        </div>
      </div>

      <div style={{ borderTop: '6px solid #000', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong style={{ fontSize: '36px' }}>Prendas:</strong>
          <span style={{ fontSize: '42px', fontWeight: 'bold' }}>{totalPrendas}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong style={{ fontSize: '38px' }}>TOTAL:</strong>
          <span style={{ fontSize: '48px', fontWeight: 'bold' }}>${granTotal.toLocaleString('es-CO')}</span>
        </div>
      </div>
    </div>
  )
}

function PasswordGate({
  children,
  correctPin,
  title,
}: {
  children: React.ReactNode
  correctPin: string
  title: string
}) {
  const [auth, setAuth] = useState(false)
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(`auth_${title}`) === 'true') {
      setAuth(true)
    }
  }, [title])

  if (auth) return <>{children}</>

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f1f5f9' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2rem', textAlign: 'center' }}>
        <img
          src="/logo.png.jpeg"
          alt="Logo"
          style={{ width: '80px', borderRadius: '8px', marginBottom: '1rem' }}
          onError={(e) => {
            ;(e.target as HTMLImageElement).src = '/logo.png'
          }}
        />
        <h2 style={{ color: 'var(--primary-pink)', marginBottom: '1.5rem' }}>{title}</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (pin === correctPin) {
              localStorage.setItem(`auth_${title}`, 'true')
              setAuth(true)
              setError(false)
            } else {
              setError(true)
              setPin('')
            }
          }}
        >
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="form-input"
              placeholder="Ingresar contraseña..."
              style={{ textAlign: 'center', fontSize: '1.2rem', letterSpacing: '0.2rem' }}
              autoFocus
            />
          </div>
          {error && <p style={{ color: '#ef4444', fontSize: '0.9rem', marginBottom: '1rem' }}>Contraseña incorrecta</p>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Ingresar
          </button>
        </form>
      </div>
    </div>
  )
}

function AdminDashboard() {
  const [recibos, setRecibos] = useState<any[]>([])
  const [operadoras, setOperadoras] = useState<any[]>([])
  const [asistencia, setAsistencia] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [nuevaOperadoraNombre, setNuevaOperadoraNombre] = useState('')
  const [filterCliente, setFilterCliente] = useState('')
  const [filterRecibo, setFilterRecibo] = useState('')
  const [filterRecibido, setFilterRecibido] = useState('')
  const [filterEntrega, setFilterEntrega] = useState('')
  const [filterOperadora, setFilterOperadora] = useState('')

  const [activeTab, setActiveTab] = useState<'list' | 'reports' | 'asistencia'>('list')
  const [reportStart, setReportStart] = useState('')
  const [reportEnd, setReportEnd] = useState('')
  const [reportOpId, setReportOpId] = useState('ALL')

  const [asistenciaStart, setAsistenciaStart] = useState(new Date().toISOString().slice(0, 10))
  const [asistenciaEnd, setAsistenciaEnd] = useState(new Date().toISOString().slice(0, 10))

  const getCurrentLocalTimeStr = () => {
    const tzOffset = new Date().getTimezoneOffset() * 60000
    return new Date(Date.now() - tzOffset).toISOString().slice(0, 16)
  }

  const [entregaModal, setEntregaModal] = useState({
    isOpen: false,
    reciboId: '',
    fecha: getCurrentLocalTimeStr(),
    nombre: '',
  })

  const [obsModal, setObsModal] = useState({
    isOpen: false,
    reciboId: '',
    operadoraText: '',
    adminText: '',
  })

  const [stickerData, setStickerData] = useState<any>(null)

  const loadData = async () => {
    try {
      const res = await fetch('/api/db?t=' + Date.now())
      if (res.ok) {
        const data = await res.json()
        setRecibos(data.recibos || [])
        const ops = data.operadoras || []
        let missingTokens = false
        const opsWithTokens = ops.map((op: any) => {
          if (!op.token) {
            missingTokens = true
            return { ...op, token: Math.random().toString(36).substring(2, 10) }
          }
          return op
        })
        
        if (missingTokens) {
          fetch('/api/db', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'MANAGE_OPERATORS', operadoras: opsWithTokens }),
          }).catch(console.error)
        }
        
        setOperadoras(opsWithTokens)
        setAsistencia(data.asistencia || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const assignOperator = async (reciboId: string, operadoraId: string) => {
    try {
      await fetch('/api/db', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'ASSIGN_OPERATOR', id: reciboId, operadoraId }),
      })
      loadData()
    } catch (e) {
      console.error(e)
    }
  }

  const handleEntregaSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!entregaModal.nombre.trim()) {
      alert('Por favor ingrese el nombre de quien recoge.')
      return
    }
    const target = recibos.find((r) => r.id === entregaModal.reciboId)
    try {
      await fetch('/api/db', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'MARK_DELIVERED',
          id: entregaModal.reciboId,
          fechaEntregado: entregaModal.fecha,
          quienRecogio: entregaModal.nombre,
        }),
      })

      setEntregaModal({ ...entregaModal, isOpen: false, reciboId: '', nombre: '' })
      loadData()
    } catch (e) {
      console.error(e)
    }
  }

  const handleObsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await fetch('/api/db', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'UPDATE_OBSERVATIONS',
          id: obsModal.reciboId,
          respuestaAdministradora: obsModal.adminText,
        }),
      })
      setObsModal({ ...obsModal, isOpen: false, reciboId: '', adminText: '' })
      loadData()
    } catch (e) {
      console.error(e)
    }
  }

  const handleAddOperator = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevaOperadoraNombre.trim()) return
    const updated = [...operadoras, { id: Date.now().toString(), nombre: nuevaOperadoraNombre.trim(), activa: true, token: Math.random().toString(36).substring(2, 10) }]
    try {
      await fetch('/api/db', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'MANAGE_OPERATORS', operadoras: updated }),
      })
      setNuevaOperadoraNombre('')
      loadData()
    } catch (e) {
      console.error(e)
    }
  }

  const toggleOperatorStatus = async (id: string, newStatus: boolean) => {
    const updated = operadoras.map((op) => (op.id === id ? { ...op, activa: newStatus } : op))
    try {
      await fetch('/api/db', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'MANAGE_OPERATORS', operadoras: updated }),
      })
      loadData()
    } catch (e) {
      console.error(e)
    }
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Cargando datos...</div>
  }

  if (stickerData) {
    return (
      <div className="print-preview-screen animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem', minHeight: '100vh' }}>
        <div className="no-print" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={() => setStickerData(null)} className="btn btn-secondary">
            🔙 Volver al Panel de Administradora
          </button>
          <button onClick={() => window.print()} className="btn btn-primary">
            🖨️ CONFIRMAR IMPRESIÓN STICKER
          </button>
        </div>
        <div className="no-print" style={{ marginBottom: '1rem', color: '#6b7280', fontSize: '0.9rem', textAlign: 'center' }}>
          Vista previa de Sticker generada para {stickerData.cliente || stickerData.clienteNombre}.
        </div>
        <div className="print-area-wrapper" style={{ background: '#fff', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '10px' }}>
          <StickerPrintView data={stickerData} />
        </div>
      </div>
    )
  }

  const normalizeStr = (str: string) => str ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase() : ""

  const activeOperators = operadoras.filter((op) => op.activa)
  const filteredRecibos = recibos.filter((r) => {
    let match = true
    if (filterCliente && !normalizeStr(r.cliente).includes(normalizeStr(filterCliente))) match = false
    if (filterRecibo && !(r.numeroRecibo || '').toLowerCase().includes(filterRecibo.toLowerCase())) match = false
    if (filterRecibido && !r.fechaRecibido.startsWith(filterRecibido)) match = false
    if (filterEntrega && !r.fechaEntrega.startsWith(filterEntrega)) match = false
    if (filterOperadora) {
      if (filterOperadora === 'unassigned' && r.operadoraId) match = false
      else if (filterOperadora !== 'unassigned' && r.operadoraId !== filterOperadora) match = false
    }
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
            <h2 style={{ color: 'var(--primary-pink)', margin: '0 0 10px 0', fontSize: '1.5rem', textAlign: 'right' }}>Panel de Administradora</h2>
            <button onClick={() => { window.location.href = '/api/download' }} className="btn btn-secondary">
              Descargar Base de Datos Completa
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
          <button
            onClick={() => setActiveTab('list')}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              color: activeTab === 'list' ? 'var(--primary-pink)' : '#64748b',
              borderBottom: activeTab === 'list' ? '3px solid var(--primary-pink)' : 'none',
              paddingBottom: '0.5rem',
              marginBottom: '-0.65rem',
            }}
          >
            Gestión de Paquetes
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              color: activeTab === 'reports' ? 'var(--primary-pink)' : '#64748b',
              borderBottom: activeTab === 'reports' ? '3px solid var(--primary-pink)' : 'none',
              paddingBottom: '0.5rem',
              marginBottom: '-0.65rem',
            }}
          >
            Reportes (Excel)
          </button>
          <button
            onClick={() => setActiveTab('asistencia')}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              color: activeTab === 'asistencia' ? 'var(--primary-pink)' : '#64748b',
              borderBottom: activeTab === 'asistencia' ? '3px solid var(--primary-pink)' : 'none',
              paddingBottom: '0.5rem',
              marginBottom: '-0.65rem',
            }}
          >
            Asistencia Auxiliares
          </button>
        </div>

        {activeTab === 'reports' && (
          <div style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
            <h2 style={{ marginTop: 0, color: '#334155' }}>Generar Reporte por Operadora</h2>
            <p style={{ color: '#64748b', marginBottom: '2rem' }}>Descarga un archivo Excel con los datos solicitados: Nombre, Número de Prendas y Valor Total.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#64748b' }}>Fecha de Inicio</label>
                <input type="date" className="form-input" value={reportStart} onChange={(e) => setReportStart(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#64748b' }}>Fecha de Fin</label>
                <input type="date" className="form-input" value={reportEnd} onChange={(e) => setReportEnd(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#64748b' }}>Operadora</label>
                <select className="form-input" value={reportOpId} onChange={(e) => setReportOpId(e.target.value)}>
                  <option value="ALL">Todas las Operadoras</option>
                  <option value="unassigned">Sin Asignar</option>
                  {operadoras.map((op) => (
                    <option key={op.id} value={op.id}>{op.nombre}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => {
                const params = new URLSearchParams()
                if (reportStart) params.append('start', reportStart)
                if (reportEnd) params.append('end', reportEnd)
                if (reportOpId) params.append('opId', reportOpId)
                window.location.href = `/api/report?${params.toString()}`
              }}
            >
              Descargar Reporte en Excel
            </button>
          </div>
        )}

        {activeTab === 'asistencia' && (
          <div style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <h2 style={{ marginTop: 0, color: '#334155' }}>Reporte de Asistencia</h2>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 'bold' }}>Desde:</label>
                  <input type="date" className="form-input" style={{ fontSize: '1rem', padding: '0.5rem' }} value={asistenciaStart} onChange={(e) => setAsistenciaStart(e.target.value)} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 'bold' }}>Hasta:</label>
                  <input type="date" className="form-input" style={{ fontSize: '1rem', padding: '0.5rem' }} value={asistenciaEnd} onChange={(e) => setAsistenciaEnd(e.target.value)} />
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    const params = new URLSearchParams()
                    if (asistenciaStart) params.append('start', asistenciaStart)
                    if (asistenciaEnd) params.append('end', asistenciaEnd)
                    window.location.href = `/api/report-asistencia?${params.toString()}`
                  }}
                >
                  Descargar Excel
                </button>
              </div>
            </div>
            <div className="table-container" style={{ marginTop: '1.5rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '1rem', color: '#475569' }}>Operaria</th>
                    <th style={{ padding: '1rem', color: '#475569' }}>Fecha</th>
                    <th style={{ padding: '1rem', color: '#475569' }}>Entrada</th>
                    <th style={{ padding: '1rem', color: '#475569' }}>Salida</th>
                    <th style={{ padding: '1rem', color: '#475569' }}>Horas Trabajadas</th>
                  </tr>
                </thead>
                <tbody>
                  {asistencia
                    .filter((a) => (!asistenciaStart || a.fecha >= asistenciaStart) && (!asistenciaEnd || a.fecha <= asistenciaEnd))
                    .map((item) => {
                      let hours = 0
                      if (item.horaEntrada && item.horaSalida) {
                        hours = (new Date(item.horaSalida).getTime() - new Date(item.horaEntrada).getTime()) / 3600000
                      }
                      return (
                        <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '1rem', fontWeight: '500' }}>{item.operariaNombre}</td>
                          <td style={{ padding: '1rem' }}>{item.fecha}</td>
                          <td style={{ padding: '1rem' }}>{item.horaEntrada ? formatDateTime(item.horaEntrada) : '-'}</td>
                          <td style={{ padding: '1rem' }}>{item.horaSalida ? formatDateTime(item.horaSalida) : <span style={{ color: '#ef4444', fontWeight: 'bold' }}>En Turno</span>}</td>
                          <td style={{ padding: '1rem', fontWeight: 'bold', color: 'var(--primary-pink)' }}>{item.horaSalida ? hours.toFixed(2) + ' h' : '-'}</td>
                        </tr>
                      )
                    })}
                  {asistencia.filter((a) => (!asistenciaStart || a.fecha >= asistenciaStart) && (!asistenciaEnd || a.fecha <= asistenciaEnd)).length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                        No hay registros en este rango de fechas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div style={{ display: activeTab === 'list' ? 'block' : 'none' }}>
          <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
            <h2 style={{ marginTop: 0, color: '#334155' }}>Buscador de Paquetes</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#64748b' }}>Cliente</label>
                <input type="text" className="form-input" placeholder="Buscar por nombre..." value={filterCliente} onChange={(e) => setFilterCliente(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#64748b' }}>Número Recibo</label>
                <input type="text" className="form-input" placeholder="Ej. 1234" value={filterRecibo} onChange={(e) => setFilterRecibo(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#64748b' }}>Fecha de Recibido</label>
                <input type="date" className="form-input" value={filterRecibido} onChange={(e) => setFilterRecibido(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#64748b' }}>Fecha de Entrega (Salida)</label>
                <input type="date" className="form-input" value={filterEntrega} onChange={(e) => setFilterEntrega(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#64748b' }}>Operadora Asignada</label>
                <select className="form-input" value={filterOperadora} onChange={(e) => setFilterOperadora(e.target.value)}>
                  <option value="">Todas</option>
                  <option value="unassigned">Sin Asignar</option>
                  {activeOperators.map((op) => (
                    <option key={op.id} value={op.id}>{op.nombre}</option>
                  ))}
                </select>
              </div>
            </div>
            {(filterCliente || filterRecibo || filterRecibido || filterEntrega || filterOperadora) && (
              <button className="btn btn-secondary" style={{ marginTop: '1rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }} onClick={() => { setFilterCliente(''); setFilterRecibo(''); setFilterRecibido(''); setFilterEntrega(''); setFilterOperadora('') }}>
                Limpiar Filtros
              </button>
            )}
          </div>

          <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
            <h2 style={{ marginTop: 0, color: '#334155' }}>Asignación de Paquetes</h2>
            <div className="table-container">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead style={{ backgroundColor: '#f1f5f9' }}>
                  <tr>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}># Recibo</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Fecha Registro</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Cliente</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Prendas</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Pago</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Fecha Entrega</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Operadora</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecibos.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '1rem' }}>No hay recibos que coincidan con la búsqueda.</td>
                    </tr>
                  ) : (
                    filteredRecibos.map((r) => (
                      <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{r.numeroRecibo || '-'}</td>
                        <td style={{ padding: '0.75rem' }}>{r.fechaRegistro}</td>
                        <td style={{ padding: '0.75rem' }}>
                          {r.cliente} <br />
                          <small style={{ color: '#64748b' }}>{r.telefono}</small>
                        </td>
                        <td style={{ padding: '0.75rem', maxWidth: '300px' }}>
                          <div style={{ fontWeight: 'bold' }}>{r.totalPrendas || (r.prendas ? r.prendas.reduce((acc: number, p: any) => acc + (Number(p.cantidad) || 1), 0) : 1)} prendas</div>
                          <ul style={{ paddingLeft: '1rem', margin: '0.2rem 0', fontSize: '0.85rem' }}>
                            {r.prendas ? r.prendas.map((p: any, i: number) => (
                              <li key={i} style={{ marginBottom: '4px' }}>
                                {p.cantidad}x {p.descripcion} - <strong>${(Number(p.valorTotal) || Number(p.valorUnitario) || 0).toLocaleString('es-CO')}</strong>
                                {p.operadoraId && p.operadoraId !== r.operadoraId && (
                                  <span style={{ display: 'block', color: '#0284c7', fontSize: '0.75rem' }}>
                                    ↳ Delegado a: {p.operaria || p.operadoraId} {p.estado === 'Terminado' ? '(Terminado ✅)' : ''}
                                  </span>
                                )}
                              </li>
                            )) : (
                              <li>{r.detallePrendas || r.descripcion || 'Arreglos'}</li>
                            )}
                          </ul>
                        </td>
                        <td style={{ padding: '0.75rem', fontSize: '0.85rem' }}>
                          <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#0f172a', marginBottom: '0.2rem' }}>
                            Total: ${(r.valorPagar || r.granTotal || 0).toLocaleString('es-CO')}
                          </div>
                          <div style={{ fontWeight: 'bold', color: r.tipoPago === 'Cancelado' ? '#16a34a' : r.tipoPago === 'Abono' ? '#ca8a04' : '#ef4444' }}>
                            {r.tipoPago || 'Pendiente'}
                          </div>
                          {r.tipoPago === 'Abono' && (
                            <div style={{ color: '#64748b' }}>
                              Abono: ${r.abono?.toLocaleString('es-CO')} <br />
                              Saldo: ${r.saldo?.toLocaleString('es-CO')}
                            </div>
                          )}
                          {r.tipoPago !== 'Abono' && r.tipoPago !== 'Cancelado' && (
                            <div style={{ color: '#64748b' }}>
                              Deuda: ${r.saldo !== undefined ? r.saldo.toLocaleString('es-CO') : 'Calculando...'}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '0.75rem' }}>{formatDateTime(r.fechaEntrega)}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <select className="form-input" style={{ padding: '0.4rem', fontSize: '0.85rem' }} value={r.operadoraId || ''} onChange={(e) => assignOperator(r.id, e.target.value)}>
                            <option value="">Sin Asignar</option>
                            {activeOperators.map((op) => (
                              <option key={op.id} value={op.id}>{op.nombre}</option>
                            ))}
                          </select>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}>
                            <button
                              type="button"
                              onClick={() => setStickerData(r)}
                              className="btn font-bold text-xs"
                              style={{
                                padding: '0.25rem 0.6rem',
                                fontSize: '0.75rem',
                                backgroundColor: '#0f172a',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '0.5rem',
                                cursor: 'pointer',
                              }}
                            >
                              🏷️ Imprimir Sticker
                            </button>
                            <span style={{ padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 'bold', backgroundColor: r.estado === 'Entregado' ? '#e0e7ff' : r.estado === 'Terminado' ? '#dcfce7' : r.estado === 'En elaboración' ? '#fef08a' : '#f1f5f9', color: r.estado === 'Entregado' ? '#3730a3' : r.estado === 'Terminado' ? '#166534' : r.estado === 'En elaboración' ? '#854d0e' : '#475569' }}>
                              {r.estado}
                            </span>
                            {r.estado === 'Terminado' && (
                              <button className="btn btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} onClick={() => setEntregaModal({ isOpen: true, reciboId: r.id, fecha: getCurrentLocalTimeStr(), nombre: '' })}>
                                Entregar
                              </button>
                            )}
                            {r.estado === 'Entregado' && (
                              <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: '1.2' }}>
                                A: <strong>{r.quienRecogio}</strong> <br />
                                {formatDateTime(r.fechaEntregado)}
                              </div>
                            )}
                            <button
                              className="btn"
                              style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', marginTop: '0.5rem', backgroundColor: r.observacionOperadora && !r.respuestaAdministradora ? '#f97316' : '#f1f5f9', color: r.observacionOperadora && !r.respuestaAdministradora ? '#fff' : '#475569', border: 'none', fontWeight: 'bold', borderRadius: '0.5rem' }}
                              onClick={() => setObsModal({ isOpen: true, reciboId: r.id, operadoraText: r.observacionOperadora || '', adminText: r.respuestaAdministradora || '' })}
                            >
                              Observaciones {r.observacionOperadora && !r.respuestaAdministradora ? '⚠️' : ''}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
            <h2 style={{ marginTop: 0, color: '#334155' }}>Gestión de Operadoras</h2>
            <form onSubmit={handleAddOperator} style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <input type="text" className="form-input" placeholder="Nombre de la nueva operadora" value={nuevaOperadoraNombre} onChange={(e) => setNuevaOperadoraNombre(e.target.value)} style={{ flex: 1 }} />
              <button type="submit" className="btn btn-primary">Agregar Operadora</button>
            </form>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
              {operadoras.map((op) => (
                <div key={op.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem', backgroundColor: op.activa ? '#f8fafc' : '#fee2e2', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '500', color: op.activa ? '#0f172a' : '#991b1b', textDecoration: op.activa ? 'none' : 'line-through' }}>{op.nombre}</span>
                    <button onClick={() => toggleOperatorStatus(op.id, !op.activa)} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>
                      {op.activa ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                  {op.activa && op.token && (
                    <button 
                      onClick={() => {
                        const link = `${window.location.origin}/operadoras?token=${op.token}`
                        navigator.clipboard.writeText(link)
                        alert('Enlace copiado al portapapeles:\n\n' + link)
                      }} 
                      className="btn btn-primary" 
                      style={{ padding: '0.4rem', fontSize: '0.8rem', marginTop: '0.5rem' }}
                    >
                      📋 Copiar Enlace Único
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {entregaModal.isOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '0.5rem', width: '90%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
              <h2 style={{ marginTop: 0, color: 'var(--primary-pink)' }}>Confirmar Entrega</h2>
              <form onSubmit={handleEntregaSubmit}>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Fecha y Hora de Entrega Real</label>
                  <input type="datetime-local" className="form-input" required value={entregaModal.fecha} onChange={(e) => setEntregaModal({ ...entregaModal, fecha: e.target.value })} />
                </div>
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label">Nombre de quien retira</label>
                  <input type="text" className="form-input" placeholder="Ej. María (titular) o Juan (esposo)" required value={entregaModal.nombre} onChange={(e) => setEntregaModal({ ...entregaModal, nombre: e.target.value })} />
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setEntregaModal({ ...entregaModal, isOpen: false })}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    Guardar Entrega
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {obsModal.isOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '0.5rem', width: '90%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
              <h2 style={{ marginTop: 0, color: 'var(--primary-pink)' }}>Observaciones del Paquete</h2>
              <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                <strong style={{ display: 'block', marginBottom: '0.5rem', color: '#334155', fontSize: '0.9rem' }}>Lo que dice la Operadora:</strong>
                <p style={{ margin: 0, fontSize: '0.95rem', color: obsModal.operadoraText ? '#0f172a' : '#94a3b8', fontStyle: obsModal.operadoraText ? 'normal' : 'italic' }}>
                  {obsModal.operadoraText || 'La operadora no ha dejado ninguna observación para este paquete.'}
                </p>
              </div>
              <form onSubmit={handleObsSubmit}>
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label" style={{ fontWeight: 'bold' }}>Tu Respuesta (Administradora):</label>
                  <textarea className="form-input" placeholder="Escribe aquí tu respuesta para la operadora..." style={{ minHeight: '80px' }} value={obsModal.adminText} onChange={(e) => setObsModal({ ...obsModal, adminText: e.target.value })} />
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setObsModal({ ...obsModal, isOpen: false })}>
                    Cerrar
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    Guardar y Enviar Respuesta
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default function AdminPage() {
  return (
    <PasswordGate correctPin="admin" title="Acceso Administradora">
      <AdminDashboard />
    </PasswordGate>
  )
}
