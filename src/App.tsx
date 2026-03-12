import React, { useState, useCallback, useEffect } from 'react';
import { Check, Menu, X, ShieldAlert } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from './lib/supabase';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ClaimsTable from './components/ClaimsTable';
import ClaimDetail from './components/ClaimDetail';
import Ingest from './components/Ingest';
import Login from './components/Login';
import PrescriptionRiskPage from './components/PrescriptionRiskPage';
import ReportsPage from './components/Reports/ReportsPage';
import UserAdmin from './components/UserAdmin';
import UserProfile from './components/UserProfile';
import AuditLog from './components/AuditLog';
import ManagerDashboard from './components/manager/ManagerDashboard';
import AllyPortal from './components/AllyPortal';
import { Dashboard as SlaDashboard } from './components/Dashboard/SlaDashboard';
import { DashboardEficienciaEtapas } from './components/Dashboard/DashboardEficienciaEtapas';
import { ErrorToast } from './components/common/ErrorToast';
import { ThemeToggle } from './components/common/ThemeToggle';
import { Claim } from './types';
import { ClaimsProvider, useClaims } from './context/ClaimsContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import {
  canManageUsers,
  canViewAuditLog,
  canViewManagerDashboard,
  canAccessAllyPortal,
} from './utils/roleUtils';

const AppContent: React.FC = () => {
  const { user: currentUser, logout } = useAuth();
  const { updateClaim, changeClaimState, filteredClaims, errors, clearError, users } = useClaims();

  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    const fetchLastSync = async () => {
      try {
        const { data, error } = await supabase
          .from('timeline')
          .select('created_at')
          .eq('author', 'Sistema (Ingesta)') // Filter for ingestion events only
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data && data.created_at) {
          setLastSyncTime(data.created_at);
        } else {
          setLastSyncTime(null);
        }
      } catch (err) {
        console.error('Error fetching last sync:', err);
        setLastSyncTime(null);
      }
    };

    fetchLastSync();

    // Refresh every minute
    const interval = setInterval(fetchLastSync, 60000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleUpdateClaim = useCallback(
    async (updatedClaim: Claim) => {
      try {
        await updateClaim(updatedClaim);
        setSelectedClaim(updatedClaim);
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
      } catch (err) {
        // Error ya manejado en contexto con rollback
        console.error('Update failed:', err);
      }
    },
    [updateClaim]
  );

  const handleChangeState = useCallback(
    async (newState: string) => {
      if (selectedClaim && currentUser) {
        try {
          const updated = await changeClaimState(
            selectedClaim.id_softseguros,
            newState as import('./types').InternalState,
            currentUser.name
          );
          // Actualizar el claim seleccionado para reflejar el cambio en el modal
          if (updated) setSelectedClaim(updated);
        } catch (err) {
          // Error ya manejado en contexto con rollback
          console.error('State change failed:', err);
        }
      }
    },
    [selectedClaim, currentUser, changeClaimState]
  );

  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  const getViewTitle = useCallback(() => {
    const titles: Record<string, string> = {
      dashboard: 'Tablero de Control',
      'sla-dashboard': 'Dashboard SLA / KPIs',
      list: 'Gestión de Casos',
      ingest: 'Importación Masiva',
      'prescription-risk': 'Riesgo de Prescripción',
      reports: 'Reportes y Análisis',
      'user-admin': 'Administración de Usuarios',
      'user-profile': 'Mi Perfil',
      'audit-log': 'Logs de Auditoría',
      'manager-dashboard': 'Dashboard Gerencial',
      'ally-portal': 'Mis Siniestros',
    };
    return titles[currentView] || 'Módulo';
  }, [currentView]);

  const getRelativeTime = () => {
    if (lastSyncTime === '') return 'Cargando...';
    if (!lastSyncTime) return 'Sin actividad';
    try {
      return formatDistanceToNow(new Date(lastSyncTime), { addSuffix: true, locale: es });
    } catch (e) {
      return 'Fecha inválida';
    }
  };

  if (!currentUser) {
    return <Login />;
  }

  const renderContent = () => {
    // Verificar permisos para vistas protegidas
    if (currentView === 'user-admin' && !canManageUsers(currentUser.role)) {
      return (
        <div className="text-center p-8 text-rose-600">
          No tienes permisos para acceder a esta sección
        </div>
      );
    }
    if (currentView === 'audit-log' && !canViewAuditLog(currentUser.role)) {
      return (
        <div className="text-center p-8 text-rose-600">
          No tienes permisos para acceder a esta sección
        </div>
      );
    }
    if (currentView === 'manager-dashboard' && !canViewManagerDashboard(currentUser.role)) {
      return (
        <div className="text-center p-8 text-rose-600">
          No tienes permisos para acceder a esta sección
        </div>
      );
    }

    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard
            claims={filteredClaims}
            onSelectClaim={setSelectedClaim}
            onChangeView={setCurrentView}
          />
        );
      case 'list':
        return (
          <ClaimsTable claims={filteredClaims} onSelectClaim={setSelectedClaim} users={users} />
        );
      case 'ingest':
        return <Ingest />;
      case 'prescription-risk':
        return (
          <PrescriptionRiskPage
            claims={filteredClaims}
            onSelectClaim={setSelectedClaim}
            onBack={() => setCurrentView('dashboard')}
          />
        );
      case 'reports':
        return <ReportsPage currentUser={currentUser} onSelectClaim={setSelectedClaim} />;
      case 'user-admin':
        return <UserAdmin currentUser={currentUser} />;
      case 'user-profile':
        return <UserProfile />;
      case 'audit-log':
        return <AuditLog />;
      case 'manager-dashboard':
        return <ManagerDashboard />;
      case 'ally-portal':
        return <AllyPortal />;
      case 'sla-dashboard':
        return <SlaDashboard />;
      case 'eficiencia-etapas':
        return <DashboardEficienciaEtapas />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500">
            <p>Módulo en construcción: {currentView}</p>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-500/30 transition-colors duration-200">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <Sidebar
        currentView={currentView}
        onChangeView={view => {
          setCurrentView(view);
          setMobileMenuOpen(false);
        }}
        currentUser={currentUser}
        onLogout={handleLogout}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <main
        className={`flex-1 transition-all w-full p-4 lg:p-8 ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}
      >
        {/* Mobile Header */}
        <div className="flex lg:hidden items-center justify-between mb-6">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center space-x-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-900 dark:text-white">SGS</span>
          </div>
          <ThemeToggle />
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 lg:mb-8 gap-4">
          <div>
            <h2 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {getViewTitle()}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Bienvenido de nuevo, {currentUser.name.split(' ')[0]}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden lg:block">
              <ThemeToggle />
            </div>
            <div className="text-right hidden md:block">
              <p className="text-xs text-slate-500 font-mono">Última sincronización</p>
              <p className="text-xs text-emerald-400 font-bold capitalize">{getRelativeTime()}</p>
            </div>
          </div>
        </div>

        {renderContent()}
      </main>

      {selectedClaim && (
        <ClaimDetail
          claim={selectedClaim}
          onClose={() => setSelectedClaim(null)}
          onUpdate={handleUpdateClaim}
          onChangeState={handleChangeState}
        />
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed bottom-6 right-6 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-xl shadow-emerald-900/20 flex items-center space-x-2 z-50">
          <Check className="w-5 h-5" />
          <span className="font-medium">Cambios guardados correctamente</span>
        </div>
      )}

      {/* Error Toasts */}
      <ErrorToast errors={errors} onDismiss={clearError} />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ClaimsProvider>
          <AppContent />
        </ClaimsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
