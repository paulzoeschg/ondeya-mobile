// 2026-05-14 (Bug F): Shared Overlay-Navigation für die Card-Screens
// (Feed + Trends). Wird in den jeweiligen Screens als gestaffeltes Overlay
// ausgeklappt — Tap unten Mitte öffnet, Tap außerhalb schließt.

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, TouchableOpacity, Image, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getProfile, subscribeProfile, type ProfileData } from '../store/profile-store';

export type NavTab = 'feed' | 'trends' | 'watchlist' | 'profile';

const colors = {
  noir: '#1a1714',
  espresso: '#3d3630',
  taupe: '#8a7f72',
  sand: '#c9a882',
  linen: '#e8ddd0',
};

const ROUTES: Record<NavTab, string> = {
  feed: '/',
  trends: '/trends',
  watchlist: '/explore',
  profile: '/profile',
};

function useProfileSnapshot(): ProfileData {
  const [snapshot, setSnapshot] = React.useState<ProfileData>(getProfile);
  useEffect(() => {
    const unsubscribe = subscribeProfile(() => setSnapshot(getProfile()));
    return () => { unsubscribe(); };
  }, []);
  return snapshot;
}

function ProfileTabIcon({ active }: { active: boolean }) {
  const profile = useProfileSnapshot();
  if (profile.avatarUri) {
    return (
      <View style={[styles.avatarWrap, active && styles.avatarWrapActive]}>
        <Image source={{ uri: profile.avatarUri }} style={styles.avatarImg} />
      </View>
    );
  }
  return (
    <View style={[styles.avatarWrap, styles.avatarFallback, active && styles.avatarWrapActive]}>
      <Ionicons name="person" size={20} color={active ? colors.sand : colors.taupe} />
    </View>
  );
}

export function BottomNavBar({
  current,
  visible,
  anim,
  onClose,
}: {
  current: NavTab;
  visible: boolean;
  anim: Animated.Value;
  onClose: () => void;
}) {
  const router = useRouter();

  if (!visible) return null;

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [80, 0] });

  const goTo = (tab: NavTab) => {
    onClose();
    if (tab === current) return;
    router.push(ROUTES[tab] as never);
  };

  return (
    <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
      <Animated.View style={[styles.bar, { opacity: anim, transform: [{ translateY }] }]}>
        {/* Bug H-2 (2026-05-14): Nur Icons im Tap-Overlay, keine Wörter mehr —
            konsistent mit der Standard-Bar (tabBarShowLabel: false) auf
            Watchlist + Profil. */}
        <NavItem
          icon={<Ionicons name="layers-outline" size={26} color={current === 'feed' ? colors.sand : colors.taupe} />}
          active={current === 'feed'}
          onPress={() => goTo('feed')}
        />
        <NavItem
          icon={<Ionicons name="trending-up-outline" size={26} color={current === 'trends' ? colors.sand : colors.taupe} />}
          active={current === 'trends'}
          onPress={() => goTo('trends')}
        />
        <NavItem
          icon={<Ionicons name="bookmark-outline" size={26} color={current === 'watchlist' ? colors.sand : colors.taupe} />}
          active={current === 'watchlist'}
          onPress={() => goTo('watchlist')}
        />
        <NavItem
          icon={<ProfileTabIcon active={current === 'profile'} />}
          active={current === 'profile'}
          onPress={() => goTo('profile')}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

function NavItem({
  icon,
  onPress,
}: {
  icon: React.ReactNode;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.85}>
      {icon}
    </TouchableOpacity>
  );
}

export function useBottomNavAnimation(): {
  visible: boolean;
  anim: Animated.Value;
  open: () => void;
  close: () => void;
} {
  const anim = useRef(new Animated.Value(0)).current;
  const [visible, setVisible] = React.useState(false);
  const open = () => {
    setVisible(true);
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }).start();
  };
  const close = () => {
    Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => setVisible(false));
  };
  return { visible, anim, open, close };
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 60,
    justifyContent: 'flex-end',
    paddingBottom: 24,
    alignItems: 'center',
  },
  bar: {
    backgroundColor: colors.espresso,
    borderRadius: 24,
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(138, 127, 114, 0.3)',
    gap: 2,
  },
  item: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 56,
  },
  avatarWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
  },
  avatarWrapActive: {
    borderWidth: 2,
    borderColor: colors.sand,
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarFallback: {
    backgroundColor: '#2e2a26',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
