import { ApiClient } from './api';
import { Work, RiskLevel } from '../types/work';

export interface WorkFilters {
  search?: string;
  financialYear?: string;
  state?: string;
  district?: string;
  sector?: string;
  riskLevel?: RiskLevel | 'ALL';
  status?: string;
}

export class WorksService {
  private worksCache: Work[] | null = null;
  private cacheTimestamp: number = 0;
  private CACHE_DURATION = 30000; // 30 seconds
  private worksPromise: Promise<Work[]> | null = null; // Prevent concurrent requests
  private verificationCache: Record<string, any> = {};

  public async getVerification(workId: string): Promise<any> {
    try {
      const resp = await ApiClient.get<any>(`/works/${encodeURIComponent(workId)}/verification`);
      const data = {
          status: resp.status || 'Not Started',
          notes: resp.notes || '',
          outcome: resp.outcome || null,
          ...resp,
          checklist: {
              financial: false,
              payment: false,
              physical: false,
              inspection: false,
              contractor: false,
              documentation: false,
              ...(resp.checklist || {})
          }
      };
      this.verificationCache[workId] = data;
      return data;
    } catch (e) {
      console.error(`Failed to fetch verification for ${workId}:`, e);
      throw e;
    }
  }

  public async updateVerification(workId: string, payload: any): Promise<any> {
    try {
      const data = await ApiClient.post(`/works/${encodeURIComponent(workId)}/verification`, payload);
      this.verificationCache[workId] = data;

      // Attempt to update the work object in cache if we have it
      if (this.worksCache) {
        const idx = this.worksCache.findIndex(w => w.workId === workId);
        if (idx !== -1) {
          this.worksCache[idx] = {
            ...this.worksCache[idx],
            verification: data as any
          };
        }
      }
      return data;
    } catch (e) {
      console.error(`Failed to update verification for ${workId}:`, e);
      throw e;
    }
  }

  public async getAllWorks(): Promise<Work[]> {
    try {
      const now = Date.now();
      if (this.worksCache && (now - this.cacheTimestamp < this.CACHE_DURATION)) {
        return this.worksCache;
      }

      if (this.worksPromise) {
        return this.worksPromise;
      }

      this.worksPromise = (async () => {
        try {
          const works = await ApiClient.get<any[]>('/works');

          // The backend returns the raw dataframe records.
          // We map the backend JSON shape to our frontend Work interface.
          const mappedWorks: Work[] = works.map(w => {
            const sanctionedAmount = parseFloat(w.sanctioned_amount || 0);
            return {
            workId: w.work_id,
            workName: w.work_description || w.work_id,
            description: w.work_description || "",
            state: w.state || "",
            district: w.district || "",
            block: w.block || "",
            village: w.village,
            constituency: w.constituency,
            mpName: w.mp_name,
            sector: w.sector || "Unknown",
            workType: w.work_type,
            implementingAgency: w.implementing_agency || "Unknown",
            sanctionDate: w.sanction_date || "Unknown",
            expectedCompletion: w.expected_completion_date || "Unknown",
            projectedCompletion: w.projected_completion_date || "Unknown",
            status: (w.status || 'UNDER PROGRESS') as any,
            sanctionedAmount: sanctionedAmount,
            releasedAmount: parseFloat(w.released_amount || sanctionedAmount),
            expenditure: parseFloat(w.actual_expenditure || sanctionedAmount),
            physicalProgress: parseInt(w.physical_progress_percent || 0, 10),
            financialProgress: parseInt(w.financial_progress_percent || 0, 10),
            delayDays: parseInt(w.delay_days || 0, 10),
            riskScore: parseFloat(w.final_risk_score || w.ml_risk_score || 0),
            riskLevel: (w.risk_level || 'LOW').toUpperCase() as RiskLevel,
            riskSignals: w.signals || [],
            latitude: parseFloat(w.latitude || 23),
            longitude: parseFloat(w.longitude || 78),
            financialYear: w.financial_year || w.financial_year_start || (w.sanction_date ? String(w.sanction_date).substring(0, 4) : 'Unknown'),
            actionStatus: w.actionStatus || 'NO_ACTION',
            inspectionReport: w.inspectionReport || undefined,
            correctiveAction: w.correctiveAction || undefined
          }});

          this.worksCache = mappedWorks;
          this.cacheTimestamp = Date.now();
          return mappedWorks;
        } finally {
          this.worksPromise = null;
        }
      })();

      return await this.worksPromise;
    } catch (e) {
      console.error("Failed to load works:", e);
      throw e;
    }
  }

