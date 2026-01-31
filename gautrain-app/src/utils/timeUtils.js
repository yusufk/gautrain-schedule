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
 * Generate Google Maps URL for navigation to station with arrival time
 * Subtracts 20 minutes from train departure time to account for parking and walking
 */
export function getGoogleMapsUrl(stationName, lat, lon, trainDepartureTime) {
  // Calculate arrival time (20 minutes before train departure)
  const arrivalTime = new Date(trainDepartureTime);
  arrivalTime.setMinutes(arrivalTime.getMinutes() - 20);
  
  // Format time for Google Maps (Unix timestamp in seconds)
  const arrivalTimestamp = Math.floor(arrivalTime.getTime() / 1000);
  
  // Build Google Maps URL with destination, travelmode, and arrival time
  const destination = `${lat},${lon}`;
  const url = new URL('https://www.google.com/maps/dir/');
  url.searchParams.set('api', '1');
  url.searchParams.set('destination', destination);
  url.searchParams.set('travelmode', 'driving');
  url.searchParams.set('dir_action', 'navigate');
  
  // Note: Google Maps doesn't support arrival_time for driving, but we'll include it in the label
  const label = `${stationName} Gautrain Station (Arrive by ${format(arrivalTime, 'HH:mm')})`;
  url.searchParams.set('destination_place_id', label);
  
  return url.toString();
}

/**
 * Get relative time ("in 8 minutes", "5 minutes ago")
 */
export function getRelativeTime(date) {
  return formatDistance(date, new Date(), { addSuffix: true });
}
