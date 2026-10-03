const fs = require('fs');
let code = fs.readFileSync('src/services/worksService.ts', 'utf-8');
code = code.replace(
  "financialYear: w.financial_year || w.financial_year_start || 'Unknown'",
  "financialYear: w.financial_year || w.financial_year_start || (w.sanction_date ? w.sanction_date.substring(0, 4) : 'Unknown')"
);
fs.writeFileSync('src/services/worksService.ts', code);
