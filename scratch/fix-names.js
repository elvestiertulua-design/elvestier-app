const fs = require('fs');

async function fix() {
  // First read the Excel file to get all details
  const xlsx = require('xlsx');
  const filePath = 'C:\\Users\\USUARIO\\.gemini\\antigravity\\brain\\364c1cc6-8824-4e4c-b138-b959030c503e\\.user_uploaded\\media_1791335759731.xlsx';
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const dataRows = xlsx.utils.sheet_to_json(sheet);
  
  // Create a map from Excel data
  const excelMap = new Map();
  for (const row of dataRows) {
    const nr = String(row['Número Recibo'] || row['Nǧmero Recibo'] || row['N?mero Recibo'] || '');
    if (nr) {
      excelMap.set(nr, row);
    }
  }

  // Fetch current DB state
  const resGet = await fetch('http://localhost:3000/api/db');
  const currentDb = await resGet.json();
  const recibos = currentDb.recibos || [];
  
  let fixedCount = 0;

  // Fix all receipts <= 2505
  for (const r of recibos) {
    const num = parseInt(r.numeroRecibo);
    if (!isNaN(num) && num <= 2505) {
      // Find row in excel
      const row = excelMap.get(r.numeroRecibo);
      if (row) {
        // Fix the fields
        r.cliente = row['Cliente Nombre'] || '';
        r.telefono = String(row['Cliente Teléfono'] || '');
        
        // Remove the incorrect keys
        delete r.clienteNombre;
        delete r.clienteTelefono;
        
        // Fix dates and status
        r.estado = row['Estado'] || 'Pendiente';
        if (row['Fecha Terminado'] || row['Fecha de Terminado']) {
          r.fechaTerminado = row['Fecha Terminado'] || row['Fecha de Terminado'];
        }
        
        // Fix operaria
        if (row['Operaria']) {
          r.operaria = row['Operaria'];
          // Try to map it to an operadoraId if needed
          const opName = row['Operaria'].toLowerCase().trim();
          const foundOp = (currentDb.operadoras || []).find(op => op.nombre.toLowerCase().includes(opName));
          if (foundOp) r.operadoraId = foundOp.id;
        }
        
        r.granTotal = parseInt(row['Gran Total ($)']) || 0;
        
        fixedCount++;
      } else if (r.clienteNombre || r.clienteTelefono) {
        // Just rename the properties if not in excel (shouldn't happen)
        if (r.clienteNombre) {
          r.cliente = r.clienteNombre;
          delete r.clienteNombre;
        }
        if (r.clienteTelefono) {
          r.telefono = r.clienteTelefono;
          delete r.clienteTelefono;
        }
        fixedCount++;
      }
    }
  }

  console.log(`Fixed ${fixedCount} receipts.`);
  
  // POST to API
  const resPost = await fetch('http://localhost:3000/api/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recibos })
  });
  
  console.log('Restored successfully!', await resPost.json());
}

fix().catch(console.error);
