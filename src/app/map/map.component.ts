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
  markerLayer: L.LayerGroup = L.layerGroup(); // To manage markers
  polylineLayer: L.Polyline | null = null; // Store the polyline layer

  ngOnInit(): void {
    // Initialize the Leaflet map
    this.map = L.map('map').setView([39.8283, -98.5795], 4); // USA center

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);

    // Add the marker layer to the map (for handling markers dynamically)
    this.markerLayer.addTo(this.map);
  }

  async plotRoute() {
    const startCoords = await this.getCoordinates(this.startPoint);
    const destinationCoords = await this.getCoordinates(this.destinationPoint);

    if (startCoords && destinationCoords) {
      // Set the map view to the starting point
      this.map.setView(startCoords, 6);

      // Clear previous markers and polylines if any
      this.markerLayer.clearLayers();
      if (this.polylineLayer) {
        this.map.removeLayer(this.polylineLayer); // Remove existing polyline
      }

      // Add markers for start and destination points
      L.marker(startCoords)
        .addTo(this.markerLayer)
        .bindPopup('Start')
        .openPopup();
      L.marker(destinationCoords)
        .addTo(this.markerLayer)
        .bindPopup('Destination')
        .openPopup();

      // Draw a new polyline between the two points
      this.polylineLayer = L.polyline([startCoords, destinationCoords], {
        color: 'blue',
      });
      this.polylineLayer.addTo(this.map);
    } else {
      alert('Invalid locations! Please enter valid points.');
    }
  }

  // Function to get coordinates using Nominatim API
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
}
