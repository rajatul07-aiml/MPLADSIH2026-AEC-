import { Work } from '../types/work';

export interface QuarterlyTrend {
  quarter: string; // e.g. "2024 Q1"
  label: string; // e.g. "Q1 FY24-25"
  totalInspections: number;
  highCriticalRisk: number;
  anomaliesDetected: number;
  complianceIssues: number;
  escalatedCases: number;
  resolvedCases: number;
}

export function getQuarterFromDate(dateString: string): { quarter: string, label: string } {
  if (!dateString) return { quarter: 'Unknown', label: 'Unknown' };
  const date = new Date(dateString);
  const month = date.getMonth(); 
  const year = date.getFullYear();

  // Q1 = April-June, Q2 = July-September, Q3 = October-December, Q4 = January-March
  if (month >= 3 && month <= 5) return { quarter: `${year} Q1`, label: `Q1 FY${year.toString().slice(2)}-${(year + 1).toString().slice(2)}` };
  if (month >= 6 && month <= 8) return { quarter: `${year} Q2`, label: `Q2 FY${year.toString().slice(2)}-${(year + 1).toString().slice(2)}` };
  if (month >= 9 && month <= 11) return { quarter: `${year} Q3`, label: `Q3 FY${year.toString().slice(2)}-${(year + 1).toString().slice(2)}` };
  if (month >= 0 && month <= 2) return { quarter: `${year - 1} Q4`, label: `Q4 FY${(year - 1).toString().slice(2)}-${year.toString().slice(2)}` };
  
  return { quarter: 'Unknown', label: 'Unknown' };
}

export function aggregateInspectionTrends(works: Work[]): QuarterlyTrend[] {
  const trendsMap = new Map<string, QuarterlyTrend>();

  works.forEach(work => {
    if (work.inspectionReport && work.inspectionReport.inspectionDate) {
      const qInfo = getQuarterFromDate(work.inspectionReport.inspectionDate);
      if (!trendsMap.has(qInfo.quarter)) {
        trendsMap.set(qInfo.quarter, {
          quarter: qInfo.quarter,
          label: qInfo.label,
          totalInspections: 0,
          highCriticalRisk: 0,
          anomaliesDetected: 0,
          complianceIssues: 0,
          escalatedCases: 0,
          resolvedCases: 0
        });
      }

      const trend = trendsMap.get(qInfo.quarter)!;
      trend.totalInspections += 1;

      if (work.riskLevel === 'HIGH' || work.riskLevel === 'CRITICAL') {
        trend.highCriticalRisk += 1;
      }

      if (work.inspectionReport.deviationObserved && work.inspectionReport.deviationObserved !== 'None') {
        trend.anomaliesDetected += 1;
      }

      if ((work.complianceScore || 100) < 85) {
        trend.complianceIssues += 1;
      }

      if (work.correctiveAction?.actionType === 'ESCALATED') {
        trend.escalatedCases += 1;
      }

      if (work.correctiveAction?.actionType === 'RESOLVED') {
        trend.resolvedCases += 1;
      }
    }
  });

  return Array.from(trendsMap.values()).sort((a, b) => a.quarter.localeCompare(b.quarter));
}
