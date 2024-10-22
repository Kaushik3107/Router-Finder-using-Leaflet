import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet';

// Define custom marker icons
const startIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/252/252025.png', // Replace with your desired icon URL
  iconSize: [38, 38], // size of the icon
  iconAnchor: [22, 94], // point of the icon which will correspond to marker's location
  popupAnchor: [-3, -76], // point from which the popup should open relative to the iconAnchor
});

const destinationIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1397/1397898.png', // Replace with your desired icon URL
  iconSize: [38, 38], // size of the icon
  iconAnchor: [22, 94], // point of the icon which will correspond to marker's location
  popupAnchor: [-3, -76], // point from which the popup should open relative to the iconAnchor
});

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
})
export class MapComponent implements OnInit {
  map: any;
  startPoint: string = '';
  destinationPoint: string = '';
  markerLayer: L.LayerGroup = L.layerGroup(); // Manage markers
  polylineLayer: L.Polyline | null = null; // Store the polyline
  distance: string = ''; // Distance in kilometers
  travelTime: string = ''; // Travel time in hours and minutes

  private openRouteServiceApiKey = 'YOUR_API_KEY'; // Replace with your API key

  ngOnInit(): void {
    // Initialize the Leaflet map
    this.map = L.map('map').setView([39.8283, -98.5795], 4); // USA center

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);

    this.markerLayer.addTo(this.map); // Add marker layer to map
  }

  async plotRoute() {
    const startCoords = await this.getCoordinates(this.startPoint);
    const destinationCoords = await this.getCoordinates(this.destinationPoint);

    if (startCoords && destinationCoords) {
      // Set the map view to the starting point
      this.map.setView(startCoords, 6);

      // Clear previous markers and polyline
      this.markerLayer.clearLayers();
      if (this.polylineLayer) {
        this.map.removeLayer(this.polylineLayer);
      }

      // Add custom markers for both points
      L.marker(startCoords, { icon: startIcon })
        .addTo(this.markerLayer)
        .bindPopup('Start')
        .openPopup();
      L.marker(destinationCoords, { icon: destinationIcon })
        .addTo(this.markerLayer)
        .bindPopup('Destination')
        .openPopup();

      // Draw polyline between the points
      this.polylineLayer = L.polyline([startCoords, destinationCoords], {
        color: 'blue',
      });
      this.polylineLayer.addTo(this.map);

      // Calculate real distance and travel time using OpenRouteService API
      await this.calculateDistanceAndTime(startCoords, destinationCoords);
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

  async calculateDistanceAndTime(
    startCoords: [number, number],
    destinationCoords: [number, number]
  ) {
    const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${this.openRouteServiceApiKey}`;
    const body = {
      coordinates: [startCoords.reverse(), destinationCoords.reverse()],
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const distanceInKm = (route.summary.distance / 1000).toFixed(2); // Convert meters to km
      const durationInMinutes = route.summary.duration / 60; // Convert seconds to minutes

      this.distance = `${distanceInKm} km`;
      this.travelTime = `${Math.floor(durationInMinutes / 60)} hrs ${Math.round(
        durationInMinutes % 60
      )} mins`;
    } else {
      alert('Unable to calculate distance and time.');
    }
  }

  swapCities() {
    const temp = this.startPoint;
    this.startPoint = this.destinationPoint;
    this.destinationPoint = temp;
  }
}
