import React, {createContext, useContext, useState, useEffect, ReactNode} from 'react';
import {Mood, MoodType, Location} from '../types';
import {moodService} from '../services/moodService';
import {locationService} from '../services/locationService';
import {notificationService} from '../services/notificationService';
import {calculateDistance, isWithinProximity} from '../utils/distance';
import {getAbsoluteUrl} from '../utils/url';
import {CONFIG} from '../constants/config';
import {useAuth} from './authContext';

interface MoodContextType {
  currentMood: Mood | null;
  partnerMood: Mood | null;
  isLoading: boolean;
  updateMood: (type: MoodType, message?: string) => Promise<void>;
  refreshMoods: () => Promise<void>;
  isNearby: boolean;
  distance: number | null;
}

const MoodContext = createContext<MoodContextType | undefined>(undefined);

export const useMood = () => {
  const context = useContext(MoodContext);
  if (!context) {
    throw new Error('useMood must be used within a MoodProvider');
  }
  return context;
};

interface MoodProviderProps {
  children: ReactNode;
}

export const MoodProvider: React.FC<MoodProviderProps> = ({children}) => {
  const {user} = useAuth();
  const [currentMood, setCurrentMood] = useState<Mood | null>(null);
  const [partnerMood, setPartnerMood] = useState<Mood | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isNearby, setIsNearby] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    initializeLocationTracking();
    refreshMoods();
    const cleanupPolling = startMoodPolling();

    return () => {
      locationService.stopTracking();
      cleanupPolling();
    };
  }, [user]);

  const initializeLocationTracking = async () => {
    try {
      const hasPermission = await locationService.checkPermissions();
      if (!hasPermission) {
        await locationService.requestPermissions();
      }

      await locationService.initialize();
      await locationService.startTracking();

      locationService.setLocationUpdateCallback(async (location: Location) => {
        await checkProximity(location);
      });
    } catch (error) {
      console.error('Error initializing location tracking:', error);
    }
  };

  const checkProximity = async (myLocation: Location) => {
    if (!user?.partnerId || !partnerMood?.location) {
      return;
    }

    const partnerLocation: Location = {
      latitude: partnerMood.location.latitude,
      longitude: partnerMood.location.longitude,
      timestamp: Date.now(),
    };

    const calculatedDistance = calculateDistance(myLocation, partnerLocation);
    setDistance(calculatedDistance);

    const nearby = isWithinProximity(myLocation, partnerLocation, CONFIG.PROXIMITY_THRESHOLD_KM);
    setIsNearby(nearby);

    if (nearby && currentMood?.type !== MoodType.HAPPY) {
      // Auto-update both to happy when nearby
      await updateMoodWithProximity(MoodType.HAPPY, myLocation, partnerLocation);
    }
  };

  const updateMoodWithProximity = async (
    type: MoodType,
    myLocation: Location,
    partnerLocation: Location
  ) => {
    try {
      const response = await moodService.updateMoodWithProximity(type, myLocation, partnerLocation);
      if (response.success && response.data) {
        setCurrentMood(response.data);
        await refreshMoods();
        await notificationService.sendProximityNotification(user?.partnerId || 'Parceiro');
      }
    } catch (error) {
      console.error('Error updating mood with proximity:', error);
    }
  };

  const refreshMoods = async () => {
    if (!user) {
      return;
    }

    setIsLoading(true);
    try {
      const [currentResponse, partnerResponse] = await Promise.all([
        moodService.getCurrentMood(user.id),
        user.partnerId ? moodService.getPartnerMood(user.partnerId) : Promise.resolve({success: false}),
      ]);

      if (currentResponse.success && currentResponse.data) {
        setCurrentMood(currentResponse.data);
      }

      if (partnerResponse.success && partnerResponse.data) {
        setPartnerMood(partnerResponse.data);

        // Check proximity if we have both locations
        if (currentResponse.data?.location && partnerResponse.data.location) {
          const calculatedDistance = calculateDistance(
            currentResponse.data.location,
            partnerResponse.data.location
          );
          setDistance(calculatedDistance);
          setIsNearby(calculatedDistance <= CONFIG.PROXIMITY_THRESHOLD_KM);
        }
      }

      // Atualiza notificação da tela bloqueada quando os humores mudam
      if (currentResponse.success && currentResponse.data) {
        const partnerName = user?.partnerId || 'Parceiro';
        const absolutePhotoUrl = getAbsoluteUrl(user?.photoUrl);
        await notificationService.updateLockScreenNotification(
          absolutePhotoUrl,
          currentResponse.data.type,
          currentResponse.data.message,
          partnerResponse.success && partnerResponse.data ? partnerResponse.data.type : undefined,
          partnerResponse.success && partnerResponse.data ? partnerName : undefined
        );
      }
    } catch (error) {
      console.error('Error refreshing moods:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateMood = async (type: MoodType, message?: string) => {
    if (!user) {
      return;
    }

    setIsLoading(true);
    try {
      const location = await locationService.getCurrentLocation();
      const response = await moodService.updateMood(type, message, location);

      if (response.success && response.data) {
        setCurrentMood(response.data);
        await refreshMoods();

        if (user.partnerId) {
          await notificationService.sendMoodChangeNotification(
            user.partnerId,
            response.data.type
          );
        }

        // Atualiza notificação da tela bloqueada após atualizar humor
        const partnerName = user.partnerId || 'Parceiro';
        const absolutePhotoUrl = getAbsoluteUrl(user?.photoUrl);
        await notificationService.updateLockScreenNotification(
          absolutePhotoUrl,
          response.data.type,
          response.data.message,
          partnerMood?.type,
          partnerMood ? partnerName : undefined
        );
      } else {
        throw new Error(response.error || 'Erro ao atualizar estado');
      }
    } catch (error) {
      console.error('Error updating mood:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const startMoodPolling = () => {
    const interval = setInterval(() => {
      refreshMoods();
    }, CONFIG.LOCATION_UPDATE_INTERVAL);

    return () => clearInterval(interval);
  };

  const value: MoodContextType = {
    currentMood,
    partnerMood,
    isLoading,
    updateMood,
    refreshMoods,
    isNearby,
    distance,
  };

  return <MoodContext.Provider value={value}>{children}</MoodContext.Provider>;
};
