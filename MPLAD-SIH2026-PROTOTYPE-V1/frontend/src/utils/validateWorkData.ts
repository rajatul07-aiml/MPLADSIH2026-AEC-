import { Work } from '../types/work';

export function validateWorkData(works: Work[]): string[] {
  const errors: string[] = [];

  works.forEach((w, index) => {
    const id = w.workId || `Index-${index}`;

    if (!w.financialYear) errors.push(`${id}: Missing financialYear`);
    if (!w.state) errors.push(`${id}: Missing state`);
    if (!w.district) errors.push(`${id}: Missing district`);
    if (!w.sector) errors.push(`${id}: Missing sector`);
    if (!w.workType) errors.push(`${id}: Missing workType`);

    if (w.estimatedCost < 0) errors.push(`${id}: Negative estimatedCost`);
    if (w.sanctionedAmount < 0) errors.push(`${id}: Negative sanctionedAmount`);
    if (w.releasedAmount < 0) errors.push(`${id}: Negative releasedAmount`);
    if (w.expenditure < 0) errors.push(`${id}: Negative expenditure`);
    if (w.physicalProgress < 0 || w.physicalProgress > 100) errors.push(`${id}: Invalid physicalProgress`);
    if (w.financialProgress < 0 || w.financialProgress > 100) errors.push(`${id}: Invalid financialProgress`);

    if (w.expenditure > (w.releasedAmount + 0.1)) {
       errors.push(`${id}: Expenditure (${w.expenditure}) exceeds releasedAmount (${w.releasedAmount})`);
    }

    if (w.payments) {
      const sum = w.payments.reduce((acc, p) => acc + p.paymentAmount, 0);
      if (Math.abs(sum - w.expenditure) > 0.1) {
        errors.push(`${id}: Payments sum (${sum}) does not match expenditure (${w.expenditure})`);
      }
    }

    if (w.sanctionDate && w.expectedCompletion) {
       if (new Date(w.sanctionDate) > new Date(w.expectedCompletion)) {
         errors.push(`${id}: expectedCompletion before sanctionDate`);
       }
    }

    if (w.status === 'COMPLETED' && w.physicalProgress !== 100) {
      errors.push(`${id}: Completed status but physicalProgress is ${w.physicalProgress}`);
    }
  });

  return errors;
}
