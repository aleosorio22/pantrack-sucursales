import React, { useState } from 'react';
import { FiEdit2, FiCheck, FiX, FiChevronDown, FiLayers } from 'react-icons/fi';
import { toast } from 'react-toastify';

// Formatea medidas con 2 decimales; '-' si no hay valor
const formatMeasure = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  return Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatUnits = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  return Number(value).toLocaleString();
};

const MEASURES = [
  { key: 'arrobas_necesarias', label: 'Arrobas' },
  { key: 'latas_necesarias', label: 'Latas' },
  { key: 'libras_necesarias', label: 'Libras' }
];

const CategoryTable = ({ categoria, items, onUpdateQuantity }) => {
  const [editingItem, setEditingItem] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [isOpen, setIsOpen] = useState(true);

  const totalItem = items.find(item => item.producto_nombre.startsWith('Total'));
  const products = items.filter(item => !item.producto_nombre.startsWith('Total'));
  const totalUnits = products.reduce((sum, item) => sum + (Number(item.total_unidades) || 0), 0);

  const handleEdit = (item) => {
    // Verificar que el producto tenga ID
    if (!item.producto_id) {
      console.error('Error: No se puede editar un producto sin ID', item);
      return;
    }

    setEditingItem(item);
    setEditValue(item.total_unidades?.toString() || '');
  };

  const handleSave = async () => {
    if (!editingItem) return;

    const newValue = parseInt(editValue, 10);
    if (isNaN(newValue) || newValue < 0) {
      toast.error('Por favor ingrese un número válido');
      return;
    }

    await onUpdateQuantity(editingItem.producto_id, newValue);
    setEditingItem(null);
  };

  const handleCancel = () => {
    setEditingItem(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') handleCancel();
  };

  const isEditing = (item) => editingItem && editingItem === item;

  const renderEditInput = (className) => (
    <input
      type="number"
      inputMode="numeric"
      className={`px-2 py-1.5 text-right rounded-lg border border-border bg-background focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary ${className}`}
      value={editValue}
      onChange={(e) => setEditValue(e.target.value)}
      onKeyDown={handleKeyDown}
      min="0"
      autoFocus
    />
  );

  const renderActions = (item, size = 16) => {
    if (!item.producto_id) return null;
    return isEditing(item) ? (
      <div className="flex justify-center gap-1">
        <button
          onClick={handleSave}
          className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          title="Guardar"
        >
          <FiCheck size={size} />
        </button>
        <button
          onClick={handleCancel}
          className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
          title="Cancelar"
        >
          <FiX size={size} />
        </button>
      </div>
    ) : (
      <button
        onClick={() => handleEdit(item)}
        className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-primary transition-colors"
        title="Editar unidades"
      >
        <FiEdit2 size={size} />
      </button>
    );
  };

  return (
    <div className="bg-card rounded-lg border border-border shadow-soft overflow-hidden">
      {/* Encabezado de la categoría */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 px-4 sm:px-6 py-3.5 text-left hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
            <FiLayers className="text-primary w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="font-display font-semibold text-foreground truncate">{categoria}</h3>
            <p className="text-xs text-muted-foreground">
              {products.length} {products.length === 1 ? 'producto' : 'productos'} · {totalUnits.toLocaleString()} unidades
            </p>
          </div>
        </div>
        <FiChevronDown
          className={`text-muted-foreground flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <>
          {/* Vista móvil: lista de productos */}
          <div className="md:hidden border-t border-border divide-y divide-border">
            {products.map((item, index) => (
              <div key={item.producto_id || index} className="px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-foreground text-sm leading-snug min-w-0">
                    {item.producto_nombre}
                  </p>
                  {!isEditing(item) && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="text-right">
                        <span className="block text-lg font-display font-bold text-foreground leading-none">
                          {formatUnits(item.total_unidades)}
                        </span>
                        <span className="text-[11px] text-muted-foreground">unidades</span>
                      </span>
                      {renderActions(item, 18)}
                    </div>
                  )}
                </div>

                {/* Edición de unidades en fila completa */}
                {isEditing(item) && (
                  <div className="flex items-center gap-2 mt-2">
                    {renderEditInput('flex-1 min-w-0 text-base')}
                    {renderActions(item, 18)}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-1.5 mt-2">
                  {MEASURES.map(({ key, label }) => (
                    <div key={key} className="px-2 py-1 rounded-md bg-muted text-center">
                      <p className="text-[11px] text-muted-foreground">{label}</p>
                      <p className="text-xs font-semibold text-foreground tabular-nums">{formatMeasure(item[key])}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {totalItem && (
              <div className="px-4 py-3 bg-primary/5">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-2">Total categoría</p>
                <div className="grid grid-cols-3 gap-2">
                  {MEASURES.map(({ key, label }) => (
                    <div key={key} className="bg-card rounded-lg border border-border px-2 py-1.5 text-center">
                      <p className="text-[11px] text-muted-foreground">{label}</p>
                      <p className="text-sm font-semibold text-foreground">{formatMeasure(totalItem[key])}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Vista desktop: tabla */}
          <div className="hidden md:block border-t border-border overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-muted/60">
                <tr className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="px-6 py-3 text-left">Producto</th>
                  <th className="px-6 py-3 text-right">Unidades</th>
                  <th className="px-6 py-3 text-right">Arrobas</th>
                  <th className="px-6 py-3 text-right">Latas</th>
                  <th className="px-6 py-3 text-right">Libras</th>
                  <th className="px-6 py-3 text-center w-28">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {products.map((item, index) => (
                  <tr key={item.producto_id || index} className="hover:bg-muted/40 transition-colors">
                    <td className="px-6 py-3 text-foreground">{item.producto_nombre}</td>
                    <td className="px-6 py-3 text-right font-semibold text-foreground">
                      {isEditing(item) ? renderEditInput('w-24') : formatUnits(item.total_unidades)}
                    </td>
                    {MEASURES.map(({ key }) => (
                      <td key={key} className="px-6 py-3 text-right text-muted-foreground tabular-nums">
                        {formatMeasure(item[key])}
                      </td>
                    ))}
                    <td className="px-6 py-2 text-center">{renderActions(item)}</td>
                  </tr>
                ))}
              </tbody>
              {totalItem && (
                <tfoot>
                  <tr className="bg-primary/5 border-t border-border text-sm font-semibold text-foreground">
                    <td className="px-6 py-3">Total categoría</td>
                    <td className="px-6 py-3 text-right">{totalUnits.toLocaleString()}</td>
                    {MEASURES.map(({ key }) => (
                      <td key={key} className="px-6 py-3 text-right tabular-nums">
                        {formatMeasure(totalItem[key])}
                      </td>
                    ))}
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default CategoryTable;
