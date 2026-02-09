/**
 * Time formatting utilities
 */
import { format, formatDistance, intervalToDuration, formatDuration } from 'date-fns';

/**
 * Format time as HH:MM:SS
 */
export function formatTime(date) {
  return format(date, 'HH:mm:ss');
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
 * Generate Google Maps URL for navigation to station with departure time
 * Sets departure time to 20 minutes before train departure to arrive on time
 * Note: Google Maps only supports "arrive by" for transit, not driving
 */
export function getGoogleMapsUrl(stationName, lat, lon, trainDepartureTime) {
  // Calculate when to leave (20 minutes before train departure)
  const departureTime = new Date(trainDepartureTime);
  departureTime.setMinutes(departureTime.getMinutes() - 20);
  
  // Format time for Google Maps (Unix timestamp in seconds)
  const departureTimestamp = Math.floor(departureTime.getTime() / 1000);
  
  // Build Google Maps URL with destination and departure time
  const destination = `${lat},${lon}`;
  const url = new URL('https://www.google.com/maps/dir/');
  url.searchParams.set('api', '1');
  url.searchParams.set('destination', destination);
  url.searchParams.set('travelmode', 'driving');
  url.searchParams.set('dir_action', 'navigate');
  url.searchParams.set('departure_time', departureTimestamp);
  
  return url.toString();
}

/**
 * Get relative time ("in 8 minutes", "5 minutes ago")
 */
export function getRelativeTime(date) {
  return formatDistance(date, new Date(), { addSuffix: true });
}

/**
 * Generate calendar/reminder URLs for various platforms
 * Creates a universal reminder 20 minutes before departure
 */
export function getCalendarUrl(origin, destination, departureTime, duration) {
  const reminderTime = new Date(departureTime);
  reminderTime.setMinutes(reminderTime.getMinutes() - 20);
  
  const arrivalTime = new Date(departureTime);
  arrivalTime.setSeconds(arrivalTime.getSeconds() + duration);
  
  const title = `Gautrain: ${origin} → ${destination}`;
  const description = `Depart ${origin} at ${formatTime(departureTime)}\\nArrive ${destination} at ${formatTime(arrivalTime)}\\n\\nLeave 20 minutes early to reach the station on time.`;
  
  // Format dates for calendar (YYYYMMDDTHHMMSS)
  const formatCalendarDate = (date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };
  
  const startTime = formatCalendarDate(reminderTime);
  const endTime = formatCalendarDate(arrivalTime);
  
  // Google Calendar URL
  const googleUrl = new URL('https://calendar.google.com/calendar/render');
  googleUrl.searchParams.set('action', 'TEMPLATE');
  googleUrl.searchParams.set('text', title);
  googleUrl.searchParams.set('dates', `${startTime}/${endTime}`);
  googleUrl.searchParams.set('details', description);
  
  return googleUrl.toString();
}

/**
 * Generate webcal ICS file content for device-neutral calendar import
 * iOS and Calendar app compatible
 */
export function generateICSContent(origin, destination, departureTime, duration) {
  const reminderTime = new Date(departureTime);
  reminderTime.setMinutes(reminderTime.getMinutes() - 20);
  
  const arrivalTime = new Date(departureTime);
  arrivalTime.setSeconds(arrivalTime.getSeconds() + duration);
  
  const title = `Gautrain: ${origin} → ${destination}`;
  const description = `Depart ${origin} at ${formatTime(departureTime)}\\nArrive ${destination} at ${formatTime(arrivalTime)}\\n\\nLeave 20 minutes early to reach the station on time.`;
  
  const formatICSDate = (date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };
  
  // Generate unique ID for the event
  const eventId = `gautrain-${departureTime.getTime()}-${origin}-${destination}@gautrain-schedule.app`;
  const now = new Date();
  
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Gautrain Schedule//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${eventId}`,
    `DTSTAMP:${formatICSDate(now)}`,
    `DTSTART:${formatICSDate(reminderTime)}`,
    `DTEND:${formatICSDate(arrivalTime)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'BEGIN:VALARM',
    'TRIGGER:-PT0M',
    'ACTION:DISPLAY',
    `DESCRIPTION:Time to leave for ${origin} station!`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
  
  return icsContent;
}
