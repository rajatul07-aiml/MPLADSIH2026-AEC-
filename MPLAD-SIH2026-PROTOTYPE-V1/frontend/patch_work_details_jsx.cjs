const fs = require('fs');
let content = fs.readFileSync('src/pages/WorkDetails.tsx', 'utf8');

// 1. Update Timeline
content = content.replace(
  "{['NO_ACTION', 'INSPECTION_REQUESTED', 'OFFICER_ASSIGNED', 'REPORT_SUBMITTED', 'RESOLVED'].map((step, idx, arr) => {",
  "{['NO_ACTION', 'INSPECTION_REQUESTED', 'OFFICER_ASSIGNED', 'INSPECTION_IN_PROGRESS', 'REPORT_SUBMITTED', 'RESOLVED'].map((step, idx, arr) => {"
);

// 2. Replace the ACTION PANELS starting from OFFICER_ASSIGNED up to the RESOLVED condition.
const oldActionPanels = `                {work.actionStatus === 'OFFICER_ASSIGNED' && (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-600">Officer <strong>{work.inspectionReport?.inspectionOfficer || inspectionOfficer}</strong> is assigned. The officer will submit the report once the site visit is complete.</p>
                    <button
                      onClick={() => handleWorkflowAction('REPORT_SUBMITTED')}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded transition"
                    >
                      Simulate Report Submission
                    </button>
                  </div>
                )}

                {work.actionStatus === 'REPORT_SUBMITTED' && (
                  <div className="space-y-4 max-w-md">
                    <div className="p-4 bg-white border border-slate-200 rounded text-sm space-y-2">
                      <h4 className="font-semibold text-slate-900 border-b border-slate-100 pb-2 mb-2">Inspection Report</h4>
                      <p><span className="text-slate-500">Officer:</span> {work.inspectionReport?.inspectionOfficer}</p>
                      <p><span className="text-slate-500">Physical Progress Observed:</span> 38%</p><p><span className="text-slate-500">Measurement Book Verified:</span> NO</p><p><span className="text-slate-500">Payment Records Reviewed:</span> YES</p><p><span className="text-slate-500">Geotagged Photograph Verified:</span> NO</p><p><span className="text-slate-500">Remarks:</span> "Physical progress trails reported expenditure. Documentation is incomplete."</p>
                    </div>
                    <p className="text-sm text-slate-600">Review the report and determine the final resolution.</p>
                    <textarea
                      placeholder="Resolution or Escalation Remarks..."
                      value={correctiveRemarks}
                      onChange={(e) => setCorrectiveRemarks(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded text-sm h-24"
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleWorkflowAction('RESOLVED')}
                        disabled={!correctiveRemarks}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded transition disabled:opacity-50"
                      >
                        Resolve Case
                      </button>
                      <button
                        onClick={() => handleWorkflowAction('ESCALATED')}
                        disabled={!correctiveRemarks}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded transition disabled:opacity-50"
                      >
                        Escalate
                      </button>
                    </div>
                  </div>
                )}`;

