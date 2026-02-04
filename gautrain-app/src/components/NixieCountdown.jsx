import { useCountdown } from '../hooks/useCountdown';
import './NixieCountdown.css';

/**
 * Gautrain departure board-style countdown timer
 * Displays minutes and seconds until train departure with LED display aesthetic
 */
export function NixieCountdown({ departureTime }) {
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

  // Format numbers to always be 2 digits
  const minutesStr = String(minutes).padStart(2, '0');
  const secondsStr = String(seconds).padStart(2, '0');

  return (
    <div className="departure-board">
      <div className="board-content">
        <div className="board-label">DEPARTS IN</div>
        <div className="led-display">
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
        </div>
      </div>
    </div>
  );
}
