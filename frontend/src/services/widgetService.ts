import { NativeModules, Platform } from 'react-native';

const { MoodWidgetModule } = NativeModules;

export const widgetService = {
  updatePartnerMoodWidget: (partnerName: string, message: string, partnerPhotoUrl?: string | null) => {
    if (Platform.OS !== 'android') {
      return;
    }
    if (!MoodWidgetModule?.updateMoodWidget) {
      return;
    }
    const safeName = partnerName?.trim() || 'Parceiro';
    const safeMessage = message?.trim() || 'Atualizou o humor';
    const safePhotoUrl = partnerPhotoUrl?.trim() || null;
    MoodWidgetModule.updateMoodWidget(safeName, safeMessage, safePhotoUrl);
  },
};
