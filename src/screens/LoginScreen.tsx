import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../services/supabase';
import { useColors, useThemedStyles } from '../context/ThemeContext';
import { ThemeColors, FontSize, Radius, Spacing } from '../constants/theme';
import { Logo } from '../components/Logo';

export const LoginScreen = ({ navigation }: any) => {
  const Colors = useColors();
  const s = useThemedStyles(makeStyles);

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

  async function signInWithEmail() {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }
    
    if (emailError) {
      Alert.alert('Erreur', 'Veuillez corriger les erreurs avant de continuer.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) Alert.alert('Erreur', error.message);
    setLoading(false);
  }

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView 
        style={s.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={s.logoContainer}>
          <Image 
            source={require('../assets/logo1.png')} 
            style={[s.logo, { borderRadius: 25, overflow: 'hidden' }]} 
            resizeMode="cover"
          />
          <Text style={s.title}>ParkSense</Text>
          <Text style={s.subtitle}>Trouvez votre place, gagnez du temps.</Text>
        </View>

        <View style={s.formContainer}>
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
                placeholder="Votre mot de passe"
                placeholderTextColor={Colors.text3}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={s.eyeButton}>
                <Text style={s.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={s.forgotPassword}>
              <Text style={s.forgotPasswordText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <TouchableOpacity 
            style={s.button}
            activeOpacity={0.8}
            onPress={signInWithEmail}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.buttonText}>Se connecter</Text>
            )}
          </TouchableOpacity>

          <View style={s.footer}>
            <Text style={s.footerText}>Pas encore de compte ? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text style={s.linkText}>Créer un compte</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  logo: {
    width: 100,
    height: 100,
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: Spacing.sm,
  },
  forgotPasswordText: {
    color: Colors.accent,
    fontSize: FontSize.sm,
    fontWeight: '500',
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
