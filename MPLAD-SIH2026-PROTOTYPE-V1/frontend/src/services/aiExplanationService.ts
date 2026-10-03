import { ApiClient } from './api';
import { Work } from '../types/work';

export interface AIExplanation {
  whyIsRisky: string;
  keyIndicators: string[];
  verificationFocus: string[];
  recommendedAction: string;
  isFallback: boolean;
}

export class AIExplanationService {
  async getRiskExplanation(work: Work): Promise<AIExplanation> {
    try {
      const response = await ApiClient.get<any>(`/works/${encodeURIComponent(work.workId)}/explanation`);
      
      const isHighRisk = response.risk_level === 'High' || response.risk_level === 'Critical';
      
      // Parse indicators generically
      const inds = response.indicators || {};
      const keyIndicators = Object.keys(inds)
        .filter(k => inds[k] !== null && inds[k] !== 0)
        .slice(0, 5)
        .map(k => `${k.replace(/_/g, ' ')}: ${inds[k]}`);

      if (response.rule_details && response.rule_details.length > 0) {
        response.rule_details.forEach(r => keyIndicators.push(`Rule broken: ${r.rule_name || r}`));
      }

      return {
        whyIsRisky: response.observations?.join('\n') || "Anomaly detected by ML models.",
        keyIndicators: keyIndicators.length > 0 ? keyIndicators : ["Model anomaly threshold exceeded"],
        verificationFocus: response.signals || ["Routine site visit"],
        recommendedAction: isHighRisk ? "Escalate for immediate physical verification" : "Routine monitoring",
        isFallback: false
      };
    } catch (e) {
      console.error(`Failed to load AI explanation for work ${work.workId}:`, e);
      return {
        whyIsRisky: "Explanation unavailable from ML backend.",
        keyIndicators: [],
        verificationFocus: [],
        recommendedAction: "Awaiting ML analysis integration.",
        isFallback: true
      };
    }
  }
}

export const aiExplanationService = new AIExplanationService();
