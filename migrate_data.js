const Redis = require('ioredis');

async function migrate() {
  console.log("Conectando a Redis...");
  const redis = new Redis('redis://default:36jLcgZDCmiaPVw8Azlry6ZrT1b91Cgt@megabright-superneat-design-36118.db.redis.io:10147');
  
  const r = await redis.get('elvestier_db');
  if (!r) {
    console.log("No data in Redis!");
    process.exit(1);
  }
  
  const p = JSON.parse(r);
  console.log('Operadoras en Redis:', p.operadoras?.length, 'Recibos en Redis:', p.recibos?.length);
  
  // Update local file as backup!
  const fs = require('fs');
  fs.writeFileSync('respaldo_redis_recibos.json', JSON.stringify(p.recibos));
  
  // Fetch current live DB to preserve operadoras
  console.log("Fetching live DB...");
  const liveRes = await fetch('https://antigravity-three-dun.vercel.app/api/db');
  const liveDb = await liveRes.json();
  console.log('Operadoras Live:', liveDb.operadoras?.length, 'Recibos Live:', liveDb.recibos?.length);
  
  // Merge live operadoras (with tokens) and Redis recibos
  console.log("Posting to Live DB...");
  const postRes = await fetch('https://antigravity-three-dun.vercel.app/api/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recibos: p.recibos })
  });
  
  const postJson = await postRes.json();
  console.log("Response:", postJson);
  
  process.exit(0);
}

migrate().catch(e => {
  console.error(e);
  process.exit(1);
});
