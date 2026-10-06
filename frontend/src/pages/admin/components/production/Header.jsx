import React from 'react';
import { FiDownload, FiArrowLeft, FiCalendar, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { formatDate, shiftDate } from '../../../../utils/dateUtils';

const Header = ({ dateFilter, setDateFilter, handleGeneratePDF, generatingPDF, isLoading }) => {
  const navigate = useNavigate();

  return (
    <div className="mb-4 sm:mb-6">
      <div className="flex items-start gap-3 mb-4">
        <button
          onClick={() => navigate('/admin/orders')}
          className="p-2 -ml-2 mt-0.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Volver a pedidos"
        >
          <FiArrowLeft className="text-xl" />
        </button>
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-display font-semibold text-foreground">
            Consolidado de Producción
          </h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center">
            <FiCalendar className="mr-1.5 flex-shrink-0" size={14} />
            {formatDate(dateFilter)}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        {/* Selector de fecha con navegación por día */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDateFilter(shiftDate(dateFilter, -1))}
            className="flex-shrink-0 p-2.5 rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Día anterior"
          >
            <FiChevronLeft />
          </button>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => e.target.value && setDateFilter(e.target.value)}
            aria-label="Fecha"
            className="flex-1 min-w-0 sm:w-44 px-3 py-2 text-sm rounded-lg border border-border bg-card focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            onClick={() => setDateFilter(shiftDate(dateFilter, 1))}
            className="flex-shrink-0 p-2.5 rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Día siguiente"
          >
            <FiChevronRight />
          </button>
        </div>

        <button
          onClick={handleGeneratePDF}
          disabled={generatingPDF || isLoading}
          className="sm:ml-auto flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 shadow-soft transition-colors disabled:opacity-50"
        >
          {generatingPDF ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"/>
          ) : (
            <>
              <FiDownload size={16} />
              <span>Descargar PDF</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Header;
