const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\USUARIO\\.gemini\\antigravity\\brain\\364c1cc6-8824-4e4c-b138-b959030c503e\\.system_generated\\logs\\transcript_full.jsonl';
const fileStream = fs.createReadStream(logPath);
const readline = require('readline');

const rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity
});

let lastCsvContent = '';

rl.on('line', (line) => {
  try {
    const data = JSON.parse(line);
    if (data.source === 'USER_INPUT' && data.content && data.content.includes('Número Recibo,Fecha')) {
      let content = data.content;
      let startIdx = content.indexOf('Número Recibo,Fecha');
      let csv = content.substring(startIdx);
      if (csv.includes('Error: Your previous response was cut off')) {
        csv = csv.substring(0, csv.indexOf('Error: Your previous response was cut off'));
      }
      lastCsvContent = csv.trim();
    }
  } catch (e) {
    // Ignore JSON parse errors for lines that might be malformed
  }
});

rl.on('close', () => {
  fs.writeFileSync('C:\\Users\\USUARIO\\Desktop\\antigravity\\scratch\\backup.csv', lastCsvContent);
  console.log('Saved CSV, length:', lastCsvContent.length);
  
  // Try to count lines
  console.log('Lines:', lastCsvContent.split('\n').length);
});
