import React, { useState } from 'react';
import { ShieldAlert, LogIn, Key, Mail } from 'lucide-react';
import { User } from '../types';
import { MOCK_USERS } from '../constants';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate API delay
    setTimeout(() => {
      const foundUser = MOCK_USERS.find(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      );

      // Simple mock password check (in reality this would be hashed on backend)
      if (foundUser && password === '123456') {
        onLogin(foundUser);
      } else {
        setError('Credenciales inválidas. Intenta nuevamente.');
        setIsLoading(false);
      }
    }, 800);
  };

  const fillCredentials = (role: 'admin' | 'tech') => {
    if (role === 'admin') {
      setEmail('admin@softseguros.com');
      setPassword('123456');
    } else {
      setEmail('tecnico@softseguros.com');
      setPassword('123456');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-blue-900/40 blur-[100px]"></div>
        <div className="absolute bottom-[0%] right-[0%] w-[50%] h-[50%] rounded-full bg-emerald-900/30 blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl relative z-10 p-8">
        
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-600 p-3 rounded-xl shadow-lg shadow-blue-500/20 mb-4">
            <ShieldAlert className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">SGS Extension</h1>
          <p className="text-slate-400 text-sm mt-1">Gestión Inteligente de Siniestros</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">Correo Corporativo</label>
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
              <input 
                type="email" 
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-slate-200 placeholder-slate-600 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all"
                placeholder="usuario@softseguros.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">Contraseña</label>
            <div className="relative group">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
              <input 
                type="password" 
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-slate-200 placeholder-slate-600 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-900/20 border border-rose-900/50 rounded-lg text-rose-400 text-xs flex items-center">
               <ShieldAlert className="w-4 h-4 mr-2 flex-shrink-0" />
               {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-3 rounded-lg shadow-lg shadow-blue-500/20 transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <LogIn className="w-4 h-4 mr-2" />
                Iniciar Sesión
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800">
           <p className="text-center text-[10px] text-slate-500 uppercase tracking-widest mb-4">Demo Quick Login</p>
           <div className="grid grid-cols-2 gap-3">
             <button 
               onClick={() => fillCredentials('admin')}
               className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 py-2 px-3 rounded transition-colors text-center"
             >
               Soy Admin
             </button>
             <button 
               onClick={() => fillCredentials('tech')}
               className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 py-2 px-3 rounded transition-colors text-center"
             >
               Soy Técnico
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Login;