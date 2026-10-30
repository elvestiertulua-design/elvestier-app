'use client'

import React, { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'
import { parseDateParts, getDayName, formatTimeOnly } from '@/lib/dateUtils'

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
              placeholder="Ingresa la clave"
              className="form-input"
              style={{ textAlign: 'center', fontSize: '1.2rem', letterSpacing: '0.2rem' }}
            />
          </div>
          {error && <p style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.9rem' }}>Clave incorrecta</p>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Ingresar
          </button>
        </form>
      </div>
    </div>
  )
}

function getTodayMonthStr() {
  const now = new Date()
  const offset = -5 * 60 * 60 * 1000
  const localDate = new Date(now.getTime() + offset)
  const yyyy = localDate.getUTCFullYear()
  const mm = String(localDate.getUTCMonth() + 1).padStart(2, '0')
  return `${yyyy}-${mm}`
}

function getTodayStr() {
  const now = new Date()
  const offset = -5 * 60 * 60 * 1000
  const localDate = new Date(now.getTime() + offset)
  const yyyy = localDate.getUTCFullYear()
  const mm = String(localDate.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(localDate.getUTCDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function shiftDate(dateStr: string, offsetDays: number): string {
  if (!dateStr) return dateStr
  const [y, m, d] = dateStr.split('-').map(Number)
  if (!y || !m || !d) return dateStr
  const dt = new Date(y, m - 1, d + offsetDays, 12, 0, 0)
  const yyyy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function formatSpanishDatePretty(dateStr: string): string {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-').map(Number)
  if (!y || !m || !d) return dateStr
  const dayName = getDayName(dateStr)
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]
  const dayCapitalized = dayName ? dayName.charAt(0) + dayName.slice(1).toLowerCase() : ''
  return `${dayCapitalized ? dayCapitalized + ', ' : ''}${d} de ${monthNames[m - 1]} de ${y}`
}

function getReciboDate(r: any): string {
  const d = r.fechaRegistro || r.fechaRecibido || r.fecha || ''
  return d.substring(0, 10)
}

function getReciboEntregaDate(r: any): string {
  if (!r?.fechaEntrega) return ''
  return parseDateParts(r.fechaEntrega).date || (String(r.fechaEntrega).slice(0, 10))
}

function getReciboDeliveryMetrics(r: any) {
  const granTotal = Number(r.valorPagar || r.granTotal) || 0
  const abono = Number(r.abono) || 0
  
  // Dinero que debería entrar según la fecha de entrega acordada
  const dineroEsperado = Math.max(0, granTotal - abono)

  // Saldo actualmente pendiente por cobrar
  let saldoPendiente = 0
  if (r.estado === 'Entregado' && (r.saldo === 0 || r.tipoPago === 'Cancelado')) {
    saldoPendiente = 0
  } else if (r.saldo !== undefined && r.saldo !== null && !isNaN(Number(r.saldo))) {
    saldoPendiente = Number(r.saldo)
  } else {
    saldoPendiente = r.tipoPago === 'Cancelado' ? 0 : dineroEsperado
  }

  const yaRecaudado = Math.max(0, dineroEsperado - saldoPendiente)

  return {
    granTotal,
    abono,
    dineroEsperado,
    saldoPendiente,
    yaRecaudado
  }
}

function formatMoneyCompact(val: number) {
  if (!val) return '$0'
  if (val >= 1000000) {
    const formatted = (val / 1000000).toFixed(1)
    return `$${formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted}M`
  }
  if (val >= 1000) {
    return `$${Math.round(val / 1000)}k`
  }
  return `$${val}`
}

const COLORS = ['#f472b6', '#3b82f6', '#10b981', '#f59e0b']

export default function DashboardPage() {
  const [recibos, setRecibos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(getTodayMonthStr())
  const [selectedDeliveryDate, setSelectedDeliveryDate] = useState(getTodayStr())
  const [showOrdersList, setShowOrdersList] = useState(false)
  const [showMonthDeliveriesTable, setShowMonthDeliveriesTable] = useState(false)
  const [chartMetricMode, setChartMetricMode] = useState<'both' | 'entrega' | 'registro'>('both')
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily')
  const [chartScroll, setChartScroll] = useState<boolean>(false)

  useEffect(() => {
    fetch('/api/db')
      .then((res) => res.json())
      .then((data) => {
        setRecibos(data.recibos || [])
        setLoading(false)
      })
      .catch((err) => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  // Derived calculations
  const [yearStr, monthStr] = selectedMonth.split('-')
  const selectedYear = parseInt(yearStr)
  const selectedMonthNum = parseInt(monthStr) - 1 // 0-indexed

  // Sort and Tag Recibos for New vs Returning Clients
  const sortedRecibos = [...recibos].sort((a, b) => getReciboDate(a).localeCompare(getReciboDate(b)))
  const seenClients = new Set<string>()
  
  const taggedRecibos = sortedRecibos.map(r => {
    const clientKey = (r.cliente || r.clienteNombre || '').toLowerCase().trim()
    const isNew = clientKey && !seenClients.has(clientKey)
    if (clientKey) seenClients.add(clientKey)
    return { ...r, isNewClient: !!isNew }
  })

  // Current Month Data (por Fecha de Registro)
  const currentMonthRecibos = taggedRecibos.filter((r) => getReciboDate(r).startsWith(selectedMonth))
  
  // Previous Month Data
  const prevDate = new Date(selectedYear, selectedMonthNum - 1, 1)
  const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`
  const prevMonthRecibos = taggedRecibos.filter((r) => getReciboDate(r).startsWith(prevMonthStr))

  interface ChartItem {
    periodo: string
    dinero: number // Dinero por Registro
    dineroEsperadoEntrega: number // Dinero que debería entrar según Fecha de Entrega
    valorTotalEntrega: number // Valor total de órdenes a entregar
    pedidosEntrega: number
    clientesTotales: number
    clientesNuevos: number
    clientesRecurrentes: number
  }

  // Daily Data Aggregation (1 a daysInMonth)
  const daysInMonth = new Date(selectedYear, selectedMonthNum + 1, 0).getDate()
  const dailyData: ChartItem[] = []
  
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${selectedMonth}-${String(i).padStart(2, '0')}`
    
    // Recibos registrados en esta fecha
    const dailyRecibos = currentMonthRecibos.filter((r) => getReciboDate(r) === dateStr)
    const totalDinero = dailyRecibos.reduce((acc, r) => acc + (Number(r.valorPagar || r.granTotal) || 0), 0)
    
    const totalClientes = dailyRecibos.length
    const clientesNuevos = dailyRecibos.filter(r => r.isNewClient).length
    const clientesRecurrentes = totalClientes - clientesNuevos

    // Entregas programadas para esta fecha
    const dailyEntregas = taggedRecibos.filter((r) => getReciboEntregaDate(r) === dateStr)
    const dineroEsperadoEntrega = dailyEntregas.reduce((acc, r) => acc + getReciboDeliveryMetrics(r).dineroEsperado, 0)
    const valorTotalEntrega = dailyEntregas.reduce((acc, r) => acc + getReciboDeliveryMetrics(r).granTotal, 0)
    const pedidosEntrega = dailyEntregas.length

    dailyData.push({ 
      periodo: String(i), 
      dinero: totalDinero, 
      dineroEsperadoEntrega,
      valorTotalEntrega,
      pedidosEntrega,
      clientesTotales: totalClientes,
      clientesNuevos: clientesNuevos,
      clientesRecurrentes: clientesRecurrentes
    })
  }

  // Weekly Data Aggregation
  const weeklyData: ChartItem[] = [
    { periodo: 'Sem 1 (1-7)', dinero: 0, dineroEsperadoEntrega: 0, valorTotalEntrega: 0, pedidosEntrega: 0, clientesTotales: 0, clientesNuevos: 0, clientesRecurrentes: 0 },
    { periodo: 'Sem 2 (8-14)', dinero: 0, dineroEsperadoEntrega: 0, valorTotalEntrega: 0, pedidosEntrega: 0, clientesTotales: 0, clientesNuevos: 0, clientesRecurrentes: 0 },
    { periodo: 'Sem 3 (15-21)', dinero: 0, dineroEsperadoEntrega: 0, valorTotalEntrega: 0, pedidosEntrega: 0, clientesTotales: 0, clientesNuevos: 0, clientesRecurrentes: 0 },
    { periodo: 'Sem 4 (22-28)', dinero: 0, dineroEsperadoEntrega: 0, valorTotalEntrega: 0, pedidosEntrega: 0, clientesTotales: 0, clientesNuevos: 0, clientesRecurrentes: 0 },
    ...(daysInMonth > 28 ? [{ periodo: `Sem 5 (29-${daysInMonth})`, dinero: 0, dineroEsperadoEntrega: 0, valorTotalEntrega: 0, pedidosEntrega: 0, clientesTotales: 0, clientesNuevos: 0, clientesRecurrentes: 0 }] : []),
  ]

  dailyData.forEach((d) => {
    const dayNum = Number(d.periodo)
    let wIdx = 0
    if (dayNum <= 7) wIdx = 0
    else if (dayNum <= 14) wIdx = 1
    else if (dayNum <= 21) wIdx = 2
    else if (dayNum <= 28) wIdx = 3
    else wIdx = 4

    if (weeklyData[wIdx]) {
      weeklyData[wIdx].dinero += d.dinero
      weeklyData[wIdx].dineroEsperadoEntrega += d.dineroEsperadoEntrega
      weeklyData[wIdx].valorTotalEntrega += d.valorTotalEntrega
      weeklyData[wIdx].pedidosEntrega += d.pedidosEntrega
      weeklyData[wIdx].clientesTotales += d.clientesTotales
      weeklyData[wIdx].clientesNuevos += d.clientesNuevos
      weeklyData[wIdx].clientesRecurrentes += d.clientesRecurrentes
    }
  })

  const activeChartData = viewMode === 'daily' ? dailyData : weeklyData

  // Totales de Registro
  const currentTotalDinero = currentMonthRecibos.reduce((acc, r) => acc + (Number(r.valorPagar || r.granTotal) || 0), 0)
  const prevTotalDinero = prevMonthRecibos.reduce((acc, r) => acc + (Number(r.valorPagar || r.granTotal) || 0), 0)
  const currentTotalClientes = currentMonthRecibos.length
  const prevTotalClientes = prevMonthRecibos.length

  // Totales de Entrega del Mes Seleccionado
  const currentMonthEntregas = taggedRecibos.filter((r) => getReciboEntregaDate(r).startsWith(selectedMonth))
  const currentMonthEsperadoEntrega = currentMonthEntregas.reduce((acc, r) => acc + getReciboDeliveryMetrics(r).dineroEsperado, 0)
  const currentMonthTotalPedidosEntrega = currentMonthEntregas.length

  // Métricas de Hoy
  const todayStr = getTodayStr()
  const todayRecibos = taggedRecibos.filter(r => getReciboDate(r) === todayStr)
  const todayDinero = todayRecibos.reduce((acc, r) => acc + (Number(r.valorPagar || r.granTotal) || 0), 0)
  const todayClientes = todayRecibos.length
  const todayNuevos = todayRecibos.filter(r => r.isNewClient).length

  // Entregas de Hoy
  const todayEntregas = taggedRecibos.filter(r => getReciboEntregaDate(r) === todayStr)
  const todayEsperadoEntrega = todayEntregas.reduce((acc, r) => acc + getReciboDeliveryMetrics(r).dineroEsperado, 0)

  // Métricas del Día Seleccionado en el Cuadro Informativo de Entrega
  const isSelectedDateToday = selectedDeliveryDate === todayStr
  const isSelectedDateTomorrow = selectedDeliveryDate === shiftDate(todayStr, 1)
  const isSelectedDateYesterday = selectedDeliveryDate === shiftDate(todayStr, -1)
  
  const recibosEntregaDia = taggedRecibos.filter((r) => getReciboEntregaDate(r) === selectedDeliveryDate)
  const totalEsperadoDia = recibosEntregaDia.reduce((acc, r) => acc + getReciboDeliveryMetrics(r).dineroEsperado, 0)
  const saldoPendienteDia = recibosEntregaDia.reduce((acc, r) => acc + getReciboDeliveryMetrics(r).saldoPendiente, 0)
  const yaRecaudadoDia = recibosEntregaDia.reduce((acc, r) => acc + getReciboDeliveryMetrics(r).yaRecaudado, 0)
  const valorTotalPedidosDia = recibosEntregaDia.reduce((acc, r) => acc + getReciboDeliveryMetrics(r).granTotal, 0)
  const totalAbonadoDia = recibosEntregaDia.reduce((acc, r) => acc + getReciboDeliveryMetrics(r).abono, 0)
  const totalPrendasDia = recibosEntregaDia.reduce((acc, r) => acc + (Number(r.totalPrendas) || r.prendas?.length || 1), 0)
  const pedidosEntregadosDia = recibosEntregaDia.filter((r) => r.estado === 'Entregado').length
  const pedidosPendientesDia = recibosEntregaDia.filter((r) => r.estado !== 'Entregado').length

  // Días con entregas en el mes actual para la tabla resumen
  const deliveryDaysInMonth = dailyData.filter((d) => d.pedidosEntrega > 0)

  // Promedios semanales
  const avgWeeklyDinero = currentTotalDinero / 4.33
  const avgWeeklyClientes = currentTotalClientes / 4.33

  // Pie Chart Data
  const pieDineroData = [
    { name: 'Mes Anterior', value: prevTotalDinero },
    { name: 'Mes Actual', value: currentTotalDinero }
  ]

  const pieClientesData = [
    { name: 'Mes Anterior', value: prevTotalClientes },
    { name: 'Mes Actual', value: currentTotalClientes }
  ]

  return (
    <PasswordGate correctPin="4321" title="Dashboard de Estadísticas">
      <main className="main-container" style={{ maxWidth: '1240px' }}>
        <div className="glass-panel animate-fade-in panel-inner">
          
          {/* Header */}
          <div className="header-container" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <img src="/logo.png.jpeg" alt="Logo" style={{ width: '65px', borderRadius: '8px' }} onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png' }} />
              <div>
                <h1 style={{ color: 'var(--primary-pink)', margin: 0, fontSize: '1.75rem', fontWeight: '800' }}>Dashboard</h1>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Estadísticas, Análisis y Expectativa Diaria</p>
              </div>
            </div>
            <div className="header-right" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#fff', padding: '0.25rem 0.5rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold' }}>Mes:</span>
                <input 
                  type="month" 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="form-input"
                  style={{ width: 'auto', padding: '0.3rem 0.5rem', fontSize: '0.9rem', border: 'none', outline: 'none' }}
                />
              </div>
              <a href="/api/download" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} download>Descargar Excel</a>
              <a href="/" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Volver</a>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Cargando datos históricos y proyecciones...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* ============================================================== */}
              {/* CUADRO INFORMATIVO: EXPECTATIVA DE DINERO DIARIO SEGÚN ENTREGA */}
              {/* ============================================================== */}
              <section 
                style={{ 
                  backgroundColor: '#ffffff', 
                  borderRadius: '1.25rem', 
                  border: '2px solid #fbcfe8',
                  boxShadow: '0 10px 25px -5px rgba(244, 114, 182, 0.15), 0 8px 10px -6px rgba(0,0,0,0.05)',
                  overflow: 'hidden'
                }}
              >
                {/* Franja Superior / Cabecera del Cuadro */}
                <div 
                  style={{ 
                    padding: '1.25rem 1.5rem', 
                    background: 'linear-gradient(135deg, #fdf2f8 0%, #fff1f2 100%)', 
                    borderBottom: '1px solid #fce7f3',
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    flexWrap: 'wrap', 
                    gap: '1rem' 
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div 
                      style={{ 
                        width: '46px', 
                        height: '46px', 
                        borderRadius: '0.75rem', 
                        backgroundColor: '#f472b6', 
                        color: '#fff', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        fontSize: '1.5rem',
                        boxShadow: '0 4px 10px rgba(244, 114, 182, 0.4)'
                      }}
                    >
                      📦
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <h2 style={{ margin: 0, color: '#831843', fontSize: '1.25rem', fontWeight: '800' }}>
                          Expectativa de Dinero Diario
                        </h2>
                        <span 
                          style={{ 
                            fontSize: '0.75rem', 
                            fontWeight: '700', 
                            backgroundColor: '#fce7f3', 
                            color: '#be185d', 
                            padding: '0.2rem 0.6rem', 
                            borderRadius: '1rem',
                            border: '1px solid #fbcfe8'
                          }}
                        >
                          Según Fecha de Entrega
                        </span>
                      </div>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>
                        Monto proyectado a ingresar según las prendas programadas para entregar en esta fecha
                      </p>
                    </div>
                  </div>

                  {/* Controles de Navegación de Fecha */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedDeliveryDate(shiftDate(selectedDeliveryDate, -1))}
                      style={{
                        padding: '0.45rem 0.75rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#fff',
                        color: '#334155',
                        fontWeight: 'bold',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                      title="Ver día anterior"
                    >
                      ◀ Anterior
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedDeliveryDate(todayStr)}
                      style={{
                        padding: '0.45rem 0.85rem',
                        borderRadius: '0.5rem',
                        border: isSelectedDateToday ? '2px solid #10b981' : '1px solid #cbd5e1',
                        backgroundColor: isSelectedDateToday ? '#ecfdf5' : '#fff',
                        color: isSelectedDateToday ? '#047857' : '#334155',
                        fontWeight: 'bold',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                      title="Ir al día de hoy"
                    >
                      📅 Hoy
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedDeliveryDate(shiftDate(selectedDeliveryDate, 1))}
                      style={{
                        padding: '0.45rem 0.75rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#fff',
                        color: '#334155',
                        fontWeight: 'bold',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                      title="Ver día siguiente"
                    >
                      Siguiente ▶
                    </button>

                    <input 
                      type="date"
                      value={selectedDeliveryDate}
                      onChange={(e) => {
                        if (e.target.value) setSelectedDeliveryDate(e.target.value)
                      }}
                      className="form-input"
                      style={{ 
                        padding: '0.4rem 0.65rem', 
                        fontSize: '0.85rem', 
                        width: 'auto',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    />
                  </div>
                </div>

                {/* Sub-barra: Etiqueta del Día y Badges Relativos */}
                <div 
                  style={{ 
                    padding: '0.75rem 1.5rem', 
                    backgroundColor: '#fff', 
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    flexWrap: 'wrap', 
                    gap: '0.75rem' 
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: '800', color: '#1e293b' }}>
                      {formatSpanishDatePretty(selectedDeliveryDate)}
                    </span>
                    {isSelectedDateToday && (
                      <span style={{ backgroundColor: '#10b981', color: '#fff', fontSize: '0.75rem', fontWeight: 'bold', padding: '0.2rem 0.6rem', borderRadius: '1rem' }}>
                        HOY
                      </span>
                    )}
                    {isSelectedDateTomorrow && (
                      <span style={{ backgroundColor: '#3b82f6', color: '#fff', fontSize: '0.75rem', fontWeight: 'bold', padding: '0.2rem 0.6rem', borderRadius: '1rem' }}>
                        MAÑANA
                      </span>
                    )}
                    {isSelectedDateYesterday && (
                      <span style={{ backgroundColor: '#64748b', color: '#fff', fontSize: '0.75rem', fontWeight: 'bold', padding: '0.2rem 0.6rem', borderRadius: '1rem' }}>
                        AYER
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {recibosEntregaDia.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowOrdersList(!showOrdersList)}
                        style={{
                          backgroundColor: showOrdersList ? '#fdf2f8' : '#f8fafc',
                          border: showOrdersList ? '1px solid #f472b6' : '1px solid #cbd5e1',
                          color: showOrdersList ? '#be185d' : '#475569',
                          padding: '0.35rem 0.8rem',
                          borderRadius: '0.5rem',
                          fontSize: '0.8rem',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        {showOrdersList ? '▲ Ocultar pedidos del día' : `▼ Ver detalle de pedidos (${recibosEntregaDia.length})`}
                      </button>
                    )}
                  </div>
                </div>

                {/* 4 Tarjetas de Métricas del Día */}
                <div style={{ padding: '1.25rem 1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  
                  {/* Tarjeta Principal: Dinero que Debería Entrar */}
                  <div 
                    style={{ 
                      backgroundColor: '#f0fdf4', 
                      borderRadius: '1rem', 
                      padding: '1.25rem', 
                      border: '1.5px solid #86efac',
                      boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.08)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#047857', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        💵 Debería Entrar (Saldos)
                      </span>
                      <span style={{ fontSize: '0.75rem', backgroundColor: '#dcfce7', color: '#15803d', padding: '0.15rem 0.5rem', borderRadius: '0.5rem', fontWeight: 'bold' }}>
                        Expectativa
                      </span>
                    </div>
                    <div style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.25rem)', fontWeight: '900', color: '#059669', lineHeight: 1.15, margin: '0.35rem 0' }}>
                      ${totalEsperadoDia.toLocaleString('es-CO')}
                    </div>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#065f46', lineHeight: 1.3 }}>
                      Dinero a ingresar en caja cuando los clientes reclaman sus prendas
                    </p>
                    <div style={{ marginTop: '0.6rem', paddingTop: '0.6rem', borderTop: '1px dashed #bbf7d0', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#065f46' }}>
                      <span>Por recaudar: <strong>${saldoPendienteDia.toLocaleString('es-CO')}</strong></span>
                      <span>Ya cobrado: <strong>${yaRecaudadoDia.toLocaleString('es-CO')}</strong></span>
                    </div>
                  </div>

                  {/* Tarjeta: Valor Total de Pedidos a Entregar */}
                  <div 
                    style={{ 
                      backgroundColor: '#eff6ff', 
                      borderRadius: '1rem', 
                      padding: '1.25rem', 
                      border: '1.5px solid #93c5fd',
                      boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.08)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        🏷️ Total Facturado a Entregar
                      </span>
                      <span style={{ fontSize: '0.75rem', backgroundColor: '#dbeafe', color: '#1e40af', padding: '0.15rem 0.5rem', borderRadius: '0.5rem', fontWeight: 'bold' }}>
                        Valor Total
                      </span>
                    </div>
                    <div style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.25rem)', fontWeight: '900', color: '#2563eb', lineHeight: 1.15, margin: '0.35rem 0' }}>
                      ${valorTotalPedidosDia.toLocaleString('es-CO')}
                    </div>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#1e40af', lineHeight: 1.3 }}>
                      Monto total de los recibos cuya fecha de entrega es este día
                    </p>
                    <div style={{ marginTop: '0.6rem', paddingTop: '0.6rem', borderTop: '1px dashed #bfdbfe', fontSize: '0.75rem', color: '#1e40af' }}>
                      Abonado/Pagado previo: <strong>${totalAbonadoDia.toLocaleString('es-CO')}</strong>
                    </div>
                  </div>

                  {/* Tarjeta: Volumen de Entregas */}
                  <div 
                    style={{ 
                      backgroundColor: '#fffbeb', 
                      borderRadius: '1rem', 
                      padding: '1.25rem', 
                      border: '1.5px solid #fde68a',
                      boxShadow: '0 4px 6px -1px rgba(245, 158, 11, 0.08)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        👔 Pedidos y Prendas
                      </span>
                      <span style={{ fontSize: '0.75rem', backgroundColor: '#fef3c7', color: '#92400e', padding: '0.15rem 0.5rem', borderRadius: '0.5rem', fontWeight: 'bold' }}>
                        Programados
                      </span>
                    </div>
                    <div style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.25rem)', fontWeight: '900', color: '#d97706', lineHeight: 1.15, margin: '0.35rem 0' }}>
                      {recibosEntregaDia.length} <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>pedidos</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#92400e', lineHeight: 1.3 }}>
                      {totalPrendasDia} prenda{totalPrendasDia !== 1 ? 's' : ''} a despachar en el taller
                    </p>
                    <div style={{ marginTop: '0.6rem', paddingTop: '0.6rem', borderTop: '1px dashed #fcd34d', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#92400e' }}>
                      <span>Entregados: <strong>{pedidosEntregadosDia}</strong></span>
                      <span>Pendientes: <strong>{pedidosPendientesDia}</strong></span>
                    </div>
                  </div>

                  {/* Tarjeta: Promedio / Efectividad del Día */}
                  <div 
                    style={{ 
                      backgroundColor: '#faf5ff', 
                      borderRadius: '1rem', 
                      padding: '1.25rem', 
                      border: '1.5px solid #e9d5ff',
                      boxShadow: '0 4px 6px -1px rgba(139, 92, 246, 0.08)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#7e22ce', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        📊 Ticket Promedio Entrega
                      </span>
                      <span style={{ fontSize: '0.75rem', backgroundColor: '#f3e8ff', color: '#6b21a8', padding: '0.15rem 0.5rem', borderRadius: '0.5rem', fontWeight: 'bold' }}>
                        Promedio
                      </span>
                    </div>
                    <div style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.25rem)', fontWeight: '900', color: '#8b5cf6', lineHeight: 1.15, margin: '0.35rem 0' }}>
                      ${recibosEntregaDia.length > 0 ? Math.round(totalEsperadoDia / recibosEntregaDia.length).toLocaleString('es-CO') : '0'}
                    </div>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b21a8', lineHeight: 1.3 }}>
                      Ingreso promedio por cada cliente que retira hoy
                    </p>
                    <div style={{ marginTop: '0.6rem', paddingTop: '0.6rem', borderTop: '1px dashed #d8b4fe', fontSize: '0.75rem', color: '#6b21a8' }}>
                      Tasa de entrega: <strong>{recibosEntregaDia.length > 0 ? Math.round((pedidosEntregadosDia / recibosEntregaDia.length) * 100) : 0}%</strong>
                    </div>
                  </div>

                </div>

                {/* Listado Desplegable de Pedidos del Día */}
                {showOrdersList && (
                  <div style={{ padding: '0 1.5rem 1.5rem 1.5rem', borderTop: '1px solid #f1f5f9' }}>
                    <div style={{ marginTop: '1rem', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ margin: 0, color: '#334155', fontSize: '0.95rem' }}>
                        📋 Recibos con entrega programada ({recibosEntregaDia.length})
                      </h4>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        Ordenados por número de recibo
                      </span>
                    </div>

                    {recibosEntregaDia.length === 0 ? (
                      <div style={{ padding: '1.5rem', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '0.75rem', color: '#64748b', fontSize: '0.9rem' }}>
                        No hay ningún recibo programado para entregar el {formatSpanishDatePretty(selectedDeliveryDate)}.
                      </div>
                    ) : (
                      <div style={{ overflowX: 'auto', backgroundColor: '#fff', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                              <th style={{ padding: '0.6rem 0.8rem' }}># Recibo</th>
                              <th style={{ padding: '0.6rem 0.8rem' }}>Cliente</th>
                              <th style={{ padding: '0.6rem 0.8rem' }}>Hora Entrega</th>
                              <th style={{ padding: '0.6rem 0.8rem' }}>Prendas</th>
                              <th style={{ padding: '0.6rem 0.8rem', textAlign: 'right' }}>Total</th>
                              <th style={{ padding: '0.6rem 0.8rem', textAlign: 'right' }}>Abono</th>
                              <th style={{ padding: '0.6rem 0.8rem', textAlign: 'right', color: '#047857' }}>Saldo a Entrar</th>
                              <th style={{ padding: '0.6rem 0.8rem', textAlign: 'center' }}>Estado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {recibosEntregaDia.map((r) => {
                              const metrics = getReciboDeliveryMetrics(r)
                              const timeStr = formatTimeOnly(r.fechaEntrega) || 'Hora por definir'
                              const clientName = r.cliente || r.clienteNombre || 'Sin nombre'
                              const prendasCount = Number(r.totalPrendas) || r.prendas?.length || 1

                              return (
                                <tr key={r.id || r.numeroRecibo} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s' }}>
                                  <td style={{ padding: '0.6rem 0.8rem', fontWeight: 'bold', color: '#831843' }}>
                                    #{r.numeroRecibo || 'S/N'}
                                  </td>
                                  <td style={{ padding: '0.6rem 0.8rem' }}>
                                    <div style={{ fontWeight: '600', color: '#1e293b' }}>{clientName}</div>
                                    {r.telefono && (
                                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>📞 {r.telefono}</div>
                                    )}
                                  </td>
                                  <td style={{ padding: '0.6rem 0.8rem', color: '#475569' }}>
                                    ⏰ {timeStr}
                                  </td>
                                  <td style={{ padding: '0.6rem 0.8rem', color: '#475569' }}>
                                    <span style={{ backgroundColor: '#f1f5f9', padding: '0.15rem 0.45rem', borderRadius: '0.35rem', fontSize: '0.75rem', fontWeight: '600' }}>
                                      {prendasCount} pza{prendasCount !== 1 ? 's' : ''}
                                    </span>
                                  </td>
                                  <td style={{ padding: '0.6rem 0.8rem', textAlign: 'right', fontWeight: '600', color: '#334155' }}>
                                    ${metrics.granTotal.toLocaleString('es-CO')}
                                  </td>
                                  <td style={{ padding: '0.6rem 0.8rem', textAlign: 'right', color: '#64748b' }}>
                                    ${metrics.abono.toLocaleString('es-CO')}
                                  </td>
                                  <td style={{ padding: '0.6rem 0.8rem', textAlign: 'right', fontWeight: 'bold', color: '#059669', fontSize: '0.95rem' }}>
                                    ${metrics.dineroEsperado.toLocaleString('es-CO')}
                                  </td>
                                  <td style={{ padding: '0.6rem 0.8rem', textAlign: 'center' }}>
                                    {r.estado === 'Entregado' ? (
                                      <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '0.2rem 0.5rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                        Entregado ✅
                                      </span>
                                    ) : r.estado === 'Terminado' ? (
                                      <span style={{ backgroundColor: '#dbeafe', color: '#1e40af', padding: '0.2rem 0.5rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                        Listo 🧵
                                      </span>
                                    ) : (
                                      <span style={{ backgroundColor: '#fef3c7', color: '#92400e', padding: '0.2rem 0.5rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                        Pendiente ⏳
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

              </section>

              {/* ============================================================== */}
              {/* TARJETAS RESUMEN KPIS GENERALES (HOY Y MES) */}
              {/* ============================================================== */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                
                {/* KPI: Expectativa Entregas Hoy */}
                <div style={{ backgroundColor: '#fff', padding: '1.25rem', borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>Expectativa Hoy (Entregas)</h3>
                    <span style={{ fontSize: '0.7rem', backgroundColor: '#ecfdf5', color: '#059669', padding: '0.15rem 0.45rem', borderRadius: '0.5rem', fontWeight: 'bold' }}>
                      Fecha Entrega
                    </span>
                  </div>
                  <div style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 'bold', color: '#10b981', margin: '0.25rem 0' }}>
                    ${todayEsperadoEntrega.toLocaleString('es-CO')}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                    {todayEntregas.length} pedidos programados para hoy
                  </div>
                </div>

                {/* KPI: Hoy según Registro */}
                <div style={{ backgroundColor: '#fff', padding: '1.25rem', borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>Hoy ({todayStr})</h3>
                    <span style={{ fontSize: '0.7rem', backgroundColor: '#eff6ff', color: '#2563eb', padding: '0.15rem 0.45rem', borderRadius: '0.5rem', fontWeight: 'bold' }}>
                      Registro
                    </span>
                  </div>
                  <div style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 'bold', color: '#3b82f6', margin: '0.25rem 0' }}>
                    ${todayDinero.toLocaleString('es-CO')}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                    {todayClientes} clientes recibidos ({todayNuevos} nuevos)
                  </div>
                </div>

                {/* KPI: Expectativa Total Mes Actual (Entregas) */}
                <div style={{ backgroundColor: '#fff', padding: '1.25rem', borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>Expectativa Mes (Entregas)</h3>
                    <span style={{ fontSize: '0.7rem', backgroundColor: '#fdf2f8', color: '#db2777', padding: '0.15rem 0.45rem', borderRadius: '0.5rem', fontWeight: 'bold' }}>
                      {selectedMonth}
                    </span>
                  </div>
                  <div style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 'bold', color: '#8b5cf6', margin: '0.25rem 0' }}>
                    ${currentMonthEsperadoEntrega.toLocaleString('es-CO')}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                    {currentMonthTotalPedidosEntrega} pedidos con entrega este mes
                  </div>
                </div>

                {/* KPI: Total Mes Actual (Registro) */}
                <div style={{ backgroundColor: '#fff', padding: '1.25rem', borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>Total Facturado Mes (Registro)</h3>
                    <span style={{ fontSize: '0.7rem', backgroundColor: '#fdf2f8', color: '#db2777', padding: '0.15rem 0.45rem', borderRadius: '0.5rem', fontWeight: 'bold' }}>
                      {selectedMonth}
                    </span>
                  </div>
                  <div style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 'bold', color: '#f472b6', margin: '0.25rem 0' }}>
                    ${currentTotalDinero.toLocaleString('es-CO')}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                    {currentTotalClientes} clientes atendidos
                  </div>
                </div>
              </div>

              {/* ============================================================== */}
              {/* SELECTORES DE VISTA: GRÁFICOS Y AGRUPACIÓN */}
              {/* ============================================================== */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', backgroundColor: '#fff', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
                
                {/* Agrupación temporal */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#475569' }}>Agrupación:</span>
                  <div style={{ display: 'inline-flex', backgroundColor: '#f1f5f9', padding: '0.25rem', borderRadius: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setViewMode('daily')}
                      style={{
                        padding: '0.35rem 0.8rem',
                        borderRadius: '0.35rem',
                        border: 'none',
                        fontWeight: 'bold',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        backgroundColor: viewMode === 'daily' ? 'var(--primary-pink)' : 'transparent',
                        color: viewMode === 'daily' ? '#fff' : '#64748b',
                        transition: 'all 0.2s',
                      }}
                    >
                      📅 Día a Día (1 - {daysInMonth})
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('weekly')}
                      style={{
                        padding: '0.35rem 0.8rem',
                        borderRadius: '0.35rem',
                        border: 'none',
                        fontWeight: 'bold',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        backgroundColor: viewMode === 'weekly' ? 'var(--primary-pink)' : 'transparent',
                        color: viewMode === 'weekly' ? '#fff' : '#64748b',
                        transition: 'all 0.2s',
                      }}
                    >
                      📊 Por Semanas
                    </button>
                  </div>
                </div>

                {/* Filtro de Series para el Gráfico de Dinero */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#475569' }}>Curva:</span>
                  <div style={{ display: 'inline-flex', backgroundColor: '#f1f5f9', padding: '0.25rem', borderRadius: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setChartMetricMode('both')}
                      style={{
                        padding: '0.35rem 0.7rem',
                        borderRadius: '0.35rem',
                        border: 'none',
                        fontWeight: '600',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        backgroundColor: chartMetricMode === 'both' ? '#fff' : 'transparent',
                        color: chartMetricMode === 'both' ? '#0f172a' : '#64748b',
                        boxShadow: chartMetricMode === 'both' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      }}
                    >
                      Comparar Ambas
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartMetricMode('entrega')}
                      style={{
                        padding: '0.35rem 0.7rem',
                        borderRadius: '0.35rem',
                        border: 'none',
                        fontWeight: '600',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        backgroundColor: chartMetricMode === 'entrega' ? '#8b5cf6' : 'transparent',
                        color: chartMetricMode === 'entrega' ? '#fff' : '#64748b',
                      }}
                    >
                      Solo Entrega
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartMetricMode('registro')}
                      style={{
                        padding: '0.35rem 0.7rem',
                        borderRadius: '0.35rem',
                        border: 'none',
                        fontWeight: '600',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        backgroundColor: chartMetricMode === 'registro' ? '#10b981' : 'transparent',
                        color: chartMetricMode === 'registro' ? '#fff' : '#64748b',
                      }}
                    >
                      Solo Registro
                    </button>
                  </div>

                  {viewMode === 'daily' && (
                    <button
                      type="button"
                      onClick={() => setChartScroll(!chartScroll)}
                      style={{
                        background: chartScroll ? '#fdf2f8' : '#fff',
                        border: '1px solid #cbd5e1',
                        padding: '0.35rem 0.75rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.8rem',
                        color: chartScroll ? 'var(--primary-pink)' : '#64748b',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      {chartScroll ? '↔️ Desplazable: ACTIVO' : '↔️ Desplazamiento'}
                    </button>
                  )}
                </div>

              </div>

              {/* ============================================================== */}
              {/* GRÁFICOS PRINCIPALES */}
              {/* ============================================================== */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
                
                {/* Gráfico de Línea: Dinero por Registro vs Expectativa por Entrega */}
                <div style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <h3 style={{ margin: 0, color: '#334155', fontSize: '1.1rem' }}>
                        {viewMode === 'daily' ? 'Dinero por Día: Registro vs Expectativa de Entrega' : 'Ingresos Agrupados por Semana'}
                      </h3>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '0.8rem' }}>
                        Permite contrastar cuándo se toman los pedidos vs cuándo entra el dinero según la fecha de entrega
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.8rem', color: '#8b5cf6', fontWeight: 'bold', backgroundColor: '#f5f3ff', padding: '0.2rem 0.6rem', borderRadius: '1rem', border: '1px solid #ddd6fe' }}>
                        Expectativa Entrega: ${currentMonthEsperadoEntrega.toLocaleString('es-CO')}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 'bold', backgroundColor: '#f0fdf4', padding: '0.2rem 0.6rem', borderRadius: '1rem', border: '1px solid #bbf7d0' }}>
                        Total Registro: ${currentTotalDinero.toLocaleString('es-CO')}
                      </span>
                    </div>
                  </div>

                  {chartScroll && viewMode === 'daily' && (
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem', fontStyle: 'italic' }}>
                      👉 Desliza con el dedo hacia la derecha para ver todos los días en detalle
                    </div>
                  )}

                  <div style={{ width: '100%', overflowX: chartScroll && viewMode === 'daily' ? 'auto' : 'visible' }}>
                    <div style={{ minWidth: chartScroll && viewMode === 'daily' ? '650px' : '100%', height: 340 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart 
                          data={activeChartData} 
                          margin={{ top: 10, right: 15, bottom: 5, left: -5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="periodo" 
                            tickLine={false}
                            axisLine={{ stroke: '#cbd5e1' }}
                            minTickGap={8}
                            tick={{ fontSize: 11, fill: '#64748b' }}
                          />
                          <YAxis 
                            tickFormatter={formatMoneyCompact} 
                            width={52} 
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 11, fill: '#64748b' }}
                          />
                          <Tooltip 
                            formatter={(val: any, name: any) => [`$${Number(val).toLocaleString('es-CO')}`, name]} 
                            labelFormatter={(l) => viewMode === 'daily' ? `Día ${l} de ${selectedMonth}` : `${l}`} 
                            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}
                          />
                          <Legend wrapperStyle={{ paddingTop: '8px', fontSize: '12px' }} />
                          
                          {(chartMetricMode === 'both' || chartMetricMode === 'entrega') && (
                            <Line 
                              type="monotone" 
                              dataKey="dineroEsperadoEntrega" 
                              stroke="#8b5cf6" 
                              strokeWidth={viewMode === 'weekly' ? 3.5 : 2.5} 
                              dot={{ r: viewMode === 'weekly' ? 5 : 2.5, fill: '#8b5cf6' }} 
                              activeDot={{ r: 6, fill: '#6d28d9' }} 
                              name="Expectativa por Fecha de Entrega" 
                            />
                          )}

                          {(chartMetricMode === 'both' || chartMetricMode === 'registro') && (
                            <Line 
                              type="monotone" 
                              dataKey="dinero" 
                              stroke="#10b981" 
                              strokeWidth={viewMode === 'weekly' ? 3.5 : 2.5} 
                              dot={{ r: viewMode === 'weekly' ? 5 : 2.5, fill: '#10b981' }} 
                              activeDot={{ r: 6, fill: '#059669' }} 
                              name="Dinero por Fecha de Registro" 
                            />
                          )}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Gráfico de Barras: Clientes Diarios */}
                <div style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h3 style={{ margin: 0, color: '#334155', fontSize: '1.1rem' }}>
                      {viewMode === 'daily' ? 'Clientes Diarios (Mes Actual)' : 'Clientes por Semana'}
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: 'bold', backgroundColor: '#eff6ff', padding: '0.2rem 0.6rem', borderRadius: '1rem', border: '1px solid #bfdbfe' }}>
                      Total Clientes: {currentTotalClientes}
                    </span>
                  </div>

                  {chartScroll && viewMode === 'daily' && (
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem', fontStyle: 'italic' }}>
                      👉 Desliza con el dedo hacia la derecha para ver todos los días en detalle
                    </div>
                  )}

                  <div style={{ width: '100%', overflowX: chartScroll && viewMode === 'daily' ? 'auto' : 'visible' }}>
                    <div style={{ minWidth: chartScroll && viewMode === 'daily' ? '650px' : '100%', height: 320 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={activeChartData} 
                          margin={{ top: 10, right: 10, bottom: 5, left: -20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="periodo" 
                            tickLine={false}
                            axisLine={{ stroke: '#cbd5e1' }}
                            minTickGap={8}
                            tick={{ fontSize: 11, fill: '#64748b' }}
                          />
                          <YAxis 
                            width={35} 
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 11, fill: '#64748b' }}
                          />
                          <Tooltip 
                            labelFormatter={(l) => viewMode === 'daily' ? `Día ${l}` : `${l}`} 
                            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}
                          />
                          <Legend wrapperStyle={{ paddingTop: '8px', fontSize: '12px' }} />
                          <Bar dataKey="clientesNuevos" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} name="Nuevos" barSize={viewMode === 'weekly' ? 24 : undefined} />
                          <Bar dataKey="clientesRecurrentes" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Recurrentes" barSize={viewMode === 'weekly' ? 24 : undefined} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
                
              </div>

              {/* ============================================================== */}
              {/* TABLA CALENDARIO DEL MES: RESUMEN DE TODAS LAS ENTREGAS */}
              {/* ============================================================== */}
              <div style={{ backgroundColor: '#fff', padding: '1.25rem', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <h3 style={{ margin: 0, color: '#334155', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>📅</span> Resumen de Entregas del Mes ({selectedMonth})
                    </h3>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.8rem' }}>
                      Visualiza todos los días del mes donde hay prendas programadas para entregar
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowMonthDeliveriesTable(!showMonthDeliveriesTable)}
                    style={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      padding: '0.4rem 0.85rem',
                      borderRadius: '0.5rem',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      color: '#475569',
                      cursor: 'pointer',
                    }}
                  >
                    {showMonthDeliveriesTable ? '▲ Ocultar resumen mensual' : `▼ Ver días con entregas (${deliveryDaysInMonth.length})`}
                  </button>
                </div>

                {showMonthDeliveriesTable && (
                  <div style={{ marginTop: '1rem', overflowX: 'auto' }}>
                    {deliveryDaysInMonth.length === 0 ? (
                      <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
                        No hay ninguna entrega registrada para este mes.
                      </div>
                    ) : (
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                            <th style={{ padding: '0.6rem 0.8rem' }}>Fecha de Entrega</th>
                            <th style={{ padding: '0.6rem 0.8rem' }}>Día</th>
                            <th style={{ padding: '0.6rem 0.8rem', textAlign: 'center' }}>Pedidos</th>
                            <th style={{ padding: '0.6rem 0.8rem', textAlign: 'right' }}>Total Facturado</th>
                            <th style={{ padding: '0.6rem 0.8rem', textAlign: 'right', color: '#047857' }}>Dinero a Entrar (Saldo)</th>
                            <th style={{ padding: '0.6rem 0.8rem', textAlign: 'center' }}>Acción</th>
                          </tr>
                        </thead>
                        <tbody>
                          {deliveryDaysInMonth.map((d) => {
                            const dateStr = `${selectedMonth}-${String(d.periodo).padStart(2, '0')}`
                            const isToday = dateStr === todayStr
                            const isSelected = dateStr === selectedDeliveryDate

                            return (
                              <tr 
                                key={d.periodo} 
                                style={{ 
                                  borderBottom: '1px solid #f1f5f9',
                                  backgroundColor: isSelected ? '#fdf2f8' : isToday ? '#f0fdf4' : 'transparent',
                                  transition: 'background-color 0.15s'
                                }}
                              >
                                <td style={{ padding: '0.6rem 0.8rem', fontWeight: 'bold', color: '#1e293b' }}>
                                  {dateStr}
                                  {isToday && (
                                    <span style={{ marginLeft: '0.5rem', backgroundColor: '#10b981', color: '#fff', fontSize: '0.7rem', padding: '0.15rem 0.4rem', borderRadius: '0.4rem' }}>
                                      HOY
                                    </span>
                                  )}
                                </td>
                                <td style={{ padding: '0.6rem 0.8rem', color: '#64748b', textTransform: 'capitalize' }}>
                                  {getDayName(dateStr).toLowerCase()}
                                </td>
                                <td style={{ padding: '0.6rem 0.8rem', textAlign: 'center' }}>
                                  <span style={{ backgroundColor: '#fef3c7', color: '#92400e', padding: '0.15rem 0.5rem', borderRadius: '0.5rem', fontWeight: 'bold' }}>
                                    {d.pedidosEntrega} pedido{d.pedidosEntrega !== 1 ? 's' : ''}
                                  </span>
                                </td>
                                <td style={{ padding: '0.6rem 0.8rem', textAlign: 'right', color: '#334155', fontWeight: '600' }}>
                                  ${d.valorTotalEntrega.toLocaleString('es-CO')}
                                </td>
                                <td style={{ padding: '0.6rem 0.8rem', textAlign: 'right', fontWeight: 'bold', color: '#059669', fontSize: '0.95rem' }}>
                                  ${d.dineroEsperadoEntrega.toLocaleString('es-CO')}
                                </td>
                                <td style={{ padding: '0.6rem 0.8rem', textAlign: 'center' }}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedDeliveryDate(dateStr)
                                      setShowOrdersList(true)
                                      window.scrollTo({ top: 120, behavior: 'smooth' })
                                    }}
                                    style={{
                                      backgroundColor: isSelected ? 'var(--primary-pink)' : '#fff',
                                      color: isSelected ? '#fff' : '#be185d',
                                      border: '1px solid #fbcfe8',
                                      padding: '0.25rem 0.65rem',
                                      borderRadius: '0.4rem',
                                      fontSize: '0.75rem',
                                      fontWeight: 'bold',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    {isSelected ? '✓ Seleccionado' : '🔍 Ver en Cuadro'}
                                  </button>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>

              {/* ============================================================== */}
              {/* GRÁFICOS DE PASTEL (CRECIMIENTO COMPARATIVO) */}
              {/* ============================================================== */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
                <div style={{ backgroundColor: '#fff', padding: '1.25rem', borderRadius: '1rem', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <h3 style={{ marginTop: 0, color: '#334155', fontSize: '1.1rem' }}>Crecimiento de Ingresos</h3>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem' }}>Mes Anterior vs Mes Actual</p>
                  <div style={{ width: '100%', height: 240 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={pieDineroData}
                          cx="50%"
                          cy="50%"
                          outerRadius={75}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ percent }: any) => `${((percent || 0) * 100).toFixed(0)}%`}
                        >
                          {pieDineroData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(val: any) => `$${Number(val).toLocaleString('es-CO')}`} />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div style={{ backgroundColor: '#fff', padding: '1.25rem', borderRadius: '1rem', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <h3 style={{ marginTop: 0, color: '#334155', fontSize: '1.1rem' }}>Crecimiento de Clientes</h3>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem' }}>Mes Anterior vs Mes Actual</p>
                  <div style={{ width: '100%', height: 240 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={pieClientesData}
                          cx="50%"
                          cy="50%"
                          outerRadius={75}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ percent }: any) => `${((percent || 0) * 100).toFixed(0)}%`}
                        >
                          {pieClientesData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </main>
    </PasswordGate>
  )
}
