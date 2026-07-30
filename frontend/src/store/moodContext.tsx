import React, {createContext, useContext, useState, useEffect, ReactNode, useRef} from 'react';
import {ApiResponse, Mood, MoodType, Location, UserProfile} from '../types';
import {moodService} from '../services/moodService';
import {locationService} from '../services/locationService';
import {notificationService} from '../services/notificationService';
import {calculateDistance, isWithinProximity} from '../utils/distance';
import {CONFIG} from '../constants/config';
import {useAuth} from './authContext';
import {widgetService} from '../services/widgetService';
import {userService} from '../services/userService';
import {meetingService} from '../services/meetingService';
import {analytics, ANALYTICS_EVENTS} from '../services/analyticsService';

interface MoodContextType {
  currentMood: Mood | null;
  partnerMood: Mood | null;
  isLoading: boolean;
  updateMood: (
    type: MoodType,
    message?: string,
    extraEmoji?: string | null,
    extraLabel?: string | null
  ) => Promise<void>;
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
  const [partnerUser, setPartnerUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isNearby, setIsNearby] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const currentMoodRef = useRef<Mood | null>(null);
  const partnerMoodRef = useRef<Mood | null>(null);
  const partnerUserRef = useRef<UserProfile | null>(null);
  const userRef = useRef<typeof user | null>(null);
  const lastLockscreenKeyRef = useRef<string | null>(null);
  const lastWidgetKeyRef = useRef<string | null>(null);
  const lastProximityStateRef = useRef<boolean>(false);
  const lastPartnerFetchRef = useRef<number>(0);
  const lastMeetingPingRef = useRef<number>(0);
  const PARTNER_FETCH_INTERVAL_MS = 60 * 1000;
  const MEETING_PING_INTERVAL_MS = 10 * 60 * 1000;

  useEffect(() => {
    currentMoodRef.current = currentMood;
  }, [currentMood]);

  useEffect(() => {
    partnerMoodRef.current = partnerMood;
  }, [partnerMood]);

