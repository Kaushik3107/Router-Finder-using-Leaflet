// src/app/map/map.component.ts
import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
})
export class MapComponent implements OnInit {
  map: any;
  startPoint: string = '';
  destinationPoint: string = '';
  markerLayer: L.LayerGroup = L.layerGroup(); // Marker group
  polylineLayer: L.Polyline | null = null; // Store polyline
  travelMarker: L.Marker | null = null; // Moving marker
  travelTime: number | null = null; // Estimated travel time in minutes

  ngOnInit(): void {
    // Initialize the map
    this.map = L.map('map').setView([39.8283, -98.5795], 4); // USA center

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);

    // Add marker layer to the map
    this.markerLayer.addTo(this.map);
  }

  async plotRoute() {
    const startCoords = await this.getCoordinates(this.startPoint);
    const destinationCoords = await this.getCoordinates(this.destinationPoint);

    if (startCoords && destinationCoords) {
      // Set map view to the starting point
      this.map.setView(startCoords, 6);

      // Clear previous markers and polylines
      this.markerLayer.clearLayers();
      if (this.polylineLayer) {
        this.map.removeLayer(this.polylineLayer);
      }
      if (this.travelMarker) {
        this.map.removeLayer(this.travelMarker);
        this.travelMarker = null; // Reset travelMarker
      }

      // Add start and destination markers
      L.marker(startCoords)
        .addTo(this.markerLayer)
        .bindPopup('Start')
        .openPopup();
      L.marker(destinationCoords)
        .addTo(this.markerLayer)
        .bindPopup('Destination')
        .openPopup();

      // Draw a polyline between the two points
      this.polylineLayer = L.polyline([startCoords, destinationCoords], {
        color: 'blue',
      });
      this.polylineLayer.addTo(this.map);

      // Calculate travel time (assume 80 km/h speed)
      const distance = this.calculateDistance(startCoords, destinationCoords);
      this.travelTime = Math.ceil((distance / 80) * 60); // in minutes

      // Start the marker simulation
      this.simulateTravel(startCoords, destinationCoords);
    } else {
      alert('Invalid locations! Please enter valid points.');
    }
  }

  async getCoordinates(location: string): Promise<[number, number] | null> {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${location}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.length > 0) {
      const { lat, lon } = data[0];
      return [parseFloat(lat), parseFloat(lon)];
    } else {
      return null;
    }
  }

  calculateDistance(start: [number, number], end: [number, number]): number {
    const [lat1, lon1] = start;
    const [lat2, lon2] = end;

    const R = 6371; // Radius of the Earth in km
    const dLat = this.degToRad(lat2 - lat1);
    const dLon = this.degToRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degToRad(lat1)) *
        Math.cos(this.degToRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  }

  degToRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  simulateTravel(start: [number, number], end: [number, number]) {
    const latDiff = (end[0] - start[0]) / 100;
    const lonDiff = (end[1] - start[1]) / 100;

    let currentLat = start[0];
    let currentLon = start[1];
    let step = 0;

    // Create a new marker at the starting point
    this.travelMarker = L.marker([currentLat, currentLon]).addTo(this.map);

    const interval = setInterval(() => {
      if (step >= 100) {
        clearInterval(interval); // Stop the simulation when it completes
        return;
      }

      // Ensure the marker exists before updating its position
      if (this.travelMarker) {
        currentLat += latDiff;
        currentLon += lonDiff;
        this.travelMarker.setLatLng([currentLat, currentLon]);
      }

      step++;
    }, 700); // Adjust interval for speed
  }
}
