const fs = require('fs');

let content = fs.readFileSync('src/pages/WorkDetails.tsx', 'utf8');

// 1. Add state for the form
const stateReplacement = `
  const [correctiveRemarks, setCorrectiveRemarks] = useState('');

  const [isFillingReport, setIsFillingReport] = useState(false);
  const [reportForm, setReportForm] = useState({
    inspectionOfficer: '',
    inspectionDate: new Date().toISOString().split('T')[0],
    observedPhysicalProgress: '',
    reviewedFinancialProgress: '',
    siteCondition: 'SATISFACTORY',
    workStatus: 'UNDER PROGRESS',
    measurementBookVerified: 'NO' as 'YES'|'NO',
    paymentRecordsReviewed: 'NO' as 'YES'|'NO',
    geotaggedPhotographVerified: 'NO' as 'YES'|'NO',
    qualityObservation: '',
    deviationObserved: '',
    beneficiaryObservation: '',
    inspectionRemarks: '',
    recommendedAction: ''
  });
  const [reportError, setReportError] = useState('');

  const handleReportSubmit = () => {
    const pProg = parseFloat(reportForm.observedPhysicalProgress);
    const fProg = parseFloat(reportForm.reviewedFinancialProgress);
    
    if (!reportForm.inspectionOfficer || !reportForm.inspectionDate || !reportForm.inspectionRemarks || !reportForm.recommendedAction) {
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

    const finalReport = {
      ...reportForm,
      observedPhysicalProgress: pProg,
      reviewedFinancialProgress: fProg,
    };
    
    setIsFillingReport(false);
    handleWorkflowAction('REPORT_SUBMITTED', finalReport);
  };
`;
content = content.replace("  const [correctiveRemarks, setCorrectiveRemarks] = useState('');", stateReplacement);

// 2. Modify handleWorkflowAction
const workflowActionOld = `  const handleWorkflowAction = (newStatus: ActionStatus) => {
    if (!work) return;

    const updatedWork = { ...work, actionStatus: newStatus };
    let eventName = '';
    let eventRemarks = '';

    if (newStatus === 'INSPECTION_REQUESTED') {
      eventName = 'Inspection Requested';
      eventRemarks = \`Inspection requested based on risk level \${work.riskLevel}\`;
    } else if (newStatus === 'OFFICER_ASSIGNED') {
      eventName = 'Inspection Officer Assigned';
      eventRemarks = \`Assigned Officer: \${inspectionOfficer}\`;
      updatedWork.inspectionReport = {
        ...updatedWork.inspectionReport,
        inspectionOfficer,
        inspectionDate: '',
        observedPhysicalProgress: 0,
        reviewedFinancialProgress: 0,
        siteCondition: '',
        workStatus: '',
        measurementBookVerified: 'NO',
        paymentRecordsReviewed: 'NO',
        geotaggedPhotographVerified: 'NO',
        qualityObservation: '',
        deviationObserved: '',
        beneficiaryObservation: '',
        inspectionRemarks: '',
        recommendedAction: ''
      };
    } else if (newStatus === 'REPORT_SUBMITTED') {
      eventName = 'Inspection Report Submitted';
      eventRemarks = 'Physical progress trails reported expenditure. Documentation is incomplete.';
    } else if (newStatus === 'RESOLVED') {
      eventName = 'Case Resolved';
      eventRemarks = correctiveRemarks;
      updatedWork.correctiveAction = {
        actionType: 'RESOLVED',
        status: 'RESOLVED',
        remarks: correctiveRemarks,
        actionBy: 'District Collector',
        actionDate: new Date().toISOString()
      };
    } else if (newStatus === 'ESCALATED') {
      eventName = 'Case Escalated';
      eventRemarks = correctiveRemarks;
      updatedWork.correctiveAction = {
        actionType: 'ESCALATED',
        status: 'ESCALATED',
        remarks: correctiveRemarks,
        actionBy: 'District Collector',
        actionDate: new Date().toISOString()
      };
    }

    workflowService.addEvent({
      workId: work.workId,
      timestamp: new Date().toISOString(),
      event: eventName,
      actor: newStatus === 'REPORT_SUBMITTED' ? (inspectionOfficer || 'Inspector') : 'District Collector',
      role: newStatus === 'REPORT_SUBMITTED' ? 'INSPECTION OFFICER' : 'DISTRICT AUTHORITY',
      status: newStatus,
      remarks: eventRemarks
    });

    updateWork(updatedWork);
  };`;

