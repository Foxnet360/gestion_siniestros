import React, { useState, useEffect } from 'react';
import {
  Building2,
  Search,
  FileText,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Loader2,
  Download,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Claim } from '../types';
import { formatCurrency } from '../utils/formatters';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const AllyPortal: React.FC = () => {
  const { user } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [total, setTotal] = useState(0);

  const [stats, setStats] = useState({ total: 0, activos: 0, finalizados: 0, montoTotal: 0 });

  useEffect(() => {
    if (user?.aliadoId) {
      fetchClaims();
    }
  }, [user, page, searchTerm]);

  const fetchClaims = async () => {
    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from('claims')
        .select('*', { count: 'exact' })
        .eq('aliado_origen', user?.aliadoId)
        .order('created_at', { ascending: false });

      if (searchTerm.trim()) {
        query = query.or(
          `numero_siniestro.ilike.%${searchTerm}%,asegurado.ilike.%${searchTerm}%,poliza.ilike.%${searchTerm}%`
        );
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error: queryError, count } = await query;

      if (queryError) throw queryError;

      setClaims(data || []);
      setTotal(count || 0);

      const { data: allClaims } = await supabase
        .from('claims')
        .select('estado_interno, monto_reclamo')
        .eq('aliado_origen', user?.aliadoId);

      const stats = (allClaims || []).reduce(
        (acc, claim) => {
          acc.total++;
          acc.montoTotal += Number(claim.monto_reclamo) || 0;
          if (['FINALIZADO', 'PAGADO'].includes(claim.estado_interno)) {
            acc.finalizados++;
          } else {
            acc.activos++;
          }
          return acc;
        },
        { total: 0, activos: 0, finalizados: 0, montoTotal: 0 }
      );

      setStats(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar siniestros');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    const headers = ['Número', 'Asegurado', 'Póliza', 'Estado', 'Monto Reclamado', 'Fecha'];
    const rows = claims.map(c => [
      c.numero_siniestro,
      c.asegurado,
      c.poliza,
      c.estado_interno,
      c.monto_reclamo,
      c.created_at,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `siniestros-${user?.aliadoId}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const totalPages = Math.ceil(total / pageSize);

  if (isLoading && claims.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-6 h-6" />
            Portal de Aliado
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{user?.aliadoId}</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Siniestros" value={stats.total} icon={FileText} color="blue" />
        <StatCard title="Activos" value={stats.activos} icon={TrendingUp} color="amber" />
        <StatCard title="Finalizados" value={stats.finalizados} icon={FileText} color="emerald" />
        <StatCard
          title="Monto Total"
          value={formatCurrency(stats.montoTotal)}
          icon={DollarSign}
          color="violet"
        />
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por número, asegurado o póliza..."
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-200"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-900/50 rounded-lg text-rose-600 dark:text-rose-400 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Número
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Asegurado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Póliza
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Estado
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                  Monto
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {claims.map(claim => (
                <tr
                  key={claim.id_softseguros}
                  className="hover:bg-slate-50 dark:hover:bg-slate-900/30"
                >
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                    {claim.numero_siniestro}
                  </td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                    {claim.asegurado}
                  </td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{claim.poliza}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={claim.estado_interno} />
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-white">
                    {formatCurrency(claim.monto_reclamo)}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-sm">
                    {format(new Date(claim.created_at || Date.now()), 'dd/MM/yyyy', { locale: es })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700">
            <div className="text-sm text-slate-500">
              Mostrando {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)} de {total}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-slate-200 dark:border-slate-700 rounded disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="text-sm text-slate-700 dark:text-slate-300">
                Página {page} de {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1 border border-slate-200 dark:border-slate-700 rounded disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: 'blue' | 'emerald' | 'violet' | 'amber';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color }) => {
  const colors = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600',
    violet: 'bg-violet-50 dark:bg-violet-900/20 text-violet-600',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600',
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
        </div>
        <div className={`p-2 rounded-lg ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const getColor = () => {
    switch (status) {
      case 'PAGADO':
      case 'FINALIZADO':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'LIQUIDACIÓN':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'OBJECIÓN':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400';
      default:
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
    }
  };

  return (
    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getColor()}`}>
      {status}
    </span>
  );
};

export default AllyPortal;
