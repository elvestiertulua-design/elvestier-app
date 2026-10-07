const Redis = require('ioredis');

(async () => {
  const redis = new Redis('redis://default:36jLcgZDCmiaPVw8Azlry6ZrT1b91Cgt@megabright-superneat-design-36118.db.redis.io:10147');
  const data = await redis.get('elvestier_db');
  if (data) {
    const parsed = JSON.parse(data);
    const r2505 = parsed.recibos.find(r => r.numeroRecibo === '2505');
    console.log(JSON.stringify(r2505, null, 2));
  }
  process.exit(0);
})();
