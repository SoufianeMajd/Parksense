import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator }   from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet, ActivityIndicator } from 'react-native';

import { FontSize, ThemeColors }                 from '../constants/theme';
import { useColors, useThemedStyles, useTheme }  from '../context/ThemeContext';
import { useAuth }                               from '../context/AuthContext';
import { RootStackParamList, RootTabParamList }  from '../types';

import { HomeScreen }       from '../screens/HomeScreen';
import { MapScreen }        from '../screens/MapScreen';
import { FindCarScreen }    from '../screens/FindCarScreen';
import { AdminScreen }      from '../screens/AdminScreen';
import { ProfileScreen }    from '../screens/ProfileScreen';
import { NavigationScreen } from '../screens/NavigationScreen';
import { LoginScreen }      from '../screens/LoginScreen';
import { SignUpScreen }     from '../screens/SignUpScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab   = createBottomTabNavigator<RootTabParamList>();

// Map tab names → emoji icons and display labels
const TAB_META: Record<string, { icon: string; label: string }> = {
  Home:    { icon: '🏠', label: 'Home'       },
  Map:     { icon: '🗺️', label: 'Map'        },
  FindCar: { icon: '🚗', label: 'My Car'     },
  Admin:   { icon: '📊', label: 'Analytics'  },
  Profile: { icon: '👤', label: 'Profile'    },
};

// Tab icon with active indicator dot
const TabIcon = ({ name, focused }: { name: string; focused: boolean }) => {
  const ts = useThemedStyles(makeTabStyles);
  return (
    <View style={ts.wrap}>
      <Text style={ts.icon}>{TAB_META[name]?.icon}</Text>
      {focused && <View style={ts.dot} />}
    </View>
  );
};

const makeTabStyles = (Colors: ThemeColors) => StyleSheet.create({
  wrap: { alignItems: 'center' },
  icon: { fontSize: 20 },
  dot:  { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.accent, marginTop: 2 },
});

// Bottom tab navigator
const Tabs = () => {
  const Colors = useColors();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.bg2,
          borderTopColor:  Colors.border,
          borderTopWidth:  1,
          height: 64,
          paddingBottom: 8,
        },
        tabBarLabel: ({ focused }) => (
          <Text style={{
            color: focused ? Colors.accent : Colors.text3,
            fontSize: FontSize.xs,
            fontWeight: '500',
          }}>
            {TAB_META[route.name]?.label ?? route.name}
          </Text>
        ),
        tabBarIcon: ({ focused }) => (
          <TabIcon name={route.name} focused={focused} />
        ),
      })}
    >
      <Tab.Screen name="Home"    component={HomeScreen}    />
      <Tab.Screen name="Map"     component={MapScreen}     />
      <Tab.Screen name="FindCar" component={FindCarScreen} />
      <Tab.Screen name="Admin"   component={AdminScreen}   />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

// Root stack: tabs + modal navigation screen
export const AppNavigator = () => {
  const { mode, colors } = useTheme();
  const { user, loading } = useAuth();

  const navTheme = {
    ...(mode === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(mode === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.bg,
      card:       colors.bg2,
      text:       colors.text,
      border:     colors.border,
      primary:    colors.accent,
    },
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="MainTabs" component={Tabs} />
            <Stack.Screen
              name="NavigationScreen"
              component={NavigationScreen}
              options={{ animation: 'slide_from_bottom' }}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
