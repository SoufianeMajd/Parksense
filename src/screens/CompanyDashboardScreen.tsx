import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { FontSize, Radius, Spacing, ThemeColors } from '../constants/theme';
import { useColors, useThemedStyles } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { fetchCompanyParkingLots } from '../services/parkingService';
import { ParkingLot, RootStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export const CompanyDashboardScreen: React.FC = () => {
  const Colors = useColors();
  const s = useThemedStyles(makeStyles);
  const navigation = useNavigation<Nav>();
  const { user, companyName } = useAuth();

  const [lots, setLots] = useState<ParkingLot[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLots = async () => {
    if (!user) return;
    setLoading(true);
    const data = await fetchCompanyParkingLots(user.id);
    setLots(data);
    setLoading(false);
  };

  useEffect(() => {
    loadLots();
  }, [user]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadLots();
    });
    return unsubscribe;
  }, [navigation, user]);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <View>
            <Text style={s.title}>Tableau de bord</Text>
            <Text style={s.subtitle}>{companyName || 'Entreprise'}</Text>
          </View>
        </View>

        <View style={s.body}>
          <View style={s.statsRow}>
            <View style={s.statCard}>
              <Text style={s.statVal}>{lots.length}</Text>
              <Text style={s.statLbl}>Parkings</Text>
            </View>
            <View style={s.statCard}>
              <Text style={s.statVal}>{lots.filter(l => l.approved).length}</Text>
              <Text style={s.statLbl}>Approuvés</Text>
            </View>
            <View style={s.statCard}>
              <Text style={s.statVal}>{lots.filter(l => !l.approved).length}</Text>
              <Text style={s.statLbl}>En attente</Text>
            </View>
          </View>

          <TouchableOpacity
            style={s.addButton}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('AddParking', {})}
          >
            <Text style={s.addButtonText}>+ Ajouter un parking</Text>
          </TouchableOpacity>

          {loading ? (
            <ActivityIndicator size="large" color={Colors.accent} style={{ marginTop: 40 }} />
          ) : lots.length === 0 ? (
            <View style={s.emptyState}>
              <Text style={s.emptyIcon}>🅿️</Text>
              <Text style={s.emptyText}>Aucun parking ajouté</Text>
              <Text style={s.emptySubtext}>Ajoutez votre premier parking pour commencer</Text>
            </View>
          ) : (
            lots.map(lot => (
              <View key={lot.id} style={s.lotCard}>
                <View style={s.lotHeader}>
                  <Text style={s.lotName}>{lot.name}</Text>
                  <View style={[s.statusBadge, { backgroundColor: lot.approved ? Colors.greenDim : Colors.amberDim }]}>
                    <Text style={[s.statusText, { color: lot.approved ? Colors.green : Colors.amber }]}>
                      {lot.approved ? 'Approuvé' : 'En attente'}
                    </Text>
                  </View>
                </View>
                <Text style={s.lotAddress}>{lot.address}</Text>
                <View style={s.lotMeta}>
                  <Text style={s.lotMetaText}>🅿️ {lot.totalSpots} places</Text>
                  <Text style={s.lotMetaText}>💰 {lot.pricePerHour} DH/h</Text>
                </View>
                {lot.phone ? (
                  <Text style={s.lotPhone}>📞 {lot.phone}</Text>
                ) : null}
              </View>
            ))
          )}
        </View>
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: Spacing.lg, backgroundColor: Colors.accentDim,
    borderBottomWidth: 1, borderColor: Colors.border,
  },
  title: { color: Colors.text, fontSize: FontSize.h3, fontWeight: '700' },
  subtitle: { color: Colors.text2, fontSize: FontSize.md, marginTop: 2 },
  body: { padding: Spacing.lg },
  statsRow: {
    flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.sm,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.md,
    alignItems: 'center',
  },
  statVal: { color: Colors.text, fontSize: FontSize.h1, fontWeight: '700' },
  statLbl: { color: Colors.text3, fontSize: FontSize.xs, marginTop: 2 },
  addButton: {
    height: 56, backgroundColor: Colors.accent, borderRadius: Radius.md,
    justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.lg,
  },
  addButtonText: { color: '#FFF', fontSize: FontSize.lg, fontWeight: '700' },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyText: { color: Colors.text, fontSize: FontSize.h3, fontWeight: '600' },
  emptySubtext: { color: Colors.text3, fontSize: FontSize.md, marginTop: Spacing.xs },
  lotCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.sm,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  lotHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  lotName: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '600', flex: 1 },
  statusBadge: {
    borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 3,
  },
  statusText: { fontSize: FontSize.xs, fontWeight: '700' },
  lotAddress: { color: Colors.text3, fontSize: FontSize.sm, marginTop: Spacing.xs },
  lotMeta: {
    flexDirection: 'row', gap: Spacing.lg, marginTop: Spacing.sm,
  },
  lotMetaText: { color: Colors.text2, fontSize: FontSize.sm },
  lotPhone: { color: Colors.text2, fontSize: FontSize.sm, marginTop: Spacing.xs },
});
