import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/store/authContext';
import { MoodProvider } from './src/store/moodContext';
import { ThemeProvider } from './src/store/themeContext';
import AppNavigator from './src/navigation/AppNavigator';
import { COLORS } from './src/constants/colors';
import { notificationService } from './src/services/notificationService';
import { firebaseService } from './src/services/firebaseService';

const App = () => {
  useEffect(() => {
    // Inicializa serviços de notificação
    const initServices = async () => {
      try {
        // Inicializa Firebase primeiro
        await firebaseService.initialize();

        // Depois inicializa notificações Expo
        await notificationService.initialize();
      } catch (error) {
        console.error('Erro ao inicializar serviços:', error);
      }
    };

    initServices();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <ThemeProvider>
            <MoodProvider>
              <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
              <NavigationContainer>
                <AppNavigator />
              </NavigationContainer>
            </MoodProvider>
          </ThemeProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;
