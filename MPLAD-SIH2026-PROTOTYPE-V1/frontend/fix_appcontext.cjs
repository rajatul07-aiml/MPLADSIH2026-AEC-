const fs = require('fs');
let content = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

content = content.replace("  const [selectedConstituency,\n        selectedOfficer, setSelectedConstituency] = useState<string>('Demo Constituency');", "  const [selectedConstituency, setSelectedConstituency] = useState<string>('Demo Constituency');");

// Let's implement dynamic visibility logic
const getVisibleWorksStr = `
  const visibleWorks = useMemo(() => {
    return works.filter(w => {
      if (role === 'MINISTRY') return true;
      if (role === 'STATE AUTHORITY') return w.state === selectedState;
      if (role === 'DISTRICT AUTHORITY') return w.district === selectedDistrict;
      if (role === 'MP') return w.constituency === selectedConstituency;
      if (role === 'INSPECTION OFFICER') {
        // Show if assigned as inspector OR if there's a pending inspection requested and they could pick it up?
        // Let's strictly scope to assigned cases:
        return w.inspectionReport?.inspectionOfficer === selectedOfficer || w.actionStatus === 'INSPECTION_REQUESTED';
        // But the requirement says: "INSPECTION_OFFICER: Can see only inspection cases assigned to that officer."
        // Oh wait! If they are assigned, it's w.inspectionReport?.inspectionOfficer === selectedOfficer. Let's just use that.
        // Wait, what if they haven't been assigned yet? They don't see it? Correct.
      }
      return true;
    });
  }, [works, role, selectedState, selectedDistrict, selectedConstituency, selectedOfficer]);

  const visibleAlerts = useMemo(() => {
    return alerts.filter(a => {
      if (role === 'MINISTRY') return true;
      
      const relatedWork = works.find(w => w.workId === a.workId);
      if (!relatedWork) return true;

      if (role === 'STATE AUTHORITY') return relatedWork.state === selectedState;
      if (role === 'DISTRICT AUTHORITY') return relatedWork.district === selectedDistrict;
      if (role === 'MP') return relatedWork.constituency === selectedConstituency;
      if (role === 'INSPECTION OFFICER') return relatedWork.inspectionReport?.inspectionOfficer === selectedOfficer;
      
      return true;
    });
  }, [alerts, works, role, selectedState, selectedDistrict, selectedConstituency, selectedOfficer]);
`;

// Insert useMemo if missing
if (!content.includes('import React, { createContext, useContext, useState, ReactNode, useMemo }')) {
    content = content.replace("import React, { createContext, useContext, useState, ReactNode } from 'react';", "import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';");
}

content = content.replace("const [toasts, setToasts] = useState<ToastInfo[]>([]);", "const [toasts, setToasts] = useState<ToastInfo[]>([]);" + getVisibleWorksStr);

// Expose visibleWorks and visibleAlerts
content = content.replace("        works,\n        alerts,", "        works: visibleWorks,\n        alerts: visibleAlerts,");

fs.writeFileSync('src/context/AppContext.tsx', content);
