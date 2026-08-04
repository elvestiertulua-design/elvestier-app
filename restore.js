const fs = require('fs');

async function restore() {
  const recibos = JSON.parse(fs.readFileSync('respaldo_redis_recibos.json'));
  const res = await fetch('https://antigravity-three-dun.vercel.app/api/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recibos })
  });
  const json = await res.json();
  console.log(json);
}

restore().catch(console.error);
