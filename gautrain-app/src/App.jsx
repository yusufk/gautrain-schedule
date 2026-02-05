import { useState, useEffect } from 'react';
import './App.css';
import { LINES, getStationsByLine, planJourney, estimateFare, isPeakTime, getStationByName } from './services/gautrainApi';
import { formatTime, formatDurationSeconds, getGoogleMapsUrl, getCalendarUrl, generateICSContent } from './utils/timeUtils';
import { NixieCountdown } from './components/NixieCountdown';
import ReloadPrompt from './components/ReloadPrompt';

function App() {
  const [selectedLine, setSelectedLine] = useState('north-south');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [timeMode, setTimeMode] = useState('now'); // 'now', 'departAt', 'arriveBy'
  const [selectedTime, setSelectedTime] = useState('');
  const [dayType, setDayType] = useState('weekday');
  const [itineraries, setItineraries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get stations for selected line
  const stationsForLine = getStationsByLine(selectedLine);
  const currentLineInfo = LINES.find(l => l.id === selectedLine);

  // Handle calendar reminder download
  const handleAddToCalendar = (origin, destination, departureTime, duration) => {
    const icsContent = generateICSContent(origin, destination, departureTime, duration);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gautrain-${origin}-${destination}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };


  // Auto-detect day type
  useEffect(() => {
    const day = new Date().getDay();
    setDayType(day === 0 || day === 6 ? 'weekend' : 'weekday');
  }, []);

  // Reset origin/destination when line changes
  const handleLineChange = (newLine) => {
    setSelectedLine(newLine);
    setOrigin('');
    setDestination('');
    setItineraries([]);
    setError(null);
  };

  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const handleSearch = async () => {
    if (!origin || !destination) {
      setError('Please select both origin and destination');
      return;
    }

    if (origin === destination) {
      setError('Origin and destination must be different');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let timeType = 'DepartAfter';
      let time = new Date(); // Always use current time as default
      let timeWindow = null;

      if (timeMode === 'departAt' && selectedTime) {
        timeType = 'DepartWindow';
        const [hours, minutes] = selectedTime.split(':');
        time = new Date();
        time.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        const now = new Date();
        const isTargetWeekend = dayType === 'weekend';
        
        // Find next occurrence of the selected day type at the specified time
        if (time <= now) {
          // Move to tomorrow
          time.setDate(time.getDate() + 1);
        }
        
        // Keep advancing days until we hit the right day type
        const isTimeWeekend = (d) => d.getDay() === 0 || d.getDay() === 6;
        while (isTimeWeekend(time) !== isTargetWeekend) {
          time.setDate(time.getDate() + 1);
        }
        
        // 30 minutes before and after
        timeWindow = {
          start: new Date(time.getTime() - (30 * 60 * 1000)),
          end: new Date(time.getTime() + (30 * 60 * 1000)),
          target: time
        };
      } else if (timeMode === 'arriveBy' && selectedTime) {
        timeType = 'ArriveBefore';
        const [hours, minutes] = selectedTime.split(':');
        time = new Date();
        time.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        const now = new Date();
        const isTargetWeekend = dayType === 'weekend';
        
        // Find next occurrence of the selected day type at the specified time
        if (time <= now) {
          // Move to tomorrow
          time.setDate(time.getDate() + 1);
        }
        
        // Keep advancing days until we hit the right day type
        const isTimeWeekend = (d) => d.getDay() === 0 || d.getDay() === 6;
        while (isTimeWeekend(time) !== isTargetWeekend) {
          time.setDate(time.getDate() + 1);
        }
      }
      // else: timeMode === 'now' uses current time (default)

      const results = await planJourney({
        from: origin,
        to: destination,
        timeType,
        time,
        timeWindow,
        maxItineraries: 5
      });

      setItineraries(results);

      if (results.length === 0) {
        setError('No trains found for the selected time');
      }
    } catch (err) {
      setError(err.message || 'Failed to plan journey');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <img 
            src="https://gma.gautrain.co.za/SiteAssets/gautrain.png" 
            alt="Gautrain" 
            className="gautrain-logo"
          />
          <h1>Journey Planner</h1>
        </div>
        <p>Smart journey planning for Gautrain commuters</p>
      </header>

      <main className="app-main">
        <div className="planner-card">
          {/* Line Selector */}
          <div className="line-selector">
            <label htmlFor="line">Select Line</label>
            <select
              id="line"
              value={selectedLine}
              onChange={(e) => handleLineChange(e.target.value)}
              className="line-select"
            >
              {LINES.map(line => (
                <option key={line.id} value={line.id}>
                  {line.name} ({line.description})
                </option>
              ))}
            </select>
            {currentLineInfo?.note && (
              <p className="line-note">
                ℹ️ {currentLineInfo.note}
              </p>
            )}
          </div>

          <div className="route-selection">
            <div className="station-selector">
              <label htmlFor="origin">From</label>
              <select
                id="origin"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="station-select"
              >
                <option value="">Select origin station</option>
                {stationsForLine.map(station => (
                  <option key={station.id} value={station.name}>
                    {station.name}
                  </option>
                ))}
              </select>
            </div>

            <button onClick={handleSwap} className="swap-button" title="Swap stations">
              ⇅
            </button>

            <div className="station-selector">
              <label htmlFor="destination">To</label>
              <select
                id="destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="station-select"
              >
                <option value="">Select destination station</option>
                {stationsForLine.map(station => (
                  <option key={station.id} value={station.name}>
                    {station.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="time-selection">
            <div className="time-mode">
              <label>
                <input
                  type="radio"
                  value="now"
                  checked={timeMode === 'now'}
                  onChange={(e) => setTimeMode(e.target.value)}
                />
                Depart Now
              </label>
              <label>
                <input
                  type="radio"
                  value="departAt"
                  checked={timeMode === 'departAt'}
                  onChange={(e) => setTimeMode(e.target.value)}
                />
                Depart At Around
              </label>
              <label>
                <input
                  type="radio"
                  value="arriveBy"
                  checked={timeMode === 'arriveBy'}
                  onChange={(e) => setTimeMode(e.target.value)}
                />
                Arrive By
              </label>
            </div>

            {(timeMode === 'departAt' || timeMode === 'arriveBy') && (
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="time-input"
              />
            )}

            {(timeMode === 'departAt' || timeMode === 'arriveBy') && (
              <div className="day-type">
                <label>
                  <input
                    type="radio"
                    value="weekday"
                    checked={dayType === 'weekday'}
                    onChange={(e) => setDayType(e.target.value)}
                  />
                  Weekday
                </label>
                <label>
                  <input
                    type="radio"
                    value="weekend"
                    checked={dayType === 'weekend'}
                    onChange={(e) => setDayType(e.target.value)}
                  />
                  Weekend
                </label>
              </div>
            )}
          </div>

          <button
            onClick={handleSearch}
            disabled={loading || !origin || !destination}
            className="search-button"
          >
            {loading ? 'Searching...' : 'Find Trains'}
          </button>

          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}
        </div>

        {itineraries.length > 0 && (
          <div className="results">
            <h2>Available Trains</h2>
            <p className="results-info">
              {origin} → {destination} • {itineraries.length} option{itineraries.length !== 1 ? 's' : ''}
            </p>

            <div className="itineraries">
              {itineraries.map((itin, index) => {
                const isPeak = isPeakTime(itin.departureTime);
                const fare = estimateFare(origin, destination, isPeak);
                const originStation = getStationByName(origin);
                const googleMapsUrl = originStation ? getGoogleMapsUrl(
                  origin,
                  originStation.lat,
                  originStation.lon,
                  itin.departureTime
                ) : null;

                return (
                  <div key={itin.id || index} className="journey-card">
                    <NixieCountdown departureTime={itin.departureTime} is8Car={itin.is8Car} />
                    
                    <div className="journey-header">
                      <div className="journey-time">
                        <div className="departure">
                          <span className="time">{formatTime(itin.departureTime)}</span>
                          <span className="station">{origin}</span>
                        </div>
                        <div className="journey-arrow">
                          <div className="duration">{formatDurationSeconds(itin.duration)}</div>
                          <div className="arrow">→</div>
                        </div>
                        <div className="arrival">
                          <span className="time">{formatTime(itin.arrivalTime)}</span>
                          <span className="station">{destination}</span>
                        </div>
                      </div>
                    </div>

                    <div className="journey-details">
                      {fare && (
                        <div className="fare">
                          💳 R{fare} {isPeak ? '(Peak)' : '(Off-peak)'}
                        </div>
                      )}
                    </div>

                    <div className="journey-actions">
                      {googleMapsUrl && (
                        <a 
                          href={googleMapsUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="action-btn navigate-btn"
                        >
                          🗺️ Navigate to {origin}
                        </a>
                      )}
                      <button
                        onClick={() => handleAddToCalendar(origin, destination, itin.departureTime, itin.duration)}
                        className="action-btn calendar-btn"
                        title="Add reminder to calendar (20 min before departure)"
                      >
                        📅 Set Reminder
                      </button>
                    </div>

                    {itin.stops && itin.stops.length > 2 && (
                      <details className="stops-details">
                        <summary>{itin.stops.length} stops</summary>
                        <ul className="stops-list">
                          {itin.stops.map((stop, i) => (
                            <li key={i}>
                              {stop.name} {stop.departureTime && `• ${formatTime(stop.departureTime)}`}
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p className="footer-links">
          Built with ❤️ for Gautrain commuters • 
          <a href="https://github.com/yusufk/gautrain-schedule" target="_blank" rel="noopener noreferrer"> View on GitHub</a>
        </p>
        <p className="footer-disclaimer">
          This application is not affiliated with or endorsed by Gautrain Management Agency or Bombela Operating Company.
        </p>
      </footer>
      
      <ReloadPrompt />
    </div>
  );
}

export default App;
