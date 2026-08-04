'use client'

import React, { useState, useEffect } from 'react'

// Helper para formatear fecha y hora
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

// Componente de Puerta de Contraseña
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

// Componente de Vista de Recibo Térmico (80mm)
function ReceiptPrintView({ data }: { data: any }) {
  const totalPrendas = data.prendas?.reduce((acc: number, item: any) => acc + (Number(item.cantidad) || 0), 0) || 0
  const granTotal = data.prendas?.reduce((acc: number, item: any) => acc + (Number(item.valorTotal) || 0), 0) || 0

  return (
    <div
      className="thermal-receipt"
      style={{
        width: '100%',
        maxWidth: '80mm',
        margin: '0 auto',
        padding: '4mm',
        fontFamily: 'monospace',
        color: '#000',
        fontSize: '12px',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        <img
          src="/logo.png.jpeg"
          alt="El Vestier Logo"
          style={{ width: '80px', height: 'auto', marginBottom: '5px' }}
          onError={(e) => {
            ;(e.target as HTMLImageElement).src = '/logo.png'
          }}
        />
        <h1 style={{ fontSize: '18px', margin: '0 0 5px 0', fontWeight: 'bold', textTransform: 'uppercase' }}>El Vestier</h1>
        <p style={{ margin: 0, fontSize: '11px', fontWeight: 'bold' }}>Clínica de Ropa</p>
        <p style={{ margin: 0, fontSize: '11px' }}>Calle 27 No. 33-57</p>
        <p style={{ margin: 0, fontSize: '11px' }}>Tuluá - Valle</p>
        <p style={{ margin: 0, fontSize: '11px' }}>Tel: 3163464571</p>
      </div>

      <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '5px 0', marginBottom: '10px', fontSize: '11px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
          <span>Cliente:</span>
          <span style={{ fontWeight: 'bold', textAlign: 'right' }}>{data.cliente}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
          <span>Tel:</span>
          <span style={{ textAlign: 'right' }}>{data.telefono}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
          <span>Recibido:</span>
          <span style={{ textAlign: 'right' }}>{data.fechaRecibido}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
          <span>Entrega:</span>
          <span style={{ fontWeight: 'bold', textAlign: 'right' }}>{formatDateTime(data.fechaEntrega)}</span>
        </div>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #000' }}>
              <th style={{ textAlign: 'left', width: '10%', paddingBottom: '2px' }}>#</th>
              <th style={{ textAlign: 'left', width: '40%', paddingBottom: '2px' }}>Desc</th>
              <th style={{ textAlign: 'right', width: '25%', paddingBottom: '2px' }}>V.Uni</th>
              <th style={{ textAlign: 'right', width: '25%', paddingBottom: '2px' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {data.prendas?.map((item: any, idx: number) => (
              <tr key={idx}>
                <td style={{ verticalAlign: 'top', paddingTop: '2px' }}>{item.cantidad}</td>
                <td style={{ verticalAlign: 'top', paddingTop: '2px' }}>{item.descripcion}</td>
                <td style={{ textAlign: 'right', verticalAlign: 'top', paddingTop: '2px' }}>
                  {Number(item.valorUnitario).toLocaleString('es-CO')}
                </td>
                <td style={{ textAlign: 'right', verticalAlign: 'top', paddingTop: '2px' }}>
                  {Number(item.valorTotal).toLocaleString('es-CO')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ borderTop: '1px dashed #000', paddingTop: '5px', marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '12px' }}>
          <span>Total Prendas:</span>
          <span>{totalPrendas}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '16px', marginTop: '5px' }}>
          <span>TOTAL:</span>
          <span>${granTotal.toLocaleString('es-CO')}</span>
        </div>
      </div>

      {data.observaciones && (
        <div style={{ marginBottom: '10px', fontSize: '11px', borderTop: '1px solid #eee', paddingTop: '5px' }}>
          <strong>Obs:</strong> <span style={{ whiteSpace: 'pre-wrap' }}>{data.observaciones}</span>
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '15px' }}>
        <p style={{ fontSize: '11px', margin: '0 0 8px 0', fontWeight: 'bold' }}>¡Gracias por su confianza!</p>
        <p style={{ fontSize: '10px', margin: '0 0 10px 0' }}>Por favor conserve este recibo para reclamar sus prendas.</p>
        <p style={{ fontSize: '12px', margin: '5px 0 0 0', fontWeight: 'bold' }}>@EL_VESTIERR</p>
      </div>
    </div>
  )
}

// Componente de Vista de Sticker
function StickerPrintView({ data }: { data: any }) {
  const totalPrendas = data.prendas?.reduce((acc: number, item: any) => acc + (Number(item.cantidad) || 0), 0) || 0
  const granTotal = data.prendas?.reduce((acc: number, item: any) => acc + (Number(item.valorTotal) || 0), 0) || 0

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

// Formulario Principal del Mostrador
function MainForm() {
  const [formData, setFormData] = useState({
    cliente: '',
    telefono: '',
    fechaRecibido: '',
    fechaEntrega: '',
    observaciones: '',
  })
  const [prendas, setPrendas] = useState<any[]>([])
  const [itemInput, setItemInput] = useState({
    cantidad: '',
    descripcion: '',
    valorUnitario: '',
    valorTotal: '',
  })
  const [savedNumeroRecibo, setSavedNumeroRecibo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [tipoPago, setTipoPago] = useState('Pendiente')
  const [abono, setAbono] = useState('')
  const [clientesList, setClientesList] = useState<any[]>([])
  const [printMode, setPrintMode] = useState<'none' | 'receipt' | 'sticker'>('none')

  useEffect(() => {
    try {
      const draft = localStorage.getItem('elvestier_draft')
      if (draft) {
        const parsed = JSON.parse(draft)
        if (parsed.formData) setFormData(parsed.formData)
        if (parsed.prendas) setPrendas(parsed.prendas)
        if (parsed.tipoPago) setTipoPago(parsed.tipoPago)
        if (parsed.abono) setAbono(parsed.abono)
      }
    } catch (e) {}
  }, [])

  useEffect(() => {
    localStorage.setItem('elvestier_draft', JSON.stringify({ formData, prendas, tipoPago, abono }))
  }, [formData, prendas, tipoPago, abono])

  useEffect(() => {
    fetch('/api/db?t=' + Date.now())
      .then((res) => res.json())
      .then((data) => {
        if (data.recibos && Array.isArray(data.recibos)) {
          const uniqueClientes: Record<string, string> = {}
          data.recibos.forEach((r: any) => {
            if (r.cliente && r.telefono) {
              const nameLower = r.cliente.toLowerCase().trim()
              if (!uniqueClientes[nameLower]) {
                uniqueClientes[nameLower] = { nombre: r.cliente.trim(), telefono: r.telefono.trim() } as any
              }
            }
          })
          setClientesList(Object.values(uniqueClientes))
        }
      })
      .catch((err) => console.error('Error loading clientes:', err))
  }, [])

  useEffect(() => {
    if (formData.cliente) {
      document.title = `Vestier_${formData.cliente.trim().replace(/\s+/g, '_')}`
    } else {
      document.title = 'El Vestier - Recibos'
    }
  }, [formData.cliente])

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    if (name === 'cliente') {
      const found = clientesList.find((c) => c.nombre.toLowerCase() === value.toLowerCase())
      if (found) {
        setFormData({ ...formData, cliente: value.toUpperCase(), telefono: found.telefono })
        return
      }
    }
    setFormData({ ...formData, [name]: name === 'cliente' ? value.toUpperCase() : value })
  }

  const handleItemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const updated = { ...itemInput, [name]: value }
    if (name === 'cantidad' || name === 'valorUnitario') {
      const cant = parseFloat(name === 'cantidad' ? value : updated.cantidad) || 0
      const vUnit = parseFloat(name === 'valorUnitario' ? value : updated.valorUnitario) || 0
      if (cant > 0 && vUnit > 0) {
        updated.valorTotal = (cant * vUnit).toString()
      } else {
        updated.valorTotal = ''
      }
    }
    setItemInput(updated)
  }

  const addItem = () => {
    if (!itemInput.cantidad || !itemInput.descripcion || !itemInput.valorUnitario || !itemInput.valorTotal) {
      alert('Por favor completa todos los campos de la prenda (Cantidad, Descripción y Valor Unitario).')
      return
    }
    setPrendas([...prendas, itemInput])
    setItemInput({ cantidad: '', descripcion: '', valorUnitario: '', valorTotal: '' })
  }

  const removeItem = (idx: number) => {
    const updated = [...prendas]
    updated.splice(idx, 1)
    setPrendas(updated)
  }

  const editItem = (idx: number) => {
    setItemInput(prendas[idx])
    const updated = [...prendas]
    updated.splice(idx, 1)
    setPrendas(updated)
  }

  const totalPrendas = prendas.reduce((acc, curr) => acc + (Number(curr.cantidad) || 0), 0)
  const granTotal = prendas.reduce((acc, curr) => acc + (Number(curr.valorTotal) || 0), 0)

  const saveData = async () => {
    if (prendas.length === 0) {
      alert('Debes agregar al menos una prenda a la lista antes de guardar.')
      return false
    }
    setLoading(true)
    setMessage('')
    try {
      let saldo = granTotal
      let abonoVal = 0
      if (tipoPago === 'Cancelado') {
        abonoVal = granTotal
        saldo = 0
      } else if (tipoPago === 'Abono') {
        abonoVal = parseFloat(abono) || 0
        saldo = granTotal - abonoVal
      } else {
        abonoVal = 0
        saldo = granTotal
      }

      const payload = {
        ...formData,
        prendas,
        totalPrendas,
        valorPagar: granTotal,
        tipoPago,
        abono: abonoVal,
        saldo,
      }

      const res = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Error al guardar')
      }

      const respData = await res.json()
      if (respData.recibo && respData.recibo.numeroRecibo) {
        setSavedNumeroRecibo(respData.recibo.numeroRecibo)
      }
      setMessage(`¡Recibo #${respData.recibo?.numeroRecibo} guardado con éxito!`)
      return respData.recibo
    } catch (err: any) {
      console.error(err)
      let msg = err.message || 'Hubo un error al guardar. Intenta de nuevo.'
      if (msg.includes('EBUSY') || msg.includes('EPERM')) {
        msg = '❌ El archivo de Excel está abierto. Por favor ciérralo completamente y vuelve a intentar.'
      }
      setMessage(msg)
      return null
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await saveData()
    if (result) {
      alert(`Pedido #${result.numeroRecibo} guardado correctamente. Ahora puedes enviar el WhatsApp o imprimir.`)
    }
  }

  const handleWhatsApp = async () => {
    if (!formData.cliente || !formData.telefono) {
      alert('Ingresa el nombre y el teléfono del cliente.')
      return
    }

    const detalleStr = prendas.map((p) => `${p.cantidad}x ${p.descripcion} - $${(Number(p.valorTotal) || Number(p.valorUnitario) || 0).toLocaleString('es-CO')}`).join('\n')
    const fechaEnt = formData.fechaEntrega ? formatDateTime(formData.fechaEntrega) : 'Por definir'
    const diaEnt = formData.fechaEntrega ? getDayName(formData.fechaEntrega) : ''
    const entregaTxt = diaEnt ? `*${diaEnt}*, ${fechaEnt}` : fechaEnt

    let pagoTxt = ''
    if (tipoPago === 'Cancelado') {
      pagoTxt = '*Estado de Pago:* Cancelado ✅'
    } else if (tipoPago === 'Abono') {
      const abVal = parseFloat(abono) || 0
      pagoTxt = `*Abono:* $${abVal.toLocaleString('es-CO')}\n*Saldo pendiente:* $${(granTotal - abVal).toLocaleString('es-CO')}`
    } else {
      pagoTxt = `*Estado de Pago:* Pendiente\n*Saldo pendiente:* $${granTotal.toLocaleString('es-CO')}`
    }

    const saveResult = await saveData()
    if (saveResult) {
      const numReciboTxt = saveResult.numeroRecibo ? `\n*Recibo N°:* ${saveResult.numeroRecibo}` : ''
      const text = `¡Hola, ${formData.cliente}! 👗🧵\nTu orden en *El Vestier* ha sido registrada con éxito.${numReciboTxt}\n\n*Detalle de tu orden:*\n${detalleStr || formData.observaciones || 'Arreglos varios'}\n\n*Total de la factura:* $${granTotal.toLocaleString('es-CO')}\n${pagoTxt}\n*Fecha estimada de entrega:* ${entregaTxt}\n\n¡Gracias por preferirnos!`

      let cleanPhone = formData.telefono.replace(/\s+/g, '')
      if (!cleanPhone.startsWith('57') && cleanPhone.length === 10) {
        cleanPhone = '57' + cleanPhone
      } else if (cleanPhone.startsWith('+')) {
        cleanPhone = cleanPhone.substring(1)
      }

      const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
      window.open(waUrl, '_blank')
    }
  }

  if (printMode !== 'none') {
    return (
      <div className="print-preview-screen animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem', minHeight: '100vh' }}>
        <div className="no-print" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={() => setPrintMode('none')} className="btn btn-secondary">
            🔙 Volver al Recibo
          </button>
          <button onClick={() => window.print()} className="btn btn-primary">
            🖨️ CONFIRMAR IMPRESIÓN
          </button>
        </div>
        <div className="no-print" style={{ marginBottom: '1rem', color: '#6b7280', fontSize: '0.9rem', textAlign: 'center' }}>
          Vista previa generada. Presiona "Confirmar Impresión" y revisa que el PDF se vea igual a esto.
        </div>
        <div className="print-area-wrapper" style={{ background: '#fff', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '10px' }}>
          {printMode === 'receipt' ? (
            <ReceiptPrintView data={{ ...formData, prendas, numeroRecibo: savedNumeroRecibo || 'N/A' }} />
          ) : (
            <StickerPrintView data={{ clienteNombre: formData.cliente, fechaEntrega: formData.fechaEntrega, prendas, numeroRecibo: savedNumeroRecibo || 'N/A' }} />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="main-container app-content animate-fade-in">
      <div className="glass-panel animate-fade-in no-print panel-inner">
        <div className="header-container">
          <div className="header-left">
            <img src="/logo.png.jpeg" alt="Logo El Vestier" style={{ width: '90px', height: 'auto', borderRadius: '8px' }} onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png' }} />
            <div>
              <h1 style={{ color: 'var(--primary-pink)', fontSize: '2.5rem', fontWeight: '800', margin: 0 }}>El Vestier</h1>
              <p style={{ margin: 0, color: '#64748b', fontSize: '1rem', fontWeight: '600' }}>Clínica de Ropa</p>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Calle 27 No. 33-57 Tuluá - Valle • Tel: 3163464571</p>
            </div>
          </div>
          <div className="header-right">
            <button type="button" onClick={() => { window.location.href = '/api/download' }} className="btn btn-secondary" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
              Descargar Base de Datos
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b' }}>@EL_VESTIERR</span>
            </div>
          </div>
        </div>

        {message && (
          <div style={{ padding: '1rem', marginBottom: '1rem', borderRadius: '0.5rem', backgroundColor: message.includes('error') || message.includes('❌') ? '#fee2e2' : '#dcfce7', color: message.includes('error') || message.includes('❌') ? '#991b1b' : '#166534', textAlign: 'center', fontWeight: '500' }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Nombre del Cliente</label>
              <input required list="clientes-list" type="text" name="cliente" value={formData.cliente} onChange={handleFormChange} className="form-input" placeholder="Ej. María Pérez" autoComplete="off" />
              <datalist id="clientes-list">
                {clientesList.map((item, idx) => (
                  <option key={idx} value={item.nombre} />
                ))}
              </datalist>
            </div>
            <div className="form-group">
              <label className="form-label">Teléfono</label>
              <input required type="text" name="telefono" value={formData.telefono} onChange={handleFormChange} className="form-input" placeholder="Ej. 300 123 4567" />
            </div>
            <div className="form-group">
              <label className="form-label">Fecha de Recibido</label>
              <input required type="date" name="fechaRecibido" value={formData.fechaRecibido} onChange={handleFormChange} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Fecha y Hora de Entrega</label>
              <input required type="datetime-local" name="fechaEntrega" value={formData.fechaEntrega} onChange={handleFormChange} className="form-input" />
            </div>
          </div>

          <div style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '0.75rem', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', color: '#334155' }}>Lista de Prendas</h3>
            <div className="item-row">
              <div className="item-col-cant">
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Cant.</label>
                <input type="number" name="cantidad" value={itemInput.cantidad} onChange={handleItemChange} className="form-input" placeholder="Ej. 2" />
              </div>
              <div className="item-col-desc">
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Descripción</label>
                <input type="text" name="descripcion" value={itemInput.descripcion} onChange={handleItemChange} className="form-input" placeholder="Ej. Cambio de cierre" />
              </div>
              <div className="item-col-vuni">
                <label className="form-label" style={{ fontSize: '0.8rem' }}>V. Unitario ($)</label>
                <input type="number" name="valorUnitario" value={itemInput.valorUnitario} onChange={handleItemChange} className="form-input" placeholder="0" />
              </div>
              <div className="item-col-vtot">
                <label className="form-label" style={{ fontSize: '0.8rem' }}>V. Total ($)</label>
                <input type="number" name="valorTotal" value={itemInput.valorTotal} readOnly className="form-input" style={{ backgroundColor: '#e2e8f0', cursor: 'not-allowed' }} />
              </div>
              <button type="button" onClick={addItem} className="btn btn-primary btn-add-item" style={{ padding: '0.7rem 1.2rem', fontSize: '1.2rem', fontWeight: 'bold' }} title="Añadir Prenda">
                +
              </button>
            </div>

            {prendas.length > 0 && (
              <div className="table-container">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ backgroundColor: '#f1f5f9' }}>
                    <tr>
                      <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Cant</th>
                      <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Descripción</th>
                      <th style={{ padding: '0.5rem', textAlign: 'right', borderBottom: '1px solid #e2e8f0' }}>V. Unitario</th>
                      <th style={{ padding: '0.5rem', textAlign: 'right', borderBottom: '1px solid #e2e8f0' }}>Total</th>
                      <th style={{ padding: '0.5rem', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prendas.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.5rem' }}>{item.cantidad}</td>
                        <td style={{ padding: '0.5rem' }}>{item.descripcion}</td>
                        <td style={{ padding: '0.5rem', textAlign: 'right' }}>${Number(item.valorUnitario).toLocaleString('es-CO')}</td>
                        <td style={{ padding: '0.5rem', textAlign: 'right' }}>${Number(item.valorTotal).toLocaleString('es-CO')}</td>
                        <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            <button type="button" onClick={() => editItem(idx)} style={{ color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }} title="Editar">
                              ✎
                            </button>
                            <button type="button" onClick={() => removeItem(idx)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }} title="Eliminar">
                              X
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button
                type="button"
                onClick={() => {
                  if (itemInput.cantidad && itemInput.descripcion && itemInput.valorUnitario && itemInput.valorTotal) {
                    addItem()
                  }
                }}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.5rem' }}
                title="Calcular y Finalizar Prendas"
              >
                <span>Calcular Total</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>↵</span>
              </button>
            </div>

            {prendas.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', padding: '1rem', backgroundColor: '#fff', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#475569' }}>
                  Total Prendas: <span style={{ color: 'var(--primary-pink)' }}>{totalPrendas}</span>
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#0f172a' }}>
                  GRAN TOTAL: <span style={{ color: 'var(--primary-pink)' }}>${granTotal.toLocaleString('es-CO')}</span>
                </div>
              </div>
            )}
          </div>

          <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '0.75rem', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', color: '#334155' }}>Estado de Pago</h3>
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}>
                <input type="radio" name="tipoPago" checked={tipoPago === 'Pendiente'} onChange={() => setTipoPago('Pendiente')} />
                Pendiente
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}>
                <input type="radio" name="tipoPago" checked={tipoPago === 'Abono'} onChange={() => setTipoPago('Abono')} />
                Abono
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}>
                <input type="radio" name="tipoPago" checked={tipoPago === 'Cancelado'} onChange={() => setTipoPago('Cancelado')} />
                Cancelado
              </label>
            </div>

            {tipoPago === 'Abono' && (
              <div className="form-group" style={{ maxWidth: '300px' }}>
                <label className="form-label">Valor del Abono ($)</label>
                <input type="number" className="form-input" placeholder="Ej. 15000" value={abono} onChange={(e) => setAbono(e.target.value)} />
              </div>
            )}

            {prendas.length > 0 && (
              <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f1f5f9', borderRadius: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Total Factura:</span>
                  <strong>${granTotal.toLocaleString('es-CO')}</strong>
                </div>
                {tipoPago === 'Abono' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#16a34a' }}>
                    <span>Abono:</span>
                    <strong>-${(parseFloat(abono) || 0).toLocaleString('es-CO')}</strong>
                  </div>
                )}
                {tipoPago === 'Cancelado' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#16a34a' }}>
                    <span>Abono:</span>
                    <strong>-${granTotal.toLocaleString('es-CO')}</strong>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid #cbd5e1', fontSize: '1.1rem' }}>
                  <span>
                    <strong>Saldo Pendiente:</strong>
                  </span>
                  <strong style={{ color: '#ef4444' }}>
                    ${tipoPago === 'Cancelado' ? '0' : tipoPago === 'Abono' ? Math.max(0, granTotal - (parseFloat(abono) || 0)).toLocaleString('es-CO') : granTotal.toLocaleString('es-CO')}
                  </strong>
                </div>
              </div>
            )}
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label">Observaciones del Pedido</label>
            <textarea name="observaciones" value={formData.observaciones} onChange={handleFormChange} className="form-input" placeholder="Detalles extra de los arreglos..." />
          </div>

          <div className="action-buttons" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <button type="button" disabled={loading} onClick={handleWhatsApp} className="btn btn-secondary" style={{ fontSize: '1.1rem', backgroundColor: '#25D366', color: '#fff', border: 'none' }}>
              {loading ? 'Guardando...' : '1. Guardar y Enviar por WhatsApp'}
            </button>
            <button type="button" onClick={() => setPrintMode('receipt')} className="btn btn-secondary" style={{ fontSize: '1.1rem' }}>
              2. Imprimir Recibo
            </button>
            <button type="button" onClick={() => setPrintMode('sticker')} className="btn btn-secondary" style={{ fontSize: '1.1rem', backgroundColor: '#e2e8f0', color: '#0f172a' }}>
              3. Imprimir Sticker
            </button>
            <button
              type="button"
              onClick={() => {
                setFormData({ cliente: '', telefono: '', fechaRecibido: '', fechaEntrega: '', observaciones: '' })
                setPrendas([])
                setItemInput({ cantidad: '', descripcion: '', valorUnitario: '', valorTotal: '' })
                setTipoPago('Pendiente')
                setAbono('')
                setSavedNumeroRecibo(null)
                localStorage.removeItem('elvestier_draft')
              }}
              className="btn btn-primary"
              style={{ fontSize: '1.1rem', backgroundColor: '#ef4444', border: 'none' }}
            >
              4. Limpiar / Nuevo Pedido
            </button>
          </div>

          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <button type="submit" disabled={loading} className="btn btn-secondary" style={{ fontSize: '1rem', width: '100%' }}>
              {loading ? 'Guardando...' : 'Guardar en Base de Datos (Sin Imprimir/Enviar)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <PasswordGate correctPin="1234" title="El Vestier - Mostrador">
      <MainForm />
    </PasswordGate>
  )
}
