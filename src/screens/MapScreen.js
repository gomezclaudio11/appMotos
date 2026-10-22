import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Dimensions, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { supabase } from '../services/supabase';

export default function MapScreen() {
  const [location, setLocation] = useState(null);
  const [meetingPoints, setMeetingPoints] = useState([]);
  const [riders, setRiders] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation.coords);
      updateUserLocationInSupabase(currentLocation.coords);

      Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 10 },
        (loc) => {
          setLocation(loc.coords);
          updateUserLocationInSupabase(loc.coords);
        }
      );
    })();

    fetchMeetingPoints();
    fetchNearbyRiders();
  }, []);

  const updateUserLocationInSupabase = async (coords) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('profiles')
      .update({
        latitude: coords.latitude,
        longitude: coords.longitude,
        updated_at: new Date(),
      })
      .eq('id', user.id);
  };

  const fetchMeetingPoints = async () => {
    const { data } = await supabase.from('meeting_places').select('*');
    if (data) setMeetingPoints(data);
  };

  const fetchNearbyRiders = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase.from('profiles').select('*').not('latitude', 'is', null);
    if (data) {
      // Filter out current user if needed, or show all
      setRiders(data.filter(r => r.id !== user?.id));
    }
  };

  const handleCreateMeetingPlace = async () => {
    if (!title || !description || !location) {
      Alert.alert('Error', 'Completa los campos y asegúrate de tener señal GPS');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('meeting_places').insert([
      {
        title,
        description,
        latitude: location.latitude,
        longitude: location.longitude,
        created_by: user.id,
      },
    ]);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setTitle('');
      setDescription('');
      setModalVisible(false);
      fetchMeetingPoints();
      Alert.alert('¡Éxito!', 'Lugar de encuentro publicado en el mapa');
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: location ? location.latitude : -34.6037,
          longitude: location ? location.longitude : -58.3816,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {/* Meeting Places */}
        {meetingPoints.map((point) => (
          <Marker
            key={`meeting-${point.id}`}
            coordinate={{ latitude: point.latitude, longitude: point.longitude }}
            title={point.title}
            description={point.description}
            pinColor="orange"
          />
        ))}

        {/* Other Riders */}
        {riders.map((rider) => (
          rider.latitude && rider.longitude && (
            <Marker
              key={`rider-${rider.id}`}
              coordinate={{ latitude: rider.latitude, longitude: rider.longitude }}
              title={rider.name || 'Motociclista'}
              description={`Moto: ${rider.bike_model || 'N/D'}`}
              pinColor="blue"
            />
          )
        ))}
      </MapView>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🏍️ Radar Motero Activo</Text>
        <Text style={styles.cardSubtitle}>
          {location ? `Lat: ${location.latitude.toFixed(4)}, Lng: ${location.longitude.toFixed(4)}` : 'Obteniendo ubicación...'}
        </Text>
        <TouchableOpacity style={styles.button} onPress={() => setModalVisible(true)}>
          <Text style={styles.buttonText}>📢 Promover Lugar de Encuentro</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Promover Lugar de Encuentro</Text>
            <Text style={styles.modalSub}>Se usará tu ubicación GPS actual como punto de encuentro.</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Título (ej. Parador Ruta 2)"
              placeholderTextColor="#888"
              value={title}
              onChangeText={setTitle}
            />
            <TextInput
              style={styles.input}
              placeholder="Descripción (ej. Café, herramientas, mecánico)"
              placeholderTextColor="#888"
              value={description}
              onChangeText={setDescription}
            />

            <TouchableOpacity style={styles.createButton} onPress={handleCreateMeetingPlace}>
              <Text style={styles.createButtonText}>Publicar en el Mapa</Text>
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
    backgroundColor: '#fff',
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.75,
  },
  card: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#FF6B00',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
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
    marginBottom: 4,
    color: '#333',
  },
  modalSub: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
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
