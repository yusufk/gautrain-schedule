/**
 * Gautrain Schedule Service
 * Generates train times based on frequency logic and checks API for delays
 */

const API_BASE_URL = 'https://api.gautrain.co.za';
const GAUTRAIN_AGENCY_ID = 'edObkk6o-0WN3tNZBLqKPg';

// Travel time between consecutive stations (minutes)
const TRAVEL_TIMES = {
  'Park-Rosebank': 4,
  'Rosebank-Sandton': 4,
  'Sandton-Marlboro': 4,
  'Marlboro-Midrand': 7,
  'Midrand-Centurion': 9,
  'Centurion-Pretoria': 8,
  'Pretoria-Hatfield': 6,
  'Marlboro-Rhodesfield': 13,
  'Rhodesfield-ORTIA': 4,
};

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
  { id: 'nsg0gaT4zkWiYlX31c18Ew', name: 'ORTIA', lat: -26.13225, lon: 28.23127, order: 4, line: 'airport', aliases: ['OR Tambo'] },
];

// Available lines
export const LINES = [
  { id: 'north-south', name: 'North-South Line', description: 'Park ↔ Hatfield' },
  { id: 'airport', name: 'Airport Line', description: 'Sandton ↔ ORTIA' },
];

/**
 * Load schedule logic from JSON
 */
async function loadSchedule() {
  if (scheduleCache) return scheduleCache;
  
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
 * Check if time is in peak hours
 */
export function isPeakTime(time) {
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
 * Check if date is weekend or public holiday
 */
function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/**
 * Get frequency in minutes based on schedule and time
 */
function getFrequency(schedule, time, dayType) {
  if (dayType === 'weekend') {
    // Parse weekend frequency (e.g., "Every 30 minutes (early/late) or 20 minutes (daytime)")
    const hours = time.getHours();
    if (hours < 7 || hours >= 19) {
      return 30; // Early/late
    }
    return 20; // Daytime
  } else {
    // Weekday - check peak vs off-peak
    return isPeakTime(time) ? 10 : 20;
  }
}

/**
 * Calculate travel time between two stations
 */
function calculateTravelTime(stations, fromIndex, toIndex) {
  let totalMinutes = 0;
  const start = Math.min(fromIndex, toIndex);
  const end = Math.max(fromIndex, toIndex);
  
  for (let i = start; i < end; i++) {
    const from = stations[i];
    const to = stations[i + 1];
    const key = `${from}-${to}`;
    const reverseKey = `${to}-${from}`;
    totalMinutes += TRAVEL_TIMES[key] || TRAVEL_TIMES[reverseKey] || 5; // Default 5 min
  }
  
  return totalMinutes;
}

/**
 * Generate train times based on frequency logic
 */
function generateTrainTimes(schedule, referenceTime, maxItineraries) {
  const dayType = isWeekend(referenceTime) ? 'weekend' : 'weekday';
  const frequency = getFrequency(schedule, referenceTime, dayType);
  
  // Parse first train time
  const firstTrainTime = schedule.first_train_departure || '05:30';
  const [firstHour, firstMinute] = firstTrainTime.split(':').map(Number);
  
  const trains = [];
  const now = new Date(referenceTime);
  let currentTime = new Date(now);
  currentTime.setHours(firstHour, firstMinute, 0, 0);
  
  // Generate trains for the day
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59);
  
  while (currentTime <= endOfDay && trains.length < 100) {
    trains.push(new Date(currentTime));
    currentTime = new Date(currentTime.getTime() + frequency * 60 * 1000);
  }
  
  return trains;
}

/**
 * Check API for delays on a specific journey
 */
async function checkForDelays(fromStation, toStation, scheduledDeparture) {
  try {
    // Call the Gautrain API to check for real-time delays
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
 * Plan a journey
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
  const now = time || new Date();
  const dayType = isWeekend(now) ? 'Weekends and Public Holidays' : 'Weekdays (Excluding Public Holidays)';
  
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
  
  // Use the first matching schedule
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
  
  const travelTimeMinutes = calculateTravelTime(schedule.stations, fromIndex, toIndex);
  
  // Generate train times
  const trainTimes = generateTrainTimes(schedule, now, maxItineraries * 2);
  
  // Filter based on time type
  let filteredTrains = [];
  
  if (timeType === 'DepartWindow' && timeWindow) {
    filteredTrains = trainTimes.filter(t => t >= timeWindow.start && t <= timeWindow.end);
    // Sort by proximity to target
    filteredTrains.sort((a, b) => {
      const diffA = Math.abs(a - timeWindow.target);
      const diffB = Math.abs(b - timeWindow.target);
      return diffA - diffB;
    });
  } else if (timeType === 'ArriveBefore' && time) {
    filteredTrains = trainTimes.filter(t => {
      const arrival = new Date(t.getTime() + travelTimeMinutes * 60 * 1000);
      return t > now && arrival <= time;
    });
    filteredTrains.sort((a, b) => b - a); // Latest first
  } else {
    // DepartAfter
    const buffer = new Date(now.getTime() + 60000); // 1 min buffer
    filteredTrains = trainTimes.filter(t => t > buffer);
  }
  
  // Take only the requested number
  filteredTrains = filteredTrains.slice(0, maxItineraries);
  
  // Convert to itinerary objects and check for delays
  const itineraries = await Promise.all(
    filteredTrains.map(async (departureTime) => {
      const arrivalTime = new Date(departureTime.getTime() + travelTimeMinutes * 60 * 1000);
      
      // Check API for delays
      const delayInfo = await checkForDelays(fromStation, toStation, departureTime);
      
      return {
        id: `scheduled-${departureTime.getTime()}`,
        departureTime: delayInfo?.realDeparture || departureTime,
        arrivalTime: new Date(arrivalTime.getTime() + (delayInfo?.delayMinutes || 0) * 60 * 1000),
        scheduledDeparture: departureTime,
        duration: travelTimeMinutes * 60, // in seconds
        distance: 0,
        origin: from,
        destination: to,
        line: schedule.line,
        source: 'frequency-logic',
        delay: delayInfo?.delayMinutes || 0,
        hasDelay: delayInfo?.hasDelay || false,
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
  
  // Simplified fare calculation - adjust based on actual Gautrain fares
  const distance = Math.abs(fromStation.order - toStation.order);
  const baseFare = distance * 8;
  return isPeak ? Math.round(baseFare * 1.3) : baseFare;
}

export { isWeekend };
