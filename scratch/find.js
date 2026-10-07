const fs = require('fs');
const readline = require('readline');
const logPath = 'C:\\Users\\USUARIO\\.gemini\\antigravity\\brain\\364c1cc6-8824-4e4c-b138-b959030c503e\\.system_generated\\logs\\transcript_full.jsonl';

const rl = readline.createInterface({
  input: fs.createReadStream(logPath),
  crlfDelay: Infinity
});

rl.on('line', (line) => {
  if (line.includes('esta base de datos es hasta el 3 de octubre')) {
    try {
      const obj = JSON.parse(line);
      if (obj.source === 'USER' || obj.source === 'USER_EXPLICIT' || obj.source === 'USER_INPUT') {
        const content = obj.content;
        fs.writeFileSync('C:\\Users\\USUARIO\\Desktop\\antigravity\\scratch\\match.txt', content);
        console.log('Found and written');
        process.exit(0);
      }
    } catch(e) {}
  }
});
