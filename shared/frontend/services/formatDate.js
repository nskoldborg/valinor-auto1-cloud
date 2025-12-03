/**
 * Format a date string or Date object into "YYYY-MM-DD HH:MM:SS"
 * @param {string|Date|null} dateInput - The date value to format
 * @returns {string} - Formatted string or "-" if invalid
 */
export function formatDate(dateInput) {
  if (!dateInput) return "-";

  const date = new Date(dateInput);
  if (isNaN(date)) return "-"; // Invalid date fallback

  const pad = (num) => num.toString().padStart(2, "0");

  return (
    date.getFullYear() +
    "-" +
    pad(date.getMonth() + 1) +
    "-" +
    pad(date.getDate()) +
    " " +
    pad(date.getHours()) +
    ":" +
    pad(date.getMinutes()) +
    ":" +
    pad(date.getSeconds())
  );
}