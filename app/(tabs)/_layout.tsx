import React, { useEffect, useState } from 'react';
import { Image, View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getProfile, isProfileLoaded, loadProfile, subscribeProfile, type ProfileData } from '../../store/profile-store';

const colors = {
  noir: '#1a1714',
  sand: '#c9a882',
  taupe: '#8a7f72',
  espresso: '#3d3630',
};

// 2026-05-16 (Punkt 4): Avatar wurde im echten Tab-Bar-Icon nicht angezeigt,
// obwohl der gleiche Code in BottomNavBar.tsx funktioniert. Der Unterschied:
// expo-router cached die `tabBarIcon`-Render-Funktion auf Layout-Ebene anders
// als eine direkt in den View-Tree gerenderte Komponente. Das alte setTick-
// Pattern hat zwar ein State-Update getriggert, aber der State enthielt keinen
// Profile-Snapshot — also blieb der gerenderte Wert bei dem, was beim ersten
// Mount aus getProfile() gelesen wurde (in der Regel noch leer, bevor
// loadProfile() done ist). Lösung: ProfileData direkt im useState halten,
// analog zu useProfileSnapshot in BottomNavBar.tsx.
function ProfileTabIcon({ color, focused }: { color: string; focused: boolean }) {
  const [profile, setProfile] = useState<ProfileData>(() => getProfile());
  useEffect(() => {
    if (!isProfileLoaded()) loadProfile();
    const unsubscribe = subscribeProfile(() => setProfile(getProfile()));
    return () => { unsubscribe(); };
  }, []);
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
        // Bug H (2026-05-14): Nur Icons, keine Text-Labels.
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.espresso,
          borderTopColor: 'rgba(138, 127, 114, 0.2)',
          height: 64,
          paddingBottom: 14,
          paddingTop: 10,
        },
        tabBarActiveTintColor: colors.sand,
        tabBarInactiveTintColor: colors.taupe,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feed',
          // Feed nutzt das eigene Tap-Overlay; Standard-Tab-Bar bleibt unsichtbar.
          tabBarStyle: { display: 'none' },
          tabBarIcon: ({ color }) => (
            <Ionicons name="layers-outline" size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="trends"
        options={{
          title: 'Trends',
          tabBarStyle: { display: 'none' },
          tabBarIcon: ({ color }) => (
            <Ionicons name="trending-up-outline" size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Watchlist',
          tabBarIcon: ({ color }) => (
            <Ionicons name="bookmark-outline" size={26} color={color} />
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
      {/* 2026-05-16 (Punkt 5): OnboardingScreen liegt im (tabs)/-Ordner und
          würde sonst von expo-router automatisch als sichtbarer Tab gerendert
          (mit dem leeren Dreieck-Default-Icon). href:null versteckt den Tab
          vollständig. Onboarding triggert sowieso programmatisch aus
          index.tsx, wenn isOnboardingDone() false ist. */}
      <Tabs.Screen
        name="OnboardingScreen"
        options={{ href: null }}
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
