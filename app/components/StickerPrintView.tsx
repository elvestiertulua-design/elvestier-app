'use client'

import React from 'react'
import { ReceiptData } from './ReceiptPrintView'

interface StickerPrintViewProps {
  data: ReceiptData
}

export default function StickerPrintView({ data }: StickerPrintViewProps) {
  return (
    <div className="receipt-font max-w-[58mm] mx-auto p-1.5 text-[11px] bg-white text-black leading-tight border border-gray-400 print:border-none print:max-w-none print:w-[58mm]">
      <div className="text-center border-b border-black pb-1 mb-1">
        <h2 className="font-extrabold text-xs uppercase">EL VESTIER - ETIQUETA</h2>
        <p className="text-[9px]">Recibo #: <span className="font-bold">{data.numeroRecibo}</span></p>
      </div>

      <div className="space-y-1">
        <div>
          <span className="text-[9px] text-gray-700 block">CLIENTE:</span>
          <p className="font-bold text-xs uppercase truncate">{data.clienteNombre}</p>
        </div>

        <div className="flex justify-between border-t border-b border-gray-300 py-1 my-1">
          <div>
            <span className="text-[9px] text-gray-700 block">TOTAL PRENDAS:</span>
            <span className="font-bold text-sm">{data.totalPrendas}</span>
          </div>
          <div className="text-right">
            <span className="text-[9px] text-gray-700 block">TOTAL A PAGAR:</span>
            <span className="font-bold text-sm">${data.granTotal.toLocaleString('es-CO')}</span>
          </div>
        </div>

        <div className="flex justify-between items-center text-[10px]">
          <span>OPERARIA:</span>
          <span className="font-bold uppercase">{data.operaria}</span>
        </div>

        <div className="text-[8px] text-center pt-1 text-gray-600 border-t border-dashed border-gray-400">
          FECHA: {data.fecha}
        </div>
      </div>
    </div>
  )
}
