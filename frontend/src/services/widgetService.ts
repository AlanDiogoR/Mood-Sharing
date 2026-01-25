import { NativeModules, Platform } from 'react-native';

const { MoodWidgetModule } = NativeModules;

export const widgetService = {
  updatePartnerMoodWidget: (partnerName: string, message: string) => {
    if (Platform.OS !== 'android') {
      return;
    }
    if (!MoodWidgetModule?.updateMoodWidget) {
      return;
    }
    const safeName = partnerName?.trim() || 'Parceiro';
    const safeMessage = message?.trim() || 'Atualizou o humor';
    MoodWidgetModule.updateMoodWidget(safeName, safeMessage);
  },
};
