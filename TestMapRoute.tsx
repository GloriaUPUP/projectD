import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import RouteMapView from './components/RouteMapView';

const TestMapRoute = () => {
  const [origin, setOrigin] = useState('Mountain View, CA');
  const [destination, setDestination] = useState('Palo Alto, CA');
  const [showMap, setShowMap] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);

  const testRoute = () => {
    if (!origin || !destination) {
      Alert.alert('Error', 'Please enter both origin and destination');
      return;
    }
    setShowMap(true);
  };

  const handleRouteCalculated = (info) => {
    setRouteInfo(info);
    console.log('Route calculated:', info);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🗺️ Google Maps Route Test</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>From:</Text>
        <TextInput
          style={styles.input}
          value={origin}
          onChangeText={setOrigin}
          placeholder="Enter origin address"
        />
        
        <Text style={styles.label}>To:</Text>
        <TextInput
          style={styles.input}
          value={destination}
          onChangeText={setDestination}
          placeholder="Enter destination address"
        />
        
        <TouchableOpacity style={styles.button} onPress={testRoute}>
          <Text style={styles.buttonText}>Calculate Route</Text>
        </TouchableOpacity>
      </View>

      {routeInfo && (
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Route Information:</Text>
          <Text style={styles.infoText}>Distance: {routeInfo.distance}</Text>
          <Text style={styles.infoText}>Duration: {routeInfo.duration}</Text>
        </View>
      )}

      {showMap && (
        <View style={styles.mapContainer}>
          <RouteMapView
            origin={origin}
            destination={destination}
            onRouteCalculated={handleRouteCalculated}
            showAlternatives={true}
            style={styles.map}
          />
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#333',
  },
  inputContainer: {
    padding: 20,
    backgroundColor: 'white',
    margin: 10,
    borderRadius: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#4285F4',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  infoContainer: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 10,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666',
  },
  mapContainer: {
    height: 400,
    margin: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
});

export default TestMapRoute;