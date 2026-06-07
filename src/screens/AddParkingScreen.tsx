import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { FontSize, Radius, Spacing, ThemeColors } from '../constants/theme';
import { useColors, useThemedStyles } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { createParkingLot } from '../services/parkingService';

let MapView: any = null;
let Marker: any = null;
try {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
} catch (_) {}

const DEFAULT_REGION = {
  latitude: 33.5731,
  longitude: -7.5898,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export const AddParkingScreen: React.FC = () => {
  const Colors = useColors();
  const s = useThemedStyles(makeStyles);
  const navigation = useNavigation();
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [totalCapacity, setTotalCapacity] = useState('');
  const [pricePerHour, setPricePerHour] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const handleMapPress = (e: any) => {
    const coord = e.nativeEvent?.coordinate || e;
    const lat = coord.latitude?.toFixed(6);
    const lng = coord.longitude?.toFixed(6);
    if (lat && lng) {
      setLatitude(String(lat));
      setLongitude(String(lng));
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !address.trim() || !latitude.trim() || !longitude.trim() || !totalCapacity.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires.');
      return;
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const capacity = parseInt(totalCapacity, 10);
    const price = parseFloat(pricePerHour) || 0;

    if (isNaN(lat) || isNaN(lng)) {
      Alert.alert('Erreur', 'Coordonnées invalides.');
      return;
    }

    if (isNaN(capacity) || capacity < 1) {
      Alert.alert('Erreur', 'Capacité invalide.');
      return;
    }

    if (!user) {
      Alert.alert('Erreur', 'Vous devez être connecté.');
      return;
    }

    setLoading(true);
    const { data, error } = await createParkingLot({
      name: name.trim(),
      address: address.trim(),
      latitude: lat,
      longitude: lng,
      total_capacity: capacity,
      price_per_hour: price,
      description: description.trim(),
      phone: phone.trim() || undefined,
      company_id: user.id,
    });

    setLoading(false);

    if (error) {
      Alert.alert('Erreur', error.message);
      return;
    }

    Alert.alert(
      'Succès',
      'Votre parking a été soumis pour examen. Un administrateur l\'approuvera sous peu.',
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={s.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={s.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={s.backButton}>← Retour</Text>
          </TouchableOpacity>
          <Text style={s.topTitle}>Ajouter un parking</Text>
          <View style={{ width: 70 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
          <View style={s.inputWrapper}>
            <Text style={s.inputLabel}>Nom du parking *</Text>
            <View style={s.inputBox}>
              <TextInput
                style={s.input}
                placeholder="Ex: Parking Central"
                placeholderTextColor={Colors.text3}
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

          <View style={s.inputWrapper}>
            <Text style={s.inputLabel}>Adresse *</Text>
            <View style={s.inputBox}>
              <TextInput
                style={s.input}
                placeholder="Ex: 123 Rue Exemple, Casablanca"
                placeholderTextColor={Colors.text3}
                value={address}
                onChangeText={setAddress}
              />
            </View>
          </View>

          {/* Localisation sur la carte */}
          <View style={s.inputWrapper}>
            <Text style={s.inputLabel}>Localisation *</Text>
            {Platform.OS === 'web' ? (
              <View style={s.row}>
                <View style={{ flex: 1 }}>
                  <View style={s.inputBox}>
                    <TextInput
                      style={s.input}
                      placeholder="Latitude"
                      placeholderTextColor={Colors.text3}
                      value={latitude}
                      onChangeText={setLatitude}
                    />
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={s.inputBox}>
                    <TextInput
                      style={s.input}
                      placeholder="Longitude"
                      placeholderTextColor={Colors.text3}
                      value={longitude}
                      onChangeText={setLongitude}
                    />
                  </View>
                </View>
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={s.mapToggle}
                  onPress={() => setShowMap(!showMap)}
                >
                  <Text style={s.mapToggleIcon}>📍</Text>
                  <Text style={s.mapToggleText}>
                    {showMap ? 'Cacher la carte' : 'Choisir sur la carte'}
                  </Text>
                  {latitude && longitude ? (
                    <Text style={s.mapCoords}>{latitude}, {longitude}</Text>
                  ) : null}
                </TouchableOpacity>

                {showMap && MapView && (
                  <View style={s.mapContainer}>
                    <MapView
                      style={s.map}
                      initialRegion={DEFAULT_REGION}
                      onPress={handleMapPress}
                    >
                      {latitude && longitude && (
                        <Marker
                          coordinate={{
                            latitude: parseFloat(latitude),
                            longitude: parseFloat(longitude),
                          }}
                          title="Mon parking"
                        />
                      )}
                    </MapView>
                  </View>
                )}
              </>
            )}
          </View>

          <View style={s.inputWrapper}>
            <Text style={s.inputLabel}>Téléphone</Text>
            <View style={s.inputBox}>
              <TextInput
                style={s.input}
                placeholder="+212 6 XX XX XX XX"
                placeholderTextColor={Colors.text3}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={s.row}>
            <View style={[s.inputWrapper, { flex: 1 }]}>
              <Text style={s.inputLabel}>Capacité totale *</Text>
              <View style={s.inputBox}>
                <TextInput
                  style={s.input}
                  placeholder="50"
                  placeholderTextColor={Colors.text3}
                  value={totalCapacity}
                  onChangeText={setTotalCapacity}
                  keyboardType="number-pad"
                />
              </View>
            </View>
            <View style={[s.inputWrapper, { flex: 1 }]}>
              <Text style={s.inputLabel}>Prix (DH/h)</Text>
              <View style={s.inputBox}>
                <TextInput
                  style={s.input}
                  placeholder="10"
                  placeholderTextColor={Colors.text3}
                  value={pricePerHour}
                  onChangeText={setPricePerHour}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </View>

          <View style={s.inputWrapper}>
            <Text style={s.inputLabel}>Description</Text>
            <View style={[s.inputBox, s.textAreaBox]}>
              <TextInput
                style={[s.input, s.textArea]}
                placeholder="Description de votre parking..."
                placeholderTextColor={Colors.text3}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          <TouchableOpacity
            style={s.button}
            activeOpacity={0.8}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.buttonText}>Soumettre pour examen</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderColor: Colors.border,
  },
  backButton: { color: Colors.accent, fontSize: FontSize.md, fontWeight: '600' },
  topTitle: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '700' },
  scrollContent: { padding: Spacing.lg, paddingBottom: 40 },
  inputWrapper: { marginBottom: Spacing.lg },
  inputLabel: {
    color: Colors.text, fontSize: FontSize.sm, fontWeight: '600',
    marginBottom: Spacing.xs, marginLeft: 4,
  },
  inputBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bg2, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border, height: 56,
    paddingHorizontal: Spacing.md,
  },
  input: { flex: 1, color: Colors.text, fontSize: FontSize.md, height: '100%' },
  row: { flexDirection: 'row', gap: Spacing.md },
  textAreaBox: { height: 100, paddingVertical: Spacing.md },
  textArea: { height: '100%', textAlignVertical: 'top' },
  mapToggle: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.bg2, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.accent, height: 56,
    paddingHorizontal: Spacing.md,
  },
  mapToggleIcon: { fontSize: FontSize.xl },
  mapToggleText: { color: Colors.accent, fontSize: FontSize.md, fontWeight: '600', flex: 1 },
  mapCoords: { color: Colors.text3, fontSize: FontSize.xs },
  mapContainer: {
    height: 300, marginTop: Spacing.sm, borderRadius: Radius.md, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.border,
  },
  map: { flex: 1 },
  button: {
    height: 56, backgroundColor: Colors.accent, borderRadius: Radius.md,
    justifyContent: 'center', alignItems: 'center', marginTop: Spacing.md,
  },
  buttonText: { color: '#FFF', fontSize: FontSize.lg, fontWeight: '700' },
});
