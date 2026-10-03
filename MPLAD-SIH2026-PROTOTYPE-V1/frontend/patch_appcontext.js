const fs = require('fs');
const content = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

const newContent = content.replace(
  "  const resolveAlert = (alertId: string, resolutionNote: string) => {\n    alertsService.resolveAlert(alertId, resolutionNote);\n    setAlerts(alertsService.getAllAlerts());\n    showToast('Alert resolved.', 'success');\n  };",
  "  const resolveAlert = (alertId: string, resolutionNote: string) => {\n    alertsService.resolveAlert(alertId, resolutionNote);\n    setAlerts(alertsService.getAllAlerts());\n    showToast('Alert resolved.', 'success');\n  };\n\n  const updateWork = (work: Work) => {\n    worksService.updateWork(work);\n    setWorks(worksService.getAllWorks());\n  };"
).replace(
  "        resolveAlert,\n        isAlertModalOpen",
  "        resolveAlert,\n        updateWork,\n        isAlertModalOpen"
);

fs.writeFileSync('src/context/AppContext.tsx', newContent);
