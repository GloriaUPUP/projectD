import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

interface GoogleMapViewProps {
  userLocation?: { lat: number; lng: number };
  pickupLocation?: { lat: number; lng: number };
  deliveryLocation?: { lat: number; lng: number };
  stations?: Array<{ lat: number; lng: number; name: string }>;
  activeDeliveries?: Array<{
    orderId: string;
    currentLocation?: { latitude: number; longitude: number };
    route?: Array<{ latitude: number; longitude: number }>;
    origin: string;
    destination: string;
    eta: string;
    progress: number;
  }>;
  style?: any;
}

const GoogleMapView: React.FC<GoogleMapViewProps> = ({
  userLocation = { lat: 37.7749, lng: -122.4194 }, // San Francisco default
  pickupLocation,
  deliveryLocation,
  stations = [],
  activeDeliveries = [],
  style,
}) => {
  // Calculate initial region
  const getInitialRegion = () => {
    if (pickupLocation && deliveryLocation) {
      const minLat = Math.min(pickupLocation.lat, deliveryLocation.lat);
      const maxLat = Math.max(pickupLocation.lat, deliveryLocation.lat);
      const minLng = Math.min(pickupLocation.lng, deliveryLocation.lng);
      const maxLng = Math.max(pickupLocation.lng, deliveryLocation.lng);
      
      return {
        latitude: (minLat + maxLat) / 2,
        longitude: (minLng + maxLng) / 2,
        latitudeDelta: (maxLat - minLat) * 1.5,
        longitudeDelta: (maxLng - minLng) * 1.5,
      };
    }
    
    return {
      latitude: userLocation.lat,
      longitude: userLocation.lng,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    };
  };

  return (
    <View style={[styles.container, style]}>
      <MapView
        style={styles.map}
        initialRegion={getInitialRegion()}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
      >
        {/* User location marker */}
        <Marker
          coordinate={{
            latitude: userLocation.lat,
            longitude: userLocation.lng,
          }}
          title="Your Location"
          pinColor="#4285F4"
        />

        {/* Pickup location marker */}
        {pickupLocation && (
          <Marker
            coordinate={{
              latitude: pickupLocation.lat,
              longitude: pickupLocation.lng,
            }}
            title="Pickup Location"
            pinColor="#000000"
          />
        )}

        {/* Delivery location marker */}
        {deliveryLocation && (
          <Marker
            coordinate={{
              latitude: deliveryLocation.lat,
              longitude: deliveryLocation.lng,
            }}
            title="Delivery Location"
            pinColor="#34A853"
          />
        )}

        {/* Station markers */}
        {stations.map((station, index) => (
          <Marker
            key={index}
            coordinate={{
              latitude: station.lat,
              longitude: station.lng,
            }}
            title={station.name}
            pinColor="#666666"
          />
        ))}

        {/* Route polyline */}
        {pickupLocation && deliveryLocation && (
          <Polyline
            coordinates={[
              {
                latitude: pickupLocation.lat,
                longitude: pickupLocation.lng,
              },
              {
                latitude: deliveryLocation.lat,
                longitude: deliveryLocation.lng,
              },
            ]}
            strokeColor="#000000"
            strokeWidth={3}
          />
        )}

        {/* Active Deliveries */}
        {activeDeliveries && Array.isArray(activeDeliveries) && activeDeliveries.map((delivery, index) => (
          <React.Fragment key={delivery.orderId}>
            {/* Delivery Route */}
            {delivery.route && delivery.route.length > 0 && (
              <Polyline
                coordinates={delivery.route}
                strokeColor="#4CAF50"
                strokeWidth={4}
                strokeOpacity={0.8}
                lineDashPattern={[5, 5]}
              />
            )}
            
            {/* Current Delivery Vehicle Location */}
            {delivery.currentLocation && (
              <Marker
                coordinate={delivery.currentLocation}
                title={`配送车辆 #${delivery.orderId}`}
                description={`进度: ${delivery.progress}% | ETA: ${delivery.eta}`}
              >
                <View style={styles.deliveryVehicle}>
                  <Text style={styles.vehicleIcon}>🚗</Text>
                  <View style={styles.progressBadge}>
                    <Text style={styles.progressText}>{delivery.progress}%</Text>
                  </View>
                </View>
              </Marker>
            )}
          </React.Fragment>
        ))}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  deliveryVehicle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleIcon: {
    fontSize: 24,
    marginBottom: 2,
  },
  progressBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 2,
    borderColor: 'white',
  },
  progressText: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statusBadge: {
    marginTop: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 6,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  statusText: {
    fontSize: 8,
    textAlign: 'center',
  },
  userLocationMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    borderWidth: 3,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  userLocationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
  },
});

// Helper functions
function getVehicleRotation(delivery: DeliveryProgress): string {
  // Calculate rotation based on movement direction (simplified)
  return '0deg'; // Could implement based on previous vs current location
}

function getStatusIcon(status: DeliveryProgress['status']): string {
  switch (status) {
    case 'picked_up': return '📦';
    case 'in_transit': return '🚀';
    case 'near_destination': return '🏁';
    case 'delivered': return '✅';
    default: return '🗺';
  }
}

export default GoogleMapView;