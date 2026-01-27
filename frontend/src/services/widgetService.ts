import { NativeModules, Platform } from 'react-native';
import { MoodType } from '../types';

const { MoodWidgetModule } = NativeModules;

export const widgetService = {
  updatePartnerMoodWidget: (
    partnerName: string,
    message: string,
    partnerMoodType?: MoodType | null,
    partnerDistanceKm?: number | null
  ) => {
    if (Platform.OS !== 'android') {
      return;
    }
    if (!MoodWidgetModule?.updateMoodWidget) {
      return;
    }
    const safeName = partnerName?.trim() || 'Parceiro';
    const safeMessage = message?.trim() || 'Atualizou o humor';
    const safeMoodType = partnerMoodType || null;
    const safeDistanceKm =
      typeof partnerDistanceKm === 'number' && Number.isFinite(partnerDistanceKm)
        ? partnerDistanceKm
        : null;
    MoodWidgetModule.updateMoodWidget(
      safeName,
      safeMessage,
      safeMoodType,
      safeDistanceKm
    );
  },
};
