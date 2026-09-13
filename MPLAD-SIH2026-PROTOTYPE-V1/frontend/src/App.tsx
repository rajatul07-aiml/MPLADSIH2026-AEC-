import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { ToastContainer } from './components/ui/ToastContainer';
import { CreateAlertModal } from './components/alerts/CreateAlertModal';

import { Dashboard } from './pages/Dashboard';
import { RiskMonitor } from './pages/RiskMonitor';
import { WorkDetails } from './pages/WorkDetails';
import { RiskExplanation } from './pages/RiskExplanation';
import { Alerts } from './pages/Alerts';
import { AuditTrail } from './pages/AuditTrail';
import { InspectionWorklist } from './pages/InspectionWorklist';
import { DataManagement } from './pages/DataManagement';
import { NewWorkEntry } from './pages/NewWorkEntry';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="flex min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased selection:bg-slate-200">
          {/* Institutional Sidebar */}
          <Sidebar />

          {/* Main Application Area */}
          <div className="flex-1 flex flex-col min-w-0">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/risk-monitor" element={<RiskMonitor />} />
              <Route path="/inspections" element={<InspectionWorklist />} />
              <Route path="/work/:workId" element={<WorkDetails />} />
              <Route path="/work/:workId/explanation" element={<RiskExplanation />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/audit-trail" element={<AuditTrail />} />
              <Route path="/data-management" element={<DataManagement />} />
              <Route path="/data-management/new" element={<NewWorkEntry />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>

          {/* Global Modals and Notifications */}
          <CreateAlertModal />
          <ToastContainer />
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}
