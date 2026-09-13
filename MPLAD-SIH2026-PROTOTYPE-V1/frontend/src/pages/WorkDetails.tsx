import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Header } from '../components/layout/Header';
import { Badge } from '../components/ui/Badge';
import { formatLakhs, formatDate, formatPercent } from '../utils/formatting';
import { workflowService } from '../services/workflowService';
import { worksService } from '../services/worksService';
import { ActionStatus, InspectionReport } from '../types/workflow';
import { VerificationData } from '../types/work';
import {
  ArrowLeft,
  HelpCircle,
  BellPlus,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  CheckSquare,
  ShieldCheck,
  History,
  ClipboardCheck,
  UserCheck,
  Coins,
  TrendingUp,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  User,
  Receipt,
  Layers,
  Save,
  Loader2
} from 'lucide-react';

const OFFICERS_LIST = [
  'Inspector A. Sharma',
  'Inspector B. Singh',
  'Inspector C. Verma',
  'Inspector D. Patel',
];

export const WorkDetails: React.FC = () => {
  const { workId } = useParams<{ workId: string }>();
  const navigate = useNavigate();
  const { works, allWorks, updateWork, openCreateAlertModal, showToast } = useApp();

  const work = useMemo(() => {
    const list = allWorks && allWorks.length > 0 ? allWorks : works;
    return list.find((w) => w.workId.toLowerCase() === (workId || '').toLowerCase().trim());
  }, [works, allWorks, workId]);

  // Workflow State Management
  const [selectedOfficerInput, setSelectedOfficerInput] = useState('Inspector A. Sharma');
  const [correctiveRemarks, setCorrectiveRemarks] = useState('');
  const [isFillingReport, setIsFillingReport] = useState(false);
  const [reportError, setReportError] = useState('');

  const [reportForm, setReportForm] = useState({
    inspectionOfficer: 'Inspector A. Sharma',
    inspectionDate: new Date().toISOString().split('T')[0],
    observedPhysicalProgress: '45',
    reviewedFinancialProgress: '85.6',
    siteCondition: 'UNSATISFACTORY',
    workStatus: 'UNDER PROGRESS',
    measurementBookVerified: 'NO' as 'YES' | 'NO',
    paymentRecordsReviewed: 'YES' as 'YES' | 'NO',
    geotaggedPhotographVerified: 'NO' as 'YES' | 'NO',
    qualityObservation: 'Sub-grade compaction incomplete along 1.2km stretch. Pavement thickness deficit noted.',
    deviationObserved: 'Material specifications deviate from sanctioned technical estimate schedule.',
    beneficiaryObservation: 'Gram Panchayat members reported stalled progress over the last 60 days.',
    inspectionRemarks: 'Severe mismatch between recorded expenditure and physical road progress. Measurement Book not signed for tranche 3.',
    recommendedAction: 'WITHHOLD_PAYMENT',
  });

  const [auditEvents, setAuditEvents] = useState<any[]>([]);
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);
  const [isVerificationSaving, setIsVerificationSaving] = useState(false);

  useEffect(() => {
    async function loadAudit() {
      if (!work) return;
      const events = await workflowService.getEventsForWork(work.workId);
      setAuditEvents(events || []);
    }
    loadAudit();
  }, [work]);

  useEffect(() => {
    async function loadVerification() {
      if (!work) return;
      try {
        const data = await worksService.getVerification(work.workId);
        if (data) {
          setVerificationData(data);
        }
      } catch (err) {
        console.error("Failed to load verification data", err);
      }
    }
    loadVerification();
  }, [work?.workId]);

  const handleVerificationSave = async () => {
    if (!work || !verificationData) return;
    setIsVerificationSaving(true);
    try {
      await worksService.updateVerification(work.workId, verificationData);
      showToast('Verification details saved successfully', 'success');

      // Reload audit events as a verification save creates an audit event backend-side
      const events = await workflowService.getEventsForWork(work.workId);
      setAuditEvents(events || []);
    } catch (e: any) {
      showToast(e.message || 'Failed to save verification details', 'info');
    } finally {
      setIsVerificationSaving(false);
    }
  };

  const handleChecklistToggle = (key: keyof VerificationData['checklist']) => {
    setVerificationData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        checklist: {
          ...prev.checklist,
          [key]: !prev.checklist[key]
        }
      };
    });
  };

  const riskAnalysis = useMemo(() => {
    if (!work) return null;
    // Risk analysis now comes from backend
    return {
      score: work.riskScore,
      riskLevel: work.riskLevel,
      signals: work.riskSignals || [],
      contributions: work.riskSignals || []
    };
  }, [work]);

  const payments = useMemo(() => {
    if (!work) return [];
    // Payment data will come from backend
    return work.payments || [];
  }, [work]);

  const prediction = useMemo(() => {
    if (!work) return null;
    // Predictive completion will come from backend
    return work.prediction || null;
  }, [work]);

  const similarWork = useMemo(() => {
    if (!work) return null;
    // Similar work detection will come from backend
    return work.similarWork || null;
  }, [work]);

  if (!work || !riskAnalysis) {
    return (
      <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc]">
        <Header title="Work Record Not Found" />
        <main className="p-8 text-center space-y-4">
          <p className="text-sm text-slate-600">
            The requested work record with ID &ldquo;{workId}&rdquo; was not found.
          </p>
          <button
            onClick={() => navigate('/risk-monitor')}
            className="px-4 py-2 bg-slate-900 text-white text-xs rounded hover:bg-slate-800 transition"
          >
            Return to Risk Monitor
          </button>
        </main>
      </div>
    );
  }

  const financialPhysicalGap = Math.max(0, work.financialProgress - work.physicalProgress);

  const handleWorkflowAction = (newStatus: ActionStatus, reportData?: InspectionReport) => {
    if (!work) return;

    const updatedWork = { ...work, actionStatus: newStatus };
    let eventName = '';
    let eventRemarks = '';
    let actor = 'District Collector';
    let role = 'DISTRICT AUTHORITY';

    if (newStatus === 'INSPECTION_REQUESTED') {
      eventName = 'Physical Inspection Requested';
      eventRemarks = `Inspection requested based on risk score ${work.riskScore}/100 and ${financialPhysicalGap}% financial-physical progress gap.`;
    } else if (newStatus === 'OFFICER_ASSIGNED') {
      eventName = 'Field Inspection Officer Assigned';
      const officer = selectedOfficerInput || 'Inspector A. Sharma';
      eventRemarks = `Assigned Officer: ${officer} for physical site verification.`;
      updatedWork.inspectionReport = {
        ...updatedWork.inspectionReport,
        inspectionOfficer: officer,
        inspectionDate: '',
        observedPhysicalProgress: work.physicalProgress,
        reviewedFinancialProgress: work.financialProgress,
        siteCondition: 'SATISFACTORY',
        workStatus: 'UNDER PROGRESS',
        measurementBookVerified: 'NO',
        paymentRecordsReviewed: 'NO',
        geotaggedPhotographVerified: 'NO',
        qualityObservation: '',
        deviationObserved: '',
        beneficiaryObservation: '',
        inspectionRemarks: '',
        recommendedAction: 'ROUTINE',
      };
      (updatedWork as any).inspectionOfficer = officer;
      setReportForm((prev) => ({ ...prev, inspectionOfficer: officer }));
      showToast(`Assigned ${officer} to inspect ${work.workId}.`, 'success');
    } else if (newStatus === 'INSPECTION_IN_PROGRESS') {
      eventName = 'Inspection Commenced On-Site';
      const officer = work.inspectionReport?.inspectionOfficer || selectedOfficerInput || 'Inspector A. Sharma';
      eventRemarks = `Officer ${officer} initiated on-site physical measurement audit.`;
      actor = officer;
      role = 'INSPECTION OFFICER';
      showToast('Field inspection initiated.', 'info');
    } else if (newStatus === 'REPORT_SUBMITTED') {
      eventName = 'Field Inspection Report Submitted';
      eventRemarks = reportData?.inspectionRemarks || 'Inspection report submitted with site observations.';
      actor = reportData?.inspectionOfficer || work.inspectionReport?.inspectionOfficer || 'Inspector A. Sharma';
      role = 'INSPECTION OFFICER';
      if (reportData) {
        updatedWork.inspectionReport = reportData;
        updatedWork.physicalProgress = reportData.observedPhysicalProgress;
        updatedWork.financialProgress = reportData.reviewedFinancialProgress;

        // Risk recalculating will occur on the backend now
        showToast('Inspection report submitted. Data synchronized.', 'success');
      }
    } else if (newStatus === 'RESOLVED') {
      eventName = 'Work Case Resolved';
      eventRemarks = correctiveRemarks || 'Corrective measures completed and approved by District Authority.';
      updatedWork.correctiveAction = {
        actionType: 'RESOLVED',
        status: 'RESOLVED',
        remarks: correctiveRemarks || 'Corrective actions verified and approved.',
        actionBy: 'District Collector',
        actionDate: new Date().toISOString(),
      };
      showToast('Case marked as Resolved.', 'success');
    } else if (newStatus === 'ESCALATED') {
      eventName = 'Case Escalated to State Nodal Department';
      eventRemarks = correctiveRemarks || 'Referred for third-party forensic audit and statutory inquiry.';
      updatedWork.correctiveAction = {
        actionType: 'ESCALATED',
        status: 'ESCALATED',
        remarks: correctiveRemarks || 'Escalated to State Nodal Authority & MoSPI.',
        actionBy: 'District Collector',
        actionDate: new Date().toISOString(),
      };
      showToast('Case escalated to State Nodal Department.', 'info');
    }

    workflowService.addEvent({
      workId: work.workId,
      timestamp: new Date().toISOString(),
      event: eventName,
      actor: actor,
      role: role,
      status: newStatus,
      remarks: eventRemarks,
    });

    updateWork(updatedWork);
  };

  const handleReportSubmit = () => {
    const pProg = parseFloat(reportForm.observedPhysicalProgress);
    const fProg = parseFloat(reportForm.reviewedFinancialProgress);

    if (
      !reportForm.inspectionOfficer ||
      !reportForm.inspectionDate ||
      !reportForm.inspectionRemarks ||
      !reportForm.recommendedAction
    ) {
      setReportError('Please fill all required fields (Officer, Date, Remarks, Recommended Action).');
      return;
    }
    if (isNaN(pProg) || pProg < 0 || pProg > 100) {
      setReportError('Physical progress must be a number between 0 and 100.');
      return;
    }
    if (isNaN(fProg) || fProg < 0 || fProg > 100) {
      setReportError('Financial progress must be a number between 0 and 100.');
      return;
    }

    setReportError('');
    const finalReport: InspectionReport = {
      ...reportForm,
      observedPhysicalProgress: pProg,
      reviewedFinancialProgress: fProg,
    };

    setIsFillingReport(false);
    handleWorkflowAction('REPORT_SUBMITTED', finalReport);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc]">
      <Header
        title={work.workId}
        subtitle={`${work.description} (${work.district}, ${work.state})`}
      />

      <main className="flex-1 p-6 max-w-5xl w-full mx-auto space-y-6">
        {/* TOP BAR / BACK NAVIGATION & SECONDARY ACTIONS */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={() => navigate('/risk-monitor')}
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 transition font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Risk Monitor</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => navigate(`/work/${work.workId}/explanation`)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-medium transition shadow-xs"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-300" />
              <span>Why is this work flagged? (AI Explanation)</span>
            </button>

            <button
              onClick={() => openCreateAlertModal(work.workId)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 rounded text-xs font-medium transition shadow-xs"
            >
              <BellPlus className="w-3.5 h-3.5 text-slate-600" />
              <span>Create Review Alert</span>
            </button>
          </div>
        </div>

        {/* 1. WORK HEADER */}
        <section className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {work.workId}
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs font-semibold text-slate-700">{work.sector}</span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-500 font-mono">FY {work.financialYear}</span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                {work.description}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-0.5">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>
                    Block: <strong>{work.block}</strong>, District: <strong>{work.district}</strong>, State: <strong>{work.state}</strong>
                  </span>
                </div>
                {work.constituency && (
                  <span className="text-slate-400">
                    (Constituency: <strong>{work.constituency}</strong>)
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-0.5">
                  Implementation Status
                </div>
                <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded font-semibold text-xs border border-slate-200 inline-block">
                  {work.status}
                </span>
              </div>
              <div className="border-l border-slate-200 pl-3 text-right">
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-0.5">
                  Risk Assessment
                </div>
                <Badge
                  variant={
                    work.riskLevel === 'CRITICAL'
                      ? 'critical'
                      : work.riskLevel === 'HIGH'
                      ? 'high'
                      : work.riskLevel === 'MEDIUM'
                      ? 'medium'
                      : 'low'
                  }
                  size="md"
                >
                  {work.riskScore} • {work.riskLevel}
                </Badge>
              </div>
            </div>
          </div>
        </section>

        {/* 2. FINANCIAL & PROGRESS SUMMARY */}
        <section className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider text-xs flex items-center gap-2">
              <Coins className="w-4 h-4 text-slate-600" />
              <span>Financial & Progress Summary</span>
            </h2>
            {financialPhysicalGap > 15 && (
              <span className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                ⚠️ +{financialPhysicalGap}% Disbursal Ahead of Site Physical Progress
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-100 rounded">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sanctioned Cost</div>
              <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
                {formatLakhs(work.sanctionedAmount)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Sanctioned: {formatDate(work.sanctionDate)}</div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Expenditure</div>
              <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
                {formatLakhs(work.expenditure)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Disbursed to agency</div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Financial Progress</div>
              <div className="text-lg font-bold font-mono text-blue-700 mt-0.5">
                {work.financialProgress}%
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Of sanctioned allocation</div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Physical Progress</div>
              <div className="text-lg font-bold font-mono text-emerald-700 mt-0.5">
                {work.physicalProgress}%
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Verified site completion</div>
            </div>
          </div>

          {/* Comparative Progress Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
              <span>Financial Expenditure ({work.financialProgress}%) vs Physical Progress ({work.physicalProgress}%)</span>
              <span className="font-mono text-rose-600 font-semibold">Gap: {financialPhysicalGap}%</span>
            </div>
            <div className="h-4 bg-slate-100 rounded-full overflow-hidden flex relative border border-slate-200">
              <div
                style={{ width: `${work.physicalProgress}%` }}
                className="bg-emerald-500 h-full transition-all"
                title={`Physical: ${work.physicalProgress}%`}
              />
              {financialPhysicalGap > 0 && (
                <div
                  style={{ width: `${financialPhysicalGap}%` }}
                  className="bg-rose-500 h-full transition-all"
                  title={`Gap: ${financialPhysicalGap}%`}
                />
              )}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Verified Physical
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Unverified Fund Release
                </span>
              </div>
              <span>Target Completion: {formatDate(work.targetCompletionDate)}</span>
            </div>
          </div>
        </section>

        {/* 3. RISK SUMMARY */}
        <section className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-slate-600" />
              <span>Risk Summary & Contributors</span>
            </h2>
            <span className="text-xs font-mono text-slate-500">
              Algorithm Score: <strong>{work.riskScore} / 100</strong>
            </span>
          </div>

          <div className="space-y-3">
            {riskAnalysis.contributions.map((contrib, idx) => (
              <div key={idx} className="p-3 rounded border border-slate-100 bg-slate-50/50 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-medium text-slate-900">
                    <span>{contrib.factor}</span>
                    <Badge
                      variant={
                        contrib.level === 'CRITICAL'
                          ? 'critical'
                          : contrib.level === 'HIGH'
                          ? 'high'
                          : contrib.level === 'MEDIUM'
                          ? 'medium'
                          : 'low'
                      }
                      size="sm"
                    >
                      {contrib.level}
                    </Badge>
                  </div>
                  <span className="font-mono font-semibold text-slate-800">
                    +{contrib.points} pts
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">{contrib.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 4. WHY THIS WORK IS FLAGGED */}
        <section className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-3.5">
          <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Why This Work Is Flagged</span>
            </h2>
            <button
              onClick={() => navigate(`/work/${work.workId}/explanation`)}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
            >
              <span>View Full AI Explanation</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5 text-xs text-slate-700">
            <div className="p-3 bg-amber-50/40 border border-amber-200/60 rounded-md space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-amber-700 font-bold">•</span>
                <div>
                  <strong className="text-slate-900">Financial–Physical Mismatch:</strong> Expenditure has reached{' '}
                  <strong className="text-rose-700">{work.financialProgress}% ({formatLakhs(work.expenditure)})</strong>, but verified physical execution is only{' '}
                  <strong className="text-slate-800">{work.physicalProgress}%</strong> — creating an anomalous {financialPhysicalGap}% divergence.
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="text-amber-700 font-bold">•</span>
                <div>
                  <strong className="text-slate-900">Project Timeline Delay:</strong> Execution is delayed by{' '}
                  <strong className="text-rose-700">{work.delayDays || 94} days</strong> past the sanctioned completion milestone without formal time-extension approval.
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="text-amber-700 font-bold">•</span>
                <div>
                  <strong className="text-slate-900">Cost Deviation:</strong> Sanctioned expenditure is{' '}
                  <strong>{work.peerCostDeviation || 18.4}% higher</strong> than peer sector works in {work.district} district.
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="text-amber-700 font-bold">•</span>
                <div>
                  <strong className="text-slate-900">Payment Cadence Anomaly:</strong> Tranche release pattern requires field verification; Measurement Book entry not verified for the last payment cycle.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. VERIFICATIONS & AUDITS */}
        <section className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider text-xs flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-slate-600" />
              <span>Desk Audits & Document Verifications</span>
            </h2>
            {verificationData && (
              <Badge
                color={
                  verificationData.status === 'Verified' ? 'emerald' :
                  verificationData.status === 'In Progress' ? 'amber' : 'slate'
                }
              >
                {verificationData.status}
              </Badge>
            )}
          </div>

          {!verificationData ? (
            <div className="flex justify-center items-center py-6 text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              <span className="text-sm">Loading verification data...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div
                  className={`p-3 rounded border flex items-center gap-3 cursor-pointer transition-colors ${verificationData.checklist.financial ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}
                  onClick={() => handleChecklistToggle('financial')}
                >
                  <div className={`w-5 h-5 rounded border flex items-center justify-center ${verificationData.checklist.financial ? 'bg-emerald-500 border-emerald-600 text-white' : 'bg-white border-slate-300'}`}>
                    {verificationData.checklist.financial && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">Financial Records</div>
                    <div className="text-xs text-slate-500">Expenditure matches reported progress</div>
                  </div>
                </div>

                <div
                  className={`p-3 rounded border flex items-center gap-3 cursor-pointer transition-colors ${verificationData.checklist.payment ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}
                  onClick={() => handleChecklistToggle('payment')}
                >
                  <div className={`w-5 h-5 rounded border flex items-center justify-center ${verificationData.checklist.payment ? 'bg-emerald-500 border-emerald-600 text-white' : 'bg-white border-slate-300'}`}>
                    {verificationData.checklist.payment && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">Payment Vouchers</div>
                    <div className="text-xs text-slate-500">Valid tranche release documentation</div>
                  </div>
                </div>

                <div
                  className={`p-3 rounded border flex items-center gap-3 cursor-pointer transition-colors ${verificationData.checklist.physical ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}
                  onClick={() => handleChecklistToggle('physical')}
                >
                  <div className={`w-5 h-5 rounded border flex items-center justify-center ${verificationData.checklist.physical ? 'bg-emerald-500 border-emerald-600 text-white' : 'bg-white border-slate-300'}`}>
                    {verificationData.checklist.physical && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">Physical Evidence</div>
                    <div className="text-xs text-slate-500">Geotagged photos match reported stage</div>
                  </div>
                </div>

                <div
                  className={`p-3 rounded border flex items-center gap-3 cursor-pointer transition-colors ${verificationData.checklist.inspection ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}
                  onClick={() => handleChecklistToggle('inspection')}
                >
                  <div className={`w-5 h-5 rounded border flex items-center justify-center ${verificationData.checklist.inspection ? 'bg-emerald-500 border-emerald-600 text-white' : 'bg-white border-slate-300'}`}>
                    {verificationData.checklist.inspection && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">Inspection Reports</div>
                    <div className="text-xs text-slate-500">On-site measurement book verified</div>
                  </div>
                </div>

                <div
                  className={`p-3 rounded border flex items-center gap-3 cursor-pointer transition-colors ${verificationData.checklist.contractor ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}
                  onClick={() => handleChecklistToggle('contractor')}
                >
                  <div className={`w-5 h-5 rounded border flex items-center justify-center ${verificationData.checklist.contractor ? 'bg-emerald-500 border-emerald-600 text-white' : 'bg-white border-slate-300'}`}>
                    {verificationData.checklist.contractor && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">Contractor Credentials</div>
                    <div className="text-xs text-slate-500">Agency track record verified</div>
                  </div>
                </div>

                <div
                  className={`p-3 rounded border flex items-center gap-3 cursor-pointer transition-colors ${verificationData.checklist.documentation ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}
                  onClick={() => handleChecklistToggle('documentation')}
                >
                  <div className={`w-5 h-5 rounded border flex items-center justify-center ${verificationData.checklist.documentation ? 'bg-emerald-500 border-emerald-600 text-white' : 'bg-white border-slate-300'}`}>
                    {verificationData.checklist.documentation && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">Statutory Clearances</div>
                    <div className="text-xs text-slate-500">Admin and technical sanctions present</div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700">Verification Notes</label>
                <textarea
                  value={verificationData.notes}
                  onChange={(e) => setVerificationData({...verificationData, notes: e.target.value})}
                  className="w-full text-sm border-slate-200 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 min-h-[80px]"
                  placeholder="Enter detailed audit findings or observations..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700">Audit Outcome</label>
                  <select
                    value={verificationData.outcome || ''}
                    onChange={(e) => setVerificationData({...verificationData, outcome: e.target.value || null})}
                    className="w-full text-sm border-slate-200 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">-- Select Outcome --</option>
                    <option value="CLEAR">Clear - No Irregularities</option>
                    <option value="MINOR_FINDINGS">Minor Findings (Actionable)</option>
                    <option value="MAJOR_IRREGULARITY">Major Irregularity Detected</option>
                    <option value="FRAUD_SUSPECTED">Suspected Misappropriation</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700">Verification Status</label>
                  <select
                    value={verificationData.status}
                    onChange={(e) => setVerificationData({...verificationData, status: e.target.value})}
                    className="w-full text-sm border-slate-200 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Verified">Verified</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleVerificationSave}
                  disabled={isVerificationSaving}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded hover:bg-indigo-700 transition flex items-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {isVerificationSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Verification
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* 6. PAYMENT TRANCHE HISTORY */}
        <section className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-3.5">
          <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider text-xs flex items-center gap-2">
              <Receipt className="w-4 h-4 text-slate-600" />
              <span>Payment Tranche & Voucher History</span>
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              Total Disbursed: <strong>{formatLakhs(work.expenditure)}</strong> ({work.financialProgress}% of Sanction)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-3">Tranche</th>
                  <th className="py-2.5 px-3">Release Date</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-right">Cumulative</th>
                  <th className="py-2.5 px-3 text-center">Progress Recorded</th>
                  <th className="py-2.5 px-3 text-center">MB Verified</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.length > 0 ? (
                  payments.map((p, idx) => (
                    <tr key={p.paymentId || idx} className="hover:bg-slate-50/60 transition">
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        Tranche {p.paymentNumber || idx + 1}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                        {formatDate(p.paymentDate)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-900">
                        {formatLakhs(p.paymentAmount)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                        {formatLakhs(p.cumulativeExpenditure)}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-600">
                        Fin: {p.financialProgressAtPayment}% | Phys: {p.physicalProgressAtPayment}%
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {p.paymentNumber === 3 && financialPhysicalGap > 15 ? (
                          <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded text-[10px] font-semibold">
                            Pending MB
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-semibold">
                            Recorded
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] font-semibold">
                          DISBURSED
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-4 text-center text-slate-400 text-xs">
                      No payment tranches disbursed yet. Work is at mobilization / preliminary stage.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* 7. PREDICTIVE COMPLETION & VELOCITY FORECAST */}
        <section className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-3.5">
          <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider text-xs flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-slate-600" />
              <span>Predictive Completion & Velocity Forecast</span>
            </h2>
            {prediction && (
              <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${
                prediction.completionRiskStatus === 'On Schedule'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : prediction.completionRiskStatus === 'Moderate Delay Probability'
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}>
                {prediction.completionRiskStatus}
              </span>
            )}
          </div>

          {prediction && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Estimated Completion</div>
                <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
                  {prediction.predictedDate}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Sanctioned: {formatDate(work.targetCompletionDate)}</div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Projected Milestone Delay</div>
                <div className="text-base font-bold font-mono text-rose-700 mt-0.5">
                  +{prediction.predictedDelayDays} days
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Beyond sanctioned schedule</div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Physical Execution Velocity</div>
                <div className="text-base font-bold font-mono text-blue-700 mt-0.5">
                  {prediction.velocityText}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Monthly progress run-rate</div>
              </div>
            </div>
          )}

          {prediction && (
            <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded border border-slate-100 leading-relaxed">
              <strong>Methodology:</strong> {prediction.methodology}
            </div>
          )}
        </section>

        {/* 8. SIMILAR WORKS / PROXIMITY DUPLICATE CHECK */}
        <section className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-3.5">
          <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider text-xs flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-600" />
              <span>Similar Works & Geographic Duplicate Detection</span>
            </h2>
            <span className="text-xs text-slate-500">Spatial radius: 5.0 km</span>
          </div>

          {similarWork ? (
            <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-lg space-y-3 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                    {similarWork.workId}
                  </span>
                  <span className="font-semibold text-slate-900">{similarWork.description}</span>
                </div>
                <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-semibold text-[11px] whitespace-nowrap">
                  {similarWork.similarityPercentage}% Similarity Match
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500">Proximity Distance:</span>{' '}
                  <strong className="text-slate-900">{similarWork.distanceKm} km</strong>
                </div>
                <div>
                  <span className="text-slate-500">Sanctioned Cost:</span>{' '}
                  <strong className="text-slate-900">{formatLakhs(similarWork.amount)}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Status:</span>{' '}
                  <strong className="text-slate-900">{similarWork.status}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Sector:</span>{' '}
                  <strong className="text-slate-900">{similarWork.sector}</strong>
                </div>
              </div>

              {similarWork.reasons && similarWork.reasons.length > 0 && (
                <div className="pt-2 border-t border-amber-200/70 text-[11px] text-slate-700">
                  <span className="font-semibold text-slate-800">Overlap Indicators:</span>{' '}
                  {similarWork.reasons.join(' • ')}
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  onClick={() => navigate(`/work/${similarWork.workId}`)}
                  className="px-3 py-1 bg-white hover:bg-slate-50 border border-amber-300 text-amber-900 rounded font-medium text-xs transition inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <span>Inspect Peer Work Record ({similarWork.workId})</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-emerald-50/40 border border-emerald-200 rounded text-xs text-emerald-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>No duplicate asset or overlapping project detected within 5 km proximity radius.</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded uppercase">
                Proximity Scan Cleared
              </span>
            </div>
          )}
        </section>

        {/* 9. INSPECTION / ACTION (THE ONE PRIMARY PLACE TO RAISE INSPECTION) */}
        <section id="inspection-section" className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider text-xs flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-indigo-600" />
                <span>Inspection & Corrective Action Workflow</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Official audit pipeline: Request Inspection → Assign Officer → Inspection → Report → Authority Review → Resolve.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500 font-medium">Status:</span>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
                {(work.actionStatus || 'NO_ACTION').replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          {/* Linear Status Pipeline */}
          <div className="overflow-x-auto py-1">
            <div className="flex items-center min-w-[620px] text-[11px]">
              {[
                { key: 'NO_ACTION', label: '1. No Action' },
                { key: 'INSPECTION_REQUESTED', label: '2. Requested' },
                { key: 'OFFICER_ASSIGNED', label: '3. Assigned' },
                { key: 'INSPECTION_IN_PROGRESS', label: '4. In Progress' },
                { key: 'REPORT_SUBMITTED', label: '5. Report Submitted' },
                { key: 'RESOLVED', label: '6. Resolved' },
              ].map((step, idx, arr) => {
                const currentStatus = work.actionStatus || 'NO_ACTION';
                const statusOrder = [
                  'NO_ACTION',
                  'INSPECTION_REQUESTED',
                  'OFFICER_ASSIGNED',
                  'INSPECTION_IN_PROGRESS',
                  'REPORT_SUBMITTED',
                  'RESOLVED',
                ];
                const currentIdx = statusOrder.indexOf(currentStatus);
                const isPast = idx < currentIdx;
                const isCurrent = idx === currentIdx;

                return (
                  <React.Fragment key={step.key}>
                    <div
                      className={`px-3 py-1.5 rounded-full border font-semibold whitespace-nowrap ${
                        isCurrent
                          ? 'bg-indigo-600 border-indigo-700 text-white shadow-xs'
                          : isPast
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}
                    >
                      {step.label}
                    </div>
                    {idx < arr.length - 1 && (
                      <div className={`w-6 h-0.5 mx-1.5 ${isPast ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* ACTION INTERACTION PANEL */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-4">
            {/* STEP 1: NO ACTION -> THE ONE OBVIOUS PRIMARY "Request Inspection" BUTTON */}
            {(work.actionStatus === 'NO_ACTION' || !work.actionStatus) && (
              <div className="space-y-3">
                <p className="text-xs text-slate-700 leading-relaxed">
                  No field inspection has been initiated for this high-risk work record yet. Based on the{' '}
                  <strong>{work.riskLevel}</strong> risk rating ({work.riskScore}/100) and the{' '}
                  <strong>{financialPhysicalGap}% financial-physical gap</strong>, an on-site physical verification is recommended.
                </p>
                <button
                  id="primary-request-inspection-btn"
                  onClick={() => handleWorkflowAction('INSPECTION_REQUESTED')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold shadow-xs transition inline-flex items-center gap-2 cursor-pointer"
                >
                  <ClipboardCheck className="w-4 h-4" />
                  <span>Request Inspection</span>
                </button>
              </div>
            )}

            {/* STEP 2: INSPECTION REQUESTED -> ASSIGN OFFICER */}
            {work.actionStatus === 'INSPECTION_REQUESTED' && (
              <div className="space-y-3 max-w-lg">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                  <span>Inspection requested. Assign a designated Field Inspection Officer:</span>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={selectedOfficerInput}
                    onChange={(e) => setSelectedOfficerInput(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  >
                    {OFFICERS_LIST.map((off) => (
                      <option key={off} value={off}>
                        {off}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleWorkflowAction('OFFICER_ASSIGNED')}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold shadow-xs transition whitespace-nowrap"
                  >
                    Assign Officer
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: OFFICER ASSIGNED */}
            {work.actionStatus === 'OFFICER_ASSIGNED' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-slate-700">
                  <User className="w-4 h-4 text-blue-600" />
                  <span>
                    Field officer <strong>{work.inspectionReport?.inspectionOfficer || selectedOfficerInput}</strong> has been assigned for on-site physical verification.
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleWorkflowAction('INSPECTION_IN_PROGRESS')}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold shadow-xs transition inline-flex items-center gap-1.5"
                  >
                    <ClipboardCheck className="w-4 h-4" />
                    <span>Start Field Inspection</span>
                  </button>
                  <span className="text-xs text-slate-400">or switch role to Inspection Officer to conduct</span>
                </div>
              </div>
            )}

            {/* STEP 4: INSPECTION IN PROGRESS */}
            {work.actionStatus === 'INSPECTION_IN_PROGRESS' && (
              <div className="space-y-4">
                {!isFillingReport ? (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-700">
                      Officer <strong>{work.inspectionReport?.inspectionOfficer || 'Inspector A. Sharma'}</strong> is currently conducting the physical site audit.
                    </p>
                    <button
                      onClick={() => setIsFillingReport(true)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold shadow-xs transition inline-flex items-center gap-1.5"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Fill & Submit Inspection Report</span>
                    </button>
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 p-4 rounded-lg space-y-4">
                    <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Statutory Inspection Report Form
                      </h3>
                      <button
                        onClick={() => setIsFillingReport(false)}
                        className="text-xs text-slate-500 hover:text-slate-800"
                      >
                        Cancel
                      </button>
                    </div>

                    {reportError && (
                      <div className="p-2.5 bg-rose-50 text-rose-800 border border-rose-200 rounded text-xs">
                        {reportError}
                      </div>
                    )}

                    <div className="space-y-4 text-xs">
                      {/* Section 1: SITE VERIFICATION */}
                      <div className="bg-slate-50/70 p-3 rounded border border-slate-200 space-y-2">
                        <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                          <span>1. Site Verification</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-slate-600 mb-1 font-medium">Observed Physical Progress (%) *</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                              value={reportForm.observedPhysicalProgress}
                              onChange={(e) => setReportForm((p) => ({ ...p, observedPhysicalProgress: e.target.value }))}
                            />
                          </div>
                          <div>
                            <label className="block text-slate-600 mb-1 font-medium">Site Condition *</label>
                            <select
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                              value={reportForm.siteCondition}
                              onChange={(e) => setReportForm((p) => ({ ...p, siteCondition: e.target.value }))}
                            >
                              <option value="SATISFACTORY">Satisfactory</option>
                              <option value="UNSATISFACTORY">Unsatisfactory / Quality Issues</option>
                              <option value="CRITICAL">Critical / Stalled Work</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-slate-600 mb-1 font-medium">Work Execution Status *</label>
                            <select
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                              value={reportForm.workStatus}
                              onChange={(e) => setReportForm((p) => ({ ...p, workStatus: e.target.value }))}
                            >
                              <option value="UNDER PROGRESS">Under Active Progress</option>
                              <option value="STALLED">Work Stalled / Abandoned</option>
                              <option value="COMPLETED">Physically Completed</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Section 2: FINANCIAL & RECORD VERIFICATION */}
                      <div className="bg-slate-50/70 p-3 rounded border border-slate-200 space-y-2">
                        <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                          <Coins className="w-3.5 h-3.5 text-emerald-600" />
                          <span>2. Financial & Record Verification</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-slate-600 mb-1 font-medium">Reviewed Financial Progress (%) *</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                              value={reportForm.reviewedFinancialProgress}
                              onChange={(e) => setReportForm((p) => ({ ...p, reviewedFinancialProgress: e.target.value }))}
                            />
                          </div>
                          <div>
                            <label className="block text-slate-600 mb-1 font-medium">Measurement Book (MB) Recorded?</label>
                            <select
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-medium"
                              value={reportForm.measurementBookVerified}
                              onChange={(e) => setReportForm((p) => ({ ...p, measurementBookVerified: e.target.value as 'YES' | 'NO' }))}
                            >
                              <option value="YES">YES — Signed & Reconciled</option>
                              <option value="NO">NO — Missing / Unrecorded</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-slate-600 mb-1 font-medium">Payment Vouchers Audited?</label>
                            <select
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-medium"
                              value={reportForm.paymentRecordsReviewed}
                              onChange={(e) => setReportForm((p) => ({ ...p, paymentRecordsReviewed: e.target.value as 'YES' | 'NO' }))}
                            >
                              <option value="YES">YES — Vouchers Matched</option>
                              <option value="NO">NO — Discrepancies Found</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-slate-600 mb-1 font-medium">Geotagged Photos Verified?</label>
                            <select
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-medium"
                              value={reportForm.geotaggedPhotographVerified}
                              onChange={(e) => setReportForm((p) => ({ ...p, geotaggedPhotographVerified: e.target.value as 'YES' | 'NO' }))}
                            >
                              <option value="YES">YES — GPS Coordinates Match</option>
                              <option value="NO">NO — Missing / Location Mismatch</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Section 3: TECHNICAL OBSERVATION */}
                      <div className="bg-slate-50/70 p-3 rounded border border-slate-200 space-y-2">
                        <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                          <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                          <span>3. Technical Observation</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-600 mb-1 font-medium">Construction Quality & Structural Notes</label>
                            <textarea
                              rows={2}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs"
                              value={reportForm.qualityObservation}
                              onChange={(e) => setReportForm((p) => ({ ...p, qualityObservation: e.target.value }))}
                            />
                          </div>
                          <div>
                            <label className="block text-slate-600 mb-1 font-medium">Technical Specification Deviations</label>
                            <textarea
                              rows={2}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs"
                              value={reportForm.deviationObserved}
                              onChange={(e) => setReportForm((p) => ({ ...p, deviationObserved: e.target.value }))}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Section 4: COMMUNITY / BENEFICIARY OBSERVATION */}
                      <div className="bg-slate-50/70 p-3 rounded border border-slate-200 space-y-2">
                        <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-amber-600" />
                          <span>4. Community / Beneficiary Observation</span>
                        </div>
                        <div>
                          <label className="block text-slate-600 mb-1 font-medium">Local Feedback & Public Utility Assessment</label>
                          <textarea
                            rows={2}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs"
                            value={reportForm.beneficiaryObservation}
                            onChange={(e) => setReportForm((p) => ({ ...p, beneficiaryObservation: e.target.value }))}
                          />
                        </div>
                      </div>

                      {/* Section 5: FINAL RECOMMENDATION */}
                      <div className="bg-slate-50/70 p-3 rounded border border-slate-200 space-y-2">
                        <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                          <ClipboardCheck className="w-3.5 h-3.5 text-purple-600" />
                          <span>5. Final Statutory Recommendation</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-600 mb-1 font-medium">Recommended Administrative Action *</label>
                            <select
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-medium"
                              value={reportForm.recommendedAction}
                              onChange={(e) => setReportForm((p) => ({ ...p, recommendedAction: e.target.value }))}
                            >
                              <option value="WITHHOLD_PAYMENT">Withhold Further Tranche Releases</option>
                              <option value="EXPEDITE">Expedite — Direct Agency to Accelerate</option>
                              <option value="AUDIT">Order Third-Party Forensic Audit</option>
                              <option value="ROUTINE">Routine Monitoring — No Stoppage</option>
                              <option value="ESCALATE">Escalate to State Nodal Authority</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-slate-600 mb-1 font-medium">Officer Inspection Remarks & Summary *</label>
                            <textarea
                              rows={2}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs"
                              value={reportForm.inspectionRemarks}
                              onChange={(e) => setReportForm((p) => ({ ...p, inspectionRemarks: e.target.value }))}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => setIsFillingReport(false)}
                        className="px-3 py-1.5 border border-slate-300 rounded text-xs text-slate-700 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleReportSubmit}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold shadow-xs"
                      >
                        Submit Report
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 5: REPORT SUBMITTED -> AUTHORITY REVIEW */}
            {work.actionStatus === 'REPORT_SUBMITTED' && (
              <div className="space-y-4">
                <div className="p-4 bg-white border border-slate-200 rounded-lg text-xs space-y-3 shadow-xs">
                  <div className="font-bold text-slate-900 flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <ClipboardCheck className="w-4 h-4 text-indigo-600" />
                      <span className="text-sm">Submitted Field Inspection Report</span>
                    </div>
                    <span className="text-slate-500 font-normal">
                      Inspecting Officer: <strong className="text-slate-800">{work.inspectionReport?.inspectionOfficer}</strong> ({work.inspectionReport?.inspectionDate || 'Recent'})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Part 1 & 2 Metrics */}
                    <div className="space-y-2 p-2.5 bg-slate-50 rounded border border-slate-100">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        1. Site & Physical Verification
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-500 block">Observed Phys:</span>
                          <strong className="text-slate-900 font-mono text-xs">{work.inspectionReport?.observedPhysicalProgress}%</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Site Condition:</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            work.inspectionReport?.siteCondition === 'SATISFACTORY' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {work.inspectionReport?.siteCondition}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Execution:</span>
                          <strong className="text-slate-700">{work.inspectionReport?.workStatus || 'UNDER PROGRESS'}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 p-2.5 bg-slate-50 rounded border border-slate-100">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        2. Financial & Record Audits
                      </div>
                      <div className="flex flex-wrap gap-2 text-[11px]">
                        <span className="px-2 py-0.5 rounded border bg-white text-slate-700 font-mono">
                          Fin: {work.inspectionReport?.reviewedFinancialProgress}%
                        </span>
                        <span className={`px-2 py-0.5 rounded font-semibold text-[10px] ${
                          work.inspectionReport?.measurementBookVerified === 'YES' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          MB Verified: {work.inspectionReport?.measurementBookVerified || 'NO'}
                        </span>
                        <span className={`px-2 py-0.5 rounded font-semibold text-[10px] ${
                          work.inspectionReport?.paymentRecordsReviewed === 'YES' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          Vouchers: {work.inspectionReport?.paymentRecordsReviewed || 'YES'}
                        </span>
                        <span className={`px-2 py-0.5 rounded font-semibold text-[10px] ${
                          work.inspectionReport?.geotaggedPhotographVerified === 'YES' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          Geotag: {work.inspectionReport?.geotaggedPhotographVerified || 'NO'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Observations & Feedback */}
                  <div className="space-y-1.5 pt-1 text-[11px] text-slate-700 border-t border-slate-100">
                    <div>
                      <strong className="text-slate-900">Technical & Quality Notes:</strong>{' '}
                      {work.inspectionReport?.qualityObservation || 'Sub-grade compaction deficit identified during probe.'}
                    </div>
                    {work.inspectionReport?.deviationObserved && (
                      <div>
                        <strong className="text-slate-900">Deviations:</strong>{' '}
                        {work.inspectionReport?.deviationObserved}
                      </div>
                    )}
                    {work.inspectionReport?.beneficiaryObservation && (
                      <div>
                        <strong className="text-slate-900">Community / Beneficiary Feedback:</strong>{' '}
                        {work.inspectionReport?.beneficiaryObservation}
                      </div>
                    )}
                    <div className="pt-1 flex items-center gap-2">
                      <strong className="text-slate-900">Statutory Recommendation:</strong>
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-900 font-bold rounded text-[10px]">
                        {work.inspectionReport?.recommendedAction}
                      </span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded border border-slate-100 text-slate-600">
                      <strong>Remarks:</strong> {work.inspectionReport?.inspectionRemarks}
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5 max-w-lg">
                  <label className="block text-xs font-semibold text-slate-800">
                    District Authority Decision & Final Resolution:
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Enter resolution notes or escalation justification..."
                    value={correctiveRemarks}
                    onChange={(e) => setCorrectiveRemarks(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                  <div className="flex gap-2.5">
                    <button
                      onClick={() => handleWorkflowAction('RESOLVED')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-xs transition"
                    >
                      ✓ Mark Case Resolved
                    </button>
                    <button
                      onClick={() => handleWorkflowAction('ESCALATED')}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold shadow-xs transition"
                    >
                      ▲ Escalate to State Nodal
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 6: RESOLVED OR ESCALATED */}
            {(work.actionStatus === 'RESOLVED' || work.actionStatus === 'ESCALATED') && (
              <div
                className={`p-3.5 rounded border text-xs space-y-1 ${
                  work.actionStatus === 'RESOLVED'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Case {work.actionStatus === 'RESOLVED' ? 'Resolved' : 'Escalated'}</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  {work.correctiveAction?.remarks || 'Action completed and logged in system audit trail.'}
                </p>
                <div className="text-[10px] text-slate-500 pt-1 font-mono">
                  Recorded by: {work.correctiveAction?.actionBy || 'District Authority'}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 10. AUDIT / HISTORY */}
        <section className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-3.5">
          <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider text-xs flex items-center gap-2">
              <History className="w-4 h-4 text-slate-600" />
              <span>Audit / History Log</span>
            </h2>
            <button
              onClick={() => navigate('/audit-trail')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
            >
              <span>View Full System Audit Trail</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {auditEvents.length > 0 ? (
              auditEvents.slice(0, 5).map((evt) => (
                <div key={evt.id} className="flex items-start gap-3 text-xs border-l-2 border-indigo-400 pl-3 py-0.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{evt.event}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(evt.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-slate-600 mt-0.5">
                      By: <strong>{evt.actor}</strong> ({evt.role})
                    </div>
                    {evt.remarks && (
                      <div className="text-slate-500 text-[11px] mt-0.5 bg-slate-50 px-2 py-1 rounded">
                        {evt.remarks}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-500 py-3 text-center">
                System initialization event recorded. All future workflow updates will be logged here.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};
