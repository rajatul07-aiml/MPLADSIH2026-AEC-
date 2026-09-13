import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { Work, StakeholderRole } from '../types/work';
import { Alert, CreateAlertInput, AlertStatus } from '../types/alert';
import { worksService } from '../services/worksService';
import { alertsService } from '../services/alertsService';

interface ToastInfo {
  id: number;
  message: string;
  type?: 'success' | 'info';
}

interface AppContextType {
  works: Work[];
  alerts: Alert[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  // Stakeholder role & scope
  role: StakeholderRole;
  setRole: (role: StakeholderRole) => void;
  selectedState: string;
  setSelectedState: (state: string) => void;
  selectedDistrict: string;
  setSelectedDistrict: (district: string) => void;
  selectedConstituency: string;
  selectedOfficer: string;
  setSelectedOfficer: (officer: string) => void;
  setSelectedConstituency: (constituency: string) => void;
  // Alerts management
  createAlert: (input: CreateAlertInput) => void; // Made void since it fires async
  updateAlertStatus: (alertId: string, status: AlertStatus) => void;
  reassignAlert: (alertId: string, assignedTo: string) => void;
  resolveAlert: (alertId: string, resolutionNote: string) => void;
  updateWork: (work: Work) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (isCollapsed: boolean) => void;
  toggleSidebar: () => void;
  // Modal state
  isAlertModalOpen: boolean;
  alertModalWorkId: string | null;
  openCreateAlertModal: (workId?: string) => void;
  closeCreateAlertModal: () => void;
  // Notification state
  notifications: string[];
  unreadNotificationCount: number;
  markNotificationsAsRead: () => void;
  // Toast
  toasts: ToastInfo[];
  showToast: (message: string, type?: 'success' | 'info') => void;
  removeToast: (id: number) => void;
  // Global dataset operations
  allWorks: Work[];
  importWorks: (imported: Work[], mode: 'replace' | 'merge') => void;
  resetToDefaultWorks: () => void;

  isLoadingData: boolean;
  apiError: string | null;
  refreshWorks: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [works, setWorks] = useState<Work[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Stakeholder Role View State
  const [role, setRole] = useState<StakeholderRole>('MINISTRY');
  const [selectedState, setSelectedState] = useState<string>('West Bengal');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Central District');
  const [selectedConstituency, setSelectedConstituency] = useState<string>('Krishnanagar');
  const [selectedOfficer, setSelectedOfficer] = useState<string>('Inspector A. Sharma');

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    async function loadInitialData() {
      setIsLoadingData(true);
      setApiError(null);
      try {
        const [worksData, alertsData] = await Promise.all([
          worksService.getAllWorks(),
          alertsService.getAllAlerts()
        ]);
        setWorks(worksData || []);
        setAlerts(alertsData || []);
      } catch (e: any) {
        console.error("Error loading initial data", e);
        setApiError(e.message || "Failed to connect to backend API");
      } finally {
        setIsLoadingData(false);
      }
    }
    loadInitialData();
  }, []);

