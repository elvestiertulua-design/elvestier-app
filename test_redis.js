const Redis = require('ioredis');
const redis = new Redis('redis://default:36jLcgZDCmiaPVw8Azlry6ZrT1b91Cgt@megabright-superneat-design-36118.db.redis.io:10147');
redis.get('elvestier_db')
  .then(r => { 
    console.log(r ? 'DATA FOUND: ' + r.length + ' chars' : 'NO DATA'); 
    process.exit(0); 
  })
  .catch(e => { 
    console.error('ERROR:', e); 
    process.exit(1); 
  });
