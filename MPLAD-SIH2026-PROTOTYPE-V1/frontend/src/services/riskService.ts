import { ApiClient } from './api';
import { Work, RiskAnalysisResult } from '../types/work';

export class RiskService {
  public async analyzeWork(work: Partial<Work>): Promise<RiskAnalysisResult | undefined> {
    try {
      return await ApiClient.post<RiskAnalysisResult>('/works/analyze', work);
    } catch (e) {
      console.error('Failed to analyze work risk:', e);
      return undefined;
    }
  }
}

export const riskService = new RiskService();
