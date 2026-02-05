/**
 * Gautrain Schedule Service
 * Uses explicit trip times and checks API for delays
 */

const API_BASE_URL = 'https://api.gautrain.co.za';
const GAUTRAIN_AGENCY_ID = 'edObkk6o-0WN3tNZBLqKPg';

let scheduleCache = null;

export const STATIONS = [
  // North-South Line
  { id: 'TGRd5ew380mY3kfLhM2f6A', name: 'Park', lat: -26.20476, lon: 28.04559, order: 1, line: 'north-south' },
  { id: 'gikqF3ZsE0uMWbXJgCh_rA', name: 'Rosebank', lat: -26.14808, lon: 28.04105, order: 2, line: 'north-south' },
  { id: 'jXU-OlvxukW8wfc7JeVeXw', name: 'Sandton', lat: -26.10858, lon: 28.05693, order: 3, line: 'north-south' },
  { id: 'GqW6XDaSsk-6eFTiiRt46A', name: 'Marlboro', lat: -26.08337, lon: 28.11164, order: 4, line: 'north-south' },
  { id: 'ucS8WAkRbkiKUDPHCVxSYA', name: 'Midrand', lat: -25.99555, lon: 28.13586, order: 5, line: 'north-south' },
  { id: 'l99Qqgtul0imZWPofLfzyA', name: 'Centurion', lat: -25.85161, lon: 28.1897, order: 6, line: 'north-south' },
  { id: 'hv_Bf87q50W48rwIUwqCTg', name: 'Pretoria', lat: -25.75866, lon: 28.18988, order: 7, line: 'north-south' },
  { id: '_rkqSHvRE0Scvbcsuy0EVw', name: 'Hatfield', lat: -25.74762, lon: 28.23794, order: 8, line: 'north-south' },
  // Airport Line
  { id: 'nOZz7-NPrEmB2KacALquAA', name: 'Rhodesfield', lat: -26.12732, lon: 28.22461, order: 3, line: 'airport' },
  { id: 'nsg0gaT4zkWiYlX31c18Ew', name: 'OR Tambo', lat: -26.13225, lon: 28.23127, order: 4, line: 'airport', aliases: ['ORTIA'] },
];

// Available lines
export const LINES = [
  { id: 'north-south', name: 'North-South Line', description: 'Park ↔ Hatfield' },
  { id: 'airport', name: 'Airport Line', description: 'Sandton ↔ ORTIA' },
];

/**
 * Load schedule from JSON
 */
async function loadSchedule() {
  if (scheduleCache) return scheduleCache;
  
  // In test environment, load directly
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
    const fs = await import('fs');
    const path = await import('path');
    const filePath = path.join(process.cwd(), 'public', 'gautrain_schedules.json');
    const data = fs.readFileSync(filePath, 'utf-8');
    scheduleCache = JSON.parse(data);
    return scheduleCache;
  }
  
  // In browser, use fetch
  const baseUrl = import.meta.env.BASE_URL || '/';
  const response = await fetch(`${baseUrl}gautrain_schedules.json`);
  scheduleCache = await response.json();
  return scheduleCache;
}

/**
 * Get station by name (supports aliases)
 */
export function getStationByName(name) {
  const station = STATIONS.find(s => 
    s.name.toLowerCase() === name.toLowerCase() || 
    s.aliases?.some(a => a.toLowerCase() === name.toLowerCase())
  );
  return station;
}

/**
 * Get stations by line
 */
export function getStationsByLine(lineId) {
  return STATIONS.filter(s => s.line === lineId).sort((a, b) => a.order - b.order);
}

/**
 * Check if date is weekend or public holiday
 */
function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/**
 * Check if time is in peak hours (weekdays 06:00-08:30 and 15:00-18:30)
 */
export function isPeakTime(time) {
  // Only weekdays have peak times
  if (isWeekend(time)) return false;
  
  const hours = time.getHours();
  const minutes = time.getMinutes();
  const totalMinutes = hours * 60 + minutes;
  
  const morningPeakStart = 6 * 60; // 06:00
  const morningPeakEnd = 8 * 60 + 30; // 08:30
  const eveningPeakStart = 15 * 60; // 15:00
  const eveningPeakEnd = 18 * 60 + 30; // 18:30
  
  return (totalMinutes >= morningPeakStart && totalMinutes <= morningPeakEnd) ||
         (totalMinutes >= eveningPeakStart && totalMinutes <= eveningPeakEnd);
}

/**
 * Parse time string (HH:MM) and apply to a date
 */
function parseTime(timeStr, baseDate) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date(baseDate);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

/**
 * Check API for delays on a specific journey
 */
async function checkForDelays(fromStation, toStation, scheduledDeparture) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch(
      `${API_BASE_URL}/journey-service/api/0/mobile/planJourney/1.0.0`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agencyID: GAUTRAIN_AGENCY_ID,
          fromLat: fromStation.lat,
          fromLon: fromStation.lon,
          toLat: toStation.lat,
          toLon: toStation.lon,
          departureTime: scheduledDeparture.toISOString(),
          maxItineraries: 1,
        }),
        signal: controller.signal,
      }
    );
    
    clearTimeout(timeoutId);
    
    if (!response.ok) return null;
    
    const data = await response.json();
    if (data.itineraries && data.itineraries.length > 0) {
      const itinerary = data.itineraries[0];
      const apiDeparture = new Date(itinerary.startTime);
      const delayMinutes = Math.round((apiDeparture - scheduledDeparture) / 60000);
      
      return {
        hasDelay: delayMinutes > 0,
        delayMinutes,
        realDeparture: apiDeparture,
      };
    }
    
    return null;
  } catch (error) {
    console.warn('Could not fetch delay info from API:', error.message);
    return null;
  }
}

