import React, { useState, useCallback, useEffect } from 'react';
import { Check } from 'lucide-react';
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
import { ErrorToast } from './components/common/ErrorToast';
import { ThemeToggle } from './components/common/ThemeToggle';
import { Claim, User } from './types';
import { ClaimsProvider, useClaims } from './context/ClaimsContext';
import { ThemeProvider } from './context/ThemeContext';

const AppContent: React.FC = () => {
  const {
    currentUser,
    setCurrentUser,
    updateClaim,
    changeClaimState,
    filteredClaims,
    errors,
    clearError,
  } = useClaims();

  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  useEffect(() => {
    const fetchLastSync = async () => {
      try {
        const { data, error } = await supabase
          .from('timeline')
          .select('created_at')
          .eq('author', 'Sistema (Ingesta)') // Filter for ingestion events only
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

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
  }, []);

  const handleUpdateClaim = useCallback(
    async (updatedClaim: Claim) => {
      try {
        await updateClaim(updatedClaim);
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
          await changeClaimState(
            selectedClaim.id_softseguros,
            newState as import('./types').InternalState,
            currentUser.name
          );
        } catch (err) {
          // Error ya manejado en contexto con rollback
          console.error('State change failed:', err);
        }
      }
    },
    [selectedClaim, currentUser, changeClaimState]
  );

  const handleLogin = useCallback(
    (user: User) => {
      setCurrentUser(user);
      setCurrentView('dashboard');
    },
    [setCurrentUser]
  );

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
  }, [setCurrentUser]);

  const getViewTitle = useCallback(() => {
    const titles: Record<string, string> = {
      dashboard: 'Tablero de Control',
      list: 'Gestión de Casos',
      ingest: 'Importación Masiva',
      'prescription-risk': 'Riesgo de Prescripción',
      reports: 'Reportes y Análisis',
    };
    return titles[currentView] || 'Reportes';
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
    return <Login onLogin={handleLogin} />;
  }

  const renderContent = () => {
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
        return <ClaimsTable claims={filteredClaims} onSelectClaim={setSelectedClaim} />;
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
        return <ReportsPage currentUser={currentUser} />;
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
      <Sidebar
        currentView={currentView}
        onChangeView={setCurrentView}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <main className="flex-1 ml-64 p-8 transition-all">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{getViewTitle()}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Bienvenido de nuevo, {currentUser.name.split(' ')[0]}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
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
      <ClaimsProvider>
        <AppContent />
      </ClaimsProvider>
    </ThemeProvider>
  );
};

export default App;
