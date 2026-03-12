import React, { useState } from 'react';
import { Check, Clock, AlertTriangle } from 'lucide-react';
import type { TaskItem } from '../../../types/dashboard';

interface ActionPlanPanelProps {
  tasks?: TaskItem[];
  isLoading?: boolean;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'en_proceso':
      return <Clock size={14} className="text-blue-400" />;
    case 'pendiente':
      return <AlertTriangle size={14} className="text-orange-400" />;
    case 'validando':
      return <AlertTriangle size={14} className="text-yellow-400" />;
    default:
      return null;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'en_proceso':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
    case 'pendiente':
      return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
    case 'validando':
      return 'bg-yellow-500/10 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/50';
    default:
      return 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'en_proceso':
      return 'EN PROCESO';
    case 'pendiente':
      return 'PENDIENTE';
    case 'validando':
      return 'VALIDANDO CON ASEGURADORAS';
    default:
      return status;
  }
};

const defaultTasks: TaskItem[] = [
  {
    id: '1',
    description: 'Eliminar estados que no utilizamos de SS.',
    status: 'en_proceso',
    completed: false,
  },
  {
    id: '2',
    description: 'Crear lista desplegable de los amparos afectados.',
    status: 'pendiente',
    completed: false,
  },
  {
    id: '3',
    description: 'Validar con aseguradoras sobre aviso con solo nombre y NIT.',
    status: 'validando',
    completed: false,
  },
];

export const ActionPlanPanel: React.FC<ActionPlanPanelProps> = ({
  tasks = defaultTasks,
  isLoading = false,
}) => {
  const [taskList, setTaskList] = useState<TaskItem[]>(tasks);

  const toggleTaskCompletion = (id: string) => {
    setTaskList(prev =>
      prev.map(task => (task.id === id ? { ...task, completed: !task.completed } : task))
    );
  };

  const cycleTaskStatus = (id: string) => {
    const statusOrder: Array<'en_proceso' | 'pendiente' | 'validando'> = [
      'en_proceso',
      'pendiente',
      'validando',
    ];
    setTaskList(prev =>
      prev.map(task => {
        if (task.id === id) {
          const currentIndex = statusOrder.indexOf(task.status);
          const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
          return { ...task, status: nextStatus };
        }
        return task;
      })
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-4 uppercase tracking-wider">
          PLAN DE ACCIÓN - TAREAS PENDIENTES
        </h3>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-slate-50 dark:bg-slate-700 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const completedCount = taskList.filter(t => t.completed).length;
  const totalCount = taskList.length;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
      <div className="flex justify-between items-center mb-4 text-xs">
        <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">PLAN DE ACCIÓN - TAREAS PENDIENTES</h3>
        <span className="text-xs text-slate-500">
          {completedCount}/{totalCount} completadas
        </span>
      </div>

      <div className="space-y-3">
        {taskList.map(task => (
          <div
            key={task.id}
            className={`flex items-start gap-3 p-3 rounded-lg border transition-all duration-200 ${
              task.completed
                ? 'bg-slate-50 dark:bg-slate-700/30 border-slate-200 dark:border-slate-700 opacity-60'
                : 'bg-white dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 shadow-sm'
            }`}
          >
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => toggleTaskCompletion(task.id)}
              className="mt-1 w-4 h-4 rounded border-slate-300 dark:border-slate-500 text-blue-600 focus:ring-blue-500 bg-white dark:bg-slate-700"
            />

            <div className="flex-1">
              <p
                className={`text-sm ${
                  task.completed ? 'text-slate-400 line-through italic' : 'text-slate-700 dark:text-slate-200'
                }`}
              >
                {task.description}
              </p>

              <button
                onClick={() => cycleTaskStatus(task.id)}
                className={`mt-2 inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded border ${getStatusColor(
                  task.status
                )}`}
              >
                {getStatusIcon(task.status)}
                {getStatusLabel(task.status)}
              </button>
            </div>

            {!task.completed && (
              <button
                onClick={() => toggleTaskCompletion(task.id)}
                className="text-xs text-blue-400 hover:text-blue-300 whitespace-nowrap"
              >
                Marcar como Completada
              </button>
            )}
          </div>
        ))}
      </div>

      {taskList.length === 0 && (
        <div className="text-center py-8">
          <Check size={32} className="mx-auto text-green-400 mb-2" />
          <p className="text-slate-400">No hay tareas pendientes</p>
        </div>
      )}
    </div>
  );
};
