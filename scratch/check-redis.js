const Redis = require('ioredis');

(async () => {
  const redis = new Redis('redis://default:36jLcgZDCmiaPVw8Azlry6ZrT1b91Cgt@megabright-superneat-design-36118.db.redis.io:10147');
  const data = await redis.get('elvestier_db');
  if (data) {
    const parsed = JSON.parse(data);
    console.log('Recibos in REDIS_URL:', parsed.recibos?.length);
    console.log('Sample receipt dates:', parsed.recibos?.slice(0, 3).map(r => r.fechaRegistro));
  } else {
    console.log('No data found in REDIS_URL');
  }
  process.exit(0);
})();
