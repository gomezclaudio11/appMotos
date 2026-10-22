import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { supabase } from '../services/supabase';

export default function ChatScreen() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTripId, setActiveTripId] = useState(null);

  useEffect(() => {
    initializeChat();

    // Subscribe to realtime messages
    const channel = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
        // Fetch sender name for the new message
        const { data: profileData } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', payload.new.user_id)
          .single();

        const newMessage = {
          ...payload.new,
          profiles: profileData || { name: 'Motociclista' }
        };

        setMessages((prev) => {
          if (prev.some(m => m.id === newMessage.id)) return prev;
          return [...prev, newMessage];
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const initializeChat = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);

    // Get or create a default trip for global chat
    let { data: trips, error } = await supabase.from('trips').select('id').limit(1);
    
    let tripId = null;
    if (!trips || trips.length === 0) {
      // Create default trip
      const { data: newTrip, error: createError } = await supabase
        .from('trips')
        .insert([{ destination: 'Chat General Motero', date: 'Siempre activo', organizer_id: user?.id }])
        .select('id')
        .single();
      
      if (newTrip) {
        tripId = newTrip.id;
      }
    } else {
      tripId = trips[0].id;
    }

    setActiveTripId(tripId);

    if (tripId) {
      const { data: msgData } = await supabase
        .from('messages')
        .select('*, profiles(name)')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: true });

      if (msgData) {
        setMessages(msgData);
      }
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !currentUser || !activeTripId) return;

    const { error } = await supabase.from('messages').insert([
      {
        trip_id: activeTripId,
        user_id: currentUser.id,
        text: inputText,
      },
    ]);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setInputText('');
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <Text style={styles.title}>💬 Chat de Ruta en Tiempo Real</Text>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isMyMessage = currentUser && item.user_id === currentUser.id;
          return (
            <View style={[styles.messageBubble, isMyMessage ? styles.myMessage : styles.otherMessage]}>
              <Text style={styles.userName}>{item.profiles?.name || 'Motociclista'}</Text>
              <Text style={styles.messageText}>{item.text}</Text>
              <Text style={styles.timeText}>
                {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          );
        }}
        contentContainerStyle={styles.chatList}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Escribí un mensaje..."
          placeholderTextColor="#888"
          value={inputText}
          onChangeText={setInputText}
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendButtonText}>Enviar</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  chatList: {
    padding: 16,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    maxWidth: '80%',
  },
  myMessage: {
    backgroundColor: '#dcf8c6',
    alignSelf: 'flex-end',
  },
  otherMessage: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  userName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF6B00',
    marginBottom: 2,
  },
  messageText: {
    fontSize: 16,
    color: '#333',
  },
  timeText: {
    fontSize: 10,
    color: '#888',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#dee2e6',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
    color: '#000',
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: '#FF6B00',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
