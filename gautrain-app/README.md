# Gautrain Journey Planner - React PWA

A modern Progressive Web App for planning Gautrain journeys with complete schedule data, offline support, and a beautiful Gautrain-branded interface.

## Features

- ✅ **Complete Schedule**: 421+ trips covering full day service
- ✅ **PWA Support**: Install as native app, works offline
- ✅ **Smart Planning**: Multiple time modes (Depart Now/At/Arrive By)
- ✅ **Live Countdowns**: LED-style display with hours/minutes
- ✅ **Route Timeline**: Expandable stops with animated visualization
- ✅ **Peak Detection**: Automatic fare calculation
- ✅ **Calendar Integration**: Add reminders to your calendar
- ✅ **Google Maps**: One-click navigation to station
- ✅ **Both Lines**: North-South and Airport lines supported
- ✅ **Gautrain Branding**: Official blue, gold, and white colors

## Quick Start

```bash
npm install
npm run dev
```

Visit http://localhost:3000/gautrain-schedule/

## Tech Stack

Built with modern React and tooling:

- **React 19.2.0** - UI framework
- **Vite 7.2.5** - Build tool with Rolldown
- **vite-plugin-pwa** - PWA support and service workers
- **date-fns 4.1.0** - Time manipulation
- **sharp** - Icon generation
- **vitest** - Testing framework

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run test` | Run test suite with Vitest |
| `npm run lint` | Check code with ESLint |
| `npm run deploy` | Deploy to GitHub Pages |

## Project Structure

```
src/
├── components/
│   ├── NixieCountdown.jsx       # LED countdown display
│   └── ReloadPrompt.jsx         # PWA update prompt
├── services/
│   └── gautrainApi.js           # Schedule API and journey logic
├── hooks/
│   └── useCountdown.js          # Countdown timer hook
├── utils/
│   └── timeUtils.js             # Time formatting utilities
├── App.jsx                      # Main application component
├── App.css                      # Gautrain-branded styles
└── main.jsx                     # Entry point

public/
├── gautrain_schedules.json      # Complete schedule (421 trips)
├── icon.svg                     # Source icon (customizable)
├── icon-192.png                 # PWA icon (192×192)
├── icon-512.png                 # PWA icon (512×512)
└── manifest.json                # PWA manifest
```

## PWA Configuration

The app uses `vite-plugin-pwa` with the following configuration:

- **Register Type**: Auto-update (prompts user when update available)
- **Workbox**: Caches all assets and schedule data
- **Manifest**: Gautrain branding with custom icons
- **Offline**: Full functionality without internet

### Regenerate Icons

After editing `public/icon.svg`:

```bash
node generate-icons.js
```

This generates `icon-192.png` and `icon-512.png` using Sharp.

## Schedule Data

The app uses explicit schedule data from the official Gautrain Fare Guide:

- **421 trips** across 8 schedule configurations
- **Both lines**: North-South and Airport
- **Both directions**: Bidirectional travel
- **Weekday/Weekend**: Separate schedules
- **Peak/Off-peak**: Automatic fare detection
- **Train types**: 8-car (peak) and 4-car (off-peak)

## Components

### NixieCountdown
LED-style countdown with:
- Hours:Minutes format (>60 min)
- Minutes:Seconds format (<60 min)
- Train capacity display
- Smooth animations

### ReloadPrompt
PWA update notification:
- Background update detection
- User-friendly prompt
- Gautrain-styled UI

### Journey Route Timeline
Interactive stops display:
- Collapsible (saves space)
- Animated timeline
- Origin/destination highlights
- Intermediate stops
- Times for each stop

## Development

### Environment
- Node.js 18+ required
- npm or yarn

### Hot Module Replacement
Vite provides instant HMR for:
- React components
- CSS styles
- PWA configuration

### Testing
```bash
npm test                 # Run all tests
npm test -- --watch      # Watch mode
npm test -- --coverage   # Coverage report
```

## Deployment

Configured for GitHub Pages with automated CI/CD:

1. Push to `main` branch
2. GitHub Actions builds and deploys
3. Live at: https://yusufk.github.io/gautrain-schedule/

### Base Path
Configured in `vite.config.js`:
```javascript
base: '/gautrain-schedule/'
```

## Browser Support

- ✅ Chrome/Edge (desktop/Android) - Full PWA
- ✅ Firefox - Web app only
- ✅ Safari (iOS) - Manual install
- ✅ Mobile browsers - Responsive design

## License

MIT

---

Built with ❤️ for a very special Gautrain commuter
