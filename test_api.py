#!/usr/bin/env python3
"""
Gautrain API Testing Script - 2026
Quick test to verify API availability
"""

import requests
import json
from datetime import datetime

def test_api():
    print("="*60)
    print("GAUTRAIN API TESTING - 2026")
    print("="*60)
    
    # Test 1: Check if API is live
    print("\n1. Testing IsLive endpoint...")
    try:
        response = requests.get(
            "https://api.gautrain.co.za/user-service/api/0/mobile/isLive/1.0.0",
            timeout=10
        )
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test 2: Get stops
    print("\n2. Testing Stops endpoint...")
    try:
        response = requests.get(
            "https://api.gautrain.co.za/transport-api/api/0/stops/gautrain",
            timeout=10
        )
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                print(f"   Found {len(data)} stops")
                for stop in data[:3]:  # Show first 3
                    print(f"     - {stop.get('name')}: {stop.get('geometry', {}).get('coordinates')}")
            with open('api_stops.json', 'w') as f:
                json.dump(data, f, indent=2)
            print("   Full response saved to api_stops.json")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test 3: Journey planning
    print("\n3. Testing Journey Planning endpoint...")
    try:
        payload = {
            "geometry": {
                "coordinates": [
                    [28.23794, -25.74762],  # Hatfield
                    [28.05693, -26.10858]   # Sandton
                ],
                "type": "MultiPoint"
            },
            "profile": "ClosestToTime",
            "maxItineraries": 3,
            "timeType": "DepartAfter",
            "time": None,
            "only": {
                "agencies": ["edObkk6o-0WN3tNZBLqKPg"]
            }
        }
        
        response = requests.post(
            "https://api.gautrain.co.za/transport-api/api/0/journey/create",
            json=payload,
            timeout=10
        )
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Journey ID: {data.get('id')}")
            if 'itineraries' in data and len(data['itineraries']) > 0:
                itin = data['itineraries'][0]
                print(f"   First itinerary:")
                print(f"     Departure: {itin.get('departureTime')}")
                print(f"     Arrival: {itin.get('arrivalTime')}")
                print(f"     Duration: {itin.get('duration')}s")
            with open('api_journey.json', 'w') as f:
                json.dump(data, f, indent=2)
            print("   Full response saved to api_journey.json")
    except Exception as e:
        print(f"   Error: {e}")
    
    print("\n" + "="*60)
    print("TESTING COMPLETE")
    print("="*60)

if __name__ == "__main__":
    test_api()
