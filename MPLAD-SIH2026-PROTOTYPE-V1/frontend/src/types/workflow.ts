export type ActionStatus = 
  | 'NO_ACTION'
  | 'INSPECTION_REQUESTED'
  | 'OFFICER_ASSIGNED'
  | 'INSPECTION_IN_PROGRESS'
  | 'REPORT_SUBMITTED'
  | 'AUTHORITY_REVIEW'
  | 'RESOLVED'
  | 'ESCALATED';

export interface InspectionReport {
  inspectionOfficer: string;
  inspectionDate: string;
  observedPhysicalProgress: number;
  reviewedFinancialProgress: number;
  siteCondition: string;
  workStatus: string;
  measurementBookVerified: 'YES' | 'NO';
  paymentRecordsReviewed: 'YES' | 'NO';
  geotaggedPhotographVerified: 'YES' | 'NO';
  qualityObservation: string;
  deviationObserved: string;
  beneficiaryObservation: string;
  inspectionRemarks: string;
  recommendedAction: string;
}

export interface CorrectiveAction {
  actionType: 'RESOLVED' | 'ESCALATED';
  status: string;
  remarks: string;
  actionBy: string;
  actionDate: string;
  escalationLevel?: string;
  escalationReason?: string;
  requiredFollowUp?: string;
}

export interface AuditEvent {
  id: string;
  workId: string;
  timestamp: string;
  event: string;
  actor: string;
  role: string;
  status: string;
  remarks?: string;
}
