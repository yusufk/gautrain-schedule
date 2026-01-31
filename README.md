# Gautrain Schedule Viewer

Simple static web app for viewing Gautrain train schedules.

## Data

Extracted from official Bombela Fare Guide Brochure (2025).

**Routes:**
- North-South Line: Park ↔ Hatfield (via Sandton, Pretoria)
- Weekday and Weekend/Holiday schedules

## Files

- `data/gautrain_schedule.json` - Complete schedule data (423KB)
- `data/gautrain-viewer.html` - Static web viewer
- `data/gautrain_parser.py` - PDF extraction script

## Usage

Open `data/gautrain-viewer.html` in a browser, or serve via:

```bash
cd data
python3 -m http.server 8000
```

Then visit: http://localhost:8000/gautrain-viewer.html

## Features

- Clean, mobile-friendly interface
- Tab switching (weekday/weekend)
- All stations and departure times
- No backend required

## Deploy

Copy `gautrain_schedule.json` and `gautrain-viewer.html` to any static host.

---
*Created: 2026-01-31*
