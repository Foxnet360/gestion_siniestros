import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ClaimsTable from './components/ClaimsTable';
import ClaimDetail from './components/ClaimDetail';
import Ingest from './components/Ingest';
import Login from './components/Login';
import { INITIAL_CLAIMS } from './constants';
import { Claim, User } from './types';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [claims, setClaims] = useState<Claim[]>(INITIAL_CLAIMS);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [showToast, setShowToast] = useState(false);

  // Simulate data persistence logic would go here

  const handleUpdateClaim = (updatedClaim: Claim) => {
    setClaims(prev => prev.map(c => c.id_softseguros === updatedClaim.id_softseguros ? updatedClaim : c));
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch(currentView) {
      case 'dashboard':
        return <Dashboard claims={claims} onSelectClaim={setSelectedClaim} />;
      case 'list':
        return <ClaimsTable claims={claims} onSelectClaim={setSelectedClaim} />;
      case 'ingest':
        return <Ingest />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500">
            <p>Módulo en construcción: {currentView}</p>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-blue-500/30">
      
      {/* Sidebar */}
      <Sidebar 
        currentView={currentView} 
        onChangeView={setCurrentView} 
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8 transition-all">
        {/* Top Bar (Mock) */}
        <div className="flex justify-between items-center mb-8">
           <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {currentView === 'dashboard' ? 'Tablero de Control' : 
               currentView === 'list' ? 'Gestión de Casos' : 
               currentView === 'ingest' ? 'Importación Masiva' : 'Reportes'}
            </h2>
            <p className="text-slate-400 text-sm mt-1">Bienvenido de nuevo, {currentUser.name.split(' ')[0]}</p>
           </div>
           <div className="flex items-center space-x-4">
             <div className="text-right hidden md:block">
               <p className="text-xs text-slate-500 font-mono">Última sincronización</p>
               <p className="text-xs text-emerald-400 font-bold">Hace 5 minutos</p>
             </div>
           </div>
        </div>

        {renderContent()}
      </main>

      {/* Modals */}
      {selectedClaim && (
        <ClaimDetail 
          claim={selectedClaim} 
          onClose={() => setSelectedClaim(null)} 
          onUpdate={handleUpdateClaim}
        />
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-xl shadow-emerald-900/20 flex items-center space-x-2 animate-bounce-in z-50">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          <span className="font-medium">Cambios guardados correctamente</span>
        </div>
      )}
    </div>
  );
};

export default App;