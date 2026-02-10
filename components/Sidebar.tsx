import React from 'react';
import { 
  LayoutDashboard, 
  Table2, 
  UploadCloud, 
  FileBarChart,
  LogOut,
  ShieldAlert
} from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  currentView: string;
  onChangeView: (view: string) => void;
  currentUser: User;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, currentUser, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard (Escritorio)', icon: LayoutDashboard },
    { id: 'list', label: 'Listado Maestro', icon: Table2 },
    { id: 'ingest', label: 'Ingesta Excel', icon: UploadCloud },
    { id: 'reports', label: 'Reportes', icon: FileBarChart },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900 border-r border-slate-800 flex flex-col z-20 transition-all duration-300">
      <div className="p-6 flex items-center space-x-3 border-b border-slate-800">
        <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-500/20">
          <ShieldAlert className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg text-white leading-none">SGS</h1>
          <span className="text-xs text-slate-400 font-medium tracking-wide">EXTENSION</span>
        </div>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group
                ${active 
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700/50 mb-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-slate-900 ${currentUser.role === 'ADMIN' ? 'bg-amber-400' : 'bg-blue-400'}`}>
            {currentUser.initials}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-slate-200 truncate">{currentUser.name}</p>
            <p className="text-[10px] text-slate-500 truncate uppercase tracking-wide">{currentUser.role}</p>
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
  );
};

export default Sidebar;