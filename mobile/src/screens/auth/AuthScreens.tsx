import React, { useState } from 'react';
import { View, StatusBar, KeyboardAvoidingView, Platform, TouchableOpacity, ScrollView } from 'react-native';
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

export function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const loginAsDemo = useAuthStore((s) => s.loginAsDemo);

  const handleLogin = async (userEmail: string, pass: string) => {
    setLoading(true);
    try {
      const res = await apiClient.login(userEmail, pass || 'demo123');
      login(userEmail, pass, res.token);
    } catch {
      login(userEmail, pass);
    } finally {
      setLoading(false);
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('Main');
      }
    }
  };

  const handleDemo = async () => {
    setLoading(true);
    try {
      const res = await apiClient.login('creator@demo.org', 'demo123');
      login('creator@demo.org', 'demo123', res.token);
    } catch {
      loginAsDemo();
    } finally {
      setLoading(false);
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('Main');
      }
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
            loading={loading}
          />
        </View>

        <View style={{ marginTop: 12 }}>
          <Button
            title="Continue as Demo User"
            onPress={handleDemo}
            variant="secondary"
            icon="flash-outline"
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
  const register = useAuthStore((s) => s.register);

  const handleRegister = () => {
    register(name || 'Demo User', email || 'demo@example.com', password);
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Main');
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
          <Button title="Create Account" onPress={handleRegister} fullWidth size="lg" />
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
