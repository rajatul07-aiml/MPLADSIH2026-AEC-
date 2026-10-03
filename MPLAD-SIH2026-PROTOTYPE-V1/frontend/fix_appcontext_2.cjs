const fs = require('fs');
let content = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

content = content.replace(
  "return w.inspectionReport?.inspectionOfficer === selectedOfficer || w.actionStatus === 'INSPECTION_REQUESTED';",
  "return w.inspectionReport?.inspectionOfficer === selectedOfficer;"
);

fs.writeFileSync('src/context/AppContext.tsx', content);
