const fs = require('fs');
const lines = fs.readFileSync('C:\\Users\\USUARIO\\.gemini\\antigravity\\brain\\364c1cc6-8824-4e4c-b138-b959030c503e\\.system_generated\\logs\\transcript_full.jsonl', 'utf-8').split('\n').filter(l => l);
const userLines = lines.map(l => JSON.parse(l)).filter(l => l.content && l.content.includes && l.content.includes('Número Recibo,Fecha,Cliente Nombre'));
const lastUser = userLines[userLines.length - 1];
let csvContent = lastUser.content;
csvContent = csvContent.substring(csvContent.indexOf('Número Recibo,Fecha,Cliente Nombre'));
if (csvContent.includes('Error: Your previous response was cut off')) {
  csvContent = csvContent.substring(0, csvContent.indexOf('Error: Your previous response was cut off'));
}
csvContent = csvContent.trim();
fs.writeFileSync('C:\\Users\\USUARIO\\Desktop\\antigravity\\scratch\\backup.csv', csvContent);
console.log('Saved CSV, length:', csvContent.length);
