import { ApiClient } from './api';
import { Alert, CreateAlertInput, AlertStatus, AlertType } from '../types/alert';

export class AlertsService {
  public async getAllAlerts(): Promise<Alert[]> {
    try {
      const beAlerts = await ApiClient.get<any[]>('/alerts');
      return beAlerts.map(a => ({
        alertId: a.id,
        workId: a.workId,
        alertType: 'Compliance Attention' as AlertType, // default mapping
        priority: (a.severity === 'critical' ? 'Critical' : (a.severity === 'high' ? 'High' : 'Medium')),
        created: a.date,
        assignedTo: 'Unassigned',
        status: (a.status === 'active' ? 'Open' : 'Resolved') as AlertStatus,
        reviewNote: a.description || a.title
      }));
    } catch (e) {
      console.error("Failed to load alerts:", e);
      return [];
    }
  }

  public async getAlertById(alertId: string): Promise<Alert | undefined> {
    try {
      const allAlerts = await this.getAllAlerts();
      return allAlerts.find(a => a.alertId === alertId);
    } catch (e) {
      console.error(`Failed to load alert ${alertId}:`, e);
      return undefined;
    }
  }

  public async getAlertsForWork(workId: string): Promise<Alert[]> {
    try {
      const allAlerts = await this.getAllAlerts();
      return allAlerts.filter(a => a.workId === workId);
    } catch (e) {
      console.error(`Failed to load alerts for work ${workId}:`, e);
      return [];
    }
  }

  public async createAlert(input: CreateAlertInput): Promise<Alert | undefined> {
    throw new Error("Alert creation is not supported by the ML backend.");
  }

  public async updateStatus(alertId: string, status: AlertStatus): Promise<Alert | undefined> {
    throw new Error("General alert updates are not supported by the ML backend.");
  }

  public async reassignAlert(alertId: string, assignedTo: string): Promise<Alert | undefined> {
    throw new Error("Assigning alerts is not supported by the ML backend.");
  }

  public async resolveAlert(alertId: string, resolutionNote: string): Promise<Alert | undefined> {
    throw new Error("Alert resolution is not currently supported by the ML backend.");
  }
}

export const alertsService = new AlertsService();
