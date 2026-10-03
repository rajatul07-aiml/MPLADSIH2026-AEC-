const fs = require('fs');
let content = fs.readFileSync('src/pages/WorkDetails.tsx', 'utf8');

content = content.replace(
  "The requested work record with ID &ldquo;{workId}&rdquo; was not found in the monitoring dataset.",
  "The requested work record with ID &ldquo;{workId}&rdquo; was not found or you do not have permission to access it within your current role scope."
);

content = content.replace(
  "Work Record Not Found",
  "Access Denied or Not Found"
);

fs.writeFileSync('src/pages/WorkDetails.tsx', content);