const workflowActionNew = `  const handleWorkflowAction = (newStatus: ActionStatus, reportData?: any) => {
    if (!work) return;

    const updatedWork = { ...work, actionStatus: newStatus };
    let eventName = '';
    let eventRemarks = '';
    let actor = 'District Collector';
    let role = 'DISTRICT AUTHORITY';

    if (newStatus === 'INSPECTION_REQUESTED') {
      eventName = 'Inspection Requested';
      eventRemarks = \`Inspection requested based on risk level \${work.riskLevel}\`;
    } else if (newStatus === 'OFFICER_ASSIGNED') {
      eventName = 'Inspection Officer Assigned';
      eventRemarks = \`Assigned Officer: \${inspectionOfficer}\`;
      updatedWork.inspectionReport = {
        ...updatedWork.inspectionReport,
        inspectionOfficer,
        inspectionDate: '',
        observedPhysicalProgress: 0,
        reviewedFinancialProgress: 0,
        siteCondition: '',
        workStatus: '',
        measurementBookVerified: 'NO',
        paymentRecordsReviewed: 'NO',
        geotaggedPhotographVerified: 'NO',
        qualityObservation: '',
        deviationObserved: '',
        beneficiaryObservation: '',
        inspectionRemarks: '',
        recommendedAction: ''
      };
      setReportForm(prev => ({ ...prev, inspectionOfficer }));
    } else if (newStatus === 'INSPECTION_IN_PROGRESS') {
      eventName = 'Inspection Started';
      eventRemarks = \`Officer \${work.inspectionReport?.inspectionOfficer || inspectionOfficer || 'Assigned Officer'} commenced inspection.\`;
      actor = work.inspectionReport?.inspectionOfficer || inspectionOfficer || 'Inspector';
      role = 'INSPECTION OFFICER';
    } else if (newStatus === 'REPORT_SUBMITTED') {
      eventName = 'Inspection Report Submitted';
      eventRemarks = reportData?.inspectionRemarks || 'Submitted inspection findings';
      actor = reportData?.inspectionOfficer || work.inspectionReport?.inspectionOfficer || 'Inspector';
      role = 'INSPECTION OFFICER';
      if (reportData) {
        updatedWork.inspectionReport = reportData;
      }
    } else if (newStatus === 'RESOLVED') {
      eventName = 'Case Resolved';
      eventRemarks = correctiveRemarks;
      updatedWork.correctiveAction = {
        actionType: 'RESOLVED',
        status: 'RESOLVED',
        remarks: correctiveRemarks,
        actionBy: 'District Collector',
        actionDate: new Date().toISOString()
      };
    } else if (newStatus === 'ESCALATED') {
      eventName = 'Case Escalated';
      eventRemarks = correctiveRemarks;
      updatedWork.correctiveAction = {
        actionType: 'ESCALATED',
        status: 'ESCALATED',
        remarks: correctiveRemarks,
        actionBy: 'District Collector',
        actionDate: new Date().toISOString()
      };
    }

    workflowService.addEvent({
      workId: work.workId,
      timestamp: new Date().toISOString(),
      event: eventName,
      actor: actor,
      role: role,
      status: newStatus,
      remarks: eventRemarks
    });

    updateWork(updatedWork);
  };`;

content = content.replace(workflowActionOld, workflowActionNew);

fs.writeFileSync('src/pages/WorkDetails.tsx', content);
