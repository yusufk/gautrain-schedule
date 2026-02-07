# Gautrain Journey Planner

A modern Progressive Web App (PWA) for planning Gautrain journeys with real-time schedules, offline support, and smart trip planning. Built with React and featuring a beautiful Gautrain-branded interface.

🚆 **[Live Demo](https://yusufk.github.io/gautrain-schedule/)**

## Features

### Core Journey Planning
- **Multiple Time Modes**: 
  - **Depart Now**: Find the next available trains in real-time
  - **Depart At Around**: Search within a ±30 minute window of your target time
  - **Arrive By**: Reverse planning - find trains that get you there on time
- **Complete Schedule Data**: 421+ trips covering all day service (05:29-21:12+)
- **Weekend Support**: Automatic detection and scheduling for weekends and public holidays
- **Both Lines Supported**: 
  - North-South Line (Park ↔ Hatfield)
  - Airport Line (Sandton ↔ OR Tambo)

### Smart Features
- **Live Countdown Display**: LED-style countdown showing hours and minutes until departure
- **Peak/Off-Peak Detection**: Automatic fare calculation based on time of day
- **Train Capacity Info**: See if it's an 8-car (1920 capacity) or 4-car (960 capacity) train
- **Interactive Stops Timeline**: Expandable route visualization showing all intermediate stops with times
- **Calendar Reminders**: Add departure reminders to your calendar (20 minutes before)
- **Google Maps Integration**: One-click navigation to origin station

### Progressive Web App (PWA)
- **Installable**: Add to home screen on mobile and desktop
- **Offline Support**: Works without internet after first load
- **Auto-Updates**: Prompts when new versions are available
- **Custom Icons**: Gautrain-branded app icons (blue, gold, white)
- **Standalone Mode**: Runs like a native app without browser chrome

### User Experience
- **Gautrain Brand Design**: Official blue (#003e7e) and gold (#ffb81c) color scheme
- **Responsive Layout**: Optimized for mobile and desktop
- **Animated Interactions**: Smooth transitions and hover effects
- **Smart Validation**: Prevents invalid route selections
- **Modern UI Components**: Clean cards, buttons, and form elements

## Tech Stack

- **React 19.2.0**: Modern hooks-based architecture with concurrent features
- **Vite 7.2.5**: Lightning-fast development with Rolldown bundler
- **PWA Plugin**: vite-plugin-pwa for service worker and offline support
- **date-fns 4.1.0**: Robust time formatting and manipulation
- **Sharp**: High-quality icon generation for PWA
- **Vitest**: Unit testing framework
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
├── gautrain-app/           # React PWA application
│   ├── src/
│   │   ├── components/
│   │   │   ├── NixieCountdown.jsx    # LED countdown display
│   │   │   └── ReloadPrompt.jsx      # PWA update prompt
│   │   ├── services/
│   │   │   └── gautrainApi.js        # Schedule API with trip logic
│   │   ├── utils/
│   │   │   └── timeUtils.js          # Time formatting utilities
│   │   ├── hooks/
│   │   │   └── useCountdown.js       # Countdown timer hook
│   │   ├── App.jsx                   # Main app component
│   │   ├── App.css                   # Gautrain-branded styles
│   │   └── main.jsx                  # App entry point
│   ├── public/
│   │   ├── gautrain_schedules.json   # Complete schedule data (421 trips)
│   │   ├── icon.svg                  # Source icon (Gautrain branding)
│   │   ├── icon-192.png              # PWA icon (192×192)
│   │   ├── icon-512.png              # PWA icon (512×512)
│   │   └── manifest.json             # PWA manifest
│   ├── vite.config.js                # Vite + PWA configuration
│   ├── generate-icons.js             # Icon generation script
│   └── package.json
├── data/                   # Schedule data and utilities
│   ├── gautrain_schedules.json       # Master schedule file
│   ├── gautrain-viewer.html          # Legacy HTML viewer
│   └── gautrain_parser.py            # Schedule extraction tool
└── .github/workflows/
    └── deploy.yml          # Automated CI/CD pipeline
```

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
*Created: January 2026, for Shazia*