  useEffect(() => {
    partnerUserRef.current = partnerUser;
  }, [partnerUser]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    let cleanupPolling: (() => void) | null = null;
    let isActive = true;

    const run = async () => {
      await refreshMoods();
      if (!isActive) {
        return;
      }
      await initializeLocationTracking();
      cleanupPolling = startMoodPolling();
    };

    run();

    return () => {
      isActive = false;
      locationService.stopTracking();
      if (cleanupPolling) {
        cleanupPolling();
      }
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
    const activeUser = userRef.current;
    const activePartnerMood = partnerMoodRef.current;
    const activeCurrentMood = currentMoodRef.current;

    if (!activeUser?.partnerId || !activePartnerMood?.location) {
      return;
    }

    const partnerLocation: Location = {
      latitude: activePartnerMood.location.latitude,
      longitude: activePartnerMood.location.longitude,
      timestamp: Date.now(),
    };

    const calculatedDistance = calculateDistance(myLocation, partnerLocation);
    setDistance(calculatedDistance);

    const nearby = isWithinProximity(myLocation, partnerLocation, CONFIG.PROXIMITY_THRESHOLD_KM);
    setIsNearby(nearby);

    const wasNearby = lastProximityStateRef.current;
    lastProximityStateRef.current = nearby;

    if (nearby) {
      const now = Date.now();
      if (now - lastMeetingPingRef.current >= MEETING_PING_INTERVAL_MS) {
        lastMeetingPingRef.current = now;
        try {
          await meetingService.recordProximity(now);
        } catch (error) {
          console.error('Error recording proximity:', error);
        }
      }
    }

    if (nearby && !wasNearby && activeCurrentMood?.type !== MoodType.HAPPY) {
      // Auto-update both to happy when nearby
      await updateMoodWithProximity(MoodType.HAPPY, myLocation, partnerLocation, null, null);
    }
  };

  const updateMoodWithProximity = async (
    type: MoodType,
    myLocation: Location,
    partnerLocation: Location,
    extraEmoji?: string | null,
    extraLabel?: string | null
  ) => {
    try {
      const response = await moodService.updateMoodWithProximity(
        type,
        myLocation,
        partnerLocation,
        extraEmoji,
        extraLabel
      );
      if (response.success && response.data) {
        setCurrentMood(response.data);
        await refreshMoods();
        const partnerName = partnerUserRef.current?.name || 'Parceiro';
        await notificationService.sendProximityNotification(partnerName);
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
        user.partnerId
          ? moodService.getPartnerMood(user.partnerId)
          : Promise.resolve<ApiResponse<Mood>>({success: false}),
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
          const nearby = calculatedDistance <= CONFIG.PROXIMITY_THRESHOLD_KM;
          setIsNearby(nearby);
          lastProximityStateRef.current = nearby;
        }
      }

      let resolvedPartnerUser = partnerUserRef.current;
      if (user.partnerId) {
        const shouldRefreshPartner =
          !resolvedPartnerUser ||
          resolvedPartnerUser.id !== user.partnerId ||
          Date.now() - lastPartnerFetchRef.current > PARTNER_FETCH_INTERVAL_MS;
        if (shouldRefreshPartner) {
          const partnerUserResponse = await userService.getUserById(user.partnerId);
          if (partnerUserResponse.success && partnerUserResponse.data) {
            resolvedPartnerUser = partnerUserResponse.data;
            setPartnerUser(partnerUserResponse.data);
            lastPartnerFetchRef.current = Date.now();
          }
        }
      } else if (partnerUserRef.current) {
        setPartnerUser(null);
      }

      const partnerName =
        user?.partnerName?.trim() || resolvedPartnerUser?.name || 'Parceiro';
      const partnerData = partnerResponse.success ? partnerResponse.data : undefined;

      // Atualiza notificação da tela bloqueada quando os humores mudam
      if (currentResponse.success && currentResponse.data) {
        const absolutePhotoUrl = null;
        const lockscreenKey = JSON.stringify({
          photoUrl: absolutePhotoUrl,
          moodType: currentResponse.data.type,
          moodMessage: currentResponse.data.message || '',
          partnerType: partnerData?.type || '',
          partnerMessage: partnerData?.message || '',
          partnerName,
        });

        if (lastLockscreenKeyRef.current !== lockscreenKey) {
          lastLockscreenKeyRef.current = lockscreenKey;
          await notificationService.updateLockScreenNotification(
            absolutePhotoUrl,
            currentResponse.data.type,
            currentResponse.data.message,
            partnerData?.type,
            partnerData ? partnerName : undefined,
            partnerData?.message
          );
        }

        if (user.partnerId && resolvedPartnerUser) {
          const widgetKey = JSON.stringify({
            partnerType: partnerData?.type || '',
            partnerMessage: partnerData?.message || '',
            partnerName,
            partnerDistanceKm: distance ?? null,
          });

          if (lastWidgetKeyRef.current !== widgetKey) {
            lastWidgetKeyRef.current = widgetKey;
            widgetService.updatePartnerMoodWidget(
              partnerName,
              partnerData?.message || '',
              partnerData?.type || null,
              distance ?? null
            );
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing moods:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateMood = async (
    type: MoodType,
    message?: string,
    extraEmoji?: string | null,
    extraLabel?: string | null
  ) => {
    if (!user) {
      return;
    }

    setIsLoading(true);
    try {
      const location = await locationService.getCurrentLocation();
      const response = await moodService.updateMood(
        type,
        message,
        location,
        extraEmoji,
        extraLabel
      );

      if (response.success && response.data) {
        setCurrentMood(response.data);
        analytics.track(ANALYTICS_EVENTS.MOOD_SHARED, {
          moodType: type,
          hasMessage: !!message,
          hasPartner: !!user.partnerId,
        });
        await refreshMoods();

        // Atualização de notificações é tratada no refreshMoods para evitar duplicidade
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