const newActionPanels = `                {work.actionStatus === 'OFFICER_ASSIGNED' && (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-600">Officer <strong>{work.inspectionReport?.inspectionOfficer || inspectionOfficer}</strong> is assigned. The officer must now start the physical verification.</p>
                    <button
                      onClick={() => handleWorkflowAction('INSPECTION_IN_PROGRESS')}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded transition"
                    >
                      Start Inspection
                    </button>
                  </div>
                )}

                {work.actionStatus === 'INSPECTION_IN_PROGRESS' && (
                  <div className="space-y-4">
                    {!isFillingReport ? (
                      <div>
                        <p className="text-sm text-slate-600 mb-4">Inspection is currently ongoing.</p>
                        <button
                          onClick={() => setIsFillingReport(true)}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded transition"
                        >
                          Submit Inspection Report
                        </button>
                      </div>
                    ) : (
                      <div className="bg-white border border-slate-200 p-5 rounded space-y-4">
                        <h4 className="font-semibold text-slate-900 border-b border-slate-100 pb-2">Inspection Report Form</h4>
                        
                        {reportError && (
                          <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded text-sm font-medium">
                            {reportError}
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <label className="block text-slate-600 mb-1">Inspection Officer *</label>
                            <input 
                              type="text" 
                              className="w-full px-3 py-2 border border-slate-300 rounded" 
                              value={reportForm.inspectionOfficer}
                              onChange={(e) => setReportForm(p => ({...p, inspectionOfficer: e.target.value}))}
                            />
                          </div>
                          <div>
                            <label className="block text-slate-600 mb-1">Inspection Date *</label>
                            <input 
                              type="date" 
                              className="w-full px-3 py-2 border border-slate-300 rounded" 
                              value={reportForm.inspectionDate}
                              onChange={(e) => setReportForm(p => ({...p, inspectionDate: e.target.value}))}
                            />
                          </div>
                          <div>
                            <label className="block text-slate-600 mb-1">Physical Progress (%) *</label>
                            <input 
                              type="number" 
                              min="0" max="100"
                              className="w-full px-3 py-2 border border-slate-300 rounded" 
                              value={reportForm.observedPhysicalProgress}
                              onChange={(e) => setReportForm(p => ({...p, observedPhysicalProgress: e.target.value}))}
                            />
                          </div>
                          <div>
                            <label className="block text-slate-600 mb-1">Financial Progress (%) *</label>
                            <input 
                              type="number" 
                              min="0" max="100"
                              className="w-full px-3 py-2 border border-slate-300 rounded" 
                              value={reportForm.reviewedFinancialProgress}
                              onChange={(e) => setReportForm(p => ({...p, reviewedFinancialProgress: e.target.value}))}
                            />
                          </div>
                          
                          <div>
                            <label className="block text-slate-600 mb-1">Site Condition</label>
                            <select 
                              className="w-full px-3 py-2 border border-slate-300 rounded bg-white"
                              value={reportForm.siteCondition}
                              onChange={(e) => setReportForm(p => ({...p, siteCondition: e.target.value}))}
                            >
                              <option>SATISFACTORY</option>
                              <option>POOR</option>
                              <option>CRITICAL</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-slate-600 mb-1">Work Status</label>
                            <select 
                              className="w-full px-3 py-2 border border-slate-300 rounded bg-white"
                              value={reportForm.workStatus}
                              onChange={(e) => setReportForm(p => ({...p, workStatus: e.target.value}))}
                            >
                              <option>UNDER PROGRESS</option>
                              <option>COMPLETED</option>
                              <option>DELAYED</option>
                              <option>DISCONTINUED</option>
                            </select>
                          </div>

                          <div className="space-y-2 col-span-1 md:col-span-2">
                            <h5 className="font-medium text-slate-700 mt-2">Verification Checklist</h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={reportForm.measurementBookVerified === 'YES'} onChange={(e) => setReportForm(p => ({...p, measurementBookVerified: e.target.checked ? 'YES' : 'NO'}))} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                                Measurement Book
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={reportForm.paymentRecordsReviewed === 'YES'} onChange={(e) => setReportForm(p => ({...p, paymentRecordsReviewed: e.target.checked ? 'YES' : 'NO'}))} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                                Payment Records
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={reportForm.geotaggedPhotographVerified === 'YES'} onChange={(e) => setReportForm(p => ({...p, geotaggedPhotographVerified: e.target.checked ? 'YES' : 'NO'}))} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                                Geotagged Photos
                              </label>
                            </div>
                          </div>

                          <div className="col-span-1 md:col-span-2">
                            <label className="block text-slate-600 mb-1">Quality / Technical Observation</label>
                            <textarea 
                              className="w-full px-3 py-2 border border-slate-300 rounded" 
                              rows={2}
                              value={reportForm.qualityObservation}
                              onChange={(e) => setReportForm(p => ({...p, qualityObservation: e.target.value}))}
                            />
                          </div>
                          <div className="col-span-1 md:col-span-2">
                            <label className="block text-slate-600 mb-1">Deviation Observed</label>
                            <textarea 
                              className="w-full px-3 py-2 border border-slate-300 rounded" 
                              rows={2}
                              value={reportForm.deviationObserved}
                              onChange={(e) => setReportForm(p => ({...p, deviationObserved: e.target.value}))}
                            />
                          </div>
                          <div className="col-span-1 md:col-span-2">
                            <label className="block text-slate-600 mb-1">Beneficiary / Community Observation</label>
                            <textarea 
                              className="w-full px-3 py-2 border border-slate-300 rounded" 
                              rows={2}
                              value={reportForm.beneficiaryObservation}
                              onChange={(e) => setReportForm(p => ({...p, beneficiaryObservation: e.target.value}))}
                            />
                          </div>
                          <div className="col-span-1 md:col-span-2">
                            <label className="block text-slate-600 mb-1">Inspection Remarks *</label>
                            <textarea 
                              className="w-full px-3 py-2 border border-slate-300 rounded" 
                              rows={3}
                              value={reportForm.inspectionRemarks}
                              onChange={(e) => setReportForm(p => ({...p, inspectionRemarks: e.target.value}))}
                            />
                          </div>
                          <div className="col-span-1 md:col-span-2">
                            <label className="block text-slate-600 mb-1">Recommended Action *</label>
                            <select 
                              className="w-full px-3 py-2 border border-slate-300 rounded bg-white"
                              value={reportForm.recommendedAction}
                              onChange={(e) => setReportForm(p => ({...p, recommendedAction: e.target.value}))}
                            >
                              <option value="">Select Action...</option>
                              <option value="PROCEED">PROCEED - Work is satisfactory</option>
                              <option value="WARN">WARN - Minor deviations found</option>
                              <option value="HALT">HALT - Critical issues detected</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex gap-3 justify-end mt-4">
                          <button
                            onClick={() => setIsFillingReport(false)}
                            className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded hover:bg-slate-50 transition"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleReportSubmit}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded transition"
                          >
                            Submit Report
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {work.actionStatus === 'REPORT_SUBMITTED' && (
                  <div className="space-y-4 w-full">
                    <div className="p-4 bg-white border border-slate-200 rounded text-sm space-y-3">
                      <h4 className="font-semibold text-slate-900 border-b border-slate-100 pb-2">Inspection Report Findings</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4">
                        <p><span className="text-slate-500">Officer:</span> {work.inspectionReport?.inspectionOfficer}</p>
                        <p><span className="text-slate-500">Date:</span> {work.inspectionReport?.inspectionDate}</p>
                        <p><span className="text-slate-500">Physical Progress:</span> {work.inspectionReport?.observedPhysicalProgress}%</p>
                        <p><span className="text-slate-500">Financial Progress:</span> {work.inspectionReport?.reviewedFinancialProgress}%</p>
                        <p><span className="text-slate-500">Site Condition:</span> {work.inspectionReport?.siteCondition}</p>
                        <p><span className="text-slate-500">Work Status:</span> {work.inspectionReport?.workStatus}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-y-2 gap-x-4 border-t border-slate-100 pt-2">
                        <p><span className="text-slate-500">MB Verified:</span> {work.inspectionReport?.measurementBookVerified}</p>
                        <p><span className="text-slate-500">Payments Reviewed:</span> {work.inspectionReport?.paymentRecordsReviewed}</p>
                        <p><span className="text-slate-500">Photos Geotagged:</span> {work.inspectionReport?.geotaggedPhotographVerified}</p>
                      </div>

                      <div className="border-t border-slate-100 pt-2 space-y-2">
                        {work.inspectionReport?.qualityObservation && <p><span className="text-slate-500 block">Quality Obs:</span> {work.inspectionReport?.qualityObservation}</p>}
                        {work.inspectionReport?.deviationObserved && <p><span className="text-slate-500 block">Deviations:</span> {work.inspectionReport?.deviationObserved}</p>}
                        {work.inspectionReport?.beneficiaryObservation && <p><span className="text-slate-500 block">Community:</span> {work.inspectionReport?.beneficiaryObservation}</p>}
                        <p><span className="text-slate-500 block">Remarks:</span> {work.inspectionReport?.inspectionRemarks}</p>
                        <p><span className="text-slate-500 font-medium">Recommended Action:</span> <span className="font-bold">{work.inspectionReport?.recommendedAction}</span></p>
                      </div>
                    </div>
                    
                    <div className="max-w-md pt-2">
                      <p className="text-sm text-slate-600 mb-2">Review the report and determine the final resolution.</p>
                      <textarea
                        placeholder="Resolution or Escalation Remarks..."
                        value={correctiveRemarks}
                        onChange={(e) => setCorrectiveRemarks(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded text-sm h-24 mb-2"
                      />
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleWorkflowAction('RESOLVED')}
                          disabled={!correctiveRemarks}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded transition disabled:opacity-50"
                        >
                          Resolve Case
                        </button>
                        <button
                          onClick={() => handleWorkflowAction('ESCALATED')}
                          disabled={!correctiveRemarks}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded transition disabled:opacity-50"
                        >
                          Escalate
                        </button>
                      </div>
                    </div>
                  </div>
                )}`;

content = content.replace(oldActionPanels, newActionPanels);

fs.writeFileSync('src/pages/WorkDetails.tsx', content);
