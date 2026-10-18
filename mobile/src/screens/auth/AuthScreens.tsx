import React, { useState } from 'react';
import { View, Text, StatusBar, KeyboardAvoidingView, Platform, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

import { apiClient } from '../../api/client';

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
      style={{ flex: 1, backgroundColor: '#f8fafc' }}
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
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: '#f1f5f9',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          accessibilityRole="button"
          accessibilityLabel="Close sign in"
        >
          <Ionicons name="close" size={22} color="#0f172a" />
        </TouchableOpacity>

        {/* Logo */}
        <View style={{ alignItems: 'center', marginBottom: 36, marginTop: 40 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              backgroundColor: '#4f46e5',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <Ionicons name="megaphone" size={32} color="#fff" />
          </View>
          <Text style={{ fontSize: 26, fontWeight: '800', color: '#0f172a' }}>Campaign Amplifier</Text>
          <Text style={{ fontSize: 14, color: '#64748b', marginTop: 4, textAlign: 'center' }}>
            Civic message distribution infrastructure
          </Text>
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

        <View style={{ marginTop: 14 }}>
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
          <Text style={{ fontSize: 14, color: '#64748b' }}>
            Don't have an account? <Text style={{ color: '#4f46e5', fontWeight: '700' }}>Sign Up</Text>
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
      style={{ flex: 1, backgroundColor: '#f8fafc' }}
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
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: '#f1f5f9',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color="#0f172a" />
        </TouchableOpacity>

        <View style={{ marginTop: 40, marginBottom: 28 }}>
          <Text style={{ fontSize: 26, fontWeight: '800', color: '#0f172a', marginBottom: 6 }}>Create Account</Text>
          <Text style={{ fontSize: 14, color: '#64748b' }}>Join the community-funded amplification network</Text>
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
          <Text style={{ fontSize: 14, color: '#64748b' }}>
            Already have an account? <Text style={{ color: '#4f46e5', fontWeight: '700' }}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
