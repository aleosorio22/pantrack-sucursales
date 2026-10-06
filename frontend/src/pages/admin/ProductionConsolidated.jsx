import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import OrderService from '../../services/OrderService';
import { formatDateForInput } from '../../utils/dateUtils';
import usePDFGenerator from '../../hooks/usePDFGenerator';
import { toast } from 'react-toastify';
import { FiSearch, FiPackage, FiLayers, FiBox, FiInbox } from 'react-icons/fi';

// Componentes
import Header from './components/production/Header';
import CategoryTable from './components/production/CategoryTable';
import LoadingSpinner from './components/production/LoadingSpinner';

const ProductionConsolidated = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateFilter, setDateFilter] = useState(
    location.state?.selectedDate || formatDateForInput(new Date())
  );
  const [updatingProduct, setUpdatingProduct] = useState(false);
  const [search, setSearch] = useState('');

  // Efecto para actualizar la fecha cuando cambia en la ubicación
  useEffect(() => {
    if (location.state?.selectedDate) {
      setDateFilter(location.state.selectedDate);
    }
  }, [location.state]);

  const fetchConsolidated = async () => {
    try {
      setIsLoading(true);
      const response = await OrderService.getProductionConsolidated(dateFilter);
      if (response.success) {
        // Asegurarnos de que cada item tenga un producto_id
        const processedData = response.data.map(item => {
          // Si es un total, no tendrá producto_id
          if (item.producto_nombre.startsWith('Total')) {
            return item;
          }
          return item;
        });
        setData(processedData);
      } else {
        throw new Error(response.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConsolidated();
  }, [dateFilter]);

  const groupedData = useMemo(() => {
    if (!data) return {};
    return data.reduce((acc, item) => {
      if (!acc[item.categoria_nombre]) {
        acc[item.categoria_nombre] = [];
      }
      acc[item.categoria_nombre].push(item);
      return acc;
    }, {});
  }, [data]);

  const { generatePDF, generatingPDF } = usePDFGenerator(groupedData, dateFilter);

  // Categorías filtradas por búsqueda; al buscar se ocultan los totales de categoría
  const visibleCategories = useMemo(() => {
    const searchLower = search.trim().toLowerCase();
    if (!searchLower) return Object.entries(groupedData);
    return Object.entries(groupedData)
      .map(([categoria, items]) => [
        categoria,
        items.filter(item =>
          !item.producto_nombre.startsWith('Total') &&
          item.producto_nombre.toLowerCase().includes(searchLower)
        )
      ])
      .filter(([, items]) => items.length > 0);
  }, [groupedData, search]);

  // Resumen general del día
  const summary = useMemo(() => {
    const products = (data || []).filter(item => !item.producto_nombre.startsWith('Total'));
    return [
      { label: 'Categorías', value: Object.keys(groupedData).length, icon: FiLayers },
      { label: 'Productos', value: products.length, icon: FiPackage },
      {
        label: 'Unidades',
        value: products.reduce((sum, item) => sum + (Number(item.total_unidades) || 0), 0).toLocaleString(),
        icon: FiBox
      }
    ];
  }, [data, groupedData]);

  const handleUpdateQuantity = async (producto_id, total_unidades) => {
    try {
      setUpdatingProduct(true);
      
      // Verificar que tenemos los datos necesarios
      if (!producto_id) {
        console.error('Error: producto_id es undefined');
        toast.error('Error: ID de producto no válido');
        return;
      }
      
      console.log('Actualizando producto:', { producto_id, total_unidades });
      
      const response = await OrderService.updateProductionQuantity(dateFilter, {
        producto_id,
        total_unidades
      });
      
      console.log('Respuesta del servidor:', response);
      
      if (response.success) {
        // Actualizar el estado con los nuevos datos
        setData(prevData => {
          // Encontrar la categoría del producto actualizado
          const categoriaDelProducto = prevData.find(item => 
            item.producto_id === producto_id
          )?.categoria_nombre;
          
          // Actualizar los datos
          const updatedData = prevData.map(item => {
            // Actualizar el producto específico
            if (item.producto_id === producto_id) {
              return {
                ...item,
                total_unidades: Number(response.data.total_unidades),
                arrobas_necesarias: Number(response.data.arrobas_necesarias),
                latas_necesarias: Number(response.data.latas_necesarias),
                libras_necesarias: Number(response.data.libras_necesarias)
              };
            }
            
            // Actualizar el total de la categoría
            if (item.producto_nombre === `Total categoría: ${categoriaDelProducto}`) {
              // Calcular nuevos totales para la categoría
              const productosDeCategoria = prevData.filter(prod => 
                prod.categoria_nombre === categoriaDelProducto && 
                !prod.producto_nombre.startsWith('Total')
              );
              
              // Actualizar el producto en los cálculos
              const productosActualizados = productosDeCategoria.map(prod => 
                prod.producto_id === producto_id 
                  ? {
                      ...prod,
                      arrobas_necesarias: Number(response.data.arrobas_necesarias),
                      latas_necesarias: Number(response.data.latas_necesarias),
                      libras_necesarias: Number(response.data.libras_necesarias)
                    }
                  : prod
              );
              
              // Calcular nuevos totales asegurando que sean números
              const nuevasArrobas = productosActualizados.reduce(
                (sum, prod) => sum + (Number(prod.arrobas_necesarias) || 0), 0
              );
              const nuevasLatas = productosActualizados.reduce(
                (sum, prod) => sum + (Number(prod.latas_necesarias) || 0), 0
              );
              const nuevasLibras = productosActualizados.reduce(
                (sum, prod) => sum + (Number(prod.libras_necesarias) || 0), 0
              );
              
              console.log('Nuevos totales calculados:', {
                categoria: categoriaDelProducto,
                arrobas: nuevasArrobas,
                latas: nuevasLatas,
                libras: nuevasLibras
              });
              
              return {
                ...item,
                arrobas_necesarias: nuevasArrobas,
                latas_necesarias: nuevasLatas,
                libras_necesarias: nuevasLibras
              };
            }
            
            return item;
          });
          
          return updatedData;
        });
        
        toast.success('Cantidad actualizada correctamente');
      } else {
        toast.error(response.message || 'Error al actualizar la cantidad');
      }
    } catch (err) {
      console.error('Error completo:', err);
      toast.error('Error al actualizar la cantidad');
    } finally {
      setUpdatingProduct(false);
    }
  };


  return (
    <div className="container mx-auto px-0 sm:px-4 py-2 sm:py-6 max-w-6xl text-left">

      <Header 
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        handleGeneratePDF={generatePDF}
        generatingPDF={generatingPDF}
        isLoading={isLoading || updatingProduct}
      />

      {isLoading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="bg-red-50 border border-red-100 text-red-800 p-4 rounded-lg text-center text-sm">{error}</div>
      ) : (
        <>
          {/* Resumen del día */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4">
            {summary.map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-card rounded-lg border border-border shadow-soft p-2.5 sm:p-5">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] sm:text-sm font-medium text-muted-foreground truncate">{label}</p>
                  <div className="hidden sm:flex p-2 rounded-lg bg-primary/10">
                    <Icon className="text-primary w-4 h-4" />
                  </div>
                </div>
                <p className="text-xl sm:text-3xl font-display font-bold text-foreground mt-1 sm:mt-2">{value}</p>
              </div>
            ))}
          </div>

          {/* Búsqueda de productos */}
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-muted-foreground" />
            </div>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar producto"
              className="w-full pl-10 pr-3 py-2.5 text-sm rounded-lg border border-border bg-card shadow-soft focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {visibleCategories.length === 0 ? (
            <div className="bg-card rounded-lg border border-border shadow-soft p-10 flex flex-col items-center text-center">
              <div className="p-4 rounded-full bg-muted mb-3">
                <FiInbox className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground">
                {search ? 'Ningún producto coincide con la búsqueda' : 'No hay producción para esta fecha'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {visibleCategories.map(([categoria, items]) => (
                <CategoryTable 
                  key={categoria} 
                  categoria={categoria} 
                  items={items} 
                  onUpdateQuantity={handleUpdateQuantity}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProductionConsolidated;