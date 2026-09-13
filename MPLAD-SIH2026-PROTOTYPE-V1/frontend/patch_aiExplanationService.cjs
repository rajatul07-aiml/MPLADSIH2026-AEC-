const fs = require('fs');
let code = fs.readFileSync('src/services/aiExplanationService.ts', 'utf8');

// replace: const hasPaymentAnomaly = work.payments?.some(p => p.anomalyFlag);
// with: 
// import { detectPaymentAnomalies } from '../utils/riskCalculation';
// ...
// const paymentAnomaly = detectPaymentAnomalies(work);
// if (paymentAnomaly.detected) {
//   keyIndicators.push(paymentAnomaly.explanation);

code = code.replace(/import { Work } from '\.\.\/types\/work';/, "import { Work } from '../types/work';\nimport { detectPaymentAnomalies } from '../utils/riskCalculation';");

code = code.replace(
  /const hasPaymentAnomaly = work\.payments\?\.some\(p => p\.anomalyFlag\);\s*if \(hasPaymentAnomaly\) \{\s*keyIndicators\.push\("Payment timing shows an unusual concentration or anomaly requiring review\."\);\s*verificationFocus\.push\("Review payment timing and financial approvals\."\);\s*\}/,
  `const paymentAnomaly = detectPaymentAnomalies(work);
    if (paymentAnomaly.detected) {
      keyIndicators.push(paymentAnomaly.explanation);
      verificationFocus.push("Review payment timing and financial approvals.");
    }`
);

fs.writeFileSync('src/services/aiExplanationService.ts', code);
console.log("Patched aiExplanationService.ts");
