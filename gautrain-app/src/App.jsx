import { useState, useEffect } from 'react';
import './App.css';
import { STATIONS_SORTED, planJourney, estimateFare, isPeakTime } from './services/gautrainApi';
import { formatTime, getCountdown, formatDurationSeconds } from './utils/timeUtils';

function App() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [timeMode, setTimeMode] = useState('now'); // 'now', 'departAt', 'arriveBy'
  const [selectedTime, setSelectedTime] = useState('');
  const [dayType, setDayType] = useState('weekday');
  const [itineraries, setItineraries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every 30 seconds for countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Auto-detect day type
  useEffect(() => {
    const day = new Date().getDay();
    setDayType(day === 0 || day === 6 ? 'weekend' : 'weekday');
  }, []);

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
      let time = null;

      if (timeMode === 'departAt' && selectedTime) {
        timeType = 'DepartAfter';
        const [hours, minutes] = selectedTime.split(':');
        time = new Date();
        time.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      } else if (timeMode === 'arriveBy' && selectedTime) {
        timeType = 'ArriveBefore';
        const [hours, minutes] = selectedTime.split(':');
        time = new Date();
        time.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      }

      const results = await planJourney({
        from: origin,
        to: destination,
        timeType,
        time,
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
        <h1>🚆 Gautrain Journey Planner</h1>
        <p>Plan your journey on the Gautrain system</p>
      </header>

      <main className="app-main">
        <div className="planner-card">
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
                {STATIONS_SORTED.map(station => (
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
                {STATIONS_SORTED.map(station => (
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
                Depart At
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

                return (
                  <div key={itin.id || index} className="journey-card">
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
                      <div className="countdown">
                        ⏱️ {getCountdown(itin.departureTime)}
                      </div>
                      {fare && (
                        <div className="fare">
                          💳 R{fare} {isPeak ? '(Peak)' : '(Off-peak)'}
                        </div>
                      )}
                      {itin.source === 'static' && (
                        <div className="data-source">
                          📅 Scheduled times
                        </div>
                      )}
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
        <p>
          Built with ❤️ for Gautrain commuters • 
          <a href="https://github.com" target="_blank" rel="noopener noreferrer"> View on GitHub</a>
        </p>
      </footer>
    </div>
  );
}

export default App;
