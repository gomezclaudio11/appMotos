import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { supabase } from '../services/supabase';

export default function TripsScreen() {
  const [trips, setTrips] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    const { data, error } = await supabase
      .from('trips')
      .select('*, profiles(name)');
    if (error) {
      console.error('Error fetching trips:', error);
    } else if (data) {
      setTrips(data);
    }
  };

  const handleCreateTrip = async () => {
    if (!destination || !date) {
      Alert.alert('Error', 'Completa todos los campos');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('trips').insert([
      {
        destination,
        date,
        organizer_id: user.id,
        members_count: 1,
      },
    ]);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setDestination('');
      setDate('');
      setModalVisible(false);
      fetchTrips();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Destinos en Común 🗺️</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.addButtonText}>+ Crear Viaje</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={trips}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.tripCard}>
            <Text style={styles.destination}>{item.destination}</Text>
            <Text style={styles.date}>📅 {item.date}</Text>
            <Text style={styles.organizer}>👤 Organiza: {item.profiles?.name || 'Motociclista'} ({item.members_count} motociclistas)</Text>
            <TouchableOpacity style={styles.joinButton}>
              <Text style={styles.joinButtonText}>Unirme al Viaje</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Organizar Salida</Text>
            <TextInput
              style={styles.input}
              placeholder="Destino (ej. Córdoba, Chascomús)"
              placeholderTextColor="#888"
              value={destination}
              onChangeText={setDestination}
            />
            <TextInput
              style={styles.input}
              placeholder="Fecha y Hora (ej. Sáb 08:00hs)"
              placeholderTextColor="#888"
              value={date}
              onChangeText={setDate}
            />
            <TouchableOpacity style={styles.createButton} onPress={handleCreateTrip}>
              <Text style={styles.createButtonText}>Publicar Viaje</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
  },
  addButton: {
    backgroundColor: '#FF6B00',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  tripCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  destination: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  organizer: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 12,
  },
  joinButton: {
    backgroundColor: '#28a745',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  joinButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    color: '#000',
  },
  createButton: {
    backgroundColor: '#FF6B00',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  cancelButton: {
    padding: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6c757d',
    fontWeight: 'bold',
  },
});
