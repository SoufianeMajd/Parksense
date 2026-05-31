import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../services/supabase';
import { useColors, useThemedStyles } from '../context/ThemeContext';
import { ThemeColors, FontSize, Radius, Spacing } from '../constants/theme';
import { Logo } from '../components/Logo';

export const SignUpScreen = ({ navigation }: any) => {
  const Colors = useColors();
  const s = useThemedStyles(makeStyles);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [emailError, setEmailError] = useState('');

  const validateEmail = (text: string) => {
    setEmail(text);
    setEmailError('');
    if (text && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
      setEmailError('Format d\'email invalide');
    }
  };

  // Password Strength Logic
  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  let strengthScore = 0;
  if (hasMinLength) strengthScore += 1;
  if (hasNumber) strengthScore += 1;
  if (hasSpecialChar) strengthScore += 1;
  
  let strengthColor = Colors.bg2;
  let strengthText = '';
  if (password.length > 0) {
    if (strengthScore === 1) {
      strengthColor = Colors.red;
      strengthText = 'Faible';
    } else if (strengthScore === 2) {
      strengthColor = Colors.amber;
      strengthText = 'Moyen';
    } else if (strengthScore === 3) {
      strengthColor = Colors.green;
      strengthText = 'Fort';
    }
  }

  async function signUpWithEmail() {
    if (!email || !password || !name) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }

    if (emailError) {
      Alert.alert('Erreur', 'Veuillez corriger l\'adresse email.');
      return;
    }

    if (strengthScore < 3) {
      Alert.alert('Sécurité', 'Veuillez utiliser un mot de passe plus fort (8 caractères, un chiffre, un caractère spécial).');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { name },
      }
    });

    if (error) {
      Alert.alert('Erreur', error.message);
    } else if (data.user) {
      // Auto-create profile in public.profiles table
      const { error: profileError } = await supabase.from('profiles').upsert([
        { id: data.user.id, email: email.trim(), name: name, role: 'User' }
      ]);

      if (profileError) {
        Alert.alert('Erreur Profil', "Le compte a été créé, mais l'enregistrement du profil a échoué: " + profileError.message);
      }

      if (data.session) {
        // Sign out to prevent automatic redirection to the Home page
        await supabase.auth.signOut();
      }
      
      Alert.alert('Succès', 'Votre compte a été créé avec succès. Veuillez vous connecter.');
      navigation.navigate('Login');
    }
    setLoading(false);
  }

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView 
        style={s.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
          
          <View style={s.logoContainer}>
            <Image 
              source={require('../assets/logo1.png')} 
              style={[s.logo, { borderRadius: 25, overflow: 'hidden' }]} 
              resizeMode="cover"
            />
            <Text style={s.title}>Créer un compte</Text>
            <Text style={s.subtitle}>Rejoignez ParkSense aujourd'hui.</Text>
          </View>

          <View style={s.formContainer}>
            {/* Name Input */}
            <View style={s.inputWrapper}>
              <Text style={s.inputLabel}>Nom Complet</Text>
              <View style={s.inputBox}>
                <Text style={s.inputIcon}>👤</Text>
                <TextInput
                  style={s.input}
                  placeholder="Jean Dupont"
                  placeholderTextColor={Colors.text3}
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            {/* Email Input */}
            <View style={s.inputWrapper}>
              <Text style={s.inputLabel}>Adresse Email</Text>
              <View style={[s.inputBox, emailError ? s.inputBoxError : null]}>
                <Text style={s.inputIcon}>✉️</Text>
                <TextInput
                  style={s.input}
                  placeholder="nom@exemple.com"
                  placeholderTextColor={Colors.text3}
                  value={email}
                  onChangeText={validateEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                />
              </View>
              {!!emailError && <Text style={s.errorText}>{emailError}</Text>}
            </View>

            {/* Password Input */}
            <View style={s.inputWrapper}>
              <Text style={s.inputLabel}>Mot de passe</Text>
              <View style={s.inputBox}>
                <Text style={s.inputIcon}>🔒</Text>
                <TextInput
                  style={s.input}
                  placeholder="Créez un mot de passe"
                  placeholderTextColor={Colors.text3}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={s.eyeButton}>
                  <Text style={s.eyeIcon}>{showPassword ? '👁️' : '🙈'}</Text>
                </TouchableOpacity>
              </View>
              
              {/* Password Strength Indicator */}
              {password.length > 0 && (
                <View style={s.strengthContainer}>
                  <View style={s.strengthBars}>
                    <View style={[s.strengthBar, { backgroundColor: strengthScore >= 1 ? strengthColor : Colors.border }]} />
                    <View style={[s.strengthBar, { backgroundColor: strengthScore >= 2 ? strengthColor : Colors.border }]} />
                    <View style={[s.strengthBar, { backgroundColor: strengthScore >= 3 ? strengthColor : Colors.border }]} />
                  </View>
                  <Text style={[s.strengthText, { color: strengthColor }]}>{strengthText}</Text>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <TouchableOpacity 
              style={[s.button, strengthScore < 3 && password.length > 0 ? s.buttonDisabled : null]}
              activeOpacity={0.8}
              onPress={signUpWithEmail}
              disabled={loading || (strengthScore < 3 && password.length > 0)}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.buttonText}>S'inscrire</Text>
              )}
            </TouchableOpacity>

            <View style={s.footer}>
              <Text style={s.footerText}>Déjà un compte ? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={s.linkText}>Se connecter</Text>
              </TouchableOpacity>
            </View>
          </View>
          
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logo: {
    width: 90,
    height: 90,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.text2,
    marginTop: Spacing.xs,
  },
  formContainer: {
    width: '100%',
  },
  inputWrapper: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '600',
    marginBottom: Spacing.xs,
    marginLeft: 4,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg2,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 56,
    paddingHorizontal: Spacing.md,
  },
  inputBoxError: {
    borderColor: Colors.red,
  },
  inputIcon: {
    fontSize: FontSize.lg,
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    color: Colors.text,
    fontSize: FontSize.md,
    height: '100%',
  },
  eyeButton: {
    padding: Spacing.xs,
  },
  eyeIcon: {
    fontSize: FontSize.md,
  },
  errorText: {
    color: Colors.red,
    fontSize: FontSize.xs,
    marginTop: 4,
    marginLeft: 4,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingHorizontal: 4,
  },
  strengthBars: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    marginRight: Spacing.md,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    minWidth: 45,
    textAlign: 'right',
  },
  button: {
    height: 56,
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.md,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: Colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#FFF',
    fontSize: FontSize.lg,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xxl,
  },
  footerText: {
    color: Colors.text2,
    fontSize: FontSize.md,
  },
  linkText: {
    color: Colors.accent,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
