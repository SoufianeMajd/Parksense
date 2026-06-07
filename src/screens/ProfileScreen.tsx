import React from 'react';
import {
  View, Text, ScrollView,
  TouchableOpacity, StyleSheet, Switch, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { FontSize, Radius, Spacing, ThemeColors } from '../constants/theme';
import { useColors, useTheme, useThemedStyles } from '../context/ThemeContext';
import { RootStackParamList } from '../types';
import { useApp }          from '../context/AppContext';
import { useAuth }         from '../context/AuthContext';
import { FavouriteCard }   from '../components/FavouriteCard';
import { SectionHeader }   from '../components/SectionHeader';
import { buildNavSession } from '../services/mockData';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const SETTINGS = [
  { icon: '🔔', label: 'Notifications'      },
  { icon: '🔒', label: 'Privacy & Security'  },
];

export const ProfileScreen: React.FC = () => {
  const Colors                                   = useColors();
  const s                                        = useThemedStyles(makeStyles);
  const { mode, toggle }                         = useTheme();
  const isDark                                   = mode === 'dark';
  const navigation                               = useNavigation<Nav>();
  const { user: mockUser, favouriteLots, startNavigation } = useApp();
  const { signOut, user: authUser, userRole, companyName } = useAuth();

  const realName = authUser?.user_metadata?.name || authUser?.email?.split('@')[0] || 'User';
  const realEmail = authUser?.email || '';
  const realInitials = realName.substring(0, 2).toUpperCase();
  let displayRole = 'Gold';
  if (userRole === 'Admin') displayRole = 'Admin';
  else if (userRole === 'Company') displayRole = companyName || 'Company';

  // Navigate to the NavigationScreen for a favourite lot
  const handleViewMap = (lot: typeof favouriteLots[0]) => {
    startNavigation(buildNavSession(lot));
    navigation.navigate('NavigationScreen', { lot });
  };

  const handleSettingPress = (label: string) =>
    Alert.alert(label, 'Coming soon.');

  const handleSignOut = () =>
    Alert.alert(
      'Sign out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
      ],
    );

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Profile header ──────────────────────────────────── */}
        <View style={s.header}>
          <View style={s.avatarRow}>
            <View style={s.avatar}>
              <Text style={s.avatarTxt}>{realInitials}</Text>
            </View>
            <View>
              <Text style={s.name}>{realName}</Text>
              <Text style={s.email}>{realEmail}</Text>
              <View style={s.tierBadge}>
                <Text style={s.tierTxt}>⭐ {displayRole} Member</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Stats strip ─────────────────────────────────────── */}
        <View style={s.statsStrip}>
          {[
            { val: String(mockUser.totalSessions), label: 'Sessions',    color: Colors.accent },
            { val: `${mockUser.totalSpent} DH`,     label: 'Total spent', color: Colors.green  },
            { val: `${mockUser.avgSessionHours}h`,  label: 'Avg/session', color: Colors.amber  },
          ].map((item, i) => (
            <View key={i} style={s.statItem}>
              <Text style={[s.statVal, { color: item.color }]}>{item.val}</Text>
              <Text style={s.statLbl}>{item.label}</Text>
            </View>
          ))}
        </View>

        <View style={s.body}>

          {/* ── Payment method ───────────────────────────────── */}
          <SectionHeader title="Payment" />
          <View style={s.payCard}>
            <View>
              <Text style={s.cardType}>{mockUser.paymentCard.type}</Text>
              <Text style={s.cardNum}>
                •••• •••• •••• {mockUser.paymentCard.last4}
              </Text>
            </View>
            <Text style={s.cardLogo}>💳</Text>
          </View>

          {/* ── Favourite parkings ───────────────────────────── */}
          <SectionHeader title="Favourite Parkings" actionLabel="Edit →" />
          {favouriteLots.length === 0 ? (
            <Text style={s.empty}>No favourites saved yet.</Text>
          ) : (
            favouriteLots.map(lot => (
              <FavouriteCard
                key={lot.id}
                lot={lot}
                onViewMap={handleViewMap}
              />
            ))
          )}

          {/* ── Saved locations ──────────────────────────────── */}
          <SectionHeader title="Saved Locations" />
          {mockUser.savedLocations.map(loc => (
            <View key={loc.id} style={s.locCard}>
              <Text style={s.locIcon}>{loc.icon}</Text>
              <View style={s.locText}>
                <Text style={s.locLbl}>{loc.label}</Text>
                <Text style={s.locAddr}>{loc.address}</Text>
              </View>
              <Text style={s.locArrow}>›</Text>
            </View>
          ))}

          {/* ── Settings ─────────────────────────────────────── */}
          <SectionHeader title="Settings" />

          {SETTINGS.map(item => (
            <TouchableOpacity
              key={item.label}
              style={s.settingRow}
              activeOpacity={0.7}
              onPress={() => handleSettingPress(item.label)}
            >
              <View style={s.settingIcon}><Text>{item.icon}</Text></View>
              <Text style={s.settingLbl}>{item.label}</Text>
              <Text style={s.settingArrow}>›</Text>
            </TouchableOpacity>
          ))}

          {/* Dark mode toggle — wired to ThemeContext */}
          <TouchableOpacity
            style={s.settingRow}
            activeOpacity={0.7}
            onPress={toggle}
          >
            <View style={s.settingIcon}><Text>{isDark ? '🌙' : '☀️'}</Text></View>
            <Text style={s.settingLbl}>{isDark ? 'Dark Mode' : 'Light Mode'}</Text>
            <Switch
              value={isDark}
              onValueChange={toggle}
              trackColor={{ true: Colors.accent, false: Colors.surface2 }}
              thumbColor="#fff"
              ios_backgroundColor={Colors.surface2}
              style={{ marginLeft: 'auto' }}
            />
          </TouchableOpacity>

          {/* Sign out */}
          <TouchableOpacity
            style={[s.settingRow, { borderBottomWidth: 0 }]}
            activeOpacity={0.7}
            onPress={handleSignOut}
          >
            <View style={s.settingIcon}><Text>🚪</Text></View>
            <Text style={[s.settingLbl, { color: Colors.red }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.bg },

  header:      {
    backgroundColor: Colors.accentDim,
    padding: Spacing.lg,
    borderBottomWidth: 1, borderColor: Colors.border,
  },
  avatarRow:   { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  avatar:      {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)',
  },
  avatarTxt:   { color: '#fff', fontSize: FontSize.h3, fontWeight: '700' },
  name:        { color: Colors.text,  fontSize: FontSize.xxl, fontWeight: '600' },
  email:       { color: Colors.text3, fontSize: FontSize.base, marginTop: 2 },
  tierBadge:   {
    marginTop: 6, alignSelf: 'flex-start',
    backgroundColor: Colors.accentDim,
    borderWidth: 1, borderColor: Colors.accent,
    borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 2,
  },
  tierTxt:     { color: Colors.accent2, fontSize: FontSize.sm, fontWeight: '600' },

  statsStrip:  {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderColor: Colors.border,
  },
  statItem:    { alignItems: 'center' },
  statVal:     { fontSize: FontSize.h2, fontWeight: '700' },
  statLbl:     { color: Colors.text3, fontSize: FontSize.xs, marginTop: 2 },

  body:        { padding: Spacing.lg },

  payCard:     {
    backgroundColor: Colors.surface, borderRadius: Radius.sm,
    borderWidth: 1, borderColor: Colors.accent,
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: Spacing.md, marginBottom: Spacing.lg,
  },
  cardType:    { color: Colors.text,  fontSize: FontSize.md, fontWeight: '600' },
  cardNum:     { color: Colors.text3, fontSize: FontSize.base, marginTop: 2, letterSpacing: 2 },
  cardLogo:    { fontSize: 22 },

  empty:       { color: Colors.text3, fontSize: FontSize.md, marginBottom: Spacing.lg },

  locCard:     {
    backgroundColor: Colors.surface, borderRadius: Radius.sm,
    borderWidth: 1, borderColor: Colors.border,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.md, marginBottom: Spacing.sm,
  },
  locIcon:     { fontSize: 18 },
  locText:     { flex: 1 },
  locLbl:      { color: Colors.text,  fontSize: FontSize.md, fontWeight: '500' },
  locAddr:     { color: Colors.text3, fontSize: FontSize.sm, marginTop: 1 },
  locArrow:    { color: Colors.text3, fontSize: FontSize.xxl },

  settingRow:  {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderColor: Colors.border,
  },
  settingIcon: {
    width: 32, height: 32, backgroundColor: Colors.surface,
    borderRadius: Radius.xs, alignItems: 'center', justifyContent: 'center',
  },
  settingLbl:  { color: Colors.text, fontSize: FontSize.md, fontWeight: '500', flex: 1 },
  settingArrow:{ color: Colors.text3, fontSize: FontSize.xxl },
});