  const refreshWorks = async () => {
    setIsLoadingData(true);
      setApiError(null);
      try {
      const worksData = await worksService.getAllWorks();
      setWorks(worksData || []);
    } catch (e) {
      console.error("Error refreshing works data", e);
    } finally {
      setIsLoadingData(false);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sidebar_collapsed', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const [isAlertModalOpen, setIsAlertModalOpen] = useState<boolean>(false);
  const [alertModalWorkId, setAlertModalWorkId] = useState<string | null>(null);

  const [notifications, setNotifications] = useState<string[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState<number>(0);

  const [toasts, setToasts] = useState<ToastInfo[]>([]);
  const visibleWorks = useMemo(() => {
    return works.filter(w => {
      if (role === 'MINISTRY') return true;
      if (role === 'STATE AUTHORITY') return w.state === selectedState;
      if (role === 'DISTRICT AUTHORITY') return w.district === selectedDistrict;
      if (role === 'MP') return w.constituency === selectedConstituency;
      if (role === 'INSPECTION OFFICER') {
        return w.inspectionReport?.inspectionOfficer === selectedOfficer;
      }
      return true;
    });
  }, [works, role, selectedState, selectedDistrict, selectedConstituency, selectedOfficer]);

  const visibleAlerts = useMemo(() => {
    return alerts.filter(a => {
      if (role === 'MINISTRY') return true;

      const relatedWork = works.find(w => w.workId === a.workId);
      if (!relatedWork) return true;

      if (role === 'STATE AUTHORITY') return relatedWork.state === selectedState;
      if (role === 'DISTRICT AUTHORITY') return relatedWork.district === selectedDistrict;
      if (role === 'MP') return relatedWork.constituency === selectedConstituency;
      if (role === 'INSPECTION OFFICER') return relatedWork.inspectionReport?.inspectionOfficer === selectedOfficer;

      return true;
    });
  }, [alerts, works, role, selectedState, selectedDistrict, selectedConstituency, selectedOfficer]);


  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const openCreateAlertModal = (workId?: string) => {
    setAlertModalWorkId(workId || null);
    setIsAlertModalOpen(true);
  };

  const closeCreateAlertModal = () => {
    setIsAlertModalOpen(false);
    setAlertModalWorkId(null);
  };

  const createAlert = async (input: CreateAlertInput) => {
    try {
      const newAlert = await alertsService.createAlert(input);
      if (newAlert) {
        const all = await alertsService.getAllAlerts();
        setAlerts(all);
        closeCreateAlertModal();
        showToast('Review alert created.', 'success');
        setNotifications((prev) => [`1 new review alert created for ${input.workId}`, ...prev]);
        setUnreadNotificationCount((prev) => prev + 1);
      }
    } catch (e: any) {
      showToast(e.message || 'Failed to create alert.', 'info');
      closeCreateAlertModal();
    }
  };

  const updateAlertStatus = async (alertId: string, status: AlertStatus) => {
    try {
      await alertsService.updateStatus(alertId, status);
      const all = await alertsService.getAllAlerts();
      setAlerts(all);
      if (status === 'In Review') {
        showToast('Alert moved to In Review.', 'info');
      }
    } catch (e: any) {
      showToast(e.message || 'Failed to update alert.', 'info');
    }
  };

  const reassignAlert = async (alertId: string, assignedTo: string) => {
    try {
      await alertsService.reassignAlert(alertId, assignedTo);
      const all = await alertsService.getAllAlerts();
      setAlerts(all);
      showToast(`Alert reassigned to ${assignedTo}.`, 'info');
    } catch (e: any) {
      showToast(e.message || 'Failed to reassign alert.', 'info');
    }
  };

  const resolveAlert = async (alertId: string, resolutionNote: string) => {
    try {
      await alertsService.resolveAlert(alertId, resolutionNote);
      const all = await alertsService.getAllAlerts();
      setAlerts(all);
      showToast('Alert resolved.', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to resolve alert.', 'info');
    }
  };

  const updateWork = async (work: Work) => {
    try {
      await worksService.updateWork(work);
      const all = await worksService.getAllWorks();
      setWorks(all);
      showToast('Work updated successfully.', 'success');
    } catch (e: any) {
      showToast(e.message || 'Error updating work.', 'info');
    }
  };

  const importWorks = (imported: Work[], mode: 'replace' | 'merge') => {
    // Disabled for Phase 1 as backend will handle data processing
    showToast(`Work import is migrating to backend integration.`, 'info');
  };

  const resetToDefaultWorks = () => {
    // Disabled for Phase 1 as data is loaded from backend
    showToast('Dataset reset is disabled in Phase 1.', 'info');
  };

  const markNotificationsAsRead = () => {
    setUnreadNotificationCount(0);
  };

  return (
    <AppContext.Provider
      value={{
        works: visibleWorks,
        allWorks: works,
        importWorks,
        resetToDefaultWorks,
        alerts: visibleAlerts,
        searchQuery,
        setSearchQuery,
        role,
        setRole,
        selectedState,
        setSelectedState,
        selectedDistrict,
        setSelectedDistrict,
        selectedConstituency,
        selectedOfficer,
        setSelectedConstituency,
        setSelectedOfficer,
        createAlert,
        updateAlertStatus,
        reassignAlert,
        resolveAlert,
        updateWork,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        toggleSidebar,
        isAlertModalOpen,
        alertModalWorkId,
        openCreateAlertModal,
        closeCreateAlertModal,
        notifications,
        unreadNotificationCount,
        markNotificationsAsRead,
        toasts,
        showToast,
        removeToast,
        isLoadingData,
        apiError,
        refreshWorks,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
