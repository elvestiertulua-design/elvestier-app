const Redis = require('ioredis');
const redis = new Redis('redis://default:36jLcgZDCmiaPVw8Azlry6ZrT1b91Cgt@megabright-superneat-design-36118.db.redis.io:10147');
redis.get('elvestier_db').then(r => { 
  const p = JSON.parse(r); 
  console.log('Operadoras:', p.operadoras?.length, 'Recibos:', p.recibos?.length);
  const jsonStr = JSON.stringify(p);
  console.log('Total characters when stringified:', jsonStr.length);
  process.exit(0); 
}).catch(e => {
  console.error(e);
  process.exit(1);
});
