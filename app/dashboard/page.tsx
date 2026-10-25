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

function getReciboDate(r: any) {
  const d = r.fechaRegistro || r.fechaRecibido || r.fecha || ''
  return d.substring(0, 10)
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

  // Current Month Data
  const currentMonthRecibos = taggedRecibos.filter((r) => getReciboDate(r).startsWith(selectedMonth))
  
  // Previous Month Data
  const prevDate = new Date(selectedYear, selectedMonthNum - 1, 1)
  const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`
  const prevMonthRecibos = taggedRecibos.filter((r) => getReciboDate(r).startsWith(prevMonthStr))

  interface ChartItem {
    periodo: string
    dinero: number
    clientesTotales: number
    clientesNuevos: number
    clientesRecurrentes: number
  }

  // Daily Data Aggregation
  const daysInMonth = new Date(selectedYear, selectedMonthNum + 1, 0).getDate()
  const dailyData: ChartItem[] = []
  
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${selectedMonth}-${String(i).padStart(2, '0')}`
    const dailyRecibos = currentMonthRecibos.filter((r) => getReciboDate(r) === dateStr)
    const totalDinero = dailyRecibos.reduce((acc, r) => acc + (Number(r.valorPagar || r.granTotal) || 0), 0)
    
    const totalClientes = dailyRecibos.length
    const clientesNuevos = dailyRecibos.filter(r => r.isNewClient).length
    const clientesRecurrentes = totalClientes - clientesNuevos

    dailyData.push({ 
      periodo: String(i), 
      dinero: totalDinero, 
      clientesTotales: totalClientes,
      clientesNuevos: clientesNuevos,
      clientesRecurrentes: clientesRecurrentes
    })
  }

  // Weekly Data Aggregation
  const weeklyData: ChartItem[] = [
    { periodo: 'Sem 1 (1-7)', dinero: 0, clientesTotales: 0, clientesNuevos: 0, clientesRecurrentes: 0 },
    { periodo: 'Sem 2 (8-14)', dinero: 0, clientesTotales: 0, clientesNuevos: 0, clientesRecurrentes: 0 },
    { periodo: 'Sem 3 (15-21)', dinero: 0, clientesTotales: 0, clientesNuevos: 0, clientesRecurrentes: 0 },
    { periodo: 'Sem 4 (22-28)', dinero: 0, clientesTotales: 0, clientesNuevos: 0, clientesRecurrentes: 0 },
    ...(daysInMonth > 28 ? [{ periodo: `Sem 5 (29-${daysInMonth})`, dinero: 0, clientesTotales: 0, clientesNuevos: 0, clientesRecurrentes: 0 }] : []),
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
      weeklyData[wIdx].clientesTotales += d.clientesTotales
      weeklyData[wIdx].clientesNuevos += d.clientesNuevos
      weeklyData[wIdx].clientesRecurrentes += d.clientesRecurrentes
    }
  })

  const activeChartData = viewMode === 'daily' ? dailyData : weeklyData

  // Totals
  const currentTotalDinero = currentMonthRecibos.reduce((acc, r) => acc + (Number(r.valorPagar || r.granTotal) || 0), 0)
  const prevTotalDinero = prevMonthRecibos.reduce((acc, r) => acc + (Number(r.valorPagar || r.granTotal) || 0), 0)
  
  const currentTotalClientes = currentMonthRecibos.length
  const prevTotalClientes = prevMonthRecibos.length

  // Today
  const todayStr = getTodayStr()
  const todayRecibos = taggedRecibos.filter(r => getReciboDate(r) === todayStr)
  const todayDinero = todayRecibos.reduce((acc, r) => acc + (Number(r.valorPagar || r.granTotal) || 0), 0)
  const todayClientes = todayRecibos.length
  const todayNuevos = todayRecibos.filter(r => r.isNewClient).length

  // Weekly Averages (assuming 4.33 weeks per month)
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
      <main className="main-container" style={{ maxWidth: '1200px' }}>
        <div className="glass-panel animate-fade-in panel-inner">
          <div className="header-container" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <img src="/logo.png.jpeg" alt="Logo" style={{ width: '65px', borderRadius: '8px' }} onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png' }} />
              <div>
                <h1 style={{ color: 'var(--primary-pink)', margin: 0, fontSize: '1.75rem', fontWeight: '800' }}>Dashboard</h1>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Estadísticas y Análisis</p>
              </div>
            </div>
            <div className="header-right" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <input 
                type="month" 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="form-input"
                style={{ width: 'auto', padding: '0.5rem 0.75rem', fontSize: '0.9rem' }}
              />
              <a href="/api/download" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} download>Descargar Excel</a>
              <a href="/" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Volver</a>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Cargando datos históricos...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <div style={{ backgroundColor: '#fff', padding: '1.25rem', borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  <h3 style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Hoy ({todayStr})</h3>
                  <div style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 'bold', color: '#10b981', margin: '0.25rem 0' }}>${todayDinero.toLocaleString('es-CO')}</div>
                  <div style={{ fontSize: '0.9rem', color: '#334155' }}>
                    {todayClientes} clientes ({todayNuevos} nuevos)
                  </div>
                </div>

                <div style={{ backgroundColor: '#fff', padding: '1.25rem', borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  <h3 style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Promedio Semanal (Mes Actual)</h3>
                  <div style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 'bold', color: '#3b82f6', margin: '0.25rem 0' }}>${Math.round(avgWeeklyDinero).toLocaleString('es-CO')}</div>
                  <div style={{ fontSize: '0.9rem', color: '#334155' }}>~{Math.round(avgWeeklyClientes)} clientes por semana</div>
                </div>

                <div style={{ backgroundColor: '#fff', padding: '1.25rem', borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  <h3 style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Total Mes Actual</h3>
                  <div style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 'bold', color: '#f472b6', margin: '0.25rem 0' }}>${currentTotalDinero.toLocaleString('es-CO')}</div>
                  <div style={{ fontSize: '0.9rem', color: '#334155' }}>{currentTotalClientes} clientes en total</div>
                </div>
              </div>

              {/* Selector de Vista: Por Días vs Por Semanas */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', backgroundColor: '#fff', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
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
                    {chartScroll ? '↔️ Modo Desplazable: ACTIVO' : '↔️ Desplazamiento Horizontal'}
                  </button>
                )}
              </div>

              {/* Charts */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
                
                {/* Daily/Weekly Money Chart */}
                <div style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h3 style={{ margin: 0, color: '#334155', fontSize: '1.1rem' }}>
                      {viewMode === 'daily' ? 'Historial de Dinero por Día' : 'Ingresos Agrupados por Semana'}
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 'bold', backgroundColor: '#f0fdf4', padding: '0.2rem 0.6rem', borderRadius: '1rem', border: '1px solid #bbf7d0' }}>
                      Total: ${currentTotalDinero.toLocaleString('es-CO')}
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
                        <LineChart 
                          data={activeChartData} 
                          margin={{ top: 10, right: 10, bottom: 5, left: -10 }}
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
                            width={48} 
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 11, fill: '#64748b' }}
                          />
                          <Tooltip 
                            formatter={(val: any) => [`$${Number(val).toLocaleString('es-CO')}`, 'Dinero']} 
                            labelFormatter={(l) => viewMode === 'daily' ? `Día ${l}` : `${l}`} 
                            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="dinero" 
                            stroke="#10b981" 
                            strokeWidth={viewMode === 'weekly' ? 3.5 : 2.5} 
                            dot={{ r: viewMode === 'weekly' ? 5 : 2.5, fill: '#10b981' }} 
                            activeDot={{ r: 6, fill: '#059669' }} 
                            name="Dinero Ingresado" 
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Daily/Weekly Clients Chart */}
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

              {/* Pie Charts - Growth Comparison */}
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
