import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Dimensions, Animated } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { decode } from '@mapbox/polyline';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';
import { routeAPI } from '../services/api';

const { width, height } = Dimensions.get('window');

interface EnhancedRouteMapProps {
  origin: string;
  destination: string;
  orderId?: string;
  showAlternatives?: boolean;
  enableRealTimeTracking?: boolean;
  autoStartTracking?: boolean;
  trackingDuration?: number; // 配送时长（分钟）
  style?: any;
  onRouteCalculated?: (routeInfo: any) => void;
  onTrackingUpdate?: (update: any) => void;
}

interface RouteData {
  coordinates: Array<{ latitude: number; longitude: number }>;
  color: string;
  width: number;
  distance: string;
  duration: string;
  summary?: string;
}

interface LatLng {
  latitude: number;
  longitude: number;
}

interface TrackingUpdate {
  orderId: string;
  status: string;
  message: string;
  eta: string;
  currentLocation?: LatLng;
  timestamp: string;
}

const EnhancedRouteMapView: React.FC<EnhancedRouteMapProps> = ({
  origin,
  destination,
  orderId,
  showAlternatives = true,
  enableRealTimeTracking = false,
  autoStartTracking = false,
  trackingDuration = 3,
  style,
  onRouteCalculated,
  onTrackingUpdate
}) => {
  // 状态管理
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [deliveryLocation, setDeliveryLocation] = useState<LatLng | null>(null);
  const [trackingStatus, setTrackingStatus] = useState<string>('');
  const [eta, setETA] = useState<string>('');
  const [isTracking, setIsTracking] = useState(false);
  const [animatedCarPosition] = useState(new Animated.ValueXY({ x: 0, y: 0 }));
  const [carRouteProgress, setCarRouteProgress] = useState(0);
  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: 37.7749,
    longitude: -122.4194,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });

  const mapRef = useRef<MapView>(null);
  const stompClientRef = useRef<any>(null);
  const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isTrackingActiveRef = useRef(false);
  const trackingSessionIdRef = useRef<string | null>(null);

  // 1. 计算路径
  useEffect(() => {
    if (origin && destination) {
      calculateMultipleRoutes();
    }
  }, [origin, destination]);

  // 2. 自动开始跟踪 - 防止重复启动
  useEffect(() => {
    if (autoStartTracking && orderId && routes.length > 0 && !isTracking && !isTrackingActiveRef.current) {
      startDeliveryTracking();
    }
  }, [autoStartTracking, orderId, routes, isTracking]);

  // 3. 设置实时跟踪 - 防止重复连接
  useEffect(() => {
    if (enableRealTimeTracking && orderId && !isTrackingActiveRef.current) {
      setupRealtimeTracking();
    }
    
    return () => {
      console.log('🧹 Cleaning up EnhancedRouteMapView for order:', orderId);
      if (stompClientRef.current) {
        stompClientRef.current.disconnect();
      }
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
      isTrackingActiveRef.current = false;
      trackingSessionIdRef.current = null;
    };
  }, [orderId, enableRealTimeTracking]);

  const calculateMultipleRoutes = async () => {
    try {
      const response = await routeAPI.calculateRoute(origin, destination);
      
      if (response.success && response.data) {
        const mainRoute = processRoute(response.data, '#1976D2', 6, '主路径');
        const processedRoutes = [mainRoute];
        
        // 处理备选路径
        if (showAlternatives && response.data.alternatives) {
          const altRoutes = response.data.alternatives.map((alt: any, index: number) => 
            processRoute(alt, '#90A4AE', 4, `路径 ${index + 2}`)
          );
          processedRoutes.push(...altRoutes);
        }
        
        setRoutes(processedRoutes);
        
        // 调整地图视图
        if (mainRoute.coordinates.length > 0) {
          adjustMapToRoute(mainRoute.coordinates);
        }
        
        // 回调通知
        if (onRouteCalculated) {
          onRouteCalculated(response.data);
        }
        
      }
    } catch (error) {
      console.log('使用模拟路径数据进行GPS跟踪');
      // 不显示错误给用户，因为GPS模拟会正常工作
      // 当Google Maps API不可用时，我们会使用模拟数据
    }
  };

  const processRoute = (routeData: any, color: string, width: number, name: string): RouteData => {
    const decoded = decode(routeData.polyline);
    const coordinates = decoded.map(([lat, lng]: [number, number]) => ({
      latitude: lat,
      longitude: lng
    }));
    
    return {
      coordinates,
      color,
      width,
      distance: routeData.distance,
      duration: routeData.duration,
      summary: routeData.summary || name
    };
  };

  const adjustMapToRoute = (coordinates: LatLng[]) => {
    if (coordinates.length === 0) return;
    
    const lats = coordinates.map(coord => coord.latitude);
    const lngs = coordinates.map(coord => coord.longitude);
    
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    
    const region: Region = {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: (maxLat - minLat) * 1.2,
      longitudeDelta: (maxLng - minLng) * 1.2,
    };
    
    setMapRegion(region);
    
    // 动画到新区域
    setTimeout(() => {
      mapRef.current?.animateToRegion(region, 1000);
    }, 100);
  };

  const setupRealtimeTracking = () => {
    try {
      console.log('🚀 开始设置WebSocket连接...');
      const socket = new SockJS('http://192.168.1.88:8086/ws');
      const client = Stomp.over(socket);
      
      // 启用调试模式
      client.debug = (str) => {
        console.log('STOMP Debug:', str);
      };
      
      client.connect({}, () => {
        console.log('✅ WebSocket连接成功！');
        console.log('📡 订阅跟踪频道:', `/topic/delivery/${orderId}`);
        
        // 订阅特定订单的跟踪更新
        client.subscribe(`/topic/delivery/${orderId}`, (message) => {
          console.log('🚗 收到订单跟踪更新:', message.body);
          const update: TrackingUpdate = JSON.parse(message.body);
          handleTrackingUpdate(update);
        });
        
        // 订阅通用跟踪频道
        client.subscribe('/topic/tracking', (message) => {
          console.log('🌍 收到通用跟踪更新:', message.body);
          const update = JSON.parse(message.body);
          handleTrackingUpdate(update);
        });
        
        // 启动配送跟踪
        if (orderId) {
          startDeliveryTracking();
        }
        
      }, (error: any) => {
        console.error('❌ WebSocket连接失败:', error);
        Alert.alert('连接失败', 'WebSocket连接失败，将使用模拟模式');
        // fallback - 启动模拟模式
        if (orderId) {
          startDeliveryTracking();
        }
      });
      
      stompClientRef.current = client;
      
    } catch (error) {
      console.error('❌ 设置WebSocket失败:', error);
      // fallback - 启动模拟模式
      if (orderId) {
        startDeliveryTracking();
      }
    }
  };

  const handleTrackingUpdate = (update: TrackingUpdate) => {
    console.log('收到跟踪更新:', update);
    
    setTrackingStatus(update.message);
    setETA(update.eta);
    
    if (update.currentLocation) {
      setDeliveryLocation(update.currentLocation);
      
      // 移动地图视图跟随配送位置
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          ...update.currentLocation,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 500);
      }
    }
    
    // 更新跟踪状态
    switch (update.status) {
      case 'DELIVERY_STARTED':
        setIsTracking(true);
        break;
      case 'DELIVERY_COMPLETED':
      case 'DELIVERY_FAILED':
      case 'DELIVERY_CANCELLED':
        setIsTracking(false);
        break;
    }
    
    // 回调通知
    if (onTrackingUpdate) {
      onTrackingUpdate(update);
    }
  };

  const startDeliveryTracking = async () => {
    if (!orderId || isTrackingActiveRef.current) {
      console.log('❌ Tracking already active or missing orderId');
      return;
    }
    
    // 创建唯一的跟踪会话ID
    const sessionId = `${orderId}-${Date.now()}`;
    trackingSessionIdRef.current = sessionId;
    
    isTrackingActiveRef.current = true;
    console.log('🚗 Starting delivery tracking for order:', orderId, 'Session:', sessionId);
    
    try {
      const params = new URLSearchParams({
        orderId: orderId || '',
        origin,
        destination,
        duration: trackingDuration.toString()
      });
      
      const response = await fetch(`http://192.168.1.88:8086/api/test/delivery?${params}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (result.success) {
        setIsTracking(true);
        startCarAnimation(sessionId);
        console.log('✅ Delivery tracking started successfully');
      } else {
        isTrackingActiveRef.current = false;
        console.error('Failed to start tracking:', result.message);
      }
      
    } catch (error) {
      console.error('启动配送跟踪失败:', error);
      isTrackingActiveRef.current = false;
      // 启动本地模拟动画
      setIsTracking(true);
      startCarAnimation(sessionId);
    }
  };

  const startCarAnimation = (sessionId: string) => {
    if (routes.length === 0 || !routes[0].coordinates.length) {
      console.log('No routes available for animation');
      // 使用模拟路径
      startSimulatedCarAnimation(sessionId);
      return;
    }
    
    const route = routes[0].coordinates;
    const totalSteps = route.length;
    const animationDuration = trackingDuration * 60 * 1000; // 转换为毫秒
    const stepDuration = animationDuration / totalSteps;
    
    console.log(`🚗 Starting car animation with ${totalSteps} steps over ${trackingDuration} minutes`);
    
    let currentStep = 0;
    
    // 设置初始位置
    setDeliveryLocation(route[0]);
    setCarRouteProgress(0);
    
    // 发送初始更新
    if (onTrackingUpdate) {
      onTrackingUpdate({
        orderId: orderId || '',
        status: 'tracking_started',
        message: '🚗 GPS跟踪已启动，配送车辆正在前往取件地点...',
        eta: `${trackingDuration}分钟`,
        timestamp: new Date().toLocaleTimeString(),
        progress: 0
      });
    }
    
    trackingIntervalRef.current = setInterval(() => {
      
      currentStep++;
      
      if (currentStep >= totalSteps) {
        // 动画完成
        clearInterval(trackingIntervalRef.current!);
        setIsTracking(false);
        isTrackingActiveRef.current = false;
        trackingSessionIdRef.current = null;
        setTrackingStatus('🎉 配送完成！');
        setETA('');
        setCarRouteProgress(100);
        
        console.log('✅ Car animation completed for session:', sessionId);
        
        // 发送完成更新
        if (onTrackingUpdate) {
          onTrackingUpdate({
            orderId: orderId || '',
            status: 'delivered',
            message: '🎉 包裹已送达！',
            eta: '已完成',
            timestamp: new Date().toLocaleTimeString(),
            progress: 100,
            sessionId: sessionId
          });
        }
        return;
      }
      
      // 更新小车位置
      const newPosition = route[currentStep];
      setDeliveryLocation(newPosition);
      
      // 计算进度
      const progress = Math.round((currentStep / totalSteps) * 100);
      setCarRouteProgress(progress);
      
      // 更新ETA
      const remainingTime = Math.max(0, Math.round((totalSteps - currentStep) * stepDuration / 60000));
      setETA(remainingTime > 0 ? `${remainingTime}分钟` : '即将送达');
      
      // 更新状态消息
      let statusMessage = '🚗 配送进行中...';
      if (progress < 30) {
        statusMessage = '🚗 前往取件地点...';
      } else if (progress < 70) {
        statusMessage = '📦 已取件，正在配送...';
      } else {
        statusMessage = '🎯 即将送达...';
      }
      
      setTrackingStatus(statusMessage);
      
      console.log(`🚗 Car progress: ${progress}% at step ${currentStep}/${totalSteps}`);
      
      // 发送跟踪更新
      if (onTrackingUpdate) {
        onTrackingUpdate({
          orderId: orderId || '',
          status: 'in_transit',
          message: statusMessage,
          eta: remainingTime > 0 ? `${remainingTime}分钟` : '即将送达',
          timestamp: new Date().toLocaleTimeString(),
          progress: progress,
          sessionId: sessionId
        });
      }
      
    }, stepDuration);
  };
  
  const startSimulatedCarAnimation = (sessionId: string) => {
    console.log('🚗 Starting simulated car animation');
    
    // 创建一个模拟路径 (从旧金山到戴利城)
    const simulatedRoute = [
      { latitude: 37.7749, longitude: -122.4194 }, // 旧金山起点
      { latitude: 37.7649, longitude: -122.4294 },
      { latitude: 37.7549, longitude: -122.4394 },
      { latitude: 37.7449, longitude: -122.4494 },
      { latitude: 37.7349, longitude: -122.4594 },
      { latitude: 37.7249, longitude: -122.4694 },
      { latitude: 37.7149, longitude: -122.4794 },
      { latitude: 37.7049, longitude: -122.4894 }, // 戴利城终点
    ];
    
    const totalSteps = simulatedRoute.length;
    const animationDuration = trackingDuration * 60 * 1000;
    const stepDuration = animationDuration / totalSteps;
    
    let currentStep = 0;
    
    // 设置初始位置
    setDeliveryLocation(simulatedRoute[0]);
    setCarRouteProgress(0);
    
    trackingIntervalRef.current = setInterval(() => {
      if (currentStep >= totalSteps - 1) {
        clearInterval(trackingIntervalRef.current!);
        setIsTracking(false);
        isTrackingActiveRef.current = false;
        setCarRouteProgress(100);
        
        if (onTrackingUpdate) {
          onTrackingUpdate({
            orderId: orderId || '',
            status: 'delivered',
            message: '🎉 包裹已送达！',
            eta: '已完成',
            timestamp: new Date().toLocaleTimeString(),
            progress: 100,
            sessionId: sessionId
          });
        }
        return;
      }
      
      currentStep++;
      setDeliveryLocation(simulatedRoute[currentStep]);
      
      const progress = Math.round((currentStep / (totalSteps - 1)) * 100);
      setCarRouteProgress(progress);
      
      if (onTrackingUpdate) {
        onTrackingUpdate({
          orderId: orderId || '',
          status: 'in_transit',
          message: `🚗 配送进行中... (${progress}%)`,
          eta: `${Math.round((totalSteps - currentStep) * stepDuration / 60000)}分钟`,
          timestamp: new Date().toLocaleTimeString(),
          progress: progress,
          sessionId: sessionId
        });
      }
    }, stepDuration);
  };
  
  const stopDeliveryTracking = async () => {
    if (!orderId) return;
    
    console.log('🛑 Stopping delivery tracking for order:', orderId);
    
    // 清除当前会话
    trackingSessionIdRef.current = null;
    
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
    }
    
    try {
      await fetch(`http://192.168.1.88:8086/api/test/delivery/${orderId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('停止配送跟踪失败:', error);
    }
    
    setIsTracking(false);
    setDeliveryLocation(null);
    setTrackingStatus('');
    setETA('');
    setCarRouteProgress(0);
    isTrackingActiveRef.current = false;
  };

  const onRoutePress = (routeIndex: number) => {
    setSelectedRouteIndex(routeIndex);
    if (routes[routeIndex]?.coordinates.length > 0) {
      adjustMapToRoute(routes[routeIndex].coordinates);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={mapRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsTraffic={true}
      >
        {/* 渲染所有路径 */}
        {routes.map((route, index) => (
          <Polyline
            key={index}
            coordinates={route.coordinates}
            strokeColor={index === selectedRouteIndex ? route.color : '#90A4AE'}
            strokeWidth={index === selectedRouteIndex ? route.width : 3}
            strokeOpacity={index === selectedRouteIndex ? 1.0 : 0.6}
            lineCap="round"
            lineJoin="round"
            tappable={true}
            onPress={() => onRoutePress(index)}
          />
        ))}
        
        {/* 起点终点标记 */}
        {routes[0] && routes[0].coordinates.length > 0 && (
          <>
            <Marker
              coordinate={routes[0].coordinates[0]}
              title="起点"
              description={origin}
              pinColor="green"
            />
            <Marker
              coordinate={routes[0].coordinates[routes[0].coordinates.length - 1]}
              title="终点"
              description={destination}
              pinColor="red"
            />
          </>
        )}
        
        {/* 实时配送位置 - 动画小车 */}
        {deliveryLocation && isTracking && (
          <Marker 
            coordinate={deliveryLocation} 
            title="配送车辆" 
            anchor={{ x: 0.5, y: 0.5 }}
            zIndex={1000}
          >
            <View style={styles.deliveryMarker}>
              <Text style={styles.deliveryMarkerText}>🚗</Text>
            </View>
          </Marker>
        )}
      </MapView>
      
      {/* 实时状态显示 */}
      {isTracking && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>{trackingStatus}</Text>
          <Text style={styles.etaText}>预计送达: {eta}</Text>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${carRouteProgress}%` }]} />
            </View>
            <Text style={styles.progressText}>{carRouteProgress}%</Text>
          </View>
        </View>
      )}
      
      {/* 路径选择器 */}
      {showAlternatives && routes.length > 1 && (
        <View style={styles.routeSelector}>
          <Text style={styles.routeSelectorTitle}>选择路径:</Text>
          {routes.map((route, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => onRoutePress(index)}
              style={[
                styles.routeOption,
                index === selectedRouteIndex && styles.selectedRouteOption
              ]}
            >
              <Text style={styles.routeOptionText}>
                {route.summary || `路径 ${index + 1}`}: {route.distance} • {route.duration}
                {index === selectedRouteIndex && ' ✓'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      
      {/* 控制按钮 */}
      {orderId && (
        <View style={styles.controlButtons}>
          {!isTracking ? (
            <TouchableOpacity style={styles.startButton} onPress={startDeliveryTracking}>
              <Text style={styles.buttonText}>开始 {trackingDuration}分钟 配送模拟</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.stopButton} onPress={stopDeliveryTracking}>
              <Text style={styles.buttonText}>停止配送跟踪</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  statusContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  etaText: {
    color: 'white',
    fontSize: 14,
    marginTop: 5,
  },
  routeSelector: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  routeSelectorTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
    fontSize: 16,
  },
  routeOption: {
    padding: 12,
    backgroundColor: 'transparent',
    borderRadius: 5,
    marginVertical: 2,
  },
  selectedRouteOption: {
    backgroundColor: '#E3F2FD',
  },
  routeOptionText: {
    fontSize: 14,
  },
  controlButtons: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
  },
  startButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  stopButton: {
    backgroundColor: '#F44336',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  deliveryMarker: {
    backgroundColor: '#4CAF50',
    padding: 8,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'white',
    shadowOpacity: 0.5,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 8,
    minWidth: 40,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deliveryMarkerText: {
    fontSize: 20,
    textAlign: 'center',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 10,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 3,
  },
  progressText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    minWidth: 35,
    textAlign: 'right',
  },
});

export default EnhancedRouteMapView;