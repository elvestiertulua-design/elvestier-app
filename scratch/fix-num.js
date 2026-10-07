const fs = require('fs');

async function fix() {
  const resGet = await fetch('http://localhost:3000/api/db');
  const currentDb = await resGet.json();
  const recibos = currentDb.recibos || [];
  
  // Find receipts from today
  const todayRecibos = recibos.filter(r => r.fechaRegistro === '2026-10-06');
  
  console.log('Today receipts:', todayRecibos.map(r => r.numeroRecibo));
  
  const highestNum = recibos.reduce((max, r) => {
    const num = parseInt(r.numeroRecibo || '0', 10);
    return !isNaN(num) && num > max ? num : max;
  }, 1000);
  
  console.log('Highest num:', highestNum);
  
  let newNum = highestNum + 1;
  for (const r of todayRecibos) {
    if (parseInt(r.numeroRecibo) < 2000) {
      console.log('Fixing', r.numeroRecibo, 'to', newNum);
      r.numeroRecibo = newNum.toString();
      newNum++;
    }
  }
  
  // Also we need to restore the original 1001-1004 from Excel that were overwritten!
  const xlsx = require('xlsx');
  const filePath = 'C:\\Users\\USUARIO\\.gemini\\antigravity\\brain\\364c1cc6-8824-4e4c-b138-b959030c503e\\.user_uploaded\\media_1791335759731.xlsx';
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const dataRows = xlsx.utils.sheet_to_json(sheet);
  
  for (const row of dataRows) {
    const nr = String(row['Número Recibo'] || row['Nǧmero Recibo'] || row['N?mero Recibo'] || '');
    if (['1001', '1002', '1003', '1004'].includes(nr)) {
      // Restore this old receipt!
      const totalPrendas = parseInt(row['Total Prendas']) || 1;
      const granTotal = parseInt(row['Gran Total ($)']) || 0;
      const cliente = row['Cliente Nombre'] || '';
      const oldR = {
        id: nr,
        numeroRecibo: nr,
        fechaRegistro: row['Fecha'] || row['Fecha Registro'] || '',
        clienteNombre: cliente,
        clienteTelefono: String(row['Cliente Teléfono'] || ''),
        operaria: row['Operaria'] || '',
        totalPrendas,
        valorPagar: granTotal,
        saldo: granTotal,
        estado: row['Estado'] || 'Pendiente',
        observaciones: row['Observaciones'] || ''
      };
      
      const idx = recibos.findIndex(x => x.numeroRecibo === nr);
      if (idx === -1) {
        recibos.push(oldR);
      }
    }
  }
  
  recibos.sort((a, b) => {
    if (a.numeroRecibo && b.numeroRecibo) {
      return parseInt(b.numeroRecibo) - parseInt(a.numeroRecibo);
    }
    return new Date(b.fechaRegistro).getTime() - new Date(a.fechaRegistro).getTime();
  });
  
  const resPost = await fetch('http://localhost:3000/api/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recibos })
  });
  
  console.log('Fixed and restored old receipts!', await resPost.json());
}
fix().catch(console.error);
