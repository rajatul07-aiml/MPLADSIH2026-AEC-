const fs = require('fs');
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

// Replace roleScopedWorks with works
content = content.replace(/const roleScopedWorks = useMemo\(\(\) => \{[\s\S]*?\}, \[works, role, selectedState, selectedDistrict, selectedConstituency\]\);/, "");
content = content.replace(/roleScopedWorks/g, "works");

fs.writeFileSync('src/pages/Dashboard.tsx', content);
