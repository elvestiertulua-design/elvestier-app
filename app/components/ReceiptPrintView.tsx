'use client'

import React from 'react'

export interface PrendaItem {
  cantidad: number
  descripcion: string
  valorUnitario: number
  valorTotal: number
}

export interface ReceiptData {
  numeroRecibo: string
  fecha: string
  clienteNombre: string
  clienteTelefono: string
  operaria: string
  prendas: PrendaItem[]
  totalPrendas: number
  granTotal: number
  observaciones?: string
}

interface ReceiptPrintViewProps {
  data: ReceiptData
}

export default function ReceiptPrintView({ data }: ReceiptPrintViewProps) {
  return (
    <div className="receipt-font max-w-[80mm] mx-auto p-2 text-xs bg-white text-black leading-tight border border-gray-300 print:border-none print:max-w-none print:w-[80mm]">
      {/* Encabezado */}
      <div className="text-center mb-3 border-b pb-2 border-dashed border-gray-400">
        {/* Logo */}
        <div className="flex justify-center mb-1">
          <img
            src="/logo.png"
            alt="El Vestier Logo"
            className="h-16 w-auto object-contain fallback-hidden"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none'
            }}
          />
        </div>
        <h1 className="text-base font-bold uppercase tracking-wider">EL VESTIER</h1>
        <p className="text-[10px]">Taller de Confección & Ajustes</p>
        <p className="text-[10px] mt-1">Calle 27 No. 33-57 Tuluá - Valle</p>
        <p className="text-[10px]">Teléfono / WhatsApp: 3163464571</p>
      </div>

      {/* Info del Recibo */}
      <div className="mb-3 border-b pb-2 border-dashed border-gray-400 space-y-0.5">
        <div className="flex justify-between font-bold">
          <span>RECIBO No:</span>
          <span>#{data.numeroRecibo}</span>
        </div>
        <div className="flex justify-between">
          <span>FECHA:</span>
          <span>{data.fecha}</span>
        </div>
        <div className="flex justify-between">
          <span>CLIENTE:</span>
          <span className="font-semibold uppercase">{data.clienteNombre}</span>
        </div>
        <div className="flex justify-between">
          <span>TELÉFONO:</span>
          <span>{data.clienteTelefono || 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span>OPERARIA:</span>
          <span className="font-semibold">{data.operaria}</span>
        </div>
      </div>

      {/* Tabla de Prendas */}
      <div className="mb-3 border-b pb-2 border-dashed border-gray-400">
        <div className="flex justify-between font-bold border-b border-black pb-1 mb-1">
          <span className="w-8">CANT</span>
          <span className="flex-1">DESCRIPCIÓN</span>
          <span className="w-16 text-right">TOTAL</span>
        </div>
        {data.prendas && data.prendas.length > 0 ? (
          data.prendas.map((item, index) => (
            <div key={index} className="flex justify-between my-0.5">
              <span className="w-8">{item.cantidad}x</span>
              <span className="flex-1 pr-1 truncate">{item.descripcion}</span>
              <span className="w-16 text-right">${item.valorTotal.toLocaleString('es-CO')}</span>
            </div>
          ))
        ) : (
          <p className="text-center italic py-1">Sin prendas registradas</p>
        )}
      </div>

      {/* Totales */}
      <div className="mb-3 border-b pb-2 border-dashed border-gray-400 space-y-1">
        <div className="flex justify-between">
          <span>TOTAL PRENDAS:</span>
          <span className="font-bold">{data.totalPrendas}</span>
        </div>
        <div className="flex justify-between text-sm font-extrabold border-t pt-1 border-black">
          <span>GRAN TOTAL:</span>
          <span>${data.granTotal.toLocaleString('es-CO')}</span>
        </div>
      </div>

      {data.observaciones && (
        <div className="mb-3 border-b pb-2 border-dashed border-gray-400">
          <p className="font-bold text-[10px]">OBSERVACIONES:</p>
          <p className="italic text-[10px]">{data.observaciones}</p>
        </div>
      )}

      {/* Código QR y Pie de Página */}
      <div className="text-center pt-1">

        <p className="text-[9px] uppercase font-bold">¡Gracias por su preferencia!</p>
        <p className="text-[8px] text-gray-600 mt-0.5">Conserve este recibo para reclamar sus prendas.</p>
      </div>
    </div>
  )
}
