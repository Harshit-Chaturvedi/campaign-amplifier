import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/useAuthStore';

// Screens
import { LoginScreen, RegisterScreen } from '../screens/auth/AuthScreens';
import { HomeScreen } from '../screens/home/HomeScreen';
import { CampaignDetailScreen } from '../screens/home/CampaignDetailScreen';
import { ExploreScreen } from '../screens/explore/ExploreScreen';
import { CreateCampaignScreen } from '../screens/create/CreateCampaignScreen';
import { ImpactDashboard } from '../screens/impact/ImpactDashboard';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { FundCampaignScreen, ThankYouScreen } from '../screens/funding/FundingScreens';

const AuthStack = createNativeStackNavigator();
const HomeStack = createNativeStackNavigator();
const ExploreStack = createNativeStackNavigator();
const CreateStack = createNativeStackNavigator();
const ImpactStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const RootStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function HomeNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="CampaignDetail" component={CampaignDetailScreen} />
      <HomeStack.Screen name="FundCampaign" component={FundCampaignScreen} />
      <HomeStack.Screen name="ThankYou" component={ThankYouScreen} />
    </HomeStack.Navigator>
  );
}

function ExploreNavigator() {
  return (
    <ExploreStack.Navigator screenOptions={{ headerShown: false }}>
      <ExploreStack.Screen name="Explore" component={ExploreScreen} />
      <ExploreStack.Screen name="CampaignDetail" component={CampaignDetailScreen} />
    </ExploreStack.Navigator>
  );
}

function CreateNavigator() {
  return (
    <CreateStack.Navigator screenOptions={{ headerShown: false }}>
      <CreateStack.Screen name="CreateCampaign" component={CreateCampaignScreen} />
    </CreateStack.Navigator>
  );
}

function ImpactNavigator() {
  return (
    <ImpactStack.Navigator screenOptions={{ headerShown: false }}>
      <ImpactStack.Screen name="ImpactDashboard" component={ImpactDashboard} />
    </ImpactStack.Navigator>
  );
}

function ProfileNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="Profile" component={ProfileScreen} />
    </ProfileStack.Navigator>
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;
          switch (route.name) {
            case 'HomeTab': iconName = focused ? 'home' : 'home-outline'; break;
            case 'ExploreTab': iconName = focused ? 'compass' : 'compass-outline'; break;
            case 'CreateTab': iconName = focused ? 'add-circle' : 'add-circle-outline'; break;
            case 'ImpactTab': iconName = focused ? 'bar-chart' : 'bar-chart-outline'; break;
            case 'ProfileTab': iconName = focused ? 'person' : 'person-outline'; break;
            default: iconName = 'ellipse';
          }
          return <Ionicons name={iconName} size={route.name === 'CreateTab' ? 32 : 24} color={color} />;
        },
        tabBarActiveTintColor: '#4f46e5',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#f1f5f9',
          borderTopWidth: 1,
          paddingTop: 6,
          paddingBottom: 8,
          height: 64,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeNavigator} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="ExploreTab" component={ExploreNavigator} options={{ tabBarLabel: 'Explore' }} />
      <Tab.Screen name="CreateTab" component={CreateNavigator} options={{ tabBarLabel: 'Create' }} />
      <Tab.Screen name="ImpactTab" component={ImpactNavigator} options={{ tabBarLabel: 'Impact' }} />
      <Tab.Screen name="ProfileTab" component={ProfileNavigator} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <RootStack.Screen name="Main" component={MainTabs} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
