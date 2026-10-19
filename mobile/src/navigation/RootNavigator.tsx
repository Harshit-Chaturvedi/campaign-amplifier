import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Screens
import { LoginScreen, RegisterScreen } from '../screens/auth/AuthScreens';
import { HomeScreen } from '../screens/home/HomeScreen';
import { CampaignDetailScreen } from '../screens/home/CampaignDetailScreen';
import { ExploreScreen } from '../screens/explore/ExploreScreen';
import { CreateLandingScreen } from '../screens/create/CreateLandingScreen';
import { CreateFlowScreen } from '../screens/create/CreateFlowScreen';
import { VoiceDraftScreen } from '../screens/create/VoiceDraftScreen';
import { ActivityScreen } from '../screens/activity/ActivityScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { CreatorDashboardScreen } from '../screens/profile/CreatorDashboardScreen';
import { ReportScreen } from '../screens/report/ReportScreen';
import { InfoScreen } from '../screens/info/InfoScreen';
import { FundCampaignScreen, ThankYouScreen } from '../screens/funding/FundingScreens';
import type {
  RootStackParamList,
  MainTabParamList,
  HomeStackParamList,
  ExploreStackParamList,
  CreateStackParamList,
  ActivityStackParamList,
  ProfileStackParamList,
} from '../types/navigation';

const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const ExploreStack = createNativeStackNavigator<ExploreStackParamList>();
const CreateStack = createNativeStackNavigator<CreateStackParamList>();
const ActivityStack = createNativeStackNavigator<ActivityStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function HomeNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="CampaignDetail" component={CampaignDetailScreen} />
      <HomeStack.Screen name="FundCampaign" component={FundCampaignScreen} />
      <HomeStack.Screen name="ThankYou" component={ThankYouScreen} />
      <HomeStack.Screen name="Report" component={ReportScreen} />
      <HomeStack.Screen name="InfoPage" component={InfoScreen} />
    </HomeStack.Navigator>
  );
}

function ExploreNavigator() {
  return (
    <ExploreStack.Navigator screenOptions={{ headerShown: false }}>
      <ExploreStack.Screen name="Explore" component={ExploreScreen} />
      <ExploreStack.Screen name="CampaignDetail" component={CampaignDetailScreen} />
      <ExploreStack.Screen name="FundCampaign" component={FundCampaignScreen} />
      <ExploreStack.Screen name="ThankYou" component={ThankYouScreen} />
      <ExploreStack.Screen name="Report" component={ReportScreen} />
      <ExploreStack.Screen name="InfoPage" component={InfoScreen} />
    </ExploreStack.Navigator>
  );
}

function CreateNavigator() {
  return (
    <CreateStack.Navigator screenOptions={{ headerShown: false }}>
      <CreateStack.Screen name="CreateLanding" component={CreateLandingScreen} />
      <CreateStack.Screen name="CreateFlow" component={CreateFlowScreen} />
      <CreateStack.Screen name="VoiceDraft" component={VoiceDraftScreen} />
    </CreateStack.Navigator>
  );
}

function ActivityNavigator() {
  return (
    <ActivityStack.Navigator screenOptions={{ headerShown: false }}>
      <ActivityStack.Screen name="Activity" component={ActivityScreen} />
      <ActivityStack.Screen name="CampaignDetail" component={CampaignDetailScreen} />
      <ActivityStack.Screen name="FundCampaign" component={FundCampaignScreen} />
      <ActivityStack.Screen name="ThankYou" component={ThankYouScreen} />
      <ActivityStack.Screen name="Report" component={ReportScreen} />
    </ActivityStack.Navigator>
  );
}

function ProfileNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="Profile" component={ProfileScreen} />
      <ProfileStack.Screen name="CreatorDashboard" component={CreatorDashboardScreen} />
      <ProfileStack.Screen name="Report" component={ReportScreen} />
      <ProfileStack.Screen name="InfoPage" component={InfoScreen} />
      <ProfileStack.Screen name="CampaignDetail" component={CampaignDetailScreen} />
      <ProfileStack.Screen name="FundCampaign" component={FundCampaignScreen} />
      <ProfileStack.Screen name="ThankYou" component={ThankYouScreen} />
    </ProfileStack.Navigator>
  );
}

import { colors, fonts } from '../theme/tokens';
import { DefaultTheme } from '@react-navigation/native';

const EditorialTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.ink,
    border: colors.border,
    primary: colors.accent,
  },
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color }) => {
          let iconName: keyof typeof Ionicons.glyphMap;
          switch (route.name) {
            case 'HomeTab':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'ExploreTab':
              iconName = focused ? 'compass' : 'compass-outline';
              break;
            case 'CreateTab':
              iconName = focused ? 'add-circle' : 'add-circle-outline';
              break;
            case 'ActivityTab':
              iconName = focused ? 'notifications' : 'notifications-outline';
              break;
            case 'ProfileTab':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'ellipse';
          }
          return <Ionicons name={iconName} size={route.name === 'CreateTab' ? 28 : 22} color={color} />;
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.inkSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingTop: 4,
          paddingBottom: 10,
          height: 72,
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 2,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: fonts.sansMedium,
          marginTop: 1,
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeNavigator} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="ExploreTab" component={ExploreNavigator} options={{ tabBarLabel: 'Explore' }} />
      <Tab.Screen name="CreateTab" component={CreateNavigator} options={{ tabBarLabel: 'Create' }} />
      <Tab.Screen name="ActivityTab" component={ActivityNavigator} options={{ tabBarLabel: 'Activity' }} />
      <Tab.Screen name="ProfileTab" component={ProfileNavigator} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}

import { navigationRef } from './navigationRef';

export function RootNavigator() {
  return (
    <NavigationContainer ref={navigationRef} theme={EditorialTheme}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Main" component={MainTabs} />
        <RootStack.Group screenOptions={{ presentation: 'modal' }}>
          <RootStack.Screen name="Login" component={LoginScreen} />
          <RootStack.Screen name="Register" component={RegisterScreen} />
        </RootStack.Group>
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

