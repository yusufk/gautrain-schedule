/**
 * Gautrain API Service
 * Handles API calls to Gautrain journey planning API with fallback to static data
 */

const API_BASE_URL = 'https://api.gautrain.co.za';
const GAUTRAIN_AGENCY_ID = 'edObkk6o-0WN3tNZBLqKPg';

// Station data with coordinates (from API)
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
  // Airport Line (Sandton to OR Tambo via Rhodesfield)
  { id: 'jXU-OlvxukW8wfc7JeVeXw', name: 'Sandton', lat: -26.10858, lon: 28.05693, order: 1, line: 'airport' },
  { id: 'nOZz7-NPrEmB2KacALquAA', name: 'Rhodesfield', lat: -26.12732, lon: 28.22461, order: 2, line: 'airport' },
  { id: 'nsg0gaT4zkWiYlX31c18Ew', name: 'OR Tambo', lat: -26.13225, lon: 28.23127, order: 3, line: 'airport' },
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

  try {
    let searchTime = time;
    let searchTimeType = timeType;
    
    // For DepartWindow, search from window start time
    if (timeType === 'DepartWindow' && timeWindow) {
      searchTime = timeWindow.start;
      searchTimeType = 'DepartAfter';
    }
    // For ArriveBefore, search from now + 1 minute (to get upcoming trains, not just-departed ones)
    else if (timeType === 'ArriveBefore' && time) {
      searchTime = new Date(Date.now() + 60000); // 1 minute from now
      searchTimeType = 'DepartAfter';
    }
    
    const payload = {
      geometry: {
        coordinates: [
          [fromStation.lon, fromStation.lat],
          [toStation.lon, toStation.lat]
        ],
        type: 'MultiPoint'
      },
      profile: 'ClosestToTime',
      maxItineraries: 30, // Get more options to filter from
      timeType: searchTimeType,
      time: searchTime ? searchTime.toISOString() : null,
      only: {
        agencies: [GAUTRAIN_AGENCY_ID],
        modes: []
      }
    };

    console.log('API Request:', {
      timeType: searchTimeType,
      searchTime: searchTime ? searchTime.toISOString() : null,
      originalTimeType: timeType,
      targetTime: time ? time.toISOString() : null
    });

    const response = await fetch(
      `${API_BASE_URL}/transport-api/api/0/journey/create`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    let itineraries = parseItineraries(data.itineraries || []);
    
    console.log('API returned:', {
      timeType,
      targetTime: time,
      rawCount: (data.itineraries || []).length,
      parsedCount: itineraries.length,
      sampleItineraries: itineraries.slice(0, 3).map(i => ({
        depart: i.departureTime.toISOString(),
        arrive: i.arrivalTime.toISOString()
      }))
    });
    
    // Get current time for filtering
    const currentTime = new Date();
    
    // Filter and sort based on original time type
    if (timeType === 'DepartWindow' && timeWindow) {
      // Filter trains within the window
      itineraries = itineraries.filter(itin => 
        itin.departureTime >= timeWindow.start && itin.departureTime <= timeWindow.end
      );
      // Sort by proximity to target time (closest first)
      itineraries.sort((a, b) => {
        const diffA = Math.abs(a.departureTime - timeWindow.target);
        const diffB = Math.abs(b.departureTime - timeWindow.target);
        return diffA - diffB;
      });
      itineraries = itineraries.slice(0, maxItineraries);
    } else if (timeType === 'ArriveBefore') {
      // Filter: trains that haven't departed yet AND arrive before target
      const now = new Date();
      
      const debugInfo = itineraries.map(i => ({
        depart: i.departureTime.toISOString(),
        arrive: i.arrivalTime.toISOString(),
        departAfterNow: i.departureTime > now,
        arriveBeforeTarget: i.arrivalTime <= time
      }));
      console.log('ArriveBefore - All itineraries before filter:', JSON.stringify(debugInfo, null, 2));
      
      itineraries = itineraries.filter(itin => 
        itin.departureTime > now && itin.arrivalTime <= time
      );
      console.log('ArriveBefore filtering:', {
        targetArrival: time.toISOString(),
        now: now.toISOString(),
        afterFilter: itineraries.length
      });
      // Sort by arrival time descending (latest arrival first, closest to target)
      itineraries.sort((a, b) => b.arrivalTime - a.arrivalTime);
      itineraries = itineraries.slice(0, maxItineraries);
      
      // If API returned no valid results, fall back to static schedule
      if (itineraries.length === 0) {
        console.log('API returned no valid ArriveBefore results, falling back to static schedule');
        return planJourneyStatic({ from, to, timeType, time, timeWindow, maxItineraries });
      }
    } else {
      // For DepartAfter, filter out trains that have already departed
      // Add 1 minute buffer to account for boarding time
      const departureThreshold = new Date(currentTime.getTime() + 60000);
      itineraries = itineraries.filter(itin => itin.departureTime > departureThreshold);
      // Sort by departure time ascending (earliest first)
      itineraries.sort((a, b) => a.departureTime - b.departureTime);
      itineraries = itineraries.slice(0, maxItineraries);
    }
    
    return itineraries;
  } catch (error) {
    console.error('API journey planning failed, falling back to static schedule:', error);
    // Fallback to static schedule
    return planJourneyStatic({ from, to, timeType, time, timeWindow, maxItineraries });
  }
}

/**
 * Parse API itineraries into simplified format
 */
