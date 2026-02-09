/**
 * Test cases for Gautrain API Service
 * Tests the 3 main journey planning functions:
 * 1. Depart Now - trains departing from now onwards
 * 2. Depart At Around - trains within ±30 min of selected time
 * 3. Arrive By - trains arriving before specified time
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { planJourney, getStationByName, STATIONS } from './gautrainApi.js';

describe('Gautrain API Service', () => {
  
  describe('Station Data', () => {
    it('should have all North-South line stations', () => {
      const nsStations = ['Park', 'Rosebank', 'Sandton', 'Marlboro', 'Midrand', 'Centurion', 'Pretoria', 'Hatfield'];
      nsStations.forEach(name => {
        const station = getStationByName(name);
        expect(station).toBeDefined();
        expect(station.name).toBe(name);
      });
    });

    it('should have all Airport line stations', () => {
      const airportStations = ['Sandton', 'Marlboro', 'Rhodesfield', 'OR Tambo'];
      airportStations.forEach(name => {
        const station = getStationByName(name);
        expect(station).toBeDefined();
        expect(station.name).toBe(name);
      });
    });

    it('should return undefined for invalid station', () => {
      const station = getStationByName('InvalidStation');
      expect(station).toBeUndefined();
    });
  });

  describe('Depart Now (DepartAfter)', () => {
    it('should return trains for Sandton → Pretoria (South to North)', async () => {
      const results = await planJourney({
        from: 'Sandton',
        to: 'Pretoria',
        timeType: 'DepartAfter',
        maxItineraries: 5
      });

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      
      if (results.length > 0) {
        const train = results[0];
        expect(train.origin).toBe('Sandton');
        expect(train.destination).toBe('Pretoria');
        expect(train.departureTime).toBeInstanceOf(Date);
        expect(train.arrivalTime).toBeInstanceOf(Date);
        expect(train.duration).toBeGreaterThan(0);
        expect(train.line).toBe('North - South Line');
        
        // Travel time should be ~28 minutes (1680 seconds)
        expect(train.duration).toBeGreaterThanOrEqual(25 * 60);
        expect(train.duration).toBeLessThanOrEqual(35 * 60);
      }
    });

    it('should return trains for Pretoria → Sandton (North to South)', async () => {
      const results = await planJourney({
        from: 'Pretoria',
        to: 'Sandton',
        timeType: 'DepartAfter',
        maxItineraries: 5
      });

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      
      if (results.length > 0) {
        const train = results[0];
        expect(train.origin).toBe('Pretoria');
        expect(train.destination).toBe('Sandton');
        expect(train.line).toBe('North - South Line');
        
        // Travel time should be ~28 minutes
        expect(train.duration).toBeGreaterThanOrEqual(25 * 60);
        expect(train.duration).toBeLessThanOrEqual(35 * 60);
      }
    });

    it('should return trains for Sandton → OR Tambo (Airport line)', async () => {
      const results = await planJourney({
        from: 'Sandton',
        to: 'OR Tambo',
        timeType: 'DepartAfter',
        maxItineraries: 5
      });

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      
      if (results.length > 0) {
        const train = results[0];
        expect(train.origin).toBe('Sandton');
        expect(train.destination).toBe('OR Tambo');
        expect(train.line).toBe('East - West Line and OR Tambo Service');
        
        // Travel time should be ~14 minutes (actual schedule time)
        expect(train.duration).toBeGreaterThanOrEqual(12 * 60);
        expect(train.duration).toBeLessThanOrEqual(18 * 60);
      }
    });

    it('should return trains for OR Tambo → Sandton (Airport line reverse)', async () => {
      const results = await planJourney({
        from: 'OR Tambo',
        to: 'Sandton',
        timeType: 'DepartAfter',
        maxItineraries: 5
      });

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      
      if (results.length > 0) {
        const train = results[0];
        expect(train.origin).toBe('OR Tambo');
        expect(train.destination).toBe('Sandton');
        expect(train.line).toBe('East - West Line and OR Tambo Service');
      }
    });

    it('should return trains sorted by departure time (earliest first)', async () => {
      const results = await planJourney({
        from: 'Sandton',
        to: 'Pretoria',
        timeType: 'DepartAfter',
        maxItineraries: 5
      });

      if (results.length > 1) {
        for (let i = 1; i < results.length; i++) {
          expect(results[i].departureTime.getTime()).toBeGreaterThanOrEqual(
            results[i-1].departureTime.getTime()
          );
        }
      }
    });

    it('should only return trains departing after now', async () => {
      const now = new Date();
      const results = await planJourney({
        from: 'Sandton',
        to: 'Pretoria',
        timeType: 'DepartAfter',
        maxItineraries: 5
      });

      results.forEach(train => {
        expect(train.departureTime.getTime()).toBeGreaterThan(now.getTime());
      });
    });
  });

  describe('Depart At Around (DepartWindow)', () => {
    it('should return trains within ±30 min of target time', async () => {
      const targetTime = new Date();
      targetTime.setHours(8, 0, 0, 0); // 8:00 AM
      
      const windowStart = new Date(targetTime.getTime() - 30 * 60 * 1000);
      const windowEnd = new Date(targetTime.getTime() + 30 * 60 * 1000);

      const results = await planJourney({
        from: 'Sandton',
        to: 'Pretoria',
        timeType: 'DepartWindow',
        timeWindow: {
          start: windowStart,
          target: targetTime,
          end: windowEnd
        },
        maxItineraries: 10
      });

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      
      // All results should be within the window
      results.forEach(train => {
        expect(train.departureTime.getTime()).toBeGreaterThanOrEqual(windowStart.getTime());
        expect(train.departureTime.getTime()).toBeLessThanOrEqual(windowEnd.getTime());
      });
    });

    it('should sort results by proximity to target time', async () => {
      const targetTime = new Date();
      targetTime.setHours(12, 0, 0, 0); // 12:00 PM
      
      const windowStart = new Date(targetTime.getTime() - 30 * 60 * 1000);
      const windowEnd = new Date(targetTime.getTime() + 30 * 60 * 1000);

      const results = await planJourney({
        from: 'Park',
        to: 'Hatfield',
        timeType: 'DepartWindow',
        timeWindow: {
          start: windowStart,
          target: targetTime,
          end: windowEnd
        },
        maxItineraries: 10
      });

      if (results.length > 1) {
        const targetMs = targetTime.getTime();
        for (let i = 1; i < results.length; i++) {
          const diffPrev = Math.abs(results[i-1].departureTime.getTime() - targetMs);
          const diffCurr = Math.abs(results[i].departureTime.getTime() - targetMs);
          expect(diffCurr).toBeGreaterThanOrEqual(diffPrev);
        }
      }
    });

    it('should work for Airport line with time window', async () => {
      const targetTime = new Date();
      targetTime.setHours(10, 0, 0, 0);
      
      const windowStart = new Date(targetTime.getTime() - 30 * 60 * 1000);
      const windowEnd = new Date(targetTime.getTime() + 30 * 60 * 1000);

      const results = await planJourney({
        from: 'Sandton',
        to: 'OR Tambo',
        timeType: 'DepartWindow',
        timeWindow: {
          start: windowStart,
          target: targetTime,
          end: windowEnd
        },
        maxItineraries: 5
      });

      expect(results).toBeDefined();
      if (results.length > 0) {
        expect(results[0].line).toBe('East - West Line and OR Tambo Service');
      }
    });
  });

  describe('Arrive By (ArriveBefore)', () => {
    it('should return trains arriving before specified time', async () => {
      const arriveByTime = new Date();
      arriveByTime.setHours(18, 0, 0, 0); // 6:00 PM

      const results = await planJourney({
        from: 'Sandton',
        to: 'Pretoria',
        timeType: 'ArriveBefore',
        time: arriveByTime,
        maxItineraries: 5
      });

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      
      // All results should arrive before or at the specified time
      results.forEach(train => {
        expect(train.arrivalTime.getTime()).toBeLessThanOrEqual(arriveByTime.getTime());
      });
    });

    it('should sort results with latest arrival first', async () => {
      const arriveByTime = new Date();
      arriveByTime.setHours(17, 0, 0, 0);

      const results = await planJourney({
        from: 'Park',
        to: 'Centurion',
        timeType: 'ArriveBefore',
        time: arriveByTime,
        maxItineraries: 5
      });

      if (results.length > 1) {
        for (let i = 1; i < results.length; i++) {
          expect(results[i].arrivalTime.getTime()).toBeLessThanOrEqual(
            results[i-1].arrivalTime.getTime()
          );
        }
      }
    });

    it('should work for Airport line with arrive by', async () => {
      const arriveByTime = new Date();
      arriveByTime.setHours(14, 0, 0, 0);

      const results = await planJourney({
        from: 'OR Tambo',
        to: 'Sandton',
        timeType: 'ArriveBefore',
        time: arriveByTime,
        maxItineraries: 5
      });

      expect(results).toBeDefined();
      if (results.length > 0) {
        expect(results[0].line).toBe('Airport Line');
        results.forEach(train => {
          expect(train.arrivalTime.getTime()).toBeLessThanOrEqual(arriveByTime.getTime());
        });
      }
    });
  });

  describe('Travel Time Validation', () => {
    it('should ensure arrival time is always after departure time', async () => {
      // Test all major routes in both directions
      const routes = [
        { from: 'Sandton', to: 'Pretoria' },
        { from: 'Pretoria', to: 'Sandton' },
        { from: 'Park', to: 'Hatfield' },
        { from: 'Hatfield', to: 'Park' },
        { from: 'Pretoria', to: 'Rosebank' }, // Specific southbound case
        { from: 'Rosebank', to: 'Pretoria' },
        { from: 'Sandton', to: 'OR Tambo' },
        { from: 'OR Tambo', to: 'Sandton' },
      ];

      for (const route of routes) {
        const results = await planJourney({
          from: route.from,
          to: route.to,
          timeType: 'DepartAfter',
          maxItineraries: 5
        });

        results.forEach(train => {
          expect(train.arrivalTime.getTime()).toBeGreaterThan(train.departureTime.getTime());
        });
      }
    });

    it('Sandton → Pretoria should be ~28 minutes', async () => {
      const results = await planJourney({
        from: 'Sandton',
        to: 'Pretoria',
        timeType: 'DepartAfter',
        maxItineraries: 1
      });

      if (results.length > 0) {
        const durationMinutes = results[0].duration / 60;
        expect(durationMinutes).toBeCloseTo(28, 0);
      }
    });

    it('Park → Hatfield should be ~42 minutes', async () => {
      const targetTime = new Date();
      targetTime.setHours(8, 0, 0, 0);
      
      const results = await planJourney({
        from: 'Park',
        to: 'Hatfield',
        timeType: 'DepartWindow',
        timeWindow: {
          start: new Date(targetTime.getTime() - 30 * 60 * 1000),
          target: targetTime,
          end: new Date(targetTime.getTime() + 30 * 60 * 1000)
        },
        maxItineraries: 1
      });

      if (results.length > 0) {
        const durationMinutes = results[0].duration / 60;
        expect(durationMinutes).toBeCloseTo(42, 1);
      }
    });

    it('Sandton → OR Tambo should be ~14 minutes', async () => {
      const targetTime = new Date();
      targetTime.setHours(10, 0, 0, 0);
      
      const results = await planJourney({
        from: 'Sandton',
        to: 'OR Tambo',
        timeType: 'DepartWindow',
        timeWindow: {
          start: new Date(targetTime.getTime() - 30 * 60 * 1000),
          target: targetTime,
          end: new Date(targetTime.getTime() + 30 * 60 * 1000)
        },
        maxItineraries: 1
      });

      if (results.length > 0) {
        const durationMinutes = results[0].duration / 60;
        expect(durationMinutes).toBeCloseTo(14, 1);
      }
    });
  });

  describe('Specific Schedule Verification', () => {
    it('first train after 7am from Rosebank to Hatfield should leave at 7:03 and arrive at 7:41', async () => {
      const targetTime = new Date();
      // Set to a weekday for consistent results
      while (targetTime.getDay() === 0 || targetTime.getDay() === 6) {
        targetTime.setDate(targetTime.getDate() + 1);
      }
      targetTime.setHours(7, 0, 0, 0);

      const results = await planJourney({
        from: 'Rosebank',
        to: 'Hatfield',
        timeType: 'DepartAfter',
        time: targetTime,
        maxItineraries: 1
      });

      expect(results.length).toBeGreaterThan(0);
      
      const firstTrain = results[0];
      const departureMinutes = firstTrain.departureTime.getMinutes();
      const departureSeconds = firstTrain.departureTime.getSeconds();
      const arrivalHours = firstTrain.arrivalTime.getHours();
      const arrivalMinutes = firstTrain.arrivalTime.getMinutes();
      
      // First train after 7:00 should depart at 7:03
      expect(firstTrain.departureTime.getHours()).toBe(7);
      expect(departureMinutes).toBe(3);
      expect(departureSeconds).toBe(0);
      
      // Should arrive at 7:41 (38 minute journey)
      expect(arrivalHours).toBe(7);
      expect(arrivalMinutes).toBe(41);
      
      // Should be an 8-car train (6:59 departure is 8-car based on schedule)
      expect(firstTrain.is8Car).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should throw error for invalid origin station', async () => {
      await expect(planJourney({
        from: 'InvalidStation',
        to: 'Pretoria',
        timeType: 'DepartAfter',
        maxItineraries: 5
      })).rejects.toThrow('Invalid station names');
    });

    it('should throw error for invalid destination station', async () => {
      await expect(planJourney({
        from: 'Sandton',
        to: 'InvalidStation',
        timeType: 'DepartAfter',
        maxItineraries: 5
      })).rejects.toThrow('Invalid station names');
    });
  });
});
