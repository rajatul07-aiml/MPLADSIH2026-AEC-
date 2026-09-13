const fs = require('fs');
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

// Add icon
content = content.replace(
  "{role === 'MP' && <Award className=\"w-5 h-5\" />}",
  "{role === 'MP' && <Award className=\"w-5 h-5\" />}\n              {role === 'INSPECTION OFFICER' && <User className=\"w-5 h-5\" />}"
);

// Add title
content = content.replace(
  "{role === 'MP' && `Hon'ble MP Constituency View: ${selectedConstituency}`}",
  "{role === 'MP' && `Hon'ble MP Constituency View: ${selectedConstituency}`}\n                  {role === 'INSPECTION OFFICER' && `Assigned Inspection Cases: ${selectedOfficer}`}"
);

// Add description
content = content.replace(
  "{role === 'MP' &&\n                  'Monitoring recommended works and constituent impact across the represented territory.'}",
  "{role === 'MP' &&\n                  'Monitoring recommended works and constituent impact across the represented territory.'}\n                {role === 'INSPECTION OFFICER' &&\n                  'Viewing field inspection cases specifically assigned for review.'}"
);

// Make sure 'User' is imported in Dashboard.tsx
if (!content.includes('User')) {
  content = content.replace("Award", "Award, User");
}

fs.writeFileSync('src/pages/Dashboard.tsx', content);
