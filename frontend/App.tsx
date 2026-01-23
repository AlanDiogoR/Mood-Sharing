import React from 'react';
import {StatusBar} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AuthProvider} from './src/store/authContext';
import {MoodProvider} from './src/store/moodContext';
import AppNavigator from './src/navigation/AppNavigator';
import {COLORS} from './src/constants/colors';

const App = () => {

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SafeAreaProvider>
        <AuthProvider>
          <MoodProvider>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
          </MoodProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;
