const fs = require('fs');
let code = fs.readFileSync('src/services/aiExplanationService.ts', 'utf8');

code = code.replace(
  /keyIndicators\.push\("A potentially similar work has been identified in the vicinity\."\);/,
  'keyIndicators.push("This work is potentially similar to another work based on location, sector, work type and scope. Verification is recommended.");'
);

fs.writeFileSync('src/services/aiExplanationService.ts', code);
console.log("Patched aiExplanationService.ts again");
