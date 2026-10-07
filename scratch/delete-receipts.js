const fs = require('fs');

async function deleteReceipts() {
  const resGet = await fetch('http://localhost:3000/api/db');
  const currentDb = await resGet.json();
  const recibos = currentDb.recibos || [];
  
  // Filter out the receipts to delete
  const numsToDelete = ['2506', '2507', '2508', '2509'];
  const newRecibos = recibos.filter(r => !numsToDelete.includes(r.numeroRecibo));
  
  console.log(`Original count: ${recibos.length}, New count: ${newRecibos.length}`);
  
  const resPost = await fetch('http://localhost:3000/api/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recibos: newRecibos })
  });
  
  console.log('Deleted successfully!', await resPost.json());
}
deleteReceipts().catch(console.error);
