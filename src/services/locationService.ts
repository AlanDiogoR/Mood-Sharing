import * as Location from 'expo-location';
import {Location as LocationType} from '../types';
import {CONFIG} from '../constants/config';

class LocationService {
  private isInitialized = false;
  private currentLocation: LocationType | null = null;
  private locationUpdateCallback: ((location: LocationType) => void) | null = null;
  private watchPositionSubscription: Location.LocationSubscription | null = null;

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      const {status} = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Permissão de localização negada');
      }

      const backgroundStatus = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus.status !== 'granted') {
        console.warn('Permissão de localização em background negada');
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing location service:', error);
      throw error;
    }
  }

  async startTracking(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Start watching position
      this.watchPositionSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: CONFIG.LOCATION_UPDATE_INTERVAL,
          distanceInterval: 10, // meters
        },
        position => {
          const newLocation: LocationType = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: position.timestamp,
          };

          this.currentLocation = newLocation;

          if (this.locationUpdateCallback) {
            this.locationUpdateCallback(newLocation);
          }
        }
      );
    } catch (error) {
      console.error('Error starting location tracking:', error);
    }
  }

  async stopTracking(): Promise<void> {
    if (this.watchPositionSubscription) {
      this.watchPositionSubscription.remove();
      this.watchPositionSubscription = null;
    }
  }

  async getCurrentLocation(): Promise<LocationType> {
    try {
      const {status} = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        await this.initialize();
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const location: LocationType = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        timestamp: position.timestamp,
      };

      this.currentLocation = location;
      return location;
    } catch (error) {
      console.error('Error getting current location:', error);
      throw error;
    }
  }

  setLocationUpdateCallback(callback: (location: LocationType) => void): void {
    this.locationUpdateCallback = callback;
  }

  getStoredLocation(): LocationType | null {
    return this.currentLocation;
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const {status} = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return false;
      }

      const backgroundStatus = await Location.requestBackgroundPermissionsAsync();
      return backgroundStatus.status === 'granted';
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  async checkPermissions(): Promise<boolean> {
    try {
      const foregroundStatus = await Location.getForegroundPermissionsAsync();
      const backgroundStatus = await Location.getBackgroundPermissionsAsync();
      return (
        foregroundStatus.status === 'granted' &&
        backgroundStatus.status === 'granted'
      );
    } catch (error) {
      console.error('Error checking location permissions:', error);
      return false;
    }
  }
}

export const locationService = new LocationService();
