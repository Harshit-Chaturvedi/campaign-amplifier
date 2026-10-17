import React, { useState } from 'react';
import { View, Text, StatusBar, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useAuthStore((s) => s.login);
  const loginAsDemo = useAuthStore((s) => s.loginAsDemo);

  const handleLogin = (userEmail: string, pass: string) => {
    login(userEmail, pass);
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Main');
    }
  };

  const handleDemo = () => {
    loginAsDemo();
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Main');
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
        <StatusBar barStyle="dark-content" />

        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24 }}>
          <TouchableOpacity
            onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Main'))}
            style={{ position: 'absolute', top: 52, left: 24, zIndex: 10 }}
          >
            <Ionicons name="close" size={24} color="#0f172a" />
          </TouchableOpacity>

          {/* Logo */}
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <View style={{ width: 64, height: 64, borderRadius: 18, backgroundColor: '#4f46e5', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Ionicons name="megaphone" size={32} color="#fff" />
            </View>
            <Text style={{ fontSize: 28, fontWeight: '800', color: '#0f172a' }}>Campaigns</Text>
            <Text style={{ fontSize: 15, color: '#64748b', marginTop: 4 }}>Community-funded advocacy</Text>
          </View>

          <Input label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
          <Input label="Password" value={password} onChangeText={setPassword} placeholder="Your password" secureTextEntry />

          <Button title="Sign In" onPress={() => handleLogin(email || 'demo@example.com', password)} fullWidth size="lg" />

          <View style={{ marginTop: 16 }}>
            <Button title="Continue as Demo User" onPress={handleDemo} variant="secondary" icon="flash-outline" fullWidth />
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={{ marginTop: 24, alignItems: 'center' }}>
            <Text style={{ fontSize: 14, color: '#64748b' }}>
              Don't have an account? <Text style={{ color: '#4f46e5', fontWeight: '600' }}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
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
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
        <StatusBar barStyle="dark-content" />

        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ position: 'absolute', top: 52, left: 24, zIndex: 10 }}>
            <Ionicons name="arrow-back" size={24} color="#0f172a" />
          </TouchableOpacity>

          <Text style={{ fontSize: 28, fontWeight: '800', color: '#0f172a', marginBottom: 8 }}>Create Account</Text>
          <Text style={{ fontSize: 15, color: '#64748b', marginBottom: 32 }}>Join the community-funded advocacy platform</Text>

          <Input label="Full Name" value={name} onChangeText={setName} placeholder="John Doe" />
          <Input label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
          <Input label="Password" value={password} onChangeText={setPassword} placeholder="Min 6 characters" secureTextEntry />

          <Button title="Create Account" onPress={handleRegister} fullWidth size="lg" />

          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 24, alignItems: 'center' }}>
            <Text style={{ fontSize: 14, color: '#64748b' }}>
              Already have an account? <Text style={{ color: '#4f46e5', fontWeight: '600' }}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
