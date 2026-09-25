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

const COLORS = ['#f472b6', '#3b82f6', '#10b981', '#f59e0b']

export default function DashboardPage() {
  const [recibos, setRecibos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(getTodayMonthStr())

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

  // Current Month Data
  const currentMonthRecibos = recibos.filter((r) => r.fechaRecibido && r.fechaRecibido.startsWith(selectedMonth))
  
  // Previous Month Data
  const prevDate = new Date(selectedYear, selectedMonthNum - 1, 1)
  const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`
  const prevMonthRecibos = recibos.filter((r) => r.fechaRecibido && r.fechaRecibido.startsWith(prevMonthStr))

  // Daily Data Aggregation
  const daysInMonth = new Date(selectedYear, selectedMonthNum + 1, 0).getDate()
  const dailyData = []
  
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${selectedMonth}-${String(i).padStart(2, '0')}`
    const dailyRecibos = currentMonthRecibos.filter((r) => r.fechaRecibido === dateStr)
    const totalDinero = dailyRecibos.reduce((acc, r) => acc + (Number(r.granTotal) || 0), 0)
    dailyData.push({ 
      dia: String(i), 
      dinero: totalDinero, 
      clientes: dailyRecibos.length 
    })
  }

  // Totals
  const currentTotalDinero = currentMonthRecibos.reduce((acc, r) => acc + (Number(r.granTotal) || 0), 0)
  const prevTotalDinero = prevMonthRecibos.reduce((acc, r) => acc + (Number(r.granTotal) || 0), 0)
  
  const currentTotalClientes = currentMonthRecibos.length
  const prevTotalClientes = prevMonthRecibos.length

  // Today
  const todayStr = getTodayStr()
  const todayRecibos = recibos.filter(r => r.fechaRecibido === todayStr)
  const todayDinero = todayRecibos.reduce((acc, r) => acc + (Number(r.granTotal) || 0), 0)
  const todayClientes = todayRecibos.length

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
          <div className="header-container" style={{ marginBottom: '2rem' }}>
            <div className="header-left">
              <img src="/logo.png.jpeg" alt="Logo" style={{ width: '80px', borderRadius: '8px' }} onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png' }} />
              <div>
                <h1 style={{ color: 'var(--primary-pink)', margin: 0, fontSize: '2rem' }}>Dashboard</h1>
                <p style={{ margin: 0, color: '#64748b' }}>Estadísticas y Análisis</p>
              </div>
            </div>
            <div className="header-right" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <input 
                type="month" 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="form-input"
                style={{ width: 'auto' }}
              />
              <a href="/" className="btn btn-secondary">Volver al Inicio</a>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Cargando datos históricos...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  <h3 style={{ margin: 0, color: '#64748b', fontSize: '1rem' }}>Hoy ({todayStr})</h3>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>${todayDinero.toLocaleString('es-CO')}</div>
                  <div style={{ fontSize: '1rem', color: '#334155' }}>{todayClientes} clientes nuevos</div>
                </div>

                <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  <h3 style={{ margin: 0, color: '#64748b', fontSize: '1rem' }}>Promedio Semanal (Mes Actual)</h3>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>${Math.round(avgWeeklyDinero).toLocaleString('es-CO')}</div>
                  <div style={{ fontSize: '1rem', color: '#334155' }}>~{Math.round(avgWeeklyClientes)} clientes por semana</div>
                </div>

                <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  <h3 style={{ margin: 0, color: '#64748b', fontSize: '1rem' }}>Total Mes Actual</h3>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f472b6' }}>${currentTotalDinero.toLocaleString('es-CO')}</div>
                  <div style={{ fontSize: '1rem', color: '#334155' }}>{currentTotalClientes} clientes en total</div>
                </div>
              </div>

              {/* Charts */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
                
                {/* Daily Money Chart */}
                <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ marginTop: 0, color: '#334155', marginBottom: '1.5rem' }}>Ingresos Diarios (Mes Actual)</h3>
                  <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                      <LineChart data={dailyData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="dia" />
                        <YAxis tickFormatter={(val) => \`$\${val.toLocaleString('es-CO')}\`} width={80} />
                        <Tooltip formatter={(val: number) => \`$\${val.toLocaleString('es-CO')}\`} labelFormatter={(l) => \`Día \${l}\`} />
                        <Line type="monotone" dataKey="dinero" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} name="Dinero Ingresado" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Daily Clients Chart */}
                <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ marginTop: 0, color: '#334155', marginBottom: '1.5rem' }}>Clientes Diarios (Mes Actual)</h3>
                  <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                      <BarChart data={dailyData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="dia" />
                        <YAxis width={40} />
                        <Tooltip labelFormatter={(l) => \`Día \${l}\`} />
                        <Bar dataKey="clientes" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Clientes Nuevos" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
              </div>

              {/* Pie Charts - Growth Comparison */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <h3 style={{ marginTop: 0, color: '#334155' }}>Crecimiento de Ingresos</h3>
                  <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1rem' }}>Mes Anterior vs Mes Actual</p>
                  <div style={{ width: '100%', height: 250 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={pieDineroData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => \`\${name} (\${(percent * 100).toFixed(0)}%)\`}
                        >
                          {pieDineroData.map((entry, index) => (
                            <Cell key={\`cell-\${index}\`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(val: number) => \`$\${val.toLocaleString('es-CO')}\`} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <h3 style={{ marginTop: 0, color: '#334155' }}>Crecimiento de Clientes</h3>
                  <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1rem' }}>Mes Anterior vs Mes Actual</p>
                  <div style={{ width: '100%', height: 250 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={pieClientesData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => \`\${name} (\${(percent * 100).toFixed(0)}%)\`}
                        >
                          {pieClientesData.map((entry, index) => (
                            <Cell key={\`cell-\${index}\`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
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
