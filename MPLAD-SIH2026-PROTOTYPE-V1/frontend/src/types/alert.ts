export type AlertType =
  | 'Financial / Physical Mismatch'
  | 'Cost Deviation'
  | 'Delay'
  | 'Potential Similar Work'
  | 'Documentation Review'
  | 'Payment Anomaly'
  | 'Compliance Attention';

export type AlertPriority = 'Critical' | 'High' | 'Medium' | 'Low';

export type AlertStatus = 'Open' | 'In Review' | 'Resolved';

export interface Alert {
  alertId: string;
  workId: string;
  alertType: AlertType;
  priority: AlertPriority;
  created: string;
  assignedTo: string;
  status: AlertStatus;
  reviewNote: string;
  resolutionNote?: string;
  resolvedAt?: string;
}

export interface CreateAlertInput {
  workId: string;
  alertType: AlertType;
  priority: AlertPriority;
  assignedTo: string;
  reviewNote: string;
}
