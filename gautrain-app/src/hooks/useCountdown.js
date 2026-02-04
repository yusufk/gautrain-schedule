import { useState, useEffect } from 'react';

/**
 * Custom hook for real-time countdown with seconds precision
 * @param {Date} targetTime - The target date/time to count down to
 * @returns {Object} - { minutes, seconds, isExpired }
 */
export function useCountdown(targetTime) {
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(targetTime));

  useEffect(() => {
    // Update every second for accurate countdown
    const interval = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(targetTime);
      setTimeLeft(newTimeLeft);

      // Clear interval if train has departed
      if (newTimeLeft.isExpired) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetTime]);

  return timeLeft;
}

/**
 * Calculate time left until target
 */
function calculateTimeLeft(targetTime) {
  const now = new Date();
  const difference = targetTime - now;

  if (difference <= 0) {
    return {
      minutes: 0,
      seconds: 0,
      totalSeconds: 0,
      isExpired: true
    };
  }

  const totalSeconds = Math.floor(difference / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return {
    minutes,
    seconds,
    totalSeconds,
    isExpired: false
  };
}
