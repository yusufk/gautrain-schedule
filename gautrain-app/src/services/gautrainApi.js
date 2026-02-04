/**
 * Gautrain API Service
 * Handles API calls to Gautrain journey planning API with fallback to static data
 */

const API_BASE_URL = 'https://api.gautrain.co.za';
const GAUTRAIN_AGENCY_ID = 'edObkk6o-0WN3tNZBLqKPg';

// Station data with coordinates (from API)
// North-South Line stations with order for direction detection
const NORTH_SOUTH_STATIONS = {
  'Park': { order: 1 },
  'Rosebank': { order: 2 },
  'Sandton': { order: 3 },
  'Marlboro': { order: 4 },
  'Midrand': { order: 5 },
  'Centurion': { order: 6 },
  'Pretoria': { order: 7 },
  'Hatfield': { order: 8 }
};

// Airport Line stations with order for direction detection
const AIRPORT_STATIONS = {
  'Sandton': { order: 1 },
  'Marlboro': { order: 2 },
  'Rhodesfield': { order: 3 },
  'OR Tambo': { order: 4 }
};

// Airport-only stations (not on North-South line)
const AIRPORT_ONLY_STATIONS = ['Rhodesfield', 'OR Tambo'];

export const STATIONS = [
  // North-South Line (Park to Hatfield)
  { id: 'TGRd5ew380mY3kfLhM2f6A', name: 'Park', lat: -26.20476, lon: 28.04559, order: 1, line: 'north-south' },
  { id: 'gikqF3ZsE0uMWbXJgCh_rA', name: 'Rosebank', lat: -26.14808, lon: 28.04105, order: 2, line: 'north-south' },
  { id: 'jXU-OlvxukW8wfc7JeVeXw', name: 'Sandton', lat: -26.10858, lon: 28.05693, order: 3, line: 'north-south' },
  { id: 'GqW6XDaSsk-6eFTiiRt46A', name: 'Marlboro', lat: -26.08337, lon: 28.11164, order: 4, line: 'north-south' },
  { id: 'ucS8WAkRbkiKUDPHCVxSYA', name: 'Midrand', lat: -25.99555, lon: 28.13586, order: 5, line: 'north-south' },
  { id: 'l99Qqgtul0imZWPofLfzyA', name: 'Centurion', lat: -25.85161, lon: 28.1897, order: 6, line: 'north-south' },
  { id: 'hv_Bf87q50W48rwIUwqCTg', name: 'Pretoria', lat: -25.75866, lon: 28.18988, order: 7, line: 'north-south' },
  { id: '_rkqSHvRE0Scvbcsuy0EVw', name: 'Hatfield', lat: -25.74762, lon: 28.23794, order: 8, line: 'north-south' },
  // Airport Line (Sandton to OR Tambo via Marlboro and Rhodesfield)
  { id: 'jXU-OlvxukW8wfc7JeVeXw', name: 'Sandton', lat: -26.10858, lon: 28.05693, order: 1, line: 'airport' },
  { id: 'GqW6XDaSsk-6eFTiiRt46A', name: 'Marlboro', lat: -26.08337, lon: 28.11164, order: 2, line: 'airport' },
  { id: 'nOZz7-NPrEmB2KacALquAA', name: 'Rhodesfield', lat: -26.12732, lon: 28.22461, order: 3, line: 'airport' },
  { id: 'nsg0gaT4zkWiYlX31c18Ew', name: 'OR Tambo', lat: -26.13225, lon: 28.23127, order: 4, line: 'airport' },
];

// Available lines
export const LINES = [
  { id: 'north-south', name: 'North-South Line', description: 'Park ↔ Hatfield', note: 'Transfer at Sandton for Airport Line' },
  { id: 'airport', name: 'Airport Line', description: 'Sandton ↔ OR Tambo', note: 'Transfer at Sandton for North-South Line' },
];

// Get stations by line
export function getStationsByLine(lineId) {
  return STATIONS.filter(s => s.line === lineId).sort((a, b) => a.order - b.order);
}

// Sort stations by order for display
export const STATIONS_SORTED = [...STATIONS].sort((a, b) => a.order - b.order);

