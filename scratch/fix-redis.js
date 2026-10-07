const Redis = require('ioredis');
const xlsx = require('xlsx');

(async () => {
  const redis = new Redis('redis://default:36jLcgZDCmiaPVw8Azlry6ZrT1b91Cgt@megabright-superneat-design-36118.db.redis.io:10147');
  
  const data = await redis.get('elvestier_db');
  if (!data) {
    console.log('No data found');
    process.exit(1);
  }
  
  const currentDb = JSON.parse(data);
  const recibos = currentDb.recibos || [];
  
  const filePath = 'C:\\Users\\USUARIO\\.gemini\\antigravity\\brain\\364c1cc6-8824-4e4c-b138-b959030c503e\\.user_uploaded\\media_1791335759731.xlsx';
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const dataRows = xlsx.utils.sheet_to_json(sheet);
  
  const excelMap = new Map();
  for (const row of dataRows) {
    const nr = String(row['Número Recibo'] || row['Nǧmero Recibo'] || row['N?mero Recibo'] || '');
    if (nr) {
      excelMap.set(nr, row);
    }
  }
  
  let fixedCount = 0;
  for (const r of recibos) {
    const num = parseInt(r.numeroRecibo);
    if (!isNaN(num) && num <= 2505) {
      const row = excelMap.get(r.numeroRecibo);
      if (row) {
        r.cliente = row['Cliente Nombre'] || '';
        r.telefono = String(row['Cliente Teléfono'] || '');
        
        delete r.clienteNombre;
        delete r.clienteTelefono;
        
        r.estado = row['Estado'] || 'Pendiente';
        
        // Use standard 'fechaTerminado' instead of custom dates
        if (row['Fecha Terminado'] || row['Fecha de Terminado']) {
          r.fechaTerminado = row['Fecha Terminado'] || row['Fecha de Terminado'];
        }
        
        if (row['Operaria']) {
          r.operaria = row['Operaria'];
          const opName = row['Operaria'].toLowerCase().trim();
          const foundOp = (currentDb.operadoras || []).find(op => op.nombre.toLowerCase().includes(opName));
          if (foundOp) r.operadoraId = foundOp.id;
        }
        
        r.granTotal = parseInt(row['Gran Total ($)']) || 0;
        
        // Additionally mapping 'fechaRecibido' properly
        if (r.fechaRegistro) {
          r.fechaRecibido = r.fechaRegistro;
        }
        
        fixedCount++;
      } else if (r.clienteNombre || r.clienteTelefono) {
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
  
  await redis.set('elvestier_db', JSON.stringify(currentDb));
  console.log('Restored to Redis directly!');
  process.exit(0);
})();
