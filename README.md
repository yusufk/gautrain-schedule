# Gautrain Journey Planner

A modern, user-friendly web application for planning Gautrain journeys with reverse trip planning capabilities. Built with React and powered by the live Gautrain API.

🚆 **[Live Demo](https://yusufk.github.io/gautrain-schedule/)**

## Features

- **Reverse Journey Planning**: Enter your desired arrival time and find the latest train you can catch
- **Multiple Time Modes**: 
  - Depart Now (real-time journey planning)
  - Depart At (specific departure time)
  - Arrive By (reverse planning from arrival time)
- **Live API Integration**: Real-time journey information from Gautrain's official API
- **Smart Scheduling**: Automatically calculates optimal departure windows for "Arrive By" mode
- **Fare Estimation**: Distance-based fare calculations with peak/off-peak pricing
- **Journey Details**: View all intermediate stops, durations, and countdowns
- **Weekend Support**: Toggle between weekday and weekend schedules
- **Modern UI**: Gautrain-branded design with responsive mobile layout
- **Offline Fallback**: Static schedule data when API is unavailable

## Tech Stack

- **React 19.2.0**: Modern hooks-based architecture
- **Vite 7.2.5**: Fast development and optimized builds
- **date-fns**: Time formatting and manipulation
- **Gautrain API**: Live journey planning via WhereIsMyTransport platform
- **GitHub Pages**: Automated deployment via GitHub Actions

## Quick Start

### Development

```bash
cd gautrain-app
npm install
npm run dev
```

Visit http://localhost:3000/gautrain-schedule/

### Production Build

```bash
npm run build
npm run preview
```

### Deploy to GitHub Pages

```bash
npm run deploy
```

Or push to `main` branch - GitHub Actions will automatically build and deploy.

## Project Structure

```
gautrain-schedule/
├── gautrain-app/           # React application
│   ├── src/
│   │   ├── services/       # API integration layer
│   │   │   └── gautrainApi.js
│   │   ├── utils/          # Time utilities
│   │   │   └── timeUtils.js
│   │   ├── App.jsx         # Main component
│   │   └── App.css         # Gautrain-branded styles
│   ├── public/
│   │   └── gautrain_schedule.json  # Offline fallback
│   └── vite.config.js
├── data/                   # Legacy schedule data
│   ├── gautrain_schedule.json
│   ├── gautrain-viewer.html
│   └── gautrain_parser.py
└── .github/workflows/
    └── deploy.yml          # Automated deployment
```

## API Integration

The app uses the Gautrain Transport API (powered by WhereIsMyTransport):

- **Stops API**: Fetches all Gautrain stations with coordinates
- **Journey API**: Creates journey itineraries between stations
- **Live Status**: Checks API availability

### Smart "Arrive By" Logic

When planning by arrival time, the app:
1. Calculates a 1-hour departure window before the target arrival
2. Requests 20 journey options from the API
3. Filters results to only show trains arriving ≤ target time
4. Sorts by latest departure first (giving you maximum flexibility)
5. Returns the top 5 options

## Gautrain Network

Currently supports the North-South Line with 8 stations:

- Park Station
- Rosebank
- Sandton
- Marlboro
- Midrand
- Centurion
- Pretoria
- Hatfield

## Deployment

The app is automatically deployed to GitHub Pages via GitHub Actions on every push to `main`.

### Manual Setup

1. Enable GitHub Pages in repository settings:
   - Settings → Pages → Source: GitHub Actions
2. Push changes to trigger deployment
3. App will be available at: https://yusufk.github.io/gautrain-schedule/

## Legacy Files

The `data/` directory contains the original static schedule viewer:
- Extracted from official Bombela Fare Guide Brochure (2025)
- Simple HTML viewer with JSON schedule data
- Useful as offline fallback reference

## License

MIT

---
*Created: January 2026*