/**
 * Get station by name
 */
export function getStationByName(name) {
  return STATIONS.find(s => s.name.toLowerCase() === name.toLowerCase());
}

/**
 * Check if API is available
 */
export async function checkApiStatus() {
  try {
    const response = await fetch(
      `${API_BASE_URL}/user-service/api/0/mobile/isLive/1.0.0`,
      { timeout: 5000 }
    );
    const data = await response.json();
    return data === true;
  } catch (error) {
    console.warn('Gautrain API unavailable:', error);
    return false;
  }
}

/**
 * Plan a journey using the API
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

  // Route to specific handler based on time type
  if (timeType === 'DepartWindow' && timeWindow) {
    return planDepartAtAround({ from, to, fromStation, toStation, timeWindow, maxItineraries });
  } else if (timeType === 'ArriveBefore' && time) {
    return planArriveBy({ from, to, fromStation, toStation, time, maxItineraries });
  } else {
    return planDepartNow({ from, to, fromStation, toStation, maxItineraries });
  }
}

/**
 * DEPART NOW - Show trains departing from now onwards
 * Uses static schedule as primary source (authoritative timetable)
 */
async function planDepartNow({ from, to, maxItineraries }) {
  const now = new Date();
  
  // Use static schedule as primary source
  return planJourneyStatic({ 
    from, 
    to, 
    timeType: 'DepartAfter', 
    time: now, 
    timeWindow: null, 
    maxItineraries 
  });
}

/**
 * DEPART AT AROUND - Show trains within ±30 min of selected time
 * Uses static schedule as primary source (authoritative timetable)
 */
async function planDepartAtAround({ from, to, timeWindow, maxItineraries }) {
  // Use static schedule as primary source
  return planJourneyStatic({ 
    from, 
    to, 
    timeType: 'DepartWindow', 
    time: timeWindow.target, 
    timeWindow, 
    maxItineraries 
  });
}

/**
 * ARRIVE BY - Show trains that arrive before the specified time
 * Uses static schedule as primary source (authoritative timetable)
 */
async function planArriveBy({ from, to, time, maxItineraries }) {
  // Use static schedule as primary source
  return planJourneyStatic({ 
    from, 
    to, 
    timeType: 'ArriveBefore', 
    time, 
    timeWindow: null, 
    maxItineraries 
  });
}

/**
 * Plan journey using static schedule data (primary source - authoritative timetable)
 */