  public async getWorkById(workId: string): Promise<Work | undefined> {
    try {
      const works = await this.getAllWorks();
      return works.find(w => w.workId === workId);
    } catch (e) {
      console.error(`Failed to load work ${workId}:`, e);
      return undefined;
    }
  }

  public async filterWorks(filters: WorkFilters): Promise<Work[]> {
    try {
      let works = await this.getAllWorks();

      if (filters.search && filters.search.trim()) {
        const search = filters.search.toLowerCase();
        works = works.filter(w => 
          w.workId.toLowerCase().includes(search) || 
          w.workName.toLowerCase().includes(search) ||
          (w.district ||'').toLowerCase().includes(search)
        );
      }
      if (filters.financialYear && filters.financialYear !== 'ALL') {
        works = works.filter(w => w.financialYear === filters.financialYear);
      }
      if (filters.state && filters.state !== 'ALL') {
        works = works.filter(w => w.state === filters.state);
      }
      if (filters.district && filters.district !== 'ALL') {
        works = works.filter(w => w.district === filters.district);
      }
      if (filters.sector && filters.sector !== 'ALL') {
        works = works.filter(w => w.sector === filters.sector);
      }
      if (filters.riskLevel && filters.riskLevel !== 'ALL') {
        works = works.filter(w => w.riskLevel === filters.riskLevel);
      }
      if (filters.status && filters.status !== 'ALL') {
        works = works.filter(w => w.status === filters.status);
      }
      
      return works;
    } catch (e) {
      console.error("Failed to filter works:", e);
      return [];
    }
  }

  public async getAvailableStates(): Promise<string[]> {
    try {
      const works = await this.getAllWorks();
      const states = new Set(works.map(w => w.state).filter(Boolean));
      return Array.from(states).sort();
    } catch (e) {
      return [];
    }
  }

  public async getDistrictsForState(state?: string): Promise<string[]> {
    try {
      const works = await this.getAllWorks();
      const filtered = (!state || state === 'ALL') ? works : works.filter(w => w.state === state);
      const districts = new Set(filtered.map(w => w.district).filter(Boolean));
      return Array.from(districts).sort();
    } catch (e) {
      return [];
    }
  }

  public async getAvailableSectors(): Promise<string[]> {
    try {
      const works = await this.getAllWorks();
      const sectors = new Set(works.map(w => w.sector).filter(Boolean));
      return Array.from(sectors).sort();
    } catch (e) {
      return [];
    }
  }

  public async getAvailableFinancialYears(): Promise<string[]> {
    try {
      const works = await this.getAllWorks();
      const years = new Set(works.map(w => w.financialYear).filter(Boolean));
      return Array.from(years).sort();
    } catch (e) {
      return [];
    }
  }

  public async updateWork(updatedWork: Work): Promise<Work | undefined> {
    try {
      // Send the workflow fields to the verification endpoint to persist them
      await ApiClient.post(`/works/${updatedWork.workId}/verification`, {
        actionStatus: updatedWork.actionStatus,
        inspectionReport: updatedWork.inspectionReport,
        correctiveAction: updatedWork.correctiveAction
      });

      if (this.worksCache) {
        const idx = this.worksCache.findIndex(w => w.workId === updatedWork.workId);
        if (idx !== -1) {
           this.worksCache[idx] = updatedWork;
        }
      }
      return updatedWork;
    } catch (e) {
      console.error("Failed to update work on backend:", e);
      throw new Error("Failed to update work data.");
    }
  }

  public async analyzeNewWork(payload: any): Promise<any> {
    try {
      const data = await ApiClient.post('/works/analyze', payload);
      // Data was persisted, invalidate our cache so next fetch gets updated data
      this.worksCache = null; 
      this.cacheTimestamp = 0;
      return data;
    } catch (e) {
      console.error("Failed to analyze new work:", e);
      throw e;
    }
  }

}

export const worksService = new WorksService();