function parseItineraries(itineraries) {
  return itineraries.map(itin => {
    const legs = itin.legs || [];
    const transitLeg = legs.find(leg => leg.type === 'Transit');
    
    if (!transitLeg) return null;

    const waypoints = transitLeg.waypoints || [];
    const originWaypoint = waypoints[0];
    const destinationWaypoint = waypoints[waypoints.length - 1];

    // Use waypoint departure/arrival times instead of itinerary times for accuracy
    const departureTime = originWaypoint?.departureTime 
      ? new Date(originWaypoint.departureTime) 
      : new Date(itin.departureTime);
    
    const arrivalTime = destinationWaypoint?.arrivalTime 
      ? new Date(destinationWaypoint.arrivalTime) 
      : new Date(itin.arrivalTime);

    // Calculate accurate duration from actual waypoint times
    const duration = Math.floor((arrivalTime - departureTime) / 1000); // in seconds

    return {
      id: itin.id,
      departureTime,
      arrivalTime,
      duration,
      distance: itin.distance?.value || 0, // in meters
      origin: originWaypoint?.stop?.name || 'Unknown',
      destination: destinationWaypoint?.stop?.name || 'Unknown',
      stops: waypoints.map(wp => ({
        name: wp.stop?.name || 'Unknown',
        arrivalTime: wp.arrivalTime ? new Date(wp.arrivalTime) : null,
        departureTime: wp.departureTime ? new Date(wp.departureTime) : null
      })),
      line: transitLeg.line?.name || 'North - South Line',
      source: 'api'
    };
  }).filter(Boolean);
}

/**
 * Fallback: Plan journey using static schedule data
 */
async function planJourneyStatic({ from, to, timeType, time, timeWindow, maxItineraries }) {
  try {
    const response = await fetch('/gautrain_schedule.json');
    const scheduleData = await response.json();
    
    // For ArriveBefore, we want trains from today that arrive before target time
    // For DepartWindow, use the target date
    // Otherwise use current date
    const now = new Date();
    let referenceDate;
    
    if (timeType === 'DepartWindow' && timeWindow) {
      referenceDate = timeWindow.target;
    } else if (timeType === 'ArriveBefore' && time) {
      // Use the same date as the target arrival time
      referenceDate = time;
    } else {
      referenceDate = now;
    }
    
    const dayType = isWeekend(referenceDate) ? 'weekend' : 'weekday';
    const trains = scheduleData.routes.north_south[dayType] || [];
    
    console.log('Static schedule parsing:', {
      referenceDate: referenceDate.toISOString(),
      dayType,
      totalTrains: trains.length,
      timeType,
      targetTime: time ? time.toISOString() : null,
      now: now.toISOString()
    });

    // Find trains that serve both stations
    const validTrains = trains
      .map(train => {
        const fromTime = train.times[from];
        const toTime = train.times[to];
        
        if (!fromTime || !toTime) return null;

        // Parse times using the reference date (could be today or tomorrow)
        const departure = parseScheduleTime(fromTime, referenceDate);
        const arrival = parseScheduleTime(toTime, referenceDate);

        // Check direction is correct (arrival should be after departure)
        if (arrival <= departure) return null;

        const duration = Math.floor((arrival - departure) / 1000); // seconds

        return {
          id: `static-${Math.random()}`,
          departureTime: departure,
          arrivalTime: arrival,
          duration,
          distance: 0,
          origin: from,
          destination: to,
          stops: [],
          line: 'North - South Line',
          source: 'static'
        };
      })
      .filter(Boolean);

    // Filter by time type
    let filtered = validTrains;
    // Add 1 minute buffer to account for boarding time
    const departureThreshold = new Date(now.getTime() + 60000);
    
    if (timeType === 'DepartWindow' && timeWindow) {
      filtered = validTrains.filter(t => 
        t.departureTime >= timeWindow.start && t.departureTime <= timeWindow.end
      );
      console.log('DepartWindow filtering:', {
        windowStart: timeWindow.start,
        windowEnd: timeWindow.end,
        validTrainsCount: validTrains.length,
        filteredCount: filtered.length,
        sampleDepartures: validTrains.slice(0, 3).map(t => t.departureTime)
      });
    } else if (timeType === 'DepartAfter') {
      filtered = validTrains.filter(t => t.departureTime > departureThreshold);
    } else if (timeType === 'ArriveBefore') {
      // Filter: trains that arrive before target time
      // Use 1 minute buffer for trains that haven't departed yet
      const departureBuffer = new Date(now.getTime() + 60000);
      filtered = validTrains.filter(t => 
        t.departureTime > departureBuffer && t.arrivalTime <= time
      );
      console.log('ArriveBefore static filtering:', {
        targetArrival: time.toISOString(),
        departureBuffer: departureBuffer.toISOString(),
        now: now.toISOString(),
        totalValid: validTrains.length,
        afterFilter: filtered.length,
        sampleValidTrains: validTrains.slice(0, 5).map(t => ({
          depart: t.departureTime.toISOString(),
          arrive: t.arrivalTime.toISOString()
        })),
        sampleFiltered: filtered.slice(0, 3).map(t => ({
          depart: t.departureTime.toISOString(),
          arrive: t.arrivalTime.toISOString()
        }))
      });
    }

    // Sort and limit
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

    return filtered.slice(0, maxItineraries);
  } catch (error) {
    console.error('Static schedule fallback failed:', error);
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
