import * as Location from 'expo-location';
import apiService from './apiService';
import { StorageManager } from '../utils/storage';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

class LocationService {
  private watchId: Location.LocationSubscription | null = null;
  private isTracking = false;
  private lastLocationUpdate = 0;
  private readonly UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes

  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Location permission denied');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  async getCurrentLocation(): Promise<LocationData | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || undefined,
        timestamp: location.timestamp,
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  async startTracking(): Promise<void> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Location permission not granted');
      }

      if (this.isTracking) {
        console.log('Location tracking already active');
        return;
      }

      this.watchId = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: this.UPDATE_INTERVAL,
          distanceInterval: 100, // Update every 100 meters
        },
        async (location: Location.LocationObject) => {
          await this.handleLocationUpdate({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy || undefined,
            timestamp: location.timestamp,
          });
        }
      );

      this.isTracking = true;
      console.log('Location tracking started');

      // Send initial location update
      const currentLocation = await this.getCurrentLocation();
      if (currentLocation) {
        await this.handleLocationUpdate(currentLocation);
      }
    } catch (error) {
      console.error('Error starting location tracking:', error);
      throw error;
    }
  }

  async stopTracking(): Promise<void> {
    if (this.watchId) {
      this.watchId.remove();
      this.watchId = null;
    }
    this.isTracking = false;
    console.log('Location tracking stopped');
  }

  private async handleLocationUpdate(locationData: LocationData): Promise<void> {
    try {
      // Check if enough time has passed since last update
      const now = Date.now();
      if (now - this.lastLocationUpdate < this.UPDATE_INTERVAL) {
        return;
      }

      console.log('Sending location update:', locationData);

      // Send location to server
      const response = await apiService.updateUserLocation({
        lat: locationData.latitude.toString(),
        lng: locationData.longitude.toString(),
      });

      if (response.success) {
        this.lastLocationUpdate = now;
        await StorageManager.updateLastLocationUpdate(new Date().toISOString());
        console.log('Location update sent successfully');
      } else {
        console.error('Failed to send location update:', response.error);
      }
    } catch (error) {
      console.error('Error handling location update:', error);
    }
  }

  isCurrentlyTracking(): boolean {
    return this.isTracking;
  }

  getLastUpdateTime(): number {
    return this.lastLocationUpdate;
  }

  // Force location update (useful for manual updates)
  async forceLocationUpdate(): Promise<void> {
    const currentLocation = await this.getCurrentLocation();
    if (currentLocation) {
      await this.handleLocationUpdate(currentLocation);
    }
  }
}

// Export singleton instance
export const locationService = new LocationService();
export default locationService;