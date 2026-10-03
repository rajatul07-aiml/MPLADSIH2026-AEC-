const fs = require('fs');
let content = fs.readFileSync('src/pages/WorkDetails.tsx', 'utf8');

// Remove all workflow_tabs contents that got accidentally injected.
const workflowTabsContent = fs.readFileSync('workflow_tabs.tsx', 'utf8');
content = content.split(workflowTabsContent).join('');

// Now insert workflowTabsContent right before the final `</main>`
const lastMainIdx = content.lastIndexOf('</main>');
if (lastMainIdx !== -1) {
  content = content.slice(0, lastMainIdx) + '\n' + workflowTabsContent + '\n' + content.slice(lastMainIdx);
}

fs.writeFileSync('src/pages/WorkDetails.tsx', content);
