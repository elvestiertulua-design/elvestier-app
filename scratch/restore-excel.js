const xlsx = require('xlsx');

async function restore() {
  const filePath = 'C:\\Users\\USUARIO\\.gemini\\antigravity\\brain\\364c1cc6-8824-4e4c-b138-b959030c503e\\.user_uploaded\\media_1791335759731.xlsx';
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  const dataRows = xlsx.utils.sheet_to_json(sheet);
  
  console.log('Loaded rows from Excel:', dataRows.length);
  
  const recibosMap = new Map();

  for (const row of dataRows) {
    const numeroReciboStr = String(row['Número Recibo'] || row['Nǧmero Recibo'] || row['N?mero Recibo'] || '');
    const fechaRegistro = row['Fecha'] || row['Fecha Registro'] || '';
    const cliente = row['Cliente Nombre'] || '';
    const telefono = String(row['Cliente Teléfono'] || row['Cliente Tel?fono'] || '');
    const operaria = row['Operaria'] || '';
    const totalPrendas = parseInt(row['Total Prendas']) || 1;
    const granTotal = parseInt(row['Gran Total ($)']) || 0;
    
    const cantidadesStr = String(row['Cantidades por Prenda'] || totalPrendas);
    const descripcionesStr = String(row['Detalle Prendas'] || '');
    
    const cantidades = cantidadesStr.split('\n').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    const descripciones = descripcionesStr.split('\n').filter(s => s.trim());
    
    const estado = row['Estado'] || 'Pendiente';
    const fechaTerminado = row['Fecha Terminado'] || row['Fecha de Terminado'] || '';
    const observaciones = row['Observaciones'] || '';
    
    let prendas = [];
    if (cantidades.length > 0 && cantidades.length === descripciones.length) {
      prendas = cantidades.map((cant, idx) => {
        let desc = descripciones[idx].trim();
        let valor = 0;
        const match = desc.match(/\(\$(\d+)\)/);
        if (match) {
          valor = parseInt(match[1]);
          desc = desc.replace(match[0], '').trim();
        }
        return {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          cantidad: cant,
          descripcion: desc,
          valorUnitario: valor,
          valorTotal: valor,
          estado: estado === 'Terminado' ? 'Terminado' : 'Pendiente',
        };
      });
    } else {
      prendas = [{
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        cantidad: totalPrendas,
        descripcion: descripciones.join(' '),
        valorUnitario: granTotal,
        valorTotal: granTotal,
        estado: estado === 'Terminado' ? 'Terminado' : 'Pendiente',
      }];
    }

    const recibo = {
      id: numeroReciboStr.length > 6 ? numeroReciboStr : Date.now().toString() + Math.random().toString(36).substr(2, 5),
      numeroRecibo: numeroReciboStr.length > 6 ? '' : numeroReciboStr,
      fechaRegistro,
      clienteNombre: cliente,
      clienteTelefono: telefono,
      operaria,
      totalPrendas,
      valorPagar: granTotal,
      saldo: granTotal,
      prendas,
      estado,
      observaciones
    };
    
    if (numeroReciboStr.length > 10) {
      recibo.id = numeroReciboStr;
      recibo.numeroRecibo = '';
    }
    
    recibosMap.set(recibo.numeroRecibo, recibo);
  }

  // Get current DB data to preserve the 4 receipts from today
  const resGet = await fetch('http://localhost:3000/api/db');
  const currentDb = await resGet.json();
  const currentRecibos = currentDb.recibos || [];
  
  console.log('Current receipts in DB:', currentRecibos.length);
  
  // Merge, prioritizing current DB receipts (from today) over Excel ones if duplicates
  for (const r of currentRecibos) {
    if (r.numeroRecibo) {
      recibosMap.set(r.numeroRecibo, r);
    } else {
      recibosMap.set(r.id, r);
    }
  }

  const allRecibos = Array.from(recibosMap.values());
  
  allRecibos.sort((a, b) => {
    if (a.numeroRecibo && b.numeroRecibo) {
      return parseInt(b.numeroRecibo) - parseInt(a.numeroRecibo);
    }
    return new Date(b.fechaRegistro).getTime() - new Date(a.fechaRegistro).getTime();
  });

  console.log('Total receipts to save:', allRecibos.length);
  
  const resPost = await fetch('http://localhost:3000/api/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recibos: allRecibos })
  });
  
  const result = await resPost.json();
  console.log('Restored successfully!', result.success);
}

restore().catch(console.error);
