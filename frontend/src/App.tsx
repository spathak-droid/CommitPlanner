import React, { useEffect, useState } from 'react';
import { useStore } from './store/useStore';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toast } from './components/Toast';
import { Sidebar, type View } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { LoginScreen } from './components/LoginScreen';
import { setAuthToken, setBaseUrl } from './services/api';
import * as api from './services/api';
import WeeklyPlanPage from './pages/WeeklyPlanPage';
import ManagerDashboardPage from './pages/ManagerDashboardPage';
import TeamWorkspacePage from './pages/TeamWorkspacePage';
import TeamAlignmentPage from './pages/TeamAlignmentPage';
import RcdoHierarchyPage from './pages/RcdoHierarchyPage';
import SettingsPage from './pages/SettingsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import CapacityPlanningPage from './pages/CapacityPlanningPage';
import CalendarViewPage from './pages/CalendarViewPage';
import ProblemStatementPage from './pages/ProblemStatementPage';
import type { AppProps, UserRole } from './types';

const roleViews: Record<UserRole, View[]> = {
  MANAGER: ['dashboard', 'team', 'alignment', 'analytics', 'capacity', 'calendar', 'rcdo', 'settings'],
  IC: ['commitments', 'calendar', 'rcdo', 'settings'],
};

function getDefaultView(role: UserRole): View {
  return role === 'MANAGER' ? 'dashboard' : 'commitments';
}

