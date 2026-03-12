import React, { useState } from 'react';
import { useAmparos } from '../../hooks/useAmparos';
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react';

/**
 * Admin interface for managing amparos (coverage types)
 */
export const AmparosAdmin: React.FC = () => {
  const { amparos, loading, error, addAmparo, updateAmparo, deleteAmparo } = useAmparos();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newNombre, setNewNombre] = useState('');
  const [newCategoria, setNewCategoria] = useState('OTRO');
  const [editNombre, setEditNombre] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!newNombre.trim()) {
      setFormError('El nombre es obligatorio');
      return;
    }

    try {
      await addAmparo(newNombre.trim(), newCategoria);
      setNewNombre('');
      setNewCategoria('OTRO');
      setIsAdding(false);
    } catch (err) {
      setFormError((err as Error).message);
    }
  };

  const handleEdit = (amparo: { id: string; nombre: string }) => {
    setEditingId(amparo.id);
    setEditNombre(amparo.nombre);
    setFormError(null);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editNombre.trim()) {
      setFormError('El nombre es obligatorio');
      return;
    }

    try {
      await updateAmparo(id, { nombre: editNombre.trim() });
      setEditingId(null);
      setFormError(null);
    } catch (err) {
      setFormError((err as Error).message);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditNombre('');
    setFormError(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Está seguro de que desea desactivar este amparo?')) {
      try {
        await deleteAmparo(id);
      } catch (err) {
        alert('Error al desactivar: ' + (err as Error).message);
      }
    }
  };

  const activeAmparos = amparos.filter(a => a.activo);
  const inactiveAmparos = amparos.filter(a => !a.activo);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-700 rounded w-1/3"></div>
          <div className="h-12 bg-slate-700 rounded"></div>
          <div className="h-12 bg-slate-700 rounded"></div>
          <div className="h-12 bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
          <p className="text-red-400">Error al cargar amparos: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Gestión de Amparos</h1>
        <p className="text-slate-400 mt-1">
          Administre los tipos de amparos disponibles en el sistema
        </p>
      </header>

      {/* Add new amparo */}
      <div className="mb-6">
        {!isAdding ? (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Agregar Amparo
          </button>
        ) : (
          <form
            onSubmit={handleAdd}
            className="bg-slate-800 border border-slate-700 rounded-lg p-4"
          >
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Nuevo Amparo</h3>

            {formError && <p className="mb-4 text-sm text-red-400">{formError}</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={newNombre}
                  onChange={e => setNewNombre(e.target.value)}
                  placeholder="Nombre del amparo"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Categoría</label>
                <select
                  value={newCategoria}
                  onChange={e => setNewCategoria(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="OTRO">Otro</option>
                  <option value="VIDA">Vida</option>
                  <option value="SALUD">Salud</option>
                  <option value="AUTOS">Autos</option>
                  <option value="HOGAR">Hogar</option>
                  <option value="EMPRESARIAL">Empresarial</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
              >
                Guardar
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setNewNombre('');
                  setFormError(null);
                }}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-medium"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Active amparos list */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">
          Amparos Activos ({activeAmparos.length})
        </h2>

        <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
          {activeAmparos.length === 0 ? (
            <p className="p-4 text-slate-500 text-center">No hay amparos activos</p>
          ) : (
            <div className="divide-y divide-slate-700">
              {activeAmparos.map(amparo => (
                <div key={amparo.id} className="p-4 flex items-center justify-between">
                  {editingId === amparo.id ? (
                    <div className="flex-1 flex items-center gap-4">
                      <input
                        type="text"
                        value={editNombre}
                        onChange={e => setEditNombre(e.target.value)}
                        className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveEdit(amparo.id)}
                        className="p-2 text-green-400 hover:bg-green-900/30 rounded"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="p-2 text-red-400 hover:bg-red-900/30 rounded"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <p className="font-medium text-slate-100">{amparo.nombre}</p>
                        <p className="text-sm text-slate-500">{amparo.categoria}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(amparo)}
                          className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-900/30 rounded transition-colors"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(amparo.id)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-900/30 rounded transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Inactive amparos */}
      {inactiveAmparos.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-slate-100 mb-4">
            Amparos Inactivos ({inactiveAmparos.length})
          </h2>

          <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
            <div className="divide-y divide-slate-700/50">
              {inactiveAmparos.map(amparo => (
                <div key={amparo.id} className="p-4 flex items-center justify-between opacity-60">
                  <div>
                    <p className="font-medium text-slate-100">{amparo.nombre}</p>
                    <p className="text-sm text-slate-500">{amparo.categoria}</p>
                  </div>

                  <button
                    onClick={() => updateAmparo(amparo.id, { activo: true })}
                    className="px-3 py-1 text-sm text-blue-400 hover:bg-blue-900/30 rounded border border-blue-600"
                  >
                    Reactivar
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default AmparosAdmin;
