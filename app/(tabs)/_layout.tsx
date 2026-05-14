import React, { useEffect, useState } from 'react';
import { Image, View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getProfile, isProfileLoaded, loadProfile, subscribeProfile } from '../../store/profile-store';

const colors = {
  noir: '#1a1714',
  sand: '#c9a882',
  taupe: '#8a7f72',
  espresso: '#3d3630',
};

function ProfileTabIcon({ color, focused }: { color: string; focused: boolean }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!isProfileLoaded()) loadProfile();
    const unsubscribe = subscribeProfile(() => setTick((n) => n + 1));
    return () => { unsubscribe(); };
  }, []);
  const profile = getProfile();
  if (profile.avatarUri) {
    return (
      <View style={[iconStyles.wrap, focused && iconStyles.wrapActive]}>
        <Image source={{ uri: profile.avatarUri }} style={iconStyles.img} />
      </View>
    );
  }
  return (
    <View style={[iconStyles.wrap, iconStyles.fallback, focused && iconStyles.wrapActive]}>
      <Ionicons name="person" size={16} color={color} />
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.espresso,
          borderTopColor: 'rgba(138, 127, 114, 0.2)',
          height: 80,
          paddingBottom: 20,
          paddingTop: 10,
        },
        tabBarActiveTintColor: colors.sand,
        tabBarInactiveTintColor: colors.taupe,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feed',
          // Feed nutzt das eigene Tap-Overlay; Standard-Tab-Bar bleibt unsichtbar.
          tabBarStyle: { display: 'none' },
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="layers-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="trends"
        options={{
          title: 'Trends',
          tabBarStyle: { display: 'none' },
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trending-up-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Watchlist',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bookmark-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, focused }) => <ProfileTabIcon color={color} focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const iconStyles = StyleSheet.create({
  wrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
  },
  wrapActive: {
    borderWidth: 2,
    borderColor: colors.sand,
  },
  img: { width: '100%', height: '100%' },
  fallback: {
    backgroundColor: '#2e2a26',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
