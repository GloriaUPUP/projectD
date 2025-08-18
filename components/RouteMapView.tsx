import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Alert } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { decode } from '@mapbox/polyline';
import { routeAPI } from '../services/api';

interface RouteMapViewProps {
  origin: string;
  destination: string;
  userLocation?: { lat: number; lng: number };
  stations?: Array<{ lat: number; lng: number; name: string }>;
  style?: any;
  showAlternatives?: boolean;
  onRouteCalculated?: (routeInfo: any) => void;
}

interface RouteInfo {
  distance: string;
  duration: string;
  polyline: string;
  startLocation: { lat: number; lng: number };
  endLocation: { lat: number; lng: number };
  steps?: any[];
  alternatives?: any[];
}

const RouteMapView: React.FC<RouteMapViewProps> = ({
  origin,
  destination,
  userLocation = { lat: 37.7749, lng: -122.4194 },
  stations = [],
  style,
  showAlternatives = false,
  onRouteCalculated,
}) => {
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [polylineCoordinates, setPolylineCoordinates] = useState<
    Array<{ latitude: number; longitude: number }>
  >([]);
  const [alternativeRoutes, setAlternativeRoutes] = useState<
    Array<{ coordinates: Array<{ latitude: number; longitude: number }>; color: string }>
  >([]);

  // 计算路径
  useEffect(() => {
    if (origin && destination) {
      calculateRoute();
    }
  }, [origin, destination]);

  const calculateRoute = async () => {
    setLoading(true);
    try {
      const response = await routeAPI.calculateRoute(origin, destination);
      
      if (response.success && response.data) {
        const route = response.data;
        setRouteInfo(route);
        
        // 解码主路径polyline
        if (route.polyline) {
          const decoded = decode(route.polyline);
          const coordinates = decoded.map(([lat, lng]) => ({
            latitude: lat,
            longitude: lng,
          }));
          setPolylineCoordinates(coordinates);
        }
        
        // 解码备选路径
        if (showAlternatives && route.alternatives) {
          const altRoutes = route.alternatives.map((alt: any, index: number) => {
            const decoded = decode(alt.polyline);
            const coordinates = decoded.map(([lat, lng]: [number, number]) => ({
              latitude: lat,
              longitude: lng,
            }));
            return {
              coordinates,
              color: index === 0 ? '#FF6B6B' : '#4ECDC4', // 不同颜色区分备选路径
            };
          });
          setAlternativeRoutes(altRoutes);
        }
        
        // 回调通知父组件
        if (onRouteCalculated) {
          onRouteCalculated(route);
        }
      }
    } catch (error) {
      console.error('路径计算失败:', error);
      Alert.alert('路径计算失败', '无法计算路径，请检查地址是否正确');
    } finally {
      setLoading(false);
    }
  };

  // 计算地图显示区域
  const getMapRegion = () => {
    if (routeInfo && polylineCoordinates.length > 0) {
      const lats = polylineCoordinates.map(coord => coord.latitude);
      const lngs = polylineCoordinates.map(coord => coord.longitude);
      
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      
      const padding = 0.01; // 边距
      
      return {
        latitude: (minLat + maxLat) / 2,
        longitude: (minLng + maxLng) / 2,
        latitudeDelta: (maxLat - minLat) + padding,
        longitudeDelta: (maxLng - minLng) + padding,
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
        initialRegion={getMapRegion()}
        region={routeInfo ? getMapRegion() : undefined}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
        toolbarEnabled={false}
      >
        {/* 起点标记 */}
        {routeInfo && (
          <Marker
            coordinate={{
              latitude: routeInfo.startLocation.lat,
              longitude: routeInfo.startLocation.lng,
            }}
            title="起点"
            description={origin}
            pinColor="#34A853"
          />
        )}

        {/* 终点标记 */}
        {routeInfo && (
          <Marker
            coordinate={{
              latitude: routeInfo.endLocation.lat,
              longitude: routeInfo.endLocation.lng,
            }}
            title="终点"
            description={destination}
            pinColor="#EA4335"
          />
        )}

        {/* 配送站点标记 */}
        {stations.map((station, index) => (
          <Marker
            key={index}
            coordinate={{
              latitude: station.lat,
              longitude: station.lng,
            }}
            title={station.name}
            pinColor="#FBBC04"
          />
        ))}

        {/* 主路径 */}
        {polylineCoordinates.length > 0 && (
          <Polyline
            coordinates={polylineCoordinates}
            strokeColor="#4285F4"
            strokeWidth={5}
            lineJoin="round"
            lineCap="round"
          />
        )}

        {/* 备选路径 */}
        {alternativeRoutes.map((route, index) => (
          <Polyline
            key={`alt-${index}`}
            coordinates={route.coordinates}
            strokeColor={route.color}
            strokeWidth={3}
            lineDashPattern={[5, 5]}
            lineJoin="round"
            lineCap="round"
          />
        ))}
      </MapView>

      {/* 路径信息显示 */}
      {routeInfo && (
        <View style={styles.routeInfo}>
          <View style={styles.routeInfoItem}>
            <Text style={styles.routeInfoLabel}>距离:</Text>
            <Text style={styles.routeInfoValue}>{routeInfo.distance}</Text>
          </View>
          <View style={styles.routeInfoItem}>
            <Text style={styles.routeInfoLabel}>时间:</Text>
            <Text style={styles.routeInfoValue}>{routeInfo.duration}</Text>
          </View>
        </View>
      )}

      {/* 加载指示器 */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>计算路径中...</Text>
        </View>
      )}
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
  routeInfo: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  routeInfoItem: {
    alignItems: 'center',
  },
  routeInfoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  routeInfoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RouteMapView;