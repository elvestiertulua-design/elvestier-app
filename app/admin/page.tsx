'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { formatDateTime, formatDateOnly, formatTimeOnly, getDayName, parseDateParts, formatEntregaCompleta } from '@/lib/dateUtils'

function getCurrentLocalTimeStr() {
  const tzOffset = new Date().getTimezoneOffset() * 60000
  return new Date(Date.now() - tzOffset).toISOString().slice(0, 16)
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
            {data.fechaEntrega ? formatEntregaCompleta(data.fechaEntrega) : '___________'}
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
  const [auxiliares, setAuxiliares] = useState<any[]>([])
  const [asistencia, setAsistencia] = useState<any[]>([])
  const [egresos, setEgresos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [cajaDate, setCajaDate] = useState(() => getCurrentLocalTimeStr().split('T')[0])

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)

  const [nuevaOperadoraNombre, setNuevaOperadoraNombre] = useState('')
  const [nuevaAuxiliarNombre, setNuevaAuxiliarNombre] = useState('')
  const [filterCliente, setFilterCliente] = useState('')
  const [filterRecibo, setFilterRecibo] = useState('')
  const [filterRecibido, setFilterRecibido] = useState('')
  const [filterEntrega, setFilterEntrega] = useState('')
  const [filterOperadora, setFilterOperadora] = useState('')
  const [filterTerminado, setFilterTerminado] = useState('')
  const [filterEstado, setFilterEstado] = useState('')
  const [editingEntregaId, setEditingEntregaId] = useState<string | null>(null)
  const [tempEntregaVal, setTempEntregaVal] = useState<string>('')

  const [activeTab, setActiveTab] = useState<'list' | 'reports' | 'asistencia' | 'caja'>('list')
  const [reportStart, setReportStart] = useState('')
  const [reportEnd, setReportEnd] = useState('')
  const [reportOpId, setReportOpId] = useState('ALL')

  const [asistenciaStart, setAsistenciaStart] = useState(new Date().toISOString().slice(0, 10))
  const [asistenciaEnd, setAsistenciaEnd] = useState(new Date().toISOString().slice(0, 10))



  const [entregaModal, setEntregaModal] = useState({
    isOpen: false,
    reciboId: '',
    fecha: getCurrentLocalTimeStr(),
    nombre: '',
    pagoRestante: false,
    metodoPagoRestante: 'Efectivo',
  })

  const [obsModal, setObsModal] = useState({
    isOpen: false,
    reciboId: '',
    operadoraText: '',
    adminText: '',
  })

  const [nuevoEgresoDesc, setNuevoEgresoDesc] = useState('')
  const [nuevoEgresoVal, setNuevoEgresoVal] = useState('')

  const handleEgresoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevoEgresoDesc.trim() || !nuevoEgresoVal) return
    const newEgreso = {
      id: Date.now().toString(),
      descripcion: nuevoEgresoDesc,
      valor: parseFloat(nuevoEgresoVal),
      fecha: getCurrentLocalTimeStr().split('T')[0]
    }
    const updatedEgresos = [...egresos, newEgreso]
    setEgresos(updatedEgresos)
    setNuevoEgresoDesc('')
    setNuevoEgresoVal('')
    try {
      await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ egresos: updatedEgresos }),
      })
    } catch (err) {
      console.error(err)
    }
  }

  const [stickerData, setStickerData] = useState<any>(null)
  const [errorDb, setErrorDb] = useState<string | null>(null)

  const loadData = async () => {
    try {
      const res = await fetch('/api/db?t=' + Date.now())
      if (res.ok) {
        setErrorDb(null)
        const data = await res.json()
        setRecibos(data.recibos || [])
        setAsistencia(data.asistencia || [])
        setEgresos(data.egresos || [])
        const ops = data.operadoras || []
        const aux = data.auxiliares || []
        let missingTokens = false
        const opsWithTokens = ops.map((op: any) => {
          if (!op.token) {
            missingTokens = true
            return { ...op, token: Math.random().toString(36).substring(2, 10) }
          }
          return op
        })
        let missingTokensAux = false
        const auxWithTokens = aux.map((a: any) => {
          if (!a.token) {
            missingTokensAux = true
            return { ...a, token: Math.random().toString(36).substring(2, 10) }
          }
          return a
        })
        
        if (missingTokens) {
          fetch('/api/db', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'MANAGE_OPERATORS', operadoras: opsWithTokens }),
          }).catch(console.error)
        }

        if (missingTokensAux) {
          fetch('/api/db', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'MANAGE_AUXILIARES', auxiliares: auxWithTokens }),
          }).catch(console.error)
        }
        
        setOperadoras(opsWithTokens)
        setAuxiliares(auxWithTokens)
        setAsistencia(data.asistencia || [])
      } else {
        setErrorDb('La base de datos está tardando en responder. Por favor recarga la página.')
      }
    } catch (error) {
      setErrorDb('Error de red al conectar con la base de datos. Por favor recarga la página.')
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const assignOperator = async (reciboId: string, operadoraId: string) => {
    // Optimistic update
    const op = operadoras.find((o) => o.id === operadoraId)
    const opName = op ? op.nombre : (operadoraId || '')
    setRecibos((prev) =>
      prev.map((r) =>
        r.id === reciboId
          ? {
              ...r,
              operadoraId,
              operaria: opName,
              prendas: Array.isArray(r.prendas)
                ? r.prendas.map((p: any) => ({
                    ...p,
                    operadoraId: operadoraId || '',
                    operaria: opName,
                  }))
                : r.prendas,
            }
          : r
      )
    )

    try {
      const response = await fetch('/api/db', {
        method: 'PUT',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'ASSIGN_OPERATOR', id: reciboId, operadoraId }),
      })
      if (!response.ok) {
        throw new Error('Fallo al asignar operadora')
      }
    } catch (e) {
      console.error('Error al asignar operadora:', e)
      loadData()
      alert('Hubo un error al guardar la asignación. Por favor, intenta de nuevo.')
    }
  }

  const handleUpdateEstado = async (reciboId: string, nuevoEstado: string) => {
    if (nuevoEstado === 'Entregado') {
      const r = recibos.find((x) => x.id === reciboId)
      setEntregaModal({
        isOpen: true,
        reciboId,
        fecha: getCurrentLocalTimeStr(),
        nombre: r?.quienRecogio || '',
        pagoRestante: r?.tipoPago !== 'Cancelado',
        metodoPagoRestante: 'Efectivo',
      })
      return
    }

    const nowIso = new Date().toISOString()
    const isTerminado = nuevoEstado === 'Terminado'
    const isReverting = nuevoEstado === 'Pendiente' || nuevoEstado === 'En elaboración'

    setRecibos((prev) =>
      prev.map((r) => {
        if (r.id !== reciboId) return r
        return {
          ...r,
          estado: nuevoEstado,
          fechaTerminado: isTerminado ? r.fechaTerminado || nowIso : (isReverting ? null : r.fechaTerminado),
          fechaEntregado: isReverting ? null : r.fechaEntregado,
          quienRecogio: isReverting ? null : r.quienRecogio,
          prendas: Array.isArray(r.prendas)
            ? r.prendas.map((p: any) => ({
                ...p,
                estado: nuevoEstado,
                fechaTerminado: isTerminado ? p.fechaTerminado || nowIso : (isReverting ? null : p.fechaTerminado),
              }))
            : r.prendas,
        }
      })
    )

    try {
      const res = await fetch('/api/db', {
        method: 'PUT',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'UPDATE_ESTADO_RECIBO_Y_PRENDAS', reciboId, nuevoEstado }),
      })
      if (!res.ok) throw new Error('Error al actualizar estado')
    } catch (e) {
      console.error(e)
      loadData()
      alert('Error al actualizar el estado.')
    }
  }

  const handleSaveFechaEntrega = async (reciboId: string, nuevaFecha: string) => {
    setRecibos((prev) =>
      prev.map((r) => (r.id === reciboId ? { ...r, fechaEntrega: nuevaFecha } : r))
    )
    setEditingEntregaId(null)

    try {
      const res = await fetch('/api/db', {
        method: 'PUT',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'UPDATE_FECHA_ENTREGA', id: reciboId, fechaEntrega: nuevaFecha }),
      })
      if (!res.ok) throw new Error('Error al actualizar fecha de entrega')
    } catch (e) {
      console.error(e)
      loadData()
      alert('Error al guardar la nueva fecha de entrega.')
    }
  }

  const handleEntregaSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const target = recibos.find((r) => r.id === entregaModal.reciboId)
    const entregaReciboId = entregaModal.reciboId
    const fecha = entregaModal.fecha
    const nombre = entregaModal.nombre
    const pagoRestante = entregaModal.pagoRestante
    const metodoPagoRestante = entregaModal.metodoPagoRestante

    // Actualización optimista inmediata en memoria
    setRecibos((prev) =>
      prev.map((r) => {
        if (r.id === entregaReciboId) {
          const isCancelado = pagoRestante || r.tipoPago === 'Cancelado'
          const newMetodo = pagoRestante && r.metodoPago ? `${r.metodoPago} y ${metodoPagoRestante}` : (pagoRestante ? metodoPagoRestante : r.metodoPago)
          return {
            ...r,
            estado: 'Entregado',
            fechaEntregado: fecha,
            quienRecogio: nombre,
            tipoPago: isCancelado ? 'Cancelado' : r.tipoPago,
            metodoPago: newMetodo,
            valorPagar: isCancelado ? (r.granTotal || r.valorPagar) : r.valorPagar,
            saldo: isCancelado ? 0 : r.saldo,
            prendas: Array.isArray(r.prendas)
              ? r.prendas.map((p: any) => ({ ...p, estado: 'Entregado', fechaEntregado: fecha }))
              : r.prendas,
          }
        }
        return r
      })
    )

    setEntregaModal({ isOpen: false, reciboId: '', fecha: getCurrentLocalTimeStr(), nombre: '', pagoRestante: false, metodoPagoRestante: 'Efectivo' })

    try {
      const payload: any = {
        type: 'MARK_DELIVERED',
        id: entregaReciboId,
        fechaEntregado: fecha,
        quienRecogio: nombre,
      }
      if (pagoRestante && target) {
        payload.tipoPago = 'Cancelado'
        payload.metodoPago = target.metodoPago ? `${target.metodoPago} y ${metodoPagoRestante}` : metodoPagoRestante
        payload.valorPagar = target.granTotal
        payload.saldo = 0
      }

      const res = await fetch('/api/db', {
        method: 'PUT',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Error al registrar la entrega')
    } catch (e) {
      console.error(e)
      alert('Hubo un error al guardar la entrega. Se recargarán los datos.')
      loadData()
    }
  }

  const handleObsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const targetId = obsModal.reciboId
    const text = obsModal.adminText

    setRecibos((prev) =>
      prev.map((r) => (r.id === targetId ? { ...r, respuestaAdministradora: text } : r))
    )
    setObsModal({ isOpen: false, reciboId: '', operadoraText: '', adminText: '' })

    try {
      const res = await fetch('/api/db', {
        method: 'PUT',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'UPDATE_OBSERVATIONS',
          id: targetId,
          respuestaAdministradora: text,
        }),
      })
      if (!res.ok) throw new Error('Error al guardar observación')
    } catch (e) {
      console.error(e)
      alert('Error al guardar la observación.')
      loadData()
    }
  }

  const handleAddOperator = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevaOperadoraNombre.trim()) return
    const newOp = {
      id: Date.now().toString(),
      nombre: nuevaOperadoraNombre.trim(),
      activa: true,
      token: Math.random().toString(36).substring(2, 10),
    }
    const updated = [...operadoras, newOp]
    setOperadoras(updated)
    setNuevaOperadoraNombre('')

    try {
      const res = await fetch('/api/db', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'MANAGE_OPERATORS', operadoras: updated }),
      })
      if (!res.ok) throw new Error('Error al guardar operadora')
    } catch (e) {
      console.error(e)
      loadData()
    }
  }

  const toggleOperatorStatus = async (id: string, newStatus: boolean) => {
    const updated = operadoras.map((op) => (op.id === id ? { ...op, activa: newStatus } : op))
    setOperadoras(updated)
    try {
      const res = await fetch('/api/db', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'MANAGE_OPERATORS', operadoras: updated }),
      })
      if (!res.ok) throw new Error('Error al actualizar operadora')
    } catch (e) {
      console.error(e)
      loadData()
    }
  }

  const handleAddAuxiliar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevaAuxiliarNombre.trim()) return
    const newAux = {
      id: Date.now().toString(),
      nombre: nuevaAuxiliarNombre.trim(),
      activa: true,
      token: Math.random().toString(36).substring(2, 10),
    }
    const updated = [...auxiliares, newAux]
    setAuxiliares(updated)
    setNuevaAuxiliarNombre('')

    try {
      const res = await fetch('/api/db', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'MANAGE_AUXILIARES', auxiliares: updated }),
      })
      if (!res.ok) throw new Error('Error al guardar auxiliar')
    } catch (e) {
      console.error(e)
      loadData()
    }
  }

  const toggleAuxiliarStatus = async (id: string, newStatus: boolean) => {
    const updated = auxiliares.map((a) => (a.id === id ? { ...a, activa: newStatus } : a))
    setAuxiliares(updated)
    try {
      const res = await fetch('/api/db', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'MANAGE_AUXILIARES', auxiliares: updated }),
      })
      if (!res.ok) throw new Error('Error al actualizar auxiliar')
    } catch (e) {
      console.error(e)
      loadData()
    }
  }

  const normalizeStr = (str: string) => str ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "").toLowerCase() : ""

  const activeOperators = useMemo(() => operadoras.filter((op) => op.activa), [operadoras])

  const filteredRecibos = useMemo(() => {
    return recibos.filter((r) => {
      let match = true
      if (filterCliente) {
        const term = normalizeStr(filterCliente)
        const cName = normalizeStr(r.cliente || r.clienteNombre || '')
        if (!cName.includes(term)) match = false
      }
      if (filterRecibo) {
        const term = filterRecibo.toLowerCase().trim()
        const num = (r.numeroRecibo || r.id || '').toString().toLowerCase()
        if (!num.includes(term)) match = false
      }
      if (filterRecibido) {
        const rRec = (r.fechaRecibido || r.fechaRegistro || '').slice(0, 10)
        const parsedRec = parseDateParts(r.fechaRecibido || r.fechaRegistro).date
        if (rRec !== filterRecibido && parsedRec !== filterRecibido) match = false
      }
      if (filterEntrega) {
        const rEnt = (r.fechaEntrega || '').slice(0, 10)
        const parsedEnt = parseDateParts(r.fechaEntrega).date
        if (rEnt !== filterEntrega && parsedEnt !== filterEntrega) match = false
      }
      if (filterTerminado) {
        const rTerm = (r.fechaTerminado || '').slice(0, 10)
        const parsedTerm = parseDateParts(r.fechaTerminado).date
        if (rTerm !== filterTerminado && parsedTerm !== filterTerminado) match = false
      }
      if (filterEstado) {
        const rEstado = r.estado || 'Pendiente'
        if (rEstado !== filterEstado) match = false
      }
      if (filterOperadora) {
        if (filterOperadora === 'unassigned' && (r.operadoraId || r.operaria)) match = false
        else if (filterOperadora !== 'unassigned' && r.operadoraId !== filterOperadora) match = false
      }
      return match
    })
  }, [recibos, filterCliente, filterRecibo, filterRecibido, filterEntrega, filterTerminado, filterEstado, filterOperadora])

  useEffect(() => {
    setCurrentPage(1)
  }, [filterCliente, filterRecibo, filterRecibido, filterEntrega, filterTerminado, filterEstado, filterOperadora, itemsPerPage])

  const totalPages = Math.ceil(filteredRecibos.length / itemsPerPage) || 1

  const paginatedRecibos = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredRecibos.slice(start, start + itemsPerPage)
  }, [filteredRecibos, currentPage, itemsPerPage])

  const renderPaginationControls = () => {
    if (filteredRecibos.length === 0) return null
    const startIndex = (currentPage - 1) * itemsPerPage + 1
    const endIndex = Math.min(currentPage * itemsPerPage, filteredRecibos.length)

    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          padding: '0.75rem 1rem',
          backgroundColor: '#f8fafc',
          borderRadius: '0.5rem',
          border: '1px solid #e2e8f0',
          margin: '1rem 0',
          fontSize: '0.85rem',
        }}
      >
        <div style={{ color: '#475569', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span>
            Mostrando <strong>{startIndex} - {endIndex}</strong> de <strong>{filteredRecibos.length}</strong> pedidos
          </span>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>Mostrar:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="form-input"
              style={{ padding: '0.2rem 0.5rem', fontSize: '0.85rem', width: 'auto' }}
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
          </label>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <button
            type="button"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="btn btn-secondary"
            style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', opacity: currentPage === 1 ? 0.4 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
          >
            « Primera
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="btn btn-secondary"
            style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', opacity: currentPage === 1 ? 0.4 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
          >
            ‹ Anterior
          </button>
          <span style={{ fontWeight: 'bold', color: '#0f172a', padding: '0 0.5rem' }}>
            Pág. {currentPage} de {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="btn btn-secondary"
            style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', opacity: currentPage === totalPages ? 0.4 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
          >
            Siguiente ›
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="btn btn-secondary"
            style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', opacity: currentPage === totalPages ? 0.4 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
          >
            Última »
          </button>
        </div>
      </div>
    )
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

        {errorDb && (
          <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #f87171', fontWeight: 'bold' }}>
            ⚠️ {errorDb}
          </div>
        )}

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
          <button
            onClick={() => setActiveTab('caja')}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              color: activeTab === 'caja' ? 'var(--primary-pink)' : '#64748b',
              borderBottom: activeTab === 'caja' ? '3px solid var(--primary-pink)' : 'none',
              paddingBottom: '0.5rem',
              marginBottom: '-0.65rem',
            }}
          >
            Caja Registradora
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

        {activeTab === 'caja' && (() => {
          const todayStr = cajaDate
          
          let totalEfectivo = 0
          let totalNequi = 0

          recibos.forEach(r => {
            const isCreatedToday = (r.fechaRegistro || r.fechaRecibido || '').startsWith(todayStr)
            
            if (isCreatedToday) {
              const val = Number(r.abono) || (r.tipoPago === 'Cancelado' ? Number(r.valorPagar || r.granTotal) : 0)
              if (r.metodoPago === 'Nequi' || r.metodoPago === 'Nequi y Efectivo') totalNequi += val
              else if (val > 0) totalEfectivo += val
            }

            const isDeliveredToday = (r.fechaEntregado || '').startsWith(todayStr)
            if (isDeliveredToday && r.estado === 'Entregado' && r.metodoPago?.includes(' y ')) {
               const parts = r.metodoPago.split(' y ')
               if (parts.length === 2) {
                 const restVal = Number(r.valorPagar || r.granTotal) - Number(r.abono || 0)
                 if (parts[1] === 'Nequi') totalNequi += restVal
                 else totalEfectivo += restVal
               }
            }
          })

          const todayEgresos = egresos.filter(e => e.fecha === todayStr)
          const totalEgresos = todayEgresos.reduce((acc, e) => acc + (Number(e.valor) || 0), 0)

          return (
            <div style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2 style={{ margin: 0, color: '#334155', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  Caja Registradora
                  <input type="date" className="form-input" style={{ width: 'auto', fontSize: '1rem', padding: '0.25rem 0.5rem' }} value={cajaDate} onChange={(e) => setCajaDate(e.target.value)} />
                </h2>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    let csv = `REPORTE DE CAJA REGISTRADORA\nFecha:,${cajaDate}\n\nRESUMEN\n`
                    csv += `Ingresos Efectivo:,${totalEfectivo}\nIngresos Nequi:,${totalNequi}\nEgresos:,${totalEgresos}\nEFECTIVO EN CAJA:,${totalEfectivo - totalEgresos}\n\n`
                    
                    csv += `INGRESOS (RECIBOS)\nCliente,Servicio,Total,Abono,Metodo Pago,Estado\n`
                    recibos.forEach(r => {
                      const isCreatedToday = (r.fechaRegistro || r.fechaRecibido || '').startsWith(cajaDate)
                      const isDeliveredToday = (r.fechaEntregado || '').startsWith(cajaDate)
                      if (isCreatedToday || (isDeliveredToday && r.estado === 'Entregado' && r.metodoPago?.includes(' y '))) {
                        csv += `"${r.cliente}","${r.prendas?.map((p:any)=>p.descripcion).join(' - ') || ''}",${r.granTotal},${r.abono || 0},"${r.metodoPago || ''}","${r.estado}"\n`
                      }
                    })

                    csv += `\nEGRESOS (GASTOS)\nDescripcion,Valor\n`
                    todayEgresos.forEach(e => {
                      csv += `"${e.descripcion}",${e.valor}\n`
                    })

                    const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' })
                    const link = document.createElement('a')
                    const url = URL.createObjectURL(blob)
                    link.setAttribute('href', url)
                    link.setAttribute('download', `caja_${cajaDate}.csv`)
                    link.style.visibility = 'hidden'
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                  }}
                >
                  Descargar Resumen (CSV)
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ padding: '1.5rem', backgroundColor: '#f0fdf4', borderRadius: '0.5rem', border: '1px solid #bbf7d0' }}>
                  <h3 style={{ margin: 0, color: '#166534', fontSize: '1rem' }}>Ingresos Efectivo</h3>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#15803d' }}>${totalEfectivo.toLocaleString('es-CO')}</div>
                </div>
                <div style={{ padding: '1.5rem', backgroundColor: '#eef2ff', borderRadius: '0.5rem', border: '1px solid #c7d2fe' }}>
                  <h3 style={{ margin: 0, color: '#3730a3', fontSize: '1rem' }}>Ingresos Nequi</h3>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4338ca' }}>${totalNequi.toLocaleString('es-CO')}</div>
                </div>
                <div style={{ padding: '1.5rem', backgroundColor: '#fef2f2', borderRadius: '0.5rem', border: '1px solid #fecaca' }}>
                  <h3 style={{ margin: 0, color: '#991b1b', fontSize: '1rem' }}>Egresos (Gastos)</h3>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#b91c1c' }}>${totalEgresos.toLocaleString('es-CO')}</div>
                </div>
                <div style={{ padding: '1.5rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }}>
                  <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1rem' }}>Efectivo en Caja (Total)</h3>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0f172a' }}>${(totalEfectivo - totalEgresos).toLocaleString('es-CO')}</div>
                </div>
              </div>

              <h3 style={{ color: '#334155', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>Registrar Gasto (Egreso)</h3>
              <form onSubmit={handleEgresoSubmit} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <div className="form-group" style={{ flex: '1 1 300px' }}>
                  <label className="form-label">Descripción del gasto</label>
                  <input type="text" className="form-input" placeholder="Ej. Compra de hilos, almuerzo..." required value={nuevoEgresoDesc} onChange={(e) => setNuevoEgresoDesc(e.target.value)} />
                </div>
                <div className="form-group" style={{ flex: '1 1 150px' }}>
                  <label className="form-label">Valor ($)</label>
                  <input type="number" className="form-input" placeholder="Ej. 15000" required value={nuevoEgresoVal} onChange={(e) => setNuevoEgresoVal(e.target.value)} />
                </div>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', marginBottom: '0.2rem' }}>Registrar</button>
              </form>

              {todayEgresos.length > 0 && (
                <div>
                  <h3 style={{ color: '#334155' }}>Gastos de Hoy</h3>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {todayEgresos.map((e, i) => (
                      <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <span>{e.descripcion}</span>
                        <strong style={{ color: '#ef4444' }}>-${Number(e.valor).toLocaleString('es-CO')}</strong>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )
        })()}

        {activeTab === 'list' && (
          <div>
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
                <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#64748b' }}>Estado del Pedido</label>
                <select className="form-input" value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)}>
                  <option value="">Todos los Estados</option>
                  <option value="Pendiente">⏳ Pendiente</option>
                  <option value="En elaboración">🧵 En elaboración</option>
                  <option value="Terminado">✓ Terminado</option>
                  <option value="Entregado">📦 Entregado</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#64748b' }}>Fecha de Terminado</label>
                <input type="date" className="form-input" value={filterTerminado} onChange={(e) => setFilterTerminado(e.target.value)} />
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
            {(filterCliente || filterRecibo || filterRecibido || filterEntrega || filterOperadora || filterTerminado || filterEstado) && (
              <button
                className="btn btn-secondary"
                style={{ marginTop: '1rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                onClick={() => {
                  setFilterCliente('')
                  setFilterRecibo('')
                  setFilterRecibido('')
                  setFilterEntrega('')
                  setFilterOperadora('')
                  setFilterTerminado('')
                  setFilterEstado('')
                }}
              >
                Limpiar Filtros
              </button>
            )}
          </div>

          <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
            <h2 style={{ marginTop: 0, color: '#334155' }}>Asignación de Paquetes</h2>
            {renderPaginationControls()}
            <div className="table-container">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead style={{ backgroundColor: '#f1f5f9' }}>
                  <tr>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}># Recibo</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Fecha Registro</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Cliente</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Prendas</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Pago</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Entrega (Fecha y Hora)</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Operadora</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecibos.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '1rem' }}>No hay recibos que coincidan con la búsqueda.</td>
                    </tr>
                  ) : (
                    paginatedRecibos.map((r) => (
                      <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{r.numeroRecibo || '-'}</td>
                        <td style={{ padding: '0.75rem' }}>{r.fechaRegistro || r.fechaRecibido}</td>
                        <td style={{ padding: '0.75rem' }}>
                          {r.cliente || r.clienteNombre} <br />
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
                        <td style={{ padding: '0.75rem', minWidth: '160px' }}>
                          {editingEntregaId === r.id ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                              <input
                                type="datetime-local"
                                className="form-input"
                                style={{ padding: '0.3rem', fontSize: '0.8rem' }}
                                value={tempEntregaVal}
                                onChange={(e) => setTempEntregaVal(e.target.value)}
                              />
                              <div style={{ display: 'flex', gap: '0.3rem' }}>
                                <button
                                  className="btn btn-primary"
                                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', flex: 1 }}
                                  onClick={() => handleSaveFechaEntrega(r.id, tempEntregaVal)}
                                >
                                  💾 Guardar
                                </button>
                                <button
                                  className="btn btn-secondary"
                                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                                  onClick={() => setEditingEntregaId(null)}
                                >
                                  ✖
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              {r.fechaEntrega ? (
                                <div>
                                  <div style={{ fontWeight: 'bold', color: '#1e293b' }}>
                                    📅 {getDayName(r.fechaEntrega) ? `${getDayName(r.fechaEntrega)}, ` : ''}{formatDateOnly(r.fechaEntrega)}
                                  </div>
                                  <div style={{ fontWeight: '800', color: '#dc2626', fontSize: '0.9rem', marginTop: '2px' }}>
                                    ⏰ {formatTimeOnly(r.fechaEntrega) || 'Hora no esp.'}
                                  </div>
                                </div>
                              ) : (
                                <div style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.8rem' }}>Sin definir</div>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingEntregaId(r.id)
                                  setTempEntregaVal(r.fechaEntrega ? r.fechaEntrega.slice(0, 16) : '')
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#0284c7',
                                  cursor: 'pointer',
                                  fontSize: '0.75rem',
                                  padding: '2px 0',
                                  textDecoration: 'underline',
                                  display: 'block',
                                  marginTop: '4px',
                                }}
                              >
                                ✏️ Cambiar fecha/hora
                              </button>
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <select
                            className="form-input"
                            style={{ padding: '0.4rem', fontSize: '0.85rem' }}
                            value={r.operadoraId || ''}
                            onChange={(e) => assignOperator(r.id, e.target.value)}
                          >
                            <option value="">Sin Asignar</option>
                            {activeOperators.map((op) => (
                              <option key={op.id} value={op.id}>{op.nombre}</option>
                            ))}
                            {r.operadoraId && !activeOperators.some(op => op.id === r.operadoraId) && (
                              <option value={r.operadoraId}>{r.operaria || r.operadoraId}</option>
                            )}
                          </select>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-start' }}>
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

                            <div style={{ width: '100%' }}>
                              <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>
                                Estado del Pedido:
                              </label>
                              <select
                                value={r.estado || 'Pendiente'}
                                onChange={(e) => handleUpdateEstado(r.id, e.target.value)}
                                className="form-input"
                                style={{
                                  padding: '0.35rem 0.5rem',
                                  fontSize: '0.8rem',
                                  fontWeight: 'bold',
                                  borderRadius: '0.5rem',
                                  border: '1px solid #cbd5e1',
                                  backgroundColor:
                                    r.estado === 'Entregado'
                                      ? '#e0e7ff'
                                      : r.estado === 'Terminado'
                                      ? '#dcfce7'
                                      : r.estado === 'En elaboración'
                                      ? '#fef08a'
                                      : '#f1f5f9',
                                  color:
                                    r.estado === 'Entregado'
                                      ? '#3730a3'
                                      : r.estado === 'Terminado'
                                      ? '#166534'
                                      : r.estado === 'En elaboración'
                                      ? '#854d0e'
                                      : '#475569',
                                }}
                              >
                                <option value="Pendiente">⏳ Pendiente</option>
                                <option value="En elaboración">🧵 En elaboración</option>
                                <option value="Terminado">✓ Terminado</option>
                                <option value="Entregado">📦 Entregado</option>
                              </select>
                            </div>

                            {r.estado === 'Terminado' && (
                              <>
                                {r.fechaTerminado && (
                                  <div style={{ fontSize: '0.72rem', color: '#166534', backgroundColor: '#f0fdf4', padding: '0.2rem 0.4rem', borderRadius: '4px', border: '1px solid #bbf7d0', width: '100%' }}>
                                    Terminado: <strong>{formatDateTime(r.fechaTerminado)}</strong>
                                  </div>
                                )}
                                <button
                                  className="btn btn-primary"
                                  style={{ padding: '0.35rem 0.7rem', fontSize: '0.75rem', backgroundColor: '#16a34a', borderColor: '#16a34a', width: '100%', fontWeight: 'bold' }}
                                  onClick={() => setEntregaModal({ isOpen: true, reciboId: r.id, fecha: getCurrentLocalTimeStr(), nombre: '', pagoRestante: r.tipoPago !== 'Cancelado', metodoPagoRestante: 'Efectivo' })}
                                >
                                  🚀 Entregar Prenda
                                </button>
                              </>
                            )}

                            {r.estado === 'Entregado' && (
                              <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: '1.2', backgroundColor: '#f8fafc', padding: '0.3rem', borderRadius: '4px', border: '1px solid #e2e8f0', width: '100%' }}>
                                Entregado a: <strong>{r.quienRecogio || 'Cliente'}</strong> <br />
                                {formatDateTime(r.fechaEntregado)}
                              </div>
                            )}

                            <button
                              className="btn"
                              style={{
                                padding: '0.2rem 0.5rem',
                                fontSize: '0.75rem',
                                marginTop: '0.2rem',
                                backgroundColor: r.observacionOperadora && !r.respuestaAdministradora ? '#f97316' : '#f1f5f9',
                                color: r.observacionOperadora && !r.respuestaAdministradora ? '#fff' : '#475569',
                                border: 'none',
                                fontWeight: 'bold',
                                borderRadius: '0.5rem',
                              }}
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
            {renderPaginationControls()}
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
          <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', marginTop: '2rem' }}>
            <h2 style={{ marginTop: 0, color: '#334155' }}>Gestión de Auxiliares</h2>
            <form onSubmit={handleAddAuxiliar} style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <input type="text" className="form-input" placeholder="Nombre de la nueva auxiliar" value={nuevaAuxiliarNombre} onChange={(e) => setNuevaAuxiliarNombre(e.target.value)} style={{ flex: 1 }} />
              <button type="submit" className="btn btn-primary">Agregar Auxiliar</button>
            </form>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
              {auxiliares.map((aux) => (
                <div key={aux.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem', backgroundColor: aux.activa ? '#f8fafc' : '#fee2e2', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '500', color: aux.activa ? '#0f172a' : '#991b1b', textDecoration: aux.activa ? 'none' : 'line-through' }}>{aux.nombre}</span>
                    <button onClick={() => toggleAuxiliarStatus(aux.id, !aux.activa)} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>
                      {aux.activa ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                  {aux.activa && aux.token && (
                    <button 
                      onClick={() => {
                        const link = `${window.location.origin}/auxiliares?token=${aux.token}`
                        navigator.clipboard.writeText(link)
                        alert('Enlace copiado al portapapeles:\n\n' + link)
                      }} 
                      className="btn btn-primary" 
                      style={{ padding: '0.4rem', fontSize: '0.8rem', marginTop: '0.5rem', backgroundColor: '#8b5cf6' }}
                    >
                      📋 Copiar Enlace Único
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

        {entregaModal.isOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '15vh', zIndex: 9999, overflowY: 'auto' }}>
            <div style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '0.5rem', width: '90%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', marginBottom: '5vh' }}>
              <h2 style={{ marginTop: 0, color: 'var(--primary-pink)' }}>Confirmar Entrega</h2>
              <form onSubmit={handleEntregaSubmit}>
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label">Fecha y Hora de Entrega Real</label>
                  <input type="datetime-local" className="form-input" required value={entregaModal.fecha} onChange={(e) => setEntregaModal({ ...entregaModal, fecha: e.target.value })} />
                </div>
                {entregaModal.pagoRestante && (
                  <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f1f5f9', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }}>
                    <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block', color: '#0f172a' }}>El cliente debe pagar un saldo pendiente.</label>
                    <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>¿Cómo paga este saldo restante?</label>
                    <div style={{ display: 'flex', gap: '2rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 'bold', color: '#10b981', fontSize: '1.1rem' }}>
                        <input type="radio" name="metodoPagoRestante" checked={entregaModal.metodoPagoRestante === 'Efectivo'} onChange={() => setEntregaModal({ ...entregaModal, metodoPagoRestante: 'Efectivo' })} />
                        💵 Efectivo
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 'bold', color: '#6366f1', fontSize: '1.1rem' }}>
                        <input type="radio" name="metodoPagoRestante" checked={entregaModal.metodoPagoRestante === 'Nequi'} onChange={() => setEntregaModal({ ...entregaModal, metodoPagoRestante: 'Nequi' })} />
                        📱 Nequi
                      </label>
                    </div>
                  </div>
                )}
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
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '15vh', zIndex: 9999, overflowY: 'auto' }}>
            <div style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '0.5rem', width: '90%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', marginBottom: '5vh' }}>
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
export const dynamic = 'force-dynamic'
