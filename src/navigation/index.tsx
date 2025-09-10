import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { View, Text } from "react-native";

import { ROUTES } from "../utils/constants/routes";
import LandingScreen from "../screens/onboarding/LandingScreen";
import RegistrationScreen from "../screens/registration/RegistrationForm";
import RegistrationStatusScreen from "../screens/registration/RegistrationStatusScreen";
import ProfessionalDetailsScreen from "../screens/onboarding/ProfessionalDetailsScreen";
import SecurityPreferencesScreen from "../screens/onboarding/SecurityPreferencesScreen";
import DashboardScreen from "../screens/dashboard/DashboardScreen";
import CPDTrackerScreen from "../screens/cpd/CPDTrackerScreen";

// Create placeholder screens for routes that aren't implemented yet
const PlaceholderScreen = ({ route }: any) => (
  <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
    <Text style={{ fontSize: 20 }}>
      {route.name} Screen (Placeholder)
    </Text>
  </View>
);

// Create the stack navigator
const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={ROUTES.Landing}
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: "transparent" },
          cardOverlayEnabled: true,
          cardStyleInterpolator: ({ current: { progress } }) => ({
            cardStyle: {
              opacity: progress.interpolate({
                inputRange: [0, 0.5, 0.9, 1],
                outputRange: [0, 0.25, 0.7, 1],
              }),
            },
            overlayStyle: {
              opacity: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.5],
                extrapolate: "clamp",
              }),
            },
          }),
        }}
      >
        <Stack.Screen name={ROUTES.Landing} component={LandingScreen} />
        <Stack.Screen 
          name={ROUTES.Registration} 
          component={RegistrationScreen}
        />
        <Stack.Screen 
          name={ROUTES.RegistrationStatus} 
          component={RegistrationStatusScreen}
        />
        <Stack.Screen 
          name={ROUTES.ProfessionalDetails} 
          component={ProfessionalDetailsScreen}
        />
        <Stack.Screen 
          name={ROUTES.SecurityPreferences} 
          component={SecurityPreferencesScreen}
        />
        <Stack.Screen 
          name={ROUTES.Login} 
          component={PlaceholderScreen}
        />
        <Stack.Screen 
          name={ROUTES.Onboarding} 
          component={PlaceholderScreen} 
        />
        <Stack.Screen 
          name={ROUTES.Dashboard} 
          component={DashboardScreen}
        />
        <Stack.Screen 
          name={ROUTES.CPD} 
          component={CPDTrackerScreen}
        />
        <Stack.Screen 
          name={ROUTES.Standards} 
          component={PlaceholderScreen}
        />
        <Stack.Screen 
          name={ROUTES.Profile} 
          component={PlaceholderScreen}
        />
        <Stack.Screen 
          name={ROUTES.Notifications} 
          component={PlaceholderScreen}
        />
        <Stack.Screen 
          name={ROUTES.Settings} 
          component={PlaceholderScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
