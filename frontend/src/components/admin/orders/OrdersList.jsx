import React from 'react';
import { Link } from 'react-router-dom';
import { FiChevronRight, FiUser, FiPackage, FiMapPin, FiInbox } from 'react-icons/fi';

// Color del indicador lateral según estado
const STATUS_ACCENT = {
  solicitado: 'bg-purple-400',
  pendiente: 'bg-yellow-400',
  en_proceso: 'bg-blue-400',
  completado: 'bg-green-500',
  cancelado: 'bg-red-400',
  entregado: 'bg-green-500'
};

// Función para formatear el estado para mostrar
const formatStatus = (status) => {
  const statusLabels = {
    solicitado: 'Solicitado',
    pendiente: 'Pendiente',
    en_proceso: 'En Proceso',
    completado: 'Completado',
    cancelado: 'Cancelado',
    entregado: 'Entregado'
  };
  return statusLabels[status] || status;
};

const OrdersList = ({ orders, isLoading, error, getStatusColor, onViewDetails, emptyMessage = 'No se encontraron pedidos' }) => {
  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border border-border shadow-soft divide-y divide-border">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="p-4 animate-pulse">
            <div className="flex justify-between mb-3">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-5 w-20 bg-muted rounded-full" />
            </div>
            <div className="h-3 w-40 bg-muted rounded mb-2" />
            <div className="h-3 w-28 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500 text-center">
        {error}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-border shadow-soft p-10 flex flex-col items-center text-center">
        <div className="p-4 rounded-full bg-muted mb-3">
          <FiInbox className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="font-medium text-foreground">{emptyMessage}</p>
        <p className="text-sm text-muted-foreground mt-1">Prueba con otra fecha o estado.</p>
      </div>
    );
  }

  const handleClick = (e, id) => {
    if (onViewDetails) {
      e.preventDefault();
      onViewDetails(id);
    }
  };

  const StatusBadge = ({ status }) => (
    <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${getStatusColor(status)}`}>
      {formatStatus(status)}
    </span>
  );

  return (
    <>
      {/* Vista móvil: tarjetas */}
      <div className="md:hidden space-y-3">
        {orders.map(order => (
          <Link
            key={order.id}
            to={`/admin/orders/${order.id}`}
            onClick={(e) => handleClick(e, order.id)}
            className="relative block bg-card rounded-lg border border-border shadow-soft overflow-hidden active:bg-muted transition-colors"
          >
            <span className={`absolute inset-y-0 left-0 w-1 ${STATUS_ACCENT[order.estado] || 'bg-gray-300'}`} />
            <div className="p-4 pl-5">
              <div className="flex justify-between items-center gap-2">
                <p className="text-xs font-medium text-muted-foreground">Pedido #{order.id}</p>
                <StatusBadge status={order.estado} />
              </div>
              <h3 className="font-semibold text-foreground truncate mt-1">
                {order.cliente_nombre || 'Cliente sin nombre'}
              </h3>

              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-4 min-w-0 text-sm text-muted-foreground">
                  {order.sucursal_nombre && (
                    <span className="flex items-center min-w-0">
                      <FiMapPin className="mr-1 flex-shrink-0" size={14} />
                      <span className="truncate">{order.sucursal_nombre}</span>
                    </span>
                  )}
                  <span className="flex items-center flex-shrink-0">
                    <FiPackage className="mr-1" size={14} />
                    {order.total_productos ? `${order.total_productos} productos` : 'Ver detalle'}
                  </span>
                </div>
                <FiChevronRight className="text-muted-foreground flex-shrink-0" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Vista desktop: tabla */}
      <div className="hidden md:block bg-card rounded-lg border border-border shadow-soft overflow-hidden">
        <div className="grid grid-cols-[110px_1fr_1fr_120px_130px_32px] gap-4 px-5 py-3 bg-muted/60 border-b border-border text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <span>Pedido</span>
          <span>Cliente</span>
          <span>Sucursal</span>
          <span>Productos</span>
          <span>Estado</span>
          <span />
        </div>
        <div className="divide-y divide-border">
          {orders.map(order => (
            <Link
              key={order.id}
              to={`/admin/orders/${order.id}`}
              onClick={(e) => handleClick(e, order.id)}
              className="group grid grid-cols-[110px_1fr_1fr_120px_130px_32px] gap-4 items-center px-5 py-3.5 text-sm hover:bg-muted/50 transition-colors"
            >
              <span className="font-semibold text-foreground">#{order.id}</span>
              <span className="flex items-center min-w-0 text-foreground">
                <FiUser className="mr-2 flex-shrink-0 text-muted-foreground" size={14} />
                <span className="truncate">{order.cliente_nombre || 'Cliente sin nombre'}</span>
              </span>
              <span className="flex items-center min-w-0 text-muted-foreground">
                {order.sucursal_nombre ? (
                  <>
                    <FiMapPin className="mr-2 flex-shrink-0" size={14} />
                    <span className="truncate">{order.sucursal_nombre}</span>
                  </>
                ) : (
                  <span>—</span>
                )}
              </span>
              <span className="flex items-center text-muted-foreground">
                <FiPackage className="mr-2 flex-shrink-0" size={14} />
                {order.total_productos || 0}
              </span>
              <span>
                <StatusBadge status={order.estado} />
              </span>
              <FiChevronRight className="text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </Link>
          ))}
        </div>
      </div>
    </>
  );
};

export default OrdersList;
