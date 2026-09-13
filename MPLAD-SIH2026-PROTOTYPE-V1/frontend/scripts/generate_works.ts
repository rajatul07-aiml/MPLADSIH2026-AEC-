import * as fs from 'fs';
import * as path from 'path';

// Seeded PRNG
let seed = 123456789;
function random() {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
}

function randRange(min: number, max: number) {
  return min + random() * (max - min);
}

function randInt(min: number, max: number) {
  return Math.floor(randRange(min, max));
}

function randomElement<T>(arr: T[]): T {
  return arr[randInt(0, arr.length)];
}

function round2(num: number) {
  return Math.round(num * 100) / 100;
}

const states = [
  { name: 'West Bengal', districts: ['Nadia', 'Murshidabad', 'North 24 Parganas'] },
  { name: 'Uttar Pradesh', districts: ['Varanasi', 'Lucknow', 'Prayagraj'] },
  { name: 'Maharashtra', districts: ['Pune', 'Nagpur', 'Nashik'] },
  { name: 'Tamil Nadu', districts: ['Coimbatore', 'Madurai'] },
  { name: 'Rajasthan', districts: ['Jaipur', 'Jodhpur'] },
  { name: 'Karnataka', districts: ['Mysuru', 'Bengaluru Rural'] },
  { name: 'Odisha', districts: ['Khordha', 'Puri'] },
  { name: 'Bihar', districts: ['Patna', 'Gaya'] },
  { name: 'Assam', districts: ['Kamrup Metropolitan', 'Dibrugarh'] },
  { name: 'Madhya Pradesh', districts: ['Bhopal', 'Indore'] },
];

const workTypes = [
  { sector: 'Road Infrastructure', type: 'Rural Road Improvement', cost: 15 },
  { sector: 'Road Infrastructure', type: 'Bridge Approach Road', cost: 25 },
  { sector: 'Education', type: 'School Classroom Block', cost: 12 },
  { sector: 'Education', type: 'School Infrastructure', cost: 15 },
  { sector: 'Education', type: 'School Boundary Wall', cost: 5 },
  { sector: 'Education', type: 'Library / Learning Centre', cost: 8 },
  { sector: 'Health', type: 'Health Facility', cost: 30 },
  { sector: 'Health', type: 'Primary Health Centre Improvement', cost: 20 },
  { sector: 'Health', type: 'Community Health Centre Facility', cost: 35 },
  { sector: 'Water Supply', type: 'Drinking Water Pipeline', cost: 10 },
  { sector: 'Water Supply', type: 'Drinking Water', cost: 12 },
  { sector: 'Water Supply', type: 'Water Storage Tank', cost: 6 },
  { sector: 'Sanitation', type: 'Drainage Improvement', cost: 18 },
  { sector: 'Sanitation', type: 'Drainage', cost: 15 },
  { sector: 'Sanitation', type: 'Sanitation', cost: 12 },
  { sector: 'Sanitation', type: 'Public Sanitary Complex', cost: 7 },
  { sector: 'Community', type: 'Community Hall', cost: 22 },
  { sector: 'Community', type: 'Anganwadi Building', cost: 9 },
  { sector: 'Community', type: 'Sports Ground', cost: 11 },
  { sector: 'Energy', type: 'Street Lighting', cost: 6 },
  { sector: 'Energy', type: 'Solar Street Lighting', cost: 4 },
  { sector: 'Public Utility', type: 'Public Utility', cost: 10 },
  { sector: 'Other', type: 'Other Eligible Community Asset', cost: 8 }
];

const financialYears = ['2022-2023', '2023-2024', '2024-2025', '2025-2026'];

let workCounter = 1;

function generateId(fy: string) {
  const year = fy.substring(2, 4);
  const id = `MP-${year}-${String(workCounter).padStart(5, '0')}`;
  workCounter++;
  return id;
}

