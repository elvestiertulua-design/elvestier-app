const fs = require('fs');

async function restore() {
  const csvContent = fs.readFileSync('C:\\Users\\USUARIO\\Desktop\\antigravity\\scratch\\backup.csv', 'utf-8');
  
  // Basic CSV parser to handle quotes and newlines
  const rows = [];
  let currentRow = [];
  let currentCell = '';
  let inQuotes = false;
  
  for (let i = 0; i < csvContent.length; i++) {
    const char = csvContent[i];
    
    if (inQuotes) {
      if (char === '"') {
        if (csvContent[i + 1] === '"') {
          currentCell += '"';
          i++; // skip next quote
        } else {
          inQuotes = false;
        }
      } else {
        currentCell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentCell);
        currentCell = '';
      } else if (char === '\n' || (char === '\r' && csvContent[i+1] === '\n')) {
        currentRow.push(currentCell);
        rows.push(currentRow);
        currentRow = [];
        currentCell = '';
        if (char === '\r') i++; // skip \n
      } else {
        currentCell += char;
      }
    }
  }
  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }

  const headers = rows[0];
  const dataRows = rows.slice(1).filter(r => r.length > 1 && r[0]);

  const recibosMap = new Map();

  for (const row of dataRows) {
    const numeroRecibo = row[0];
    const fechaRegistro = row[1];
    const cliente = row[2];
    const telefono = row[3];
    const operaria = row[4];
    const totalPrendas = parseInt(row[5]) || 1;
    const granTotal = parseInt(row[6]) || 0;
    
    const cantidades = row[7].split('\n').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    const descripciones = row[8].split('\n').filter(s => s.trim());
    
    const estado = row[9] || 'Pendiente';
    const fechaTerminado = row[10] || '';
    const observaciones = row[11] || '';
    
    let prendas = [];
    // If the number of lines in cantidades and descripciones match, map them
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
      // Fallback
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
      id: numeroRecibo.length > 6 ? numeroRecibo : Date.now().toString() + Math.random().toString(36).substr(2, 5),
      numeroRecibo: numeroRecibo.length > 6 ? '' : numeroRecibo, // If it's a long timestamp, don't use it as numeroRecibo
      fechaRegistro,
      clienteNombre: cliente,
      clienteTelefono: telefono,
      totalPrendas,
      valorPagar: granTotal,
      prendas,
      estado,
      observaciones
    };
    
    // If the ID is a timestamp from the CSV, let's just use it
    if (numeroRecibo.length > 10) {
      recibo.id = numeroRecibo;
      recibo.numeroRecibo = '';
    } else {
      recibo.numeroRecibo = numeroRecibo;
    }
    
    recibosMap.set(recibo.id, recibo);
  }

  const recibos = Array.from(recibosMap.values());
  
  // Sort descending by numeroRecibo / date
  recibos.sort((a, b) => {
    if (a.numeroRecibo && b.numeroRecibo) {
      return parseInt(b.numeroRecibo) - parseInt(a.numeroRecibo);
    }
    return new Date(b.fechaRegistro).getTime() - new Date(a.fechaRegistro).getTime();
  });

  console.log('Parsed receipts:', recibos.length);
  
  // POST to API
  const res = await fetch('http://localhost:3000/api/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recibos })
  });
  
  const result = await res.json();
  console.log('Restored!', result);
}

restore();
