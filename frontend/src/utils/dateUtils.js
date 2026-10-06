export const formatDate = (dateString) => {
  if (!dateString) return 'No especificada';
  
  // Ensure date is handled as UTC
  const [year, month, day] = dateString.split('-');
  const date = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
  
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'
  });
};

export function formatDateForInput(date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  let month = '' + (d.getUTCMonth() + 1);
  let day = '' + d.getUTCDate();
  const year = d.getUTCFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
}

// Mueve una fecha (YYYY-MM-DD) N días hacia adelante o atrás
export function shiftDate(dateString, days) {
  const [year, month, day] = dateString.split('-').map(Number);
  return formatDateForInput(new Date(Date.UTC(year, month - 1, day + days)));
}
