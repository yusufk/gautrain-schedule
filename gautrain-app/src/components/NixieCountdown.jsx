import { useCountdown } from '../hooks/useCountdown';
import './NixieCountdown.css';

/**
 * Gautrain departure board-style countdown timer
 * Displays minutes and seconds until train departure with LED display aesthetic
 */
export function NixieCountdown({ departureTime, is8Car }) {
  const { minutes, seconds, isExpired } = useCountdown(departureTime);

  if (isExpired) {
    return (
      <div className="departure-board departed">
        <div className="board-content">
          <span className="status-label">DEPARTED</span>
        </div>
      </div>
    );
  }

  // Calculate hours and remaining minutes
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  // Format numbers to always be 2 digits
  const hoursStr = String(hours).padStart(2, '0');
  const minutesStr = String(remainingMinutes).padStart(2, '0');
  const secondsStr = String(seconds).padStart(2, '0');

  return (
    <div className="departure-board">
      <div className="board-content">
        <div className="board-label">DEPARTS IN</div>
        <div className="led-display">
          {hours > 0 ? (
            <>
              <div className="led-group">
                <span className="led-digit">{hoursStr[0]}</span>
                <span className="led-digit">{hoursStr[1]}</span>
                <span className="led-unit">HR</span>
              </div>
              <span className="led-separator">:</span>
              <div className="led-group">
                <span className="led-digit">{minutesStr[0]}</span>
                <span className="led-digit">{minutesStr[1]}</span>
                <span className="led-unit">MIN</span>
              </div>
            </>
          ) : (
            <>
              <div className="led-group">
                <span className="led-digit">{minutesStr[0]}</span>
                <span className="led-digit">{minutesStr[1]}</span>
                <span className="led-unit">MIN</span>
              </div>
              <span className="led-separator">:</span>
              <div className="led-group">
                <span className="led-digit">{secondsStr[0]}</span>
                <span className="led-digit">{secondsStr[1]}</span>
                <span className="led-unit">SEC</span>
              </div>
            </>
          )}
        </div>
        <div className="train-capacity">
          <span className="capacity-label">
            {is8Car ? '8-CAR TRAIN • 1920 CAPACITY' : '4-CAR TRAIN • 960 CAPACITY'}
          </span>
        </div>
      </div>
    </div>
  );
}
