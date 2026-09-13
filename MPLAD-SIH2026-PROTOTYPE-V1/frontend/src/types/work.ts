import { ActionStatus, InspectionReport, CorrectiveAction } from './workflow';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';


export type WorkStatus = 'UNDER PROGRESS' | 'COMPLETED' | 'NOT STARTED' | 'DELAYED' | 'DISCONTINUED';

export type StakeholderRole = 'MINISTRY' | 'STATE AUTHORITY' | 'DISTRICT AUTHORITY' | 'MP' | 'INSPECTION OFFICER';

export interface PaymentRecord {
  paymentId: string;
  paymentNumber: number;
  paymentDate: string;
  paymentAmount: number; // in Lakhs
  cumulativeExpenditure: number; // in Lakhs
  physicalProgressAtPayment: number; // 0 - 100
  financialProgressAtPayment: number; // 0 - 100
  anomalyFlag?: string; // e.g. 'Unusually large payment', 'Sudden expenditure spike', etc.
}

export type ComplianceStatus = 'COMPLIANT' | 'ATTENTION' | 'MISSING' | 'OVERDUE';

export interface ComplianceCheckItem {
  id: string;
  name: string;
  status: ComplianceStatus;
  detail: string;
  lastUpdated?: string;
}

export interface SimilarWorkRecord {
  workId: string;
  description: string;
  distanceKm: number;
  amount: number; // in Lakhs
  expenditure?: number; // in Lakhs
  status: string;
  similarityPercentage: number;
  block?: string;
  district?: string;
  state?: string;
  sector?: string;
  workType?: string;
  implementingAgency?: string;
  sanctionDate?: string;
  reasons?: string[];
}

export interface RiskContribution {
  factor: string;
  points: number;
  level: RiskLevel;
  description: string;
}

export type AssetStatus = 'CREATED' | 'UNDER CONSTRUCTION' | 'NOT STARTED' | 'PENDING VERIFICATION';

export interface AssetOutput {
  assetType: string;
  assetStatus: AssetStatus;
  assetCreated: 'YES' | 'NO' | 'PENDING VERIFICATION';
  expectedAsset: string;
  handoverStatus: 'COMPLETED' | 'PENDING' | 'NOT STARTED';
}

export type InspectionStatus = 'NOT REQUESTED' | 'REQUESTED' | 'ASSIGNED' | 'IN PROGRESS' | 'COMPLETED';
export type InspectionResult = 'VERIFIED' | 'MINOR ISSUE' | 'REQUIRES FURTHER REVIEW' | 'MAJOR IRREGULARITY INDICATOR' | 'PENDING';

export interface Inspection {
  status: InspectionStatus;
  requestDate?: string;
  inspectionDate?: string;
  assignedOfficer?: string;
  observedPhysicalProgress?: number;
  reportedPhysicalProgress?: number;
  assetExists?: 'YES' | 'NO' | 'PARTIAL' | 'PENDING';
  qualityObservation?: string;
  siteObservation?: string;
  photoEvidenceCount?: number;
  documentEvidenceAvailable?: 'YES' | 'NO';
  result?: InspectionResult;
  officerRemarks?: string;
}

export interface VerificationData {
  status: string;
  checklist: {
    financial: boolean;
    payment: boolean;
    physical: boolean;
    inspection: boolean;
    contractor: boolean;
    documentation: boolean;
  };
  notes: string;
  outcome: string | null;
}

export interface Work {
  workId: string;
  workName: string;
  description: string;
  state: string;
  district: string;
  block: string;
  village?: string;
  constituency?: string;
  mpName?: string;
  sector: string;
  workType?: string;
  implementingAgency: string;
  sanctionDate: string;
  expectedCompletion: string;
  projectedCompletion: string;
  actualCompletionDate?: string;
  status: WorkStatus;
  estimatedCost?: number;   // in Lakhs (DPR Estimate)
  sanctionedAmount: number; // in Lakhs
  releasedAmount: number;   // in Lakhs
  expenditure: number;      // in Lakhs
  physicalProgress: number; // 0 - 100
  financialProgress: number;// 0 - 100
  delayDays: number;
  riskScore: number;        // 0 - 100
  riskLevel: RiskLevel;
  riskSignals: string[];
  latitude: number;
  longitude: number;
  financialYear: string;
  peerAverageCost?: number;     // in Lakhs (Peer sector median)
  peerCostDeviation?: number; // percentage (+/-)
  similarWork?: SimilarWorkRecord;
  payments?: PaymentRecord[];
  complianceScore?: number; // 0 - 100
  complianceChecks?: ComplianceCheckItem[];
  predictedCompletionDate?: string;
  predictedDelayDays?: number;
  completionRiskStatus?: 'On Schedule' | 'Moderate Delay Probability' | 'High Delay Probability' | 'Critical Timeline Stall';
  predictionMethodology?: string;
  assetOutput?: AssetOutput;
  inspection?: Inspection;
  
  // Workflow fields
  actionStatus?: ActionStatus;
  inspectionReport?: InspectionReport;
  correctiveAction?: CorrectiveAction;
  verification?: VerificationData;
}

export interface RiskAnalysisResult {
  score: number;
  riskLevel: RiskLevel;
  signals: string[];
  contributions: RiskContribution[];
  observations: string[];
  recommendations: string[];
}
