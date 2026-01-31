import PyPDF2
import json
import re

with open('/Users/yusuf/Downloads/15305+BOMBELA+FARE+GUIDE+BROCHURE+-+2025+Prices++Schules.pdf', 'rb') as f:
    pdf = PyPDF2.PdfReader(f)
    text = pdf.pages[0].extract_text()

# Split into lines and clean
lines = [l.strip() for l in text.split('\n') if l.strip()]

# Find all time patterns
all_times = []
for line in lines:
    times = re.findall(r'\b\d{2}:\d{2}\b', line)
    if times:
        all_times.extend(times)

# Group times into trains (8 stations per direction)
trains = []
i = 0
while i < len(all_times):
    if i + 7 < len(all_times):
        trains.append(all_times[i:i+8])
        i += 8
    else:
        break

# Stations
stations = ['Park', 'Rosebank', 'Sandton', 'Marlboro', 'Midrand', 'Centurion', 'Pretoria', 'Hatfield']

# Build schedule
schedule = {
    'metadata': {
        'year': 2025,
        'source': 'Bombela Fare Guide Brochure',
        'lines': ['North-South', 'East-West']
    },
    'routes': {
        'north_south': {
            'stations': stations,
            'weekday': [],
            'weekend': []
        }
    }
}

# Split roughly (first half weekday, second half weekend)
mid = len(trains) // 2
for train in trains[:mid]:
    schedule['routes']['north_south']['weekday'].append({
        'times': dict(zip(stations, train))
    })

for train in trains[mid:]:
    schedule['routes']['north_south']['weekend'].append({
        'times': dict(zip(stations, train))
    })

print(json.dumps(schedule, indent=2))
