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
## Schedule Data

The app uses complete, explicit schedule data extracted from the official Gautrain Fare Guide:

- **421 Total Trips**: Full day coverage across all lines and schedule types
- **Service Hours**: 05:29 (first train) to 21:12+ (last train)
- **8 Schedule Configurations**:
  - North-South Line: Weekdays (both directions)
  - North-South Line: Weekends (both directions)
  - Airport Line: Weekdays (both directions)
  - Airport Line: Weekends (both directions)
- **Train Types**: 8-car trains (peak hours) and 4-car trains (off-peak)
- **Fare Types**: Automatic peak/off-peak detection
  - Peak: Weekdays 06:00-08:30 and 15:00-18:30
  - Off-Peak: All other times and weekends

### Gautrain Network

**North-South Line** (8 stations):
- Park Station → Rosebank → Sandton → Marlboro → Midrand → Centurion → Pretoria → Hatfield

**Airport Line** (4 stations):
- Sandton → Marlboro → Rhodesfield → OR Tambo International Airport (ORTIA)

## PWA Features

### Installation
- **Desktop**: Chrome/Edge will show an install button in the address bar
- **Android**: Tap the menu and select "Add to Home Screen" or use the in-app install prompt
- **iOS**: Tap the Share button and select "Add to Home Screen"

### Offline Support
After the first visit, the app caches:
- Complete application code
- All schedule data (421 trips)
- App icons and assets
- Works completely offline with full functionality

### Updates
When a new version is deployed, the app:
1. Automatically downloads updates in the background
2. Shows a prompt: "New content available, click reload to update"
3. Refreshes to the latest version when you click "Reload"

## Components

### NixieCountdown
LED-style countdown display that shows:
- **Hours:Minutes** format for waits over 60 minutes (e.g., "2:15")
- **Minutes:Seconds** format for waits under 60 minutes (e.g., "5:30")
- Train capacity info: "8-CAR TRAIN" or "4-CAR TRAIN"
- Smooth animations and Gautrain blue/gold styling

### ReloadPrompt
PWA update notification that:
- Appears when new version is available
- Offers "Reload" or "Close" options
- Shows "App ready to work offline" on first load
- Styled with Gautrain branding

### Journey Route Timeline
Expandable stops visualization with:
- Collapsible toggle (saves space)
- Animated vertical timeline
- Origin/destination markers with gold accents
- Intermediate stops with blue markers
- Train (🚉) and flag (🏁) emojis
- Staggered fade-in animations

## Development

### Key Scripts
```bash
npm run dev         # Start dev server (localhost:3000)
npm run build       # Production build
npm run preview     # Preview production build
npm run test        # Run tests with Vitest
npm run lint        # Check code quality
npm run deploy      # Deploy to GitHub Pages
```

### Icon Generation
To regenerate PWA icons after editing `public/icon.svg`:
```bash
node generate-icons.js
```

This creates `icon-192.png` and `icon-512.png` with the Gautrain color scheme.

## Deployment

The app is automatically deployed to GitHub Pages via GitHub Actions on every push to `main`.

### GitHub Pages Setup

1. Enable GitHub Pages in repository settings:
   - Settings → Pages → Source: GitHub Actions
2. Push changes to trigger deployment
3. App will be available at: https://yusufk.github.io/gautrain-schedule/

### Build Configuration

The app uses Vite's base path for GitHub Pages:
```javascript
// vite.config.js
export default defineConfig({
  base: '/gautrain-schedule/',
  // ...
})
```

## Testing

Run the test suite:
```bash
cd gautrain-app
npm test
```

Tests cover:
- Schedule loading and parsing
- Journey planning logic (DepartAfter, DepartWindow, ArriveBefore)
- Time utilities and formatting
- Peak/off-peak detection

## Browser Support

- **Chrome/Edge**: Full PWA support with install prompts
- **Firefox**: Works as web app, limited PWA features
- **Safari (iOS)**: Manual "Add to Home Screen" required
- **Mobile Browsers**: Optimized responsive design

## Legacy Files

The `data/` directory contains the original static schedule viewer:
- Extracted from official Bombela Fare Guide Brochure (2025)
- Simple HTML viewer with JSON schedule data
- Python parser for extracting schedule from PDFs
- Useful as reference and backup

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT

## Credits

Built with ❤️ for a very special Gautrain commuter

---
*This application is not affiliated with or endorsed by Gautrain Management Agency or Bombela Operating Company.*
