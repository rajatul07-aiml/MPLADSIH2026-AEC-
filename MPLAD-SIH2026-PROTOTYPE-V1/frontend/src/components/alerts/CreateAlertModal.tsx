import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatLakhs } from '../../utils/formatting';
import { AlertType, AlertPriority } from '../../types/alert';

export const CreateAlertModal: React.FC = () => {
  const {
    isAlertModalOpen,
    alertModalWorkId,
    closeCreateAlertModal,
    createAlert,
    works,
  } = useApp();

  const [workId, setWorkId] = useState('');
  const [alertType, setAlertType] = useState<AlertType>('Financial / Physical Mismatch');
  const [priority, setPriority] = useState<AlertPriority>('High');
  const [assignedTo, setAssignedTo] = useState('Monitoring Team');
  const [reviewNote, setReviewNote] = useState('');

  // Selected work context
  const selectedWork = works.find((w) => w.workId === (alertModalWorkId || workId));

  // Initialize or update fields when modal opens or workId changes
  useEffect(() => {
    if (alertModalWorkId) {
      setWorkId(alertModalWorkId);
      const target = works.find((w) => w.workId === alertModalWorkId);
      if (target) {
        // Derive intelligent defaults based on strongest signal
        if (target.riskSignals.includes('Financial–Physical Mismatch')) {
          setAlertType('Financial / Physical Mismatch');
          setReviewNote(
            `Verify latest physical progress (${target.physicalProgress}%) and reconcile reported expenditure (${target.financialProgress}%).`
          );
        } else if (target.riskSignals.includes('Cost Deviation')) {
          setAlertType('Cost Deviation');
          setReviewNote(
            `Review estimate of ${formatLakhs(target.sanctionedAmount)} against peer benchmark for ${target.sector}.`
          );
        } else if (target.riskSignals.includes('Delay Risk')) {
          setAlertType('Delay');
          setReviewNote(
            `Work has reached ${target.delayDays} days of delay. Request revised milestone timeline.`
          );
        } else if (target.riskSignals.includes('Potential Similar Work')) {
          setAlertType('Potential Similar Work');
          setReviewNote(
            `Conduct physical survey to rule out overlap with nearby completed project.`
          );
        } else {
          setAlertType('Documentation Review');
          setReviewNote('Routine documentation verification of milestone certificates.');
        }

        if (target.riskLevel === 'CRITICAL') {
          setPriority('Critical');
        } else if (target.riskLevel === 'HIGH') {
          setPriority('High');
        } else if (target.riskLevel === 'MEDIUM') {
          setPriority('Medium');
        } else {
          setPriority('Low');
        }
      }
    } else {
      setWorkId(works[0]?.workId || 'MP-24-00182');
      setAlertType('Financial / Physical Mismatch');
      setPriority('High');
      setAssignedTo('Monitoring Team');
      setReviewNote('Verify latest physical progress and reconcile reported expenditure.');
    }
  }, [alertModalWorkId, isAlertModalOpen, works]);

  if (!isAlertModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workId.trim() || !reviewNote.trim()) return;

    createAlert({
      workId: workId.trim(),
      alertType,
      priority,
      assignedTo,
      reviewNote: reviewNote.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-md border border-slate-300 shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Create Review Alert
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Initiate follow-up or field verification for this work record.
            </p>
          </div>
          <button
            onClick={closeCreateAlertModal}
            className="text-slate-400 hover:text-slate-600 p-1 rounded"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Work selection / display */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Target Work Record
            </label>
            {alertModalWorkId ? (
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded flex items-center justify-between">
                <div>
                  <span className="font-mono font-semibold text-slate-900">
                    {selectedWork?.workId}
                  </span>
                  <span className="text-slate-500 ml-2">
                    — {selectedWork?.description}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">
                  {selectedWork?.district}, {selectedWork?.state}
                </span>
              </div>
            ) : (
              <select
                value={workId}
                onChange={(e) => setWorkId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-700"
              >
                {works.map((w) => (
                  <option key={w.workId} value={w.workId}>
                    {w.workId} - {w.description} ({w.state})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Alert Type */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Alert Type
              </label>
              <select
                value={alertType}
                onChange={(e) => setAlertType(e.target.value as AlertType)}
                className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-700"
              >
                <option value="Financial / Physical Mismatch">
                  Financial / Physical Mismatch
                </option>
                <option value="Cost Deviation">Cost Deviation</option>
                <option value="Delay">Delay</option>
                <option value="Potential Similar Work">Potential Similar Work</option>
                <option value="Documentation Review">Documentation Review</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as AlertPriority)}
                className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-700"
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          {/* Assigned Team */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Assigned Team
            </label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-700"
            >
              <option value="Monitoring Team">Monitoring Team</option>
              <option value="Technical Audit Team">Technical Audit Team</option>
              <option value="District Review Cell">District Review Cell</option>
              <option value="Field Verification Unit">Field Verification Unit</option>
              <option value="Finance Audit Wing">Finance Audit Wing</option>
            </select>
          </div>

          {/* Review Note */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Review Note / Instructions
            </label>
            <textarea
              rows={3}
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              placeholder="Provide specific directions for the verification team..."
              required
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-700"
            />
          </div>

          <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-600">
            <AlertCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>
              Alert will be logged in the centralized review queue with status &lsquo;Open&rsquo;.
            </span>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={closeCreateAlertModal}
              className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-slate-900 text-white rounded font-medium hover:bg-slate-800 transition"
            >
              Create Alert
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
