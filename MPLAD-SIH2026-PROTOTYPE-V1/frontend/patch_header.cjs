const fs = require('fs');
let content = fs.readFileSync('src/components/layout/Header.tsx', 'utf8');

// Add "selectedOfficer, setSelectedOfficer" to useApp()
content = content.replace(
  "setSelectedConstituency,\n  } = useApp();",
  "setSelectedConstituency,\n    selectedOfficer,\n    setSelectedOfficer,\n  } = useApp();"
);

// Add the INSPECTION OFFICER button
const buttonsReplacement = `            <button
              type="button"
              onClick={() => setRole('MP')}
              className={\`px-2 py-1 rounded font-medium transition text-[11px] flex items-center gap-1 \${
                role === 'MP'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }\`}
              title="Member of Parliament Constituency View"
            >
              <Award className="w-3 h-3" />
              <span>MP</span>
            </button>
            <button
              type="button"
              onClick={() => setRole('INSPECTION OFFICER')}
              className={\`px-2 py-1 rounded font-medium transition text-[11px] flex items-center gap-1 \${
                role === 'INSPECTION OFFICER'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }\`}
              title="Inspection Officer View"
            >
              <User className="w-3 h-3" />
              <span>Inspector</span>
            </button>`;
content = content.replace(/<button\s+type="button"\s+onClick=\{\(\) => setRole\('MP'\)\}[\s\S]*?<\/button>/m, buttonsReplacement);

// Add officer select dropdown
const mpSelect = `{role === 'MP' && (
            <select
              value={selectedConstituency}
              onChange={(e) => setSelectedConstituency(e.target.value)}
              className="h-7 px-2 text-xs bg-white border border-slate-300 rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-700"
            >
              {constituencies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}`;
const officerSelect = `
          {role === 'INSPECTION OFFICER' && (
            <select
              value={selectedOfficer}
              onChange={(e) => setSelectedOfficer(e.target.value)}
              className="h-7 px-2 text-xs bg-white border border-slate-300 rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-700"
            >
              {['Inspector A. Sharma', 'Inspector B. Singh', 'Inspector C. Verma'].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}`;
content = content.replace(mpSelect, mpSelect + officerSelect);

// Update user profile text
const profileReplacement = `                <div className="text-xs font-medium text-slate-800 leading-tight">
                  {role === 'MINISTRY'
                    ? 'Ministry Nodal Officer'
                    : role === 'STATE AUTHORITY'
                    ? \`\${selectedState} SNA Officer\`
                    : role === 'DISTRICT AUTHORITY'
                    ? \`\${selectedDistrict} District Authority\`
                    : role === 'INSPECTION OFFICER'
                    ? \`\${selectedOfficer}\`
                    : \`\${selectedConstituency} MP Office\`}
                </div>`;
content = content.replace(/<div className="text-xs font-medium text-slate-800 leading-tight">[\s\S]*?<\/div>/m, profileReplacement);

fs.writeFileSync('src/components/layout/Header.tsx', content);
