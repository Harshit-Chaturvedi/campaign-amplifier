import React, { useState } from 'react';
import { View, StatusBar, KeyboardAvoidingView, Platform, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  Headline,
  Subheading,
  BodyText,
  SmallCapsLabel,
  MetaLabel,
  Text,
} from '../../components/ui/Typography';
import { apiClient } from '../../api/client';
import { colors, fonts, tokens } from '../../theme/tokens';

export function LoginScreen({ navigation, route }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [wakingServer, setWakingServer] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const bannerMessage = route?.params?.message || null;
  const login = useAuthStore((s) => s.login);

  const handleLogin = async (userEmail: string, pass: string) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await apiClient.login(userEmail, pass || 'demo123');
      login(res.user, res.token);
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('Main');
      }
    } catch (err: any) {
      setErrorMessage(err.detail || err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setLoading(true);
    setWakingServer(true);
    setErrorMessage(null);

    let succeeded = false;

    // Attempt 1
    try {
      const res = await apiClient.login('creator@demo.org', 'demo123');
      login(res.user, res.token);
      succeeded = true;
    } catch {
      // Attempt 2 (one retry with brief backoff for cold starts)
      try {
        await new Promise((r) => setTimeout(r, 1500));
        const res = await apiClient.login('creator@demo.org', 'demo123');
        login(res.user, res.token);
        succeeded = true;
      } catch {
        succeeded = false;
      }
    }

    setLoading(false);
    setWakingServer(false);

    if (succeeded) {
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('Main');
      }
    } else {
      setErrorMessage("Couldn't sign in, try again");
      Alert.alert("Sign In Failed", "Couldn't sign in, try again");
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.paper }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
    >
      <StatusBar barStyle="dark-content" />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 48 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Main'))}
          style={{
            position: 'absolute',
            top: 48,
            left: 24,
            zIndex: 10,
            width: 38,
            height: 38,
            borderRadius: tokens.radius.sm,
            backgroundColor: colors.paperSecondary,
            borderWidth: 1,
            borderColor: colors.hairline,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          accessibilityRole="button"
          accessibilityLabel="Close sign in"
        >
          <Ionicons name="close" size={20} color={colors.ink} />
        </TouchableOpacity>

        {/* Logo */}
        <View style={{ alignItems: 'center', marginBottom: 32, marginTop: 40 }}>
          <View
            style={{
              width: 58,
              height: 58,
              borderRadius: tokens.radius.sm,
              backgroundColor: colors.accent,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
            }}
          >
            <Ionicons name="megaphone-outline" size={28} color={colors.surface} />
          </View>
          <Headline style={{ fontSize: 24, color: colors.ink, textAlign: 'center' }}>
            Campaign Amplifier
          </Headline>
          <MetaLabel style={{ marginTop: 4, textAlign: 'center' }}>
            Civic message distribution infrastructure
          </MetaLabel>
        </View>

        {/* 401 Session Expired or Redirect Banner */}
        {bannerMessage && (
          <View
            style={{
              backgroundColor: colors.warningFaint || '#FFFBEB',
              borderWidth: 1,
              borderColor: colors.warning,
              borderRadius: tokens.radius.sm,
              padding: 12,
              marginBottom: 16,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Ionicons name="alert-circle-outline" size={18} color={colors.warning} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 13, fontFamily: fonts.sansMedium, color: colors.warning, flex: 1 }}>
              {bannerMessage}
            </Text>
          </View>
        )}

        {/* Server waking up indicator */}
        {wakingServer && (
          <View
            style={{
              backgroundColor: colors.paperSecondary,
              borderWidth: 1,
              borderColor: colors.accent,
              borderRadius: tokens.radius.sm,
              padding: 12,
              marginBottom: 16,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <ActivityIndicator size="small" color={colors.accent} style={{ marginRight: 10 }} />
            <Text style={{ fontSize: 13, fontFamily: fonts.sansMedium, color: colors.accent }}>
              Waking the server…
            </Text>
          </View>
        )}

        {/* Error message */}
        {errorMessage && !wakingServer && (
          <View
            style={{
              backgroundColor: colors.dangerFaint,
              borderWidth: 1,
              borderColor: colors.danger,
              borderRadius: tokens.radius.sm,
              padding: 12,
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 13, fontFamily: fonts.sansMedium, color: colors.danger }}>
              {errorMessage}
            </Text>
          </View>
        )}

        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          accessibilityLabel="Email input"
        />
        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Your password"
          secureTextEntry
          accessibilityLabel="Password input"
        />

        <View style={{ marginTop: 8 }}>
          <Button
            title="Sign In"
            onPress={() => handleLogin(email || 'demo@example.com', password)}
            fullWidth
            size="lg"
            loading={loading && !wakingServer}
          />
        </View>

        <View style={{ marginTop: 12 }}>
          <Button
            title={wakingServer ? 'Waking the server…' : 'Continue as Demo User'}
            onPress={handleDemo}
            variant="secondary"
            icon={wakingServer ? undefined : 'flash-outline'}
            loading={wakingServer}
            fullWidth
          />
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('Register')}
          style={{ marginTop: 24, alignItems: 'center', padding: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Navigate to sign up"
        >
          <Text style={{ fontSize: 14, fontFamily: fonts.sansRegular, color: colors.mutedInk }}>
            Don't have an account? <Text style={{ fontFamily: fonts.sansSemiBold, color: colors.accent }}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function RegisterScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const login = useAuthStore((s) => s.login);

  const handleRegister = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please provide both an email and password.');
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await apiClient.register(
        name.trim() || 'Demo User',
        email.trim(),
        password
      );
      login(res.user, res.token);
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('Main');
      }
    } catch (err: any) {
      setErrorMessage(err.detail || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.paper }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
    >
      <StatusBar barStyle="dark-content" />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 48 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            position: 'absolute',
            top: 48,
            left: 24,
            zIndex: 10,
            width: 38,
            height: 38,
            borderRadius: tokens.radius.sm,
            backgroundColor: colors.paperSecondary,
            borderWidth: 1,
            borderColor: colors.hairline,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={20} color={colors.ink} />
        </TouchableOpacity>

        <View style={{ marginTop: 40, marginBottom: 28 }}>
          <Headline style={{ fontSize: 24, color: colors.ink, marginBottom: 4 }}>
            Create Account
          </Headline>
          <MetaLabel>
            Join the community-funded amplification network
          </MetaLabel>
        </View>

        {errorMessage && (
          <View
            style={{
              backgroundColor: colors.dangerFaint,
              borderWidth: 1,
              borderColor: colors.danger,
              borderRadius: tokens.radius.sm,
              padding: 12,
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 13, fontFamily: fonts.sansMedium, color: colors.danger }}>
              {errorMessage}
            </Text>
          </View>
        )}

        <Input
          label="Full Name"
          value={name}
          onChangeText={setName}
          placeholder="Jane Doe"
          accessibilityLabel="Full name input"
        />
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          accessibilityLabel="Email input"
        />
        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Min 6 characters"
          secureTextEntry
          accessibilityLabel="Password input"
        />

        <View style={{ marginTop: 8 }}>
          <Button
            title="Create Account"
            onPress={handleRegister}
            fullWidth
            size="lg"
            loading={loading}
          />
        </View>

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ marginTop: 24, alignItems: 'center', padding: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Navigate to sign in"
        >
          <Text style={{ fontSize: 14, fontFamily: fonts.sansRegular, color: colors.mutedInk }}>
            Already have an account? <Text style={{ fontFamily: fonts.sansSemiBold, color: colors.accent }}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
