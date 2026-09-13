import { ApiClient } from './api';
import { AuditEvent } from '../types/workflow';

export class WorkflowService {
  public async getEventsForWork(workId: string): Promise<AuditEvent[]> {
    try {
      const beEvents = await ApiClient.get<any[]>(`/works/${encodeURIComponent(workId)}/audit`);
      if (!Array.isArray(beEvents)) return [];
      
      return beEvents.map((evt, idx) => ({
        id: `aud-${idx}-${new Date(evt.timestamp).getTime()}`,
        workId: workId,
        timestamp: evt.timestamp,
        event: evt.event_type || 'Unknown Action',
        actor: evt.user || 'System',
        role: 'Auditor',
        status: 'Completed',
        remarks: evt.details
      }));
    } catch (e) {
      console.error(`Failed to load workflow events for work ${workId}:`, e);
      return [];
    }
  }

  public async getAllEvents(): Promise<AuditEvent[]> {
    try {
      const beEvents = await ApiClient.get<any[]>('/audit');
      if (!Array.isArray(beEvents)) return [];

      return beEvents.map((evt, idx) => ({
        id: `aud-${idx}-${new Date(evt.timestamp).getTime()}`,
        workId: evt.work_id,
        timestamp: evt.timestamp,
        event: evt.event_type || 'Unknown Action',
        actor: evt.user || 'System',
        role: 'Auditor',
        status: 'Completed',
        remarks: evt.details
      }));
    } catch (e) {
      console.error('Failed to load all audit events:', e);
      throw e;
    }
  }

  public async addEvent(event: Omit<AuditEvent, 'id'>): Promise<AuditEvent | undefined> {
    try {
      await ApiClient.post(`/works/${encodeURIComponent(event.workId)}/audit`, {
        event: event.event,
        remarks: event.remarks,
        actor: event.actor
      });
      return {
        ...event,
        id: `aud-manual-${Date.now()}`
      };
    } catch (e) {
      console.error("Failed to add workflow event:", e);
      throw new Error("Failed to add audit event.");
    }
  }
}

export const workflowService = new WorkflowService();