/**
 * Plan a journey using explicit trip times
 * @param {Object} options - Journey options
 * @param {string} options.from - Origin station name
 * @param {string} options.to - Destination station name
 * @param {string} options.timeType - 'DepartAfter', 'ArriveBefore', or 'DepartWindow'
 * @param {Date} options.time - Time for journey (or null for now)
 * @param {Object} options.timeWindow - For DepartWindow: {start, end, target}
 * @param {number} options.maxItineraries - Max number of results
 * @returns {Promise<Array>} Array of itineraries
 */
export async function planJourney({ from, to, timeType = 'DepartAfter', time = null, timeWindow = null, maxItineraries = 5 }) {
  const fromStation = getStationByName(from);
  const toStation = getStationByName(to);
  
  if (!fromStation || !toStation) {
    throw new Error('Invalid station names');
  }
  
  const schedules = await loadSchedule();
  const referenceTime = time || new Date();
  const dayType = isWeekend(referenceTime) ? 'Weekends and Public Holidays' : 'Weekdays (Excluding Public Holidays)';
  
  // Find matching schedule
  const matchingSchedules = schedules.filter(s => {
    const hasFrom = s.stations.some(name => 
      name === fromStation.name || fromStation.aliases?.includes(name)
    );
    const hasTo = s.stations.some(name => 
      name === toStation.name || toStation.aliases?.includes(name)
    );
    return s.schedule_type === dayType && hasFrom && hasTo;
  });
  
  if (matchingSchedules.length === 0) {
    throw new Error('No schedule found for this route');
  }
  
  const schedule = matchingSchedules[0];
  
  // Find actual station names in schedule
  const fromName = schedule.stations.find(name => 
    name === fromStation.name || fromStation.aliases?.includes(name)
  );
  const toName = schedule.stations.find(name => 
    name === toStation.name || toStation.aliases?.includes(name)
  );
  
  const fromIndex = schedule.stations.indexOf(fromName);
  const toIndex = schedule.stations.indexOf(toName);
  
  if (fromIndex === -1 || toIndex === -1) {
    throw new Error('Stations not found in schedule');
  }
  
  // Extract all trips with departure and arrival times
  const allTrips = schedule.trips.map(trip => {
    const departureTimeStr = trip.times[fromIndex];
    const arrivalTimeStr = trip.times[toIndex];
    const departureTime = parseTime(departureTimeStr, referenceTime);
    const arrivalTime = parseTime(arrivalTimeStr, referenceTime);
    const durationSeconds = Math.abs(Math.round((arrivalTime - departureTime) / 1000));
    
    return {
      departureTime,
      arrivalTime,
      duration: durationSeconds,
      is8Car: trip.eight_car,
    };
  });
  
  // Filter based on time type
  let filteredTrips = [];
  
  if (timeType === 'DepartWindow' && timeWindow) {
    filteredTrips = allTrips.filter(t => 
      t.departureTime >= timeWindow.start && t.departureTime <= timeWindow.end
    );
    // Sort by proximity to target
    filteredTrips.sort((a, b) => {
      const diffA = Math.abs(a.departureTime - timeWindow.target);
      const diffB = Math.abs(b.departureTime - timeWindow.target);
      return diffA - diffB;
    });
  } else if (timeType === 'ArriveBefore' && time) {
    filteredTrips = allTrips.filter(t => 
      t.departureTime > referenceTime && t.arrivalTime <= time
    );
    filteredTrips.sort((a, b) => b.departureTime - a.departureTime); // Latest first
  } else {
    // DepartAfter
    const buffer = new Date(referenceTime.getTime() + 60000); // 1 min buffer
    filteredTrips = allTrips.filter(t => t.departureTime > buffer);
  }
  
  // Take only the requested number
  filteredTrips = filteredTrips.slice(0, maxItineraries);
  
  // Convert to itinerary objects and check for delays
  const itineraries = await Promise.all(
    filteredTrips.map(async (trip) => {
      // Check API for delays
      const delayInfo = await checkForDelays(fromStation, toStation, trip.departureTime);
      
      return {
        id: `trip-${trip.departureTime.getTime()}`,
        departureTime: delayInfo?.realDeparture || trip.departureTime,
        arrivalTime: new Date(trip.arrivalTime.getTime() + (delayInfo?.delayMinutes || 0) * 60 * 1000),
        scheduledDeparture: trip.departureTime,
        duration: trip.duration,
        distance: 0,
        origin: from,
        destination: to,
        line: schedule.line,
        source: 'explicit-schedule',
        delay: delayInfo?.delayMinutes || 0,
        hasDelay: delayInfo?.hasDelay || false,
        is8Car: trip.is8Car,
      };
    })
  );
  
  return itineraries;
}

/**
 * Estimate fare between stations
 */
export function estimateFare(from, to, isPeak = false) {
  const fromStation = getStationByName(from);
  const toStation = getStationByName(to);
  
  if (!fromStation || !toStation) return 0;
  
  // Simplified fare calculation
  const distance = Math.abs(fromStation.order - toStation.order);
  const baseFare = distance * 8;
  return isPeak ? Math.round(baseFare * 1.3) : baseFare;
}

export { isWeekend };
