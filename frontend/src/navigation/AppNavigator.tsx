import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Ionicons} from '@expo/vector-icons';
import {useAuth} from '../store/authContext';
import {useTheme} from '../store/themeContext';
import {LoginScreen} from '../screens/LoginScreen';
import {HomeScreen} from '../screens/HomeScreen';
import {MediaScreen} from '../screens/MediaScreen';
import {CompletedMediaScreen} from '../screens/CompletedMediaScreen';
import {NotesScreen} from '../screens/NotesScreen';
import {MediaFormScreen} from '../screens/MediaFormScreen';
import {SpecialAreaScreen} from '../screens/SpecialAreaScreen';
import {EditProfileScreen} from '../screens/EditProfileScreen';
import {PartnerPhotosScreen} from '../screens/PartnerPhotosScreen';
import {COLORS} from '../constants/colors';

export type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
  MediaForm: {mediaId?: string} | undefined;
  SpecialArea: undefined;
  EditProfile: undefined;
  PartnerPhotos: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Media: undefined;
  CompletedMedia: undefined;
  Notes: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabs: React.FC = () => {
  const {colors} = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 20,
          borderRadius: 20,
          backgroundColor: COLORS.backgroundCard,
          height: 64,
          borderTopWidth: 0,
          shadowColor: '#000',
          shadowOpacity: 0.15,
          shadowOffset: {width: 0, height: 6},
          shadowRadius: 12,
          elevation: 10,
        },
        tabBarItemStyle: {
          paddingVertical: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({color, size}) => <Ionicons name="home" size={size ?? 20} color={color} />,
        }}
      />
      <Tab.Screen
        name="Media"
        component={MediaScreen}
        options={{
          tabBarLabel: 'Filmes/Séries',
          tabBarIcon: ({color, size}) => <Ionicons name="film" size={size ?? 20} color={color} />,
        }}
      />
      <Tab.Screen
        name="CompletedMedia"
        component={CompletedMediaScreen}
        options={{
          tabBarLabel: 'Concluídos',
          tabBarIcon: ({color, size}) => (
            <Ionicons name="checkmark-circle" size={size ?? 20} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Notes"
        component={NotesScreen}
        options={{
          tabBarLabel: 'Notas',
          tabBarIcon: ({color, size}) => <Ionicons name="document-text" size={size ?? 20} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator: React.FC = () => {
  const {isAuthenticated, isLoading} = useAuth();
  const {colors} = useTheme();

  if (isLoading) {
    return null; // Or a loading screen
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.background,
        },
        headerTintColor: COLORS.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        cardStyle: {
          backgroundColor: COLORS.background,
        },
      }}>
      {!isAuthenticated ? (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{headerShown: false}}
        />
      ) : (
        <>
          <Stack.Screen
            name="MainTabs"
            component={MainTabs}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="MediaForm"
            component={MediaFormScreen}
            options={{title: 'Filmes e séries'}}
          />
          <Stack.Screen
            name="SpecialArea"
            component={SpecialAreaScreen}
            options={{title: 'Area especial'}}
          />
          <Stack.Screen
            name="EditProfile"
            component={EditProfileScreen}
            options={{title: 'Editar perfil'}}
          />
          <Stack.Screen
            name="PartnerPhotos"
            component={PartnerPhotosScreen}
            options={{headerShown: false}}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
