const Redis = require('ioredis');

(async () => {
  const redis = new Redis('redis://default:36jLcgZDCmiaPVw8Azlry6ZrT1b91Cgt@megabright-superneat-design-36118.db.redis.io:10147');
  const keys = await redis.keys('*');
  console.log('All keys in Redis:', keys);
  process.exit(0);
})();
