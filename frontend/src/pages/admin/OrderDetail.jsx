import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiCalendar, FiUser, FiMapPin, FiPackage, FiClipboard, FiPrinter, FiDownload, FiClock, FiMail, FiAlertCircle } from 'react-icons/fi';
import OrderService from '../../services/OrderService';
import { formatDate, formatDateTime } from '../../utils/dateUtils';
import { exportOrderToExcel } from '../../utils/excelUtils';

// Obtener color de badge según estado
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

// Formatear estado para mostrar
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

const formatCurrency = (amount) => `Q${parseFloat(amount || 0).toFixed(2)}`;

// Contenedor común para los estados de carga, error y vacío
const StateContainer = ({ children }) => (
  <div className="container mx-auto px-0 sm:px-4 py-2 sm:py-6 max-w-5xl text-left">
    <Link to="/admin/orders" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
      <FiArrowLeft className="mr-2" />
      Volver a pedidos
    </Link>
    <div className="bg-card rounded-lg border border-border shadow-soft p-10 flex flex-col items-center text-center">
      {children}
    </div>
  </div>
);

const InfoItem = ({ icon: Icon, label, children }) => (
  <div className="flex items-start gap-3">
    <div className="p-2 rounded-lg bg-muted flex-shrink-0">
      <Icon className="text-muted-foreground w-4 h-4" />
    </div>
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground break-words">{children}</p>
    </div>
  </div>
);

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  const fetchOrderDetail = async () => {
    try {
      setIsLoading(true);
      const response = await OrderService.getOrderById(id);
      if (response.success) {
        setOrder(response.data);
      } else {
        setError(response.message || 'Error al cargar el detalle del pedido');
      }
    } catch (err) {
      console.error('Error al cargar detalle del pedido:', err);
      setError(err.message || 'Error al cargar el detalle del pedido');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <StateContainer>
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </StateContainer>
    );
  }

  if (error) {
    return (
      <StateContainer>
        <FiAlertCircle className="w-8 h-8 text-red-500 mb-3" />
        <p className="font-medium text-foreground">{error}</p>
      </StateContainer>
    );
  }

  if (!order) {
    return (
      <StateContainer>
        <p className="font-medium text-foreground">No se encontró el pedido</p>
      </StateContainer>
    );
  }

  const detalles = order.detalles || [];
  const total = detalles.reduce((sum, item) => sum + (item.cantidad * parseFloat(item.precio_unitario || 0)), 0);
  const totalUnidades = detalles.reduce((sum, item) => sum + (Number(item.cantidad) || 0), 0);

  return (
    <div className="container mx-auto px-0 sm:px-4 py-2 sm:py-6 max-w-5xl text-left">
      <Link to="/admin/orders" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 print:hidden">
        <FiArrowLeft className="mr-2" />
        Volver a pedidos
      </Link>

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-4 sm:mb-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-display font-semibold text-foreground">
              Pedido #{order.id}
            </h1>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getStatusColor(order.estado)}`}>
              {formatStatus(order.estado)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1 truncate">
            {order.cliente_nombre || 'Cliente no especificado'}
            {order.sucursal_nombre && ` · ${order.sucursal_nombre}`}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3 print:hidden">
          <button
            onClick={() => window.print()}
            className="flex justify-center items-center px-4 py-2.5 text-sm font-medium rounded-lg border border-border bg-card text-foreground hover:bg-muted transition-colors"
            title="Imprimir detalle del pedido"
          >
            <FiPrinter className="mr-2" size={16} />
            Imprimir
          </button>
          <button
            onClick={() => exportOrderToExcel(order)}
            className="flex justify-center items-center px-4 py-2.5 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-soft transition-colors"
            title="Exportar a Excel"
          >
            <FiDownload className="mr-2" size={16} />
            Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 items-start">
        {/* Información del pedido */}
        <div className="bg-card rounded-lg border border-border shadow-soft p-4 sm:p-5">
          <h2 className="font-display font-semibold text-foreground mb-4">Información del pedido</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            <InfoItem icon={FiCalendar} label="Fecha del pedido">
              {formatDate(order.fecha)}
            </InfoItem>

            {order.created_at && (
              <InfoItem icon={FiClock} label="Creado">
                {formatDateTime(order.created_at, true)}
              </InfoItem>
            )}

            <InfoItem icon={FiUser} label="Cliente">
              {order.cliente_nombre || 'No especificado'}
            </InfoItem>

            {order.sucursal_nombre && (
              <InfoItem icon={FiMapPin} label="Sucursal">
                {order.sucursal_nombre}
              </InfoItem>
            )}

            {order.usuario_email && (
              <InfoItem icon={FiMail} label="Solicitado por">
                {order.usuario_email}
              </InfoItem>
            )}
          </div>

          {order.observaciones && (
            <div className="mt-4 p-3 rounded-lg bg-yellow-50 border border-yellow-100">
              <p className="flex items-center text-xs font-semibold text-yellow-800 mb-1">
                <FiClipboard className="mr-1.5" size={14} />
                Observaciones
              </p>
              <p className="text-sm text-yellow-900 whitespace-pre-line">{order.observaciones}</p>
            </div>
          )}
        </div>

        {/* Productos */}
        <div className="lg:col-span-2 bg-card rounded-lg border border-border shadow-soft overflow-hidden">
          <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-border">
            <h2 className="font-display font-semibold text-foreground">Productos</h2>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground whitespace-nowrap">
              {detalles.length} {detalles.length === 1 ? 'producto' : 'productos'}
            </span>
          </div>

          {detalles.length > 0 ? (
            <>
              <div className="divide-y divide-border">
                {detalles.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 px-4 sm:px-5 py-3">
                    <div className="hidden sm:flex p-2 rounded-lg bg-primary/10 flex-shrink-0">
                      <FiPackage className="text-primary w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm leading-snug">{item.producto_nombre}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.presentacion_nombre && `${item.presentacion_nombre} · `}
                        {item.cantidad} × {formatCurrency(item.precio_unitario)}
                      </p>
                    </div>
                    <p className="font-semibold text-foreground text-sm tabular-nums flex-shrink-0">
                      {formatCurrency(item.cantidad * parseFloat(item.precio_unitario || 0))}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center px-4 sm:px-5 py-4 bg-primary/5 border-t border-border">
                <div>
                  <p className="font-medium text-foreground">Total</p>
                  <p className="text-xs text-muted-foreground">{totalUnidades} unidades</p>
                </div>
                <p className="text-xl font-display font-bold text-foreground tabular-nums">{formatCurrency(total)}</p>
              </div>
            </>
          ) : (
            <p className="text-center text-muted-foreground py-10">No hay productos en este pedido</p>
          )}
        </div>
      </div>
    </div>
  );
}
