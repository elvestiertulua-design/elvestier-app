const fs = require('fs');

const content = fs.readFileSync('C:\\Users\\USUARIO\\Desktop\\antigravity\\scratch\\match.txt', 'utf8');

let startIdx = content.indexOf('Número Recibo');
if (startIdx === -1) {
  startIdx = content.indexOf('Nǧmero Recibo');
}
if (startIdx !== -1) {
  let csv = content.substring(startIdx);
  
  let endStr = 'Error: Your previous response was cut off';
  let endIdx = csv.indexOf(endStr);
  if (endIdx !== -1) {
    csv = csv.substring(0, endIdx);
  }
  
  fs.writeFileSync('C:\\Users\\USUARIO\\Desktop\\antigravity\\scratch\\backup.csv', csv.trim());
  console.log('Saved CSV, length:', csv.length);
} else {
  console.log('CSV start not found in match.txt');
}