async function planJourneyStatic({ from, to, timeType, time, timeWindow, maxItineraries }) {
  try {
    const baseUrl = import.meta.env.BASE_URL || '/';
    const response = await fetch(`${baseUrl}gautrain_schedule.json`);
    const scheduleData = await response.json();
    
    const now = new Date();
    let referenceDate;
    
    if (timeType === 'DepartWindow' && timeWindow) {
      referenceDate = timeWindow.target;
    } else if (timeType === 'ArriveBefore' && time) {
      referenceDate = time;
    } else {
      referenceDate = now;
    }
    
    const dayType = isWeekend(referenceDate) ? 'weekend' : 'weekday';
    
    // Determine which line to use based on stations
    const isAirportJourney = AIRPORT_ONLY_STATIONS.includes(from) || AIRPORT_ONLY_STATIONS.includes(to);
    
    let trains, direction, lineName;
    
    if (isAirportJourney) {
      // Airport line journey
      const fromOrder = AIRPORT_STATIONS[from]?.order;
      const toOrder = AIRPORT_STATIONS[to]?.order;
      
      if (!fromOrder || !toOrder) {
        console.error('Invalid airport stations:', { from, to });
        return [];
      }
      
      // West to East: Sandton(1) -> OR Tambo(4), so fromOrder < toOrder
      // East to West: OR Tambo(4) -> Sandton(1), so fromOrder > toOrder
      direction = fromOrder < toOrder ? 'west_to_east' : 'east_to_west';
      trains = scheduleData.airport?.[direction]?.[dayType] || [];
      lineName = 'Airport Line';
    } else {
      // North-South line journey
      const fromOrder = NORTH_SOUTH_STATIONS[from]?.order;
      const toOrder = NORTH_SOUTH_STATIONS[to]?.order;
      
      if (!fromOrder || !toOrder) {
        console.error('Invalid north-south stations:', { from, to });
        return [];
      }
      
      // South to North: Park(1) -> Hatfield(8), so fromOrder < toOrder
      // North to South: Hatfield(8) -> Park(1), so fromOrder > toOrder
      direction = fromOrder < toOrder ? 'south_to_north' : 'north_to_south';
      trains = scheduleData.north_south?.[direction]?.[dayType] || [];
      lineName = 'North-South Line';
    }
    
    console.log('Static schedule:', {
      from, to,
      line: isAirportJourney ? 'airport' : 'north-south',
      direction,
      dayType,
      trainsFound: trains.length,
      timeType
    });

    // Parse trains into journey objects
    const validTrains = trains
      .map(train => {
        const fromTime = train.times[from];
        const toTime = train.times[to];
        
        if (!fromTime || !toTime) return null;

        const departure = parseScheduleTime(fromTime, referenceDate);
        const arrival = parseScheduleTime(toTime, referenceDate);
        const duration = Math.floor((arrival - departure) / 1000); // seconds

        return {
          id: `static-${train.times[from]}-${Math.random().toString(36).substr(2, 9)}`,
          departureTime: departure,
          arrivalTime: arrival,
          duration,
          distance: 0,
          origin: from,
          destination: to,
          stops: [],
          line: lineName,
          source: 'schedule',
          is8Car: train.is8Car || false
        };
      })
      .filter(Boolean);

    // Filter by time type
    let filtered = validTrains;
    const departureThreshold = new Date(now.getTime() + 60000); // 1 min buffer
    
    if (timeType === 'DepartWindow' && timeWindow) {
      filtered = validTrains.filter(t => 
        t.departureTime >= timeWindow.start && t.departureTime <= timeWindow.end
      );
    } else if (timeType === 'DepartAfter') {
      filtered = validTrains.filter(t => t.departureTime > departureThreshold);
    } else if (timeType === 'ArriveBefore') {
      filtered = validTrains.filter(t => 
        t.departureTime > departureThreshold && t.arrivalTime <= time
      );
    }

    // Sort results
    filtered.sort((a, b) => {
      if (timeType === 'DepartWindow' && timeWindow) {
        // Sort by proximity to target time
        const diffA = Math.abs(a.departureTime - timeWindow.target);
        const diffB = Math.abs(b.departureTime - timeWindow.target);
        return diffA - diffB;
      } else if (timeType === 'ArriveBefore') {
        return b.arrivalTime - a.arrivalTime; // Latest arrival first
      }
      return a.departureTime - b.departureTime; // Earliest first
    });

    console.log('Static schedule results:', {
      validTrains: validTrains.length,
      afterFilter: filtered.length,
      returning: Math.min(filtered.length, maxItineraries)
    });

    return filtered.slice(0, maxItineraries);
  } catch (error) {
    console.error('Static schedule failed:', error);
    return [];
  }
}

/**
 * Parse schedule time (HH:MM) into Date object based on reference date
 */
function parseScheduleTime(timeStr, baseDate) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date(baseDate);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

/**
 * Check if date is weekend
 */
function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/**
 * Calculate fare estimate (simplified - actual fares from API when available)
 */
export function estimateFare(origin, destination, isPeak = true) {
  const fromStation = getStationByName(origin);
  const toStation = getStationByName(destination);
  
  if (!fromStation || !toStation) return null;

  // Distance-based fare estimation (simplified)
  const distance = Math.abs(fromStation.order - toStation.order);
  const baseFare = 20 + (distance * 5);
  const peakMultiplier = isPeak ? 1.3 : 1.0;
  
  return Math.round(baseFare * peakMultiplier);
}

/**
 * Check if time is during peak hours
 */
export function isPeakTime(date) {
  const hour = date.getHours();
  const day = date.getDay();
  
  // Weekend is always off-peak
  if (day === 0 || day === 6) return false;
  
  // Weekday peak: 6:00-9:00 and 16:00-19:00
  return (hour >= 6 && hour < 9) || (hour >= 16 && hour < 19);
}
