import React from 'react';
import {
  LayoutDashboard,
  Table2,
  UploadCloud,
  FileBarChart,
  LogOut,
  ShieldAlert,
  X,
  ChevronLeft,
  ChevronRight,
  Users,
  Activity,
  Building2,
  LineChart,
} from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  currentView: string;
  onChangeView: (view: string) => void;
  currentUser: User;
  onLogout: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onChangeView,
  currentUser,
  onLogout,
  isOpen,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const getMenuItems = () => {
    const items = [];

    // Dashboard base para todos
    items.push({ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard });

    // Opciones para ADMIN y GERENTE
    if (currentUser.role === 'ADMIN' || currentUser.role === 'GERENTE') {
      items.push({ id: 'manager-dashboard', label: 'Dashboard Gerencial', icon: LineChart });
    }

    // Listado de siniestros (todos excepto ALIADO tienen acceso completo)
    if (currentUser.role !== 'ALIADO') {
      items.push({ id: 'list', label: 'Listado Maestro', icon: Table2 });
    }

    // Portal de Aliado (solo para ALIADO)
    if (currentUser.role === 'ALIADO') {
      items.push({ id: 'ally-portal', label: 'Mis Siniestros', icon: Building2 });
    }

    // Ingesta Excel (solo ADMIN)
    if (currentUser.role === 'ADMIN') {
      items.push({ id: 'ingest', label: 'Ingesta Excel', icon: UploadCloud });
    }

    // Reportes (ADMIN y GERENTE)
    if (currentUser.role === 'ADMIN' || currentUser.role === 'GERENTE') {
      items.push({ id: 'reports', label: 'Reportes', icon: FileBarChart });
    }

    // Administración de Usuarios (solo ADMIN)
    if (currentUser.role === 'ADMIN') {
      items.push({ id: 'user-admin', label: 'Usuarios', icon: Users });
    }

    // Auditoría (ADMIN y GERENTE)
    if (currentUser.role === 'ADMIN' || currentUser.role === 'GERENTE') {
      items.push({ id: 'audit-log', label: 'Auditoría', icon: Activity });
    }

    return items;
  };

  const visibleItems = getMenuItems();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex fixed left-0 top-0 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col z-40 transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Header */}
        <div
          className={`p-4 flex items-center border-b border-slate-200 dark:border-slate-800 ${isCollapsed ? 'justify-center' : 'justify-between'}`}
        >
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-500/20">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="font-bold text-lg text-slate-900 dark:text-white leading-none">
                  SGS
                </h1>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide">
                  EXTENSION
                </span>
              </div>
            )}
          </div>

          {/* Toggle Button */}
          {!isCollapsed && (
            <button
              onClick={onToggleCollapse}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Colapsar menú"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-2 space-y-1">
          {visibleItems.map(item => {
            const Icon = item.icon;
            const active = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onChangeView(item.id)}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-3 py-3 rounded-lg transition-all duration-200 group relative
                  ${
                    active
                      ? 'bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-600/20'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-5 h-5 flex-shrink-0 ${active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}
                />
                {!isCollapsed && <span className="font-medium text-sm truncate">{item.label}</span>}

                {/* Tooltip para modo colapsado */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800">
          {!isCollapsed ? (
            <div className="flex items-center space-x-3 px-3 py-3 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 mb-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-slate-900 ${currentUser.role === 'ADMIN' ? 'bg-amber-400' : 'bg-blue-400'}`}
              >
                {currentUser.initials}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                  {currentUser.name}
                </p>
                <p className="text-[10px] text-slate-500 truncate uppercase tracking-wide">
                  {currentUser.role}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center mb-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-slate-900 ${currentUser.role === 'ADMIN' ? 'bg-amber-400' : 'bg-blue-400'}`}
                title={`${currentUser.name} (${currentUser.role})`}
              >
                {currentUser.initials}
              </div>
            </div>
          )}

          <button
            onClick={onLogout}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-center space-x-2'} text-xs text-slate-500 hover:text-rose-400 transition-colors py-2`}
            title={isCollapsed ? 'Cerrar Sesión' : undefined}
          >
            <LogOut className="w-4 h-4" />
            {!isCollapsed && <span>Cerrar Sesión</span>}
          </button>

          {/* Botón para expandir cuando está colapsado */}
          {isCollapsed && (
            <button
              onClick={onToggleCollapse}
              className="w-full flex items-center justify-center p-2 mt-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title="Expandir menú"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Sidebar - Solo para móvil */}
      <aside
        className={`lg:hidden fixed left-0 top-0 h-full w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col z-40 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-500/20">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-900 dark:text-white leading-none">SGS</h1>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide">
                EXTENSION
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1">
          {visibleItems.map(item => {
            const Icon = item.icon;
            const active = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onChangeView(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group
                  ${
                    active
                      ? 'bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-600/20'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
              >
                <Icon
                  className={`w-5 h-5 ${active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}
                />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 mb-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-slate-900 ${currentUser.role === 'ADMIN' ? 'bg-amber-400' : 'bg-blue-400'}`}
            >
              {currentUser.initials}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                {currentUser.name}
              </p>
              <p className="text-[10px] text-slate-500 truncate uppercase tracking-wide">
                {currentUser.role}
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center space-x-2 text-xs text-slate-500 hover:text-rose-400 transition-colors py-2"
          >
            <LogOut className="w-3 h-3" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
