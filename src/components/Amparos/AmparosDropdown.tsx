import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { ChevronDown, X, Check } from 'lucide-react';

interface Amparo {
  id: string;
  nombre: string;
  categoria?: string;
}

interface AmparosDropdownProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
}

/**
 * Multi-select dropdown for amparos (coverage types)
 */
export const AmparosDropdown: React.FC<AmparosDropdownProps> = ({
  value,
  onChange,
  placeholder = 'Seleccionar amparos...',
  disabled = false,
  required = false,
  error,
}) => {
  const [amparos, setAmparos] = useState<Amparo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch amparos from database
  useEffect(() => {
    const fetchAmparos = async () => {
      try {
        const { data, error } = await supabase
          .from('amparos')
          .select('id, nombre, categoria')
          .eq('activo', true)
          .order('nombre');

        if (error) throw error;
        setAmparos(data || []);
      } catch (err) {
        console.error('Error fetching amparos:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAmparos();
  }, []);

  // Filter amparos by search term
  const filteredAmparos = amparos.filter(amparo =>
    amparo.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get selected amparos names
  const selectedAmparos = amparos.filter(amparo => value.includes(amparo.id));

  // Toggle selection
  const toggleSelection = useCallback(
    (amparoId: string) => {
      if (disabled) return;

      const newValue = value.includes(amparoId)
        ? value.filter(id => id !== amparoId)
        : [...value, amparoId];

      onChange(newValue);
    },
    [value, onChange, disabled]
  );

  // Remove selection
  const removeSelection = useCallback(
    (amparoId: string) => {
      if (disabled) return;
      onChange(value.filter(id => id !== amparoId));
    },
    [value, onChange, disabled]
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.amparos-dropdown')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg animate-pulse">
        <div className="h-5 bg-slate-700 rounded"></div>
      </div>
    );
  }

  return (
    <div className="amparos-dropdown relative">
      {/* Selected values display */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          min-h-[42px] px-3 py-2 bg-slate-800 border rounded-lg cursor-pointer
          flex flex-wrap items-center gap-2
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-slate-500'}
          ${error ? 'border-red-500' : 'border-slate-700'}
          ${isOpen ? 'border-blue-500 ring-2 ring-blue-500/20' : ''}
        `}
      >
        {selectedAmparos.length === 0 ? (
          <span className="text-slate-500">{placeholder}</span>
        ) : (
          selectedAmparos.map(amparo => (
            <span
              key={amparo.id}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-sm rounded"
            >
              {amparo.nombre}
              {!disabled && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    removeSelection(amparo.id);
                  }}
                  className="hover:bg-blue-700 rounded p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          ))
        )}

        <div className="ml-auto">
          <ChevronDown
            className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {/* Required indicator */}
      {required && selectedAmparos.length === 0 && (
        <p className="mt-1 text-sm text-red-400">Este campo es obligatorio</p>
      )}

      {/* Error message */}
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}

      {/* Dropdown menu */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg max-h-64 overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-slate-700">
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar amparo..."
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          {/* Options list */}
          <div className="overflow-y-auto max-h-48">
            {filteredAmparos.length === 0 ? (
              <div className="p-3 text-slate-500 text-center">No se encontraron amparos</div>
            ) : (
              filteredAmparos.map(amparo => (
                <button
                  key={amparo.id}
                  onClick={() => toggleSelection(amparo.id)}
                  className={`
                    w-full px-3 py-2 text-left flex items-center gap-2
                    hover:bg-slate-700 transition-colors
                    ${value.includes(amparo.id) ? 'bg-blue-900/30' : ''}
                  `}
                >
                  <div
                    className={`
                    w-5 h-5 rounded border flex items-center justify-center
                    ${
                      value.includes(amparo.id) ? 'bg-blue-600 border-blue-600' : 'border-slate-600'
                    }
                  `}
                  >
                    {value.includes(amparo.id) && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <span className="text-slate-100">{amparo.nombre}</span>
                  {amparo.categoria && (
                    <span className="ml-auto text-xs text-slate-500">{amparo.categoria}</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AmparosDropdown;