function generateDate(fy: string, stage: 'sanction' | 'completion' | 'actual', isDelayed: boolean) {
  const startYear = parseInt(fy.substring(0, 4), 10);
  
  if (stage === 'sanction') {
    const month = randInt(4, 12);
    const day = randInt(1, 28);
    return `${startYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  
  if (stage === 'completion') {
    const month = randInt(1, 6);
    const day = randInt(1, 28);
    return `${startYear + 1}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  
  if (stage === 'actual') {
    let year = startYear + 1;
    let month = randInt(1, 6);
    if (isDelayed) {
      year += randInt(0, 2);
      month = randInt(7, 12);
    }
    const day = randInt(1, 28);
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  return '';
}

const works: any[] = [];

// Hero work (Deterministic)
const heroWork = {
  workId: 'MP-24-00182',
  workName: 'Nadia Rural Link Road Upgradation',
  description: 'Rural Road Improvement in Nadia district',
  state: 'West Bengal',
  district: 'Nadia',
  block: 'Krishnanagar',
  village: 'Dignagar',
  constituency: 'Krishnanagar',
  mpName: 'Smt. Mahua Moitra',
  sector: 'Road Infrastructure',
  workType: 'Rural Road Improvement',
  implementingAgency: 'State Rural Works Division - II',
  sanctionDate: '2024-11-15',
  expectedCompletion: '2025-06-30',
  projectedCompletion: '2025-10-02',
  status: 'UNDER PROGRESS',
  estimatedCost: 16.80,
  sanctionedAmount: 18.42,
  releasedAmount: 16.00,
  expenditure: 14.37,
  physicalProgress: 42,
  financialProgress: 78,
  delayDays: 94,
  // riskScore removed
  // riskLevel removed
  // riskSignals removed
  latitude: 23.4,
  longitude: 88.5,
  financialYear: '2024-2025',
  peerAverageCost: 15.50,
  peerCostDeviation: 18.8,
  similarWork: {
    workId: 'MP-23-00167',
    description: 'Rural Road Improvement from Main Road to Village School',
    distanceKm: 1.8,
    amount: 16.90,
    status: 'COMPLETED',
    similarityPercentage: 84,
    reasons: ['Similar description', 'Same sector', 'Nearby location', 'Similar budget']
  },
  payments: [
    { paymentId: 'PAY-1', paymentNumber: 1, paymentDate: '2024-12-10', paymentAmount: 3.20, cumulativeExpenditure: 3.20, physicalProgressAtPayment: 10, financialProgressAtPayment: 17 },
    { paymentId: 'PAY-2', paymentNumber: 2, paymentDate: '2025-02-15', paymentAmount: 4.37, cumulativeExpenditure: 7.57, physicalProgressAtPayment: 30, financialProgressAtPayment: 41 },
    { paymentId: 'PAY-3', paymentNumber: 3, paymentDate: '2025-05-20', paymentAmount: 6.80, cumulativeExpenditure: 14.37, physicalProgressAtPayment: 42, financialProgressAtPayment: 78, anomalyFlag: 'Rapid expenditure increase while physical progress remains low' },
  ],
  complianceScore: 62,
  complianceChecks: [
    { id: 'C1', name: 'Geotagged Evidence', status: 'MISSING', detail: 'Phase 3 geotags missing' },
    { id: 'C2', name: 'Milestone Inspection', status: 'OVERDUE', detail: 'Pending for > 30 days' },
  ],
  assetOutput: {
    assetType: 'Road',
    assetStatus: 'UNDER CONSTRUCTION',
    assetCreated: 'PENDING VERIFICATION',
    expectedAsset: '1.2km paved road',
    handoverStatus: 'NOT STARTED'
  },
  inspection: {
    status: 'REQUESTED',
    requestDate: '2025-08-20',
  }
};
works.push(heroWork);

const scenarios = [
  'LOW_RISK', 'LOW_RISK', 'LOW_RISK', // Bias towards normal
  'MEDIUM_RISK', 'MEDIUM_RISK',
  'HIGH_RISK_FINANCIAL',
  'HIGH_RISK_DELAY',
  'CRITICAL_RISK'
];

for (let i = 0; i < 140; i++) {
  const fy = randomElement(financialYears);
  const stateObj = randomElement(states);
  const district = randomElement(stateObj.districts);
  const workDef = randomElement(workTypes);
  
  const isPast = (fy === '2022-2023' || fy === '2023-2024');
  let status = 'COMPLETED';
  
  if (isPast) {
    status = random() > 0.9 ? 'DELAYED' : 'COMPLETED';
  } else {
    const r = random();
    if (r < 0.1) status = 'NOT STARTED';
    else if (r < 0.7) status = 'UNDER PROGRESS';
    else if (r < 0.8) status = 'DELAYED';
    else status = 'COMPLETED';
  }

  const scenario = randomElement(scenarios);
  
  let estCost = round2(workDef.cost * randRange(0.9, 1.1));
  let peerAvg = workDef.cost;
  let sancAmount = estCost;
  let dev = round2(((sancAmount - peerAvg) / peerAvg) * 100);
  

  if (scenario === 'CRITICAL_RISK') {
    sancAmount = round2(estCost * randRange(1.3, 1.6));
    dev = round2(((sancAmount - peerAvg) / peerAvg) * 100);
  }

  let phys = 0;
  let fin = 0;
  let exp = 0;
  
  if (status === 'COMPLETED') {
    phys = 100;
    fin = 100;
    exp = sancAmount;
  } else if (status === 'UNDER PROGRESS' || status === 'DELAYED') {
    phys = randInt(10, 80);
    fin = phys + randInt(-5, 10);
    
    if (scenario === 'HIGH_RISK_FINANCIAL') {
      fin = phys + randInt(30, 50);
      if (fin > 100) fin = 100;
    } else if (scenario === 'CRITICAL_RISK') {
      phys = randInt(10, 40);
      fin = phys + randInt(40, 60);
      if (fin > 100) fin = 100;
    }
    exp = round2((fin / 100) * sancAmount);
  }

  const releasedAmount = round2(Math.min(sancAmount, exp + sancAmount * randRange(0.05, 0.2)));


  const sancDate = generateDate(fy, 'sanction', false);
  const expComp = generateDate(fy, 'completion', false);
  let actComp;
  if (status === 'COMPLETED') {
     actComp = generateDate(fy, 'actual', false);
  }
  
  let delayDays = 0;
  if (status === 'DELAYED' || scenario === 'HIGH_RISK_DELAY') {
    delayDays = randInt(30, 90);
  }
  if (scenario === 'CRITICAL_RISK') {
    delayDays = randInt(130, 200);
    status = 'DELAYED';
  }

  // Determine Payments (diverse patterns)
  const payments = [];
  if (exp > 0) {
    const pType = randInt(0, 4); // 0=normal, 1=progressive, 2=delayed, 3=frontloaded
    if (pType === 0 || pType === 1) {
      let p1 = round2(exp * 0.4);
      let p2 = round2(exp * 0.6);
      payments.push({ paymentId: 'PAY-1', paymentNumber: 1, paymentDate: sancDate, paymentAmount: p1, cumulativeExpenditure: p1, physicalProgressAtPayment: Math.floor(phys * 0.4), financialProgressAtPayment: Math.floor(fin * 0.4) });
      payments.push({ paymentId: 'PAY-2', paymentNumber: 2, paymentDate: expComp, paymentAmount: p2, cumulativeExpenditure: round2(p1 + p2), physicalProgressAtPayment: phys, financialProgressAtPayment: fin });
    } else if (pType === 2) {
      // delayed chunk
      payments.push({ paymentId: 'PAY-1', paymentNumber: 1, paymentDate: sancDate, paymentAmount: exp, cumulativeExpenditure: exp, physicalProgressAtPayment: phys, financialProgressAtPayment: fin, anomalyFlag: 'Sudden single large payment' });
    } else {
      let p1 = round2(exp * 0.8);
      let p2 = round2(exp * 0.2);
      payments.push({ paymentId: 'PAY-1', paymentNumber: 1, paymentDate: sancDate, paymentAmount: p1, cumulativeExpenditure: p1, physicalProgressAtPayment: Math.floor(phys * 0.1), financialProgressAtPayment: Math.floor(fin * 0.8), anomalyFlag: 'Front-loaded excessive payment' });
      payments.push({ paymentId: 'PAY-2', paymentNumber: 2, paymentDate: expComp, paymentAmount: p2, cumulativeExpenditure: round2(p1 + p2), physicalProgressAtPayment: phys, financialProgressAtPayment: fin });
    }
  }

  const work: any = {
    workId: generateId(fy),
    workName: `${workDef.type} at ${district}`,
    description: `${workDef.type} in ${district}, ${stateObj.name}`,
    state: stateObj.name,
    district: district,
    block: `${district} Block`,
    sector: workDef.sector,
    workType: workDef.type,
    implementingAgency: `State Dept - ${district}`,
    sanctionDate: sancDate,
    expectedCompletion: expComp,
    projectedCompletion: expComp,
    actualCompletionDate: actComp,
    status,
    estimatedCost: estCost,
    sanctionedAmount: sancAmount,
    releasedAmount: releasedAmount,
    expenditure: exp,
    physicalProgress: phys,
    financialProgress: fin,
    delayDays: delayDays,
    
    
    
    latitude: 20 + randRange(-5, 5),
    longitude: 80 + randRange(-5, 5),
    financialYear: fy,
    peerAverageCost: peerAvg,
    peerCostDeviation: dev,
    payments
  };
  
  if (scenario === 'CRITICAL_RISK' && random() > 0.5) {
    work.similarWork = {
      workId: generateId(fy),
      description: `Similar ${workDef.type}`,
      distanceKm: round2(randRange(0.5, 5)),
      amount: round2(sancAmount * randRange(0.9, 1.1)),
      status: 'COMPLETED',
      similarityPercentage: Math.floor(randRange(75, 95)),
      reasons: ['Similar location', 'Same sector']
    };
  }
  
  if (status === 'COMPLETED') {
    work.assetOutput = {
      assetType: workDef.type,
      assetStatus: 'CREATED',
      assetCreated: 'YES',
      expectedAsset: `1 unit of ${workDef.type}`,
      handoverStatus: 'COMPLETED'
    };
  } else if (status === 'UNDER PROGRESS') {
    work.assetOutput = {
      assetType: workDef.type,
      assetStatus: 'UNDER CONSTRUCTION',
      assetCreated: 'PENDING VERIFICATION',
      expectedAsset: `1 unit of ${workDef.type}`,
      handoverStatus: 'NOT STARTED'
    };
  }
  
  if (scenario === 'CRITICAL_RISK') {
    if (random() > 0.5) {
      work.inspection = {
        status: 'REQUESTED',
        requestDate: new Date().toISOString().split('T')[0]
      };
    }
  }

  works.push(work);
}

const content = `import { Work } from '../types/work';\n\nexport const INITIAL_WORKS: Work[] = ${JSON.stringify(works, null, 2)} as unknown as Work[];\n`;
fs.writeFileSync(path.join(process.cwd(), 'src/data/works.ts'), content, 'utf8');
console.log('Generated works.ts successfully.');