const App: React.FC<AppProps> = ({ userId, role, apiBaseUrl, authToken }) => {
  const {
    login,
    logout,
    isAuthenticated,
    fullName,
    role: storeRole,
    token,
    showToast,
    triggerCommitmentsAction,
  } = useStore();
  const [activeView, setActiveView] = useState<View>(getDefaultView(storeRole));
  const [bootstrapping, setBootstrapping] = useState(Boolean(authToken));
  const [showProblem, setShowProblem] = useState(false);

  useEffect(() => {
    if (apiBaseUrl) setBaseUrl(apiBaseUrl);
    if (authToken) {
      setAuthToken(authToken);
      setBootstrapping(true);
      void api.fetchCurrentUser()
        .then((auth) => {
          login({ ...auth, token: authToken });
          setActiveView(getDefaultView(auth.role));
        })
        .catch((e) => {
          setAuthToken('');
          showToast(e instanceof Error ? e.message : 'Failed to bootstrap auth', 'error');
        })
        .finally(() => setBootstrapping(false));
      return;
    }
    if (token) setAuthToken(token);
    if (userId && role && !isAuthenticated) {
      setActiveView(getDefaultView(role));
    }
    setBootstrapping(false);
  }, [userId, role, apiBaseUrl, authToken, login, isAuthenticated, token, showToast]);

  useEffect(() => {
    const allowedViews = roleViews[storeRole];
    if (!allowedViews.includes(activeView)) {
      setActiveView(getDefaultView(storeRole));
    }
  }, [activeView, storeRole]);

  const handleViewChange = (view: View) => {
    if (!roleViews[storeRole].includes(view)) return;
    setActiveView(view);
  };

  const handleLogin = async (nextUserId: string, password: string) => {
    try {
      const auth = await api.login(nextUserId, password);
      login(auth);
      setActiveView(getDefaultView(auth.role));
      showToast(`Welcome back, ${auth.fullName}`, 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Login failed', 'error');
      throw e;
    }
  };

  const handleLogout = () => {
    logout();
    setActiveView('commitments');
  };

  const handleContributorPrimaryAction = () => {
    setActiveView('commitments');
    triggerCommitmentsAction();
  };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <ManagerDashboardPage />;
      case 'team':
        return <TeamWorkspacePage />;
      case 'alignment':
        return <TeamAlignmentPage />;
      case 'commitments':
        return <WeeklyPlanPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'capacity':
        return <CapacityPlanningPage />;
      case 'calendar':
        return <CalendarViewPage onNavigateToPlan={() => handleViewChange('commitments')} />;
      case 'rcdo':
        return <RcdoHierarchyPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <ManagerDashboardPage />;
    }
  };

  if (bootstrapping) {
    return <div className="min-h-screen flex items-center justify-center text-secondary">Loading workspace…</div>;
  }

  if (!isAuthenticated) {
    if (showProblem) {
      return (
        <div className="min-h-screen bg-surface p-8">
          <Toast />
          <div className="max-w-6xl mx-auto">
            <button
              onClick={() => setShowProblem(false)}
              className="mb-6 inline-flex items-center gap-2 rounded-full bg-surface-container-low px-5 py-2.5 text-sm font-bold text-secondary hover:text-on-surface transition-all"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Back to Login
            </button>
            <ProblemStatementPage />
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen">
        <Toast />
        <LoginScreen onLogin={handleLogin} onShowProblem={() => setShowProblem(true)} />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-surface">
        <Toast />
        <TopNav role={storeRole} fullName={fullName} />
        <Sidebar activeView={activeView} onViewChange={handleViewChange} role={storeRole} onLogout={handleLogout} onPrimaryAction={handleContributorPrimaryAction} />

        <main className="md:ml-72 pt-24 px-8 pb-12 transition-all duration-300">
          <div className="max-w-6xl mx-auto">
            {renderContent()}
          </div>
        </main>

        <nav className="md:hidden fixed bottom-0 left-0 w-full glass-effect flex justify-around items-center py-4 px-6 z-50">
          {storeRole === 'MANAGER' ? (
            <>
              <button onClick={() => handleViewChange('dashboard')} className={`flex flex-col items-center gap-1 ${activeView === 'dashboard' ? 'text-primary' : 'text-secondary'}`}>
                <span className="material-symbols-outlined">dashboard</span>
                <span className="text-[10px] font-bold">DASHBOARD</span>
              </button>
              <button onClick={() => handleViewChange('team')} className={`flex flex-col items-center gap-1 ${activeView === 'team' ? 'text-primary' : 'text-secondary'}`}>
                <span className="material-symbols-outlined" style={activeView === 'team' ? { fontVariationSettings: "'FILL' 1" } : undefined}>groups</span>
                <span className="text-[10px] font-bold">TEAM</span>
              </button>
              <button onClick={() => handleViewChange('alignment')}
                className="bg-primary-container p-3 rounded-full -mt-12 shadow-lg ring-4 ring-white">
                <span className="material-symbols-outlined text-on-primary-container font-black">insights</span>
              </button>
              <button onClick={() => handleViewChange('rcdo')} className={`flex flex-col items-center gap-1 ${activeView === 'rcdo' ? 'text-primary' : 'text-secondary'}`}>
                <span className="material-symbols-outlined">account_tree</span>
                <span className="text-[10px] font-bold">RCDO</span>
              </button>
            </>
          ) : (
            <>
              <button onClick={() => handleViewChange('commitments')} className={`flex flex-col items-center gap-1 ${activeView === 'commitments' ? 'text-primary' : 'text-secondary'}`}>
                <span className="material-symbols-outlined">event_available</span>
                <span className="text-[10px] font-bold">GOALS</span>
              </button>
              <button onClick={() => handleViewChange('rcdo')} className={`flex flex-col items-center gap-1 ${activeView === 'rcdo' ? 'text-primary' : 'text-secondary'}`}>
                <span className="material-symbols-outlined">account_tree</span>
                <span className="text-[10px] font-bold">RCDO</span>
              </button>
              <button onClick={handleContributorPrimaryAction}
                className="bg-primary-container p-3 rounded-full -mt-12 shadow-lg ring-4 ring-white">
                <span className="material-symbols-outlined text-on-primary-container font-black">add</span>
              </button>
            </>
          )}
          <button onClick={() => handleViewChange('settings')} className={`flex flex-col items-center gap-1 ${activeView === 'settings' ? 'text-primary' : 'text-secondary'}`}>
            <span className="material-symbols-outlined">settings</span>
            <span className="text-[10px] font-bold">CONFIG</span>
          </button>
        </nav>
      </div>
    </ErrorBoundary>
  );
};

export default App;
