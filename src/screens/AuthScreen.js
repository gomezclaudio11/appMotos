import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { z } from 'zod';
import { supabase } from '../services/supabase';

const authSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  name: z.string().min(2, 'El nombre es obligatorio').optional(),
  bikeModel: z.string().min(2, 'El modelo de moto es obligatorio').optional(),
});

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [bikeModel, setBikeModel] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    try {
      const validationResult = authSchema.safeParse({
        email: email.trim(),
        password,
        name: isLogin ? undefined : name.trim(),
        bikeModel: isLogin ? undefined : bikeModel.trim(),
      });

      if (!validationResult.success) {
        const errorMessage = validationResult.error.errors.map(err => err.message).join('\n');
        Alert.alert('Validación de seguridad', errorMessage);
        return;
      }

      setLoading(true);
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) Alert.alert('Error al iniciar sesión', error.message);
      } else {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              name: name.trim(),
              bike_model: bikeModel.trim(),
            },
          },
        });
        if (error) {
          Alert.alert('Error al registrarse', error.message);
        } else {
          Alert.alert('¡Registro exitoso!', 'Ya puedes iniciar sesión con tus credenciales.');
          setIsLogin(true);
        }
      }
    } catch (err) {
      Alert.alert('Error', 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏍️ MotoApp - Viajeros</Text>
      <Text style={styles.subtitle}>{isLogin ? 'Iniciar Sesión' : 'Registro de Motociclista'}</Text>

      {!isLogin && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Nombre y Apellido"
            placeholderTextColor="#888"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Modelo de Moto (ej. Yamaha MT-03)"
            placeholderTextColor="#888"
            value={bikeModel}
            onChangeText={setBikeModel}
          />
        </>
      )}

      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        placeholderTextColor="#888"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña (mínimo 6 caracteres)"
        placeholderTextColor="#888"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleAuth} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{isLogin ? 'Ingresar' : 'Registrarse'}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.switchButton}>
        <Text style={styles.switchText}>
          {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6B00',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#495057',
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f8f9fa',
  },
  button: {
    backgroundColor: '#FF6B00',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  switchButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  switchText: {
    color: '#007bff',
    fontSize: 14,
  },
});
