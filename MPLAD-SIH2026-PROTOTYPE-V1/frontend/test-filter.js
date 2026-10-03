import fs from 'fs';
let code = fs.readFileSync('src/data/works.ts', 'utf8'); 
const match = code.match(/export const INITIAL_WORKS.*?= (\[.*\]) as unknown as Work\[\];/s); 
if (match) { 
  const data = eval(match[1]); 
  console.log("Total:", data.length);
  console.log("DELAYED:", data.filter(w => w.status === 'DELAYED').length);
}
