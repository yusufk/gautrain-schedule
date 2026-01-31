/**
 * Time formatting utilities
 */
import { format, formatDistance, intervalToDuration, formatDuration } from 'date-fns';

/**
 * Format time as HH:MM
 */
export function formatTime(date) {
  return format(date, 'HH:mm');
}

/**
 * Format date and time
 */
export function formatDateTime(date) {
  return format(date, 'EEE, dd MMM yyyy • HH:mm');
}

/**
 * Get countdown string ("Leaves in 8 min" or "Departed 5 min ago")
 */
export function getCountdown(date) {
  const now = new Date();
  const diff = date - now;
  
  if (diff < 0) {
    return `Departed ${formatDistance(date, now)} ago`;
  }
  
  if (diff < 60000) { // Less than 1 minute
    return 'Leaving now';
  }
  
  return `Leaves in ${formatDistance(now, date)}`;
}

/**
 * Format duration in seconds to readable string
 */
export function formatDurationSeconds(seconds) {
  const duration = intervalToDuration({ start: 0, end: seconds * 1000 });
  
  if (duration.hours > 0) {
    return `${duration.hours}h ${duration.minutes}min`;
  }
  
  return `${duration.minutes} min`;
}

/**
 * Get relative time ("in 8 minutes", "5 minutes ago")
 */
export function getRelativeTime(date) {
  return formatDistance(date, new Date(), { addSuffix: true });
}
