import React, { useState, useEffect, useMemo } from 'react';
import { FiPieChart, FiDownload, FiChevronLeft, FiChevronRight, FiSearch, FiCalendar, FiPackage, FiUsers, FiRefreshCw } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import OrderService from '../../services/OrderService';
import OrdersList from '../../components/admin/orders/OrdersList';
import { formatDate, formatDateForInput, shiftDate } from '../../utils/dateUtils';
import { toast } from 'react-hot-toast';

// Estados disponibles para filtrar
const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'solicitado', label: 'Solicitado' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_proceso', label: 'En Proceso' },
  { value: 'completado', label: 'Completado' },
  { value: 'entregado', label: 'Entregado' },
  { value: 'cancelado', label: 'Cancelado' }
];

export default function OrdersManagement() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateFilter, setDateFilter] = useState(formatDateForInput(new Date()));
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Se cargan todos los pedidos del día; el estado se filtra en el cliente
  // para poder mostrar el conteo de cada estado
  useEffect(() => {
    fetchOrdersByDate();
  }, [dateFilter]);

  const fetchOrdersByDate = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await OrderService.getOrdersByDate(dateFilter, 'all');

      if (response.success) {
        setOrders(response.data);
      } else {
        setError(response.message || 'Error al cargar los pedidos');
      }
    } catch (err) {
      console.error('Error al cargar pedidos:', err);
      setError(err.message || 'Error al cargar los pedidos');
      toast.error('Error al cargar los pedidos: ' + (err.message || 'Error desconocido'));
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      solicitado: 'bg-purple-100 text-purple-800',
      pendiente: 'bg-yellow-100 text-yellow-800',
      en_proceso: 'bg-blue-100 text-blue-800',
      completado: 'bg-green-100 text-green-800',
      cancelado: 'bg-red-100 text-red-800',
      entregado: 'bg-green-100 text-green-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  // Conteo de pedidos por estado para las pestañas
  const statusCounts = useMemo(() => {
    return orders.reduce((acc, order) => {
      acc[order.estado] = (acc[order.estado] || 0) + 1;
      return acc;
    }, { all: orders.length });
  }, [orders]);

  // Pedidos filtrados por estado y búsqueda
  const filteredOrders = useMemo(() => {
    const searchLower = search.trim().toLowerCase();
    return orders.filter(order => {
      if (statusFilter !== 'all' && order.estado !== statusFilter) return false;
      if (!searchLower) return true;
      return (
        order.id?.toString().includes(searchLower) ||
        order.cliente_nombre?.toLowerCase().includes(searchLower) ||
        order.sucursal_nombre?.toLowerCase().includes(searchLower)
      );
    });
  }, [orders, statusFilter, search]);

  // Resumen del día
  const summary = useMemo(() => ({
    totalProducts: orders.reduce((acc, order) => acc + Number(order.total_productos || 0), 0),
    totalClients: new Set(orders.map(order => order.cliente_id ?? order.cliente_nombre)).size
  }), [orders]);

  const today = formatDateForInput(new Date());
  const isToday = dateFilter === today;

  // Manejador para el cambio de fecha
  const handleDateChange = (e) => {
    if (e.target.value) setDateFilter(e.target.value);
  };

  // Función para navegar al consolidado pasando la fecha seleccionada
  const navigateToConsolidated = () => {
    navigate('/admin/production/consolidated', {
      state: { selectedDate: dateFilter }
    });
  };

  const summaryItems = [
    { label: 'Pedidos', value: orders.length, icon: FiPackage },
    { label: 'Productos', value: summary.totalProducts, icon: FiPieChart },
    { label: 'Clientes', value: summary.totalClients, icon: FiUsers }
  ];

  return (
    <div className="container mx-auto px-0 sm:px-4 py-2 sm:py-6 max-w-6xl text-left">
      {/* Encabezado */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-semibold text-foreground">
            Gestión de Pedidos
          </h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center">
            <FiCalendar className="mr-1.5 flex-shrink-0" size={14} />
            <span className="first-letter:uppercase">{formatDate(dateFilter)}</span>
            {isToday && (
              <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                Hoy
              </span>
            )}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
          <button
            onClick={alert.bind(null, 'Funcionalidad en desarrollo: Ticket 20/06/2025')}
            className="flex justify-center items-center px-4 py-2.5 text-sm font-medium rounded-lg border border-border bg-card text-foreground hover:bg-muted transition-colors"
          >
            <FiDownload className="mr-2" />
            Descargar
          </button>
          <button
            onClick={navigateToConsolidated}
            className="flex justify-center items-center px-4 py-2.5 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-soft transition-colors"
          >
            <FiPieChart className="mr-2" />
            Consolidado
          </button>
        </div>
      </div>

      {/* Resumen del día */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
        {summaryItems.map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-card rounded-lg border border-border shadow-soft p-3 sm:p-5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] sm:text-sm font-medium text-muted-foreground truncate">{label}</p>
              <div className="hidden sm:flex p-2 rounded-lg bg-primary/10">
                <Icon className="text-primary w-4 h-4" />
              </div>
            </div>
            <p className="text-xl sm:text-3xl font-display font-bold text-foreground mt-1 sm:mt-2">
              {isLoading ? <span className="inline-block h-7 w-10 rounded bg-muted animate-pulse align-middle" /> : value}
            </p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-card rounded-lg border border-border shadow-soft mb-4">
        <div className="p-3 sm:p-4 flex flex-col md:flex-row gap-3">
          {/* Selector de fecha con navegación por día */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDateFilter(shiftDate(dateFilter, -1))}
              className="flex-shrink-0 p-2.5 rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Día anterior"
            >
              <FiChevronLeft />
            </button>
            <input
              id="date-filter"
              type="date"
              value={dateFilter}
              onChange={handleDateChange}
              aria-label="Fecha"
              className="flex-1 min-w-0 md:w-44 px-3 py-2 text-sm rounded-lg border border-border bg-background focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              onClick={() => setDateFilter(shiftDate(dateFilter, 1))}
              className="flex-shrink-0 p-2.5 rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Día siguiente"
            >
              <FiChevronRight />
            </button>
            {!isToday && (
              <button
                onClick={() => setDateFilter(today)}
                className="px-3 py-2 text-sm font-medium rounded-lg text-primary hover:bg-primary/10 transition-colors"
              >
                Hoy
              </button>
            )}
          </div>

          {/* Búsqueda */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-muted-foreground" />
            </div>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por #pedido, cliente o sucursal"
              className="w-full pl-10 pr-3 py-2 text-sm rounded-lg border border-border bg-background focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <button
            onClick={fetchOrdersByDate}
            disabled={isLoading}
            className="hidden md:flex items-center justify-center p-2.5 rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
            aria-label="Actualizar"
            title="Actualizar"
          >
            <FiRefreshCw className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Pestañas de estado (scroll horizontal en móvil) */}
        <div className="border-t border-border px-3 sm:px-4 py-2.5 flex gap-2 overflow-x-auto scrollbar-none">
          {STATUS_OPTIONS.map(({ value, label }) => {
            const isActive = statusFilter === value;
            const count = statusCounts[value] || 0;
            return (
              <button
                key={value}
                onClick={() => setStatusFilter(value)}
                className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-soft'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
                <span
                  className={`text-xs px-1.5 rounded-full ${
                    isActive ? 'bg-white/20' : 'bg-background'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-100 text-red-800 p-4 rounded-lg flex items-center justify-between gap-3">
          <span className="text-sm">{error}</span>
          <button
            onClick={fetchOrdersByDate}
            className="flex-shrink-0 inline-flex items-center text-sm font-medium text-red-700 hover:text-red-900"
          >
            <FiRefreshCw className="mr-1.5" />
            Reintentar
          </button>
        </div>
      ) : (
        <OrdersList
          orders={filteredOrders}
          isLoading={isLoading}
          error={error}
          getStatusColor={getStatusColor}
          onViewDetails={(id) => navigate(`/admin/orders/${id}`)}
          emptyMessage={
            search || statusFilter !== 'all'
              ? 'Ningún pedido coincide con los filtros'
              : 'No hay pedidos para esta fecha'
          }
        />
      )}
    </div>
  );
}
