import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import EnhancedRouteMapView from '../../components/EnhancedRouteMapView';

const MapTestScreen = () => {
  const [origin, setOrigin] = useState('Mountain View, CA');
  const [destination, setDestination] = useState('Palo Alto, CA');
  const [orderId, setOrderId] = useState('TEST_ORDER_001');
  const [showMap, setShowMap] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(true);
  const [enableTracking, setEnableTracking] = useState(true);
  const [autoStart, setAutoStart] = useState(false);
  const [trackingDuration, setTrackingDuration] = useState('3');
  const [routeInfo, setRouteInfo] = useState<any>(null);
  const [trackingUpdates, setTrackingUpdates] = useState<any[]>([]);

  const testRoute = () => {
    if (!origin || !destination) {
      Alert.alert('错误', '请输入起点和终点地址');
      return;
    }
    setShowMap(true);
    setTrackingUpdates([]); // 清空之前的跟踪记录
  };

  const handleRouteCalculated = (info: any) => {
    setRouteInfo(info);
    console.log('路径计算完成:', info);
  };

  const handleTrackingUpdate = (update: any) => {
    setTrackingUpdates(prev => [update, ...prev.slice(0, 9)]); // 保留最新10条记录
    console.log('跟踪更新:', update);
  };

  const generateRandomOrderId = () => {
    const randomId = 'ORDER_' + Math.random().toString(36).substr(2, 8).toUpperCase();
    setOrderId(randomId);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>🗺️ 实时配送地图测试</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>起点地址:</Text>
          <TextInput
            style={styles.input}
            value={origin}
            onChangeText={setOrigin}
            placeholder="输入起点地址"
          />
          
          <Text style={styles.label}>终点地址:</Text>
          <TextInput
            style={styles.input}
            value={destination}
            onChangeText={setDestination}
            placeholder="输入终点地址"
          />
          
          <Text style={styles.label}>订单ID:</Text>
          <View style={styles.orderIdContainer}>
            <TextInput
              style={[styles.input, styles.orderIdInput]}
              value={orderId}
              onChangeText={setOrderId}
              placeholder="输入订单ID"
            />
            <TouchableOpacity style={styles.generateButton} onPress={generateRandomOrderId}>
              <Text style={styles.generateButtonText}>随机生成</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.label}>配送时长 (分钟):</Text>
          <TextInput
            style={styles.input}
            value={trackingDuration}
            onChangeText={setTrackingDuration}
            placeholder="配送时长（分钟）"
            keyboardType="numeric"
          />
          
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>显示备选路径:</Text>
            <Switch
              value={showAlternatives}
              onValueChange={setShowAlternatives}
            />
          </View>
          
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>启用实时跟踪:</Text>
            <Switch
              value={enableTracking}
              onValueChange={setEnableTracking}
            />
          </View>
          
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>自动开始配送:</Text>
            <Switch
              value={autoStart}
              onValueChange={setAutoStart}
            />
          </View>
          
          <TouchableOpacity style={styles.button} onPress={testRoute}>
            <Text style={styles.buttonText}>
              {showMap ? '重新计算路径' : '🚀 开始GPS模拟'}
            </Text>
          </TouchableOpacity>
        </View>

        {routeInfo && (
          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>📍 路径信息:</Text>
            <Text style={styles.infoText}>距离: {routeInfo.distance}</Text>
            <Text style={styles.infoText}>时间: {routeInfo.duration}</Text>
            {routeInfo.alternatives && (
              <Text style={styles.infoText}>
                备选路径: {routeInfo.alternatives.length} 条
              </Text>
            )}
          </View>
        )}

        {trackingUpdates.length > 0 && (
          <View style={styles.trackingContainer}>
            <Text style={styles.trackingTitle}>📡 实时跟踪记录:</Text>
            {trackingUpdates.map((update, index) => (
              <View key={index} style={styles.trackingItem}>
                <Text style={styles.trackingTime}>
                  {new Date(update.timestamp).toLocaleTimeString()}
                </Text>
                <Text style={styles.trackingMessage}>{update.message}</Text>
                <Text style={styles.trackingStatus}>状态: {update.status}</Text>
                {update.eta && (
                  <Text style={styles.trackingEta}>ETA: {update.eta}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {showMap && (
          <View style={styles.mapContainer}>
            <Text style={styles.mapTitle}>🗺️ 实时配送地图:</Text>
            <EnhancedRouteMapView
              origin={origin}
              destination={destination}
              orderId={orderId}
              showAlternatives={showAlternatives}
              enableRealTimeTracking={enableTracking}
              autoStartTracking={autoStart}
              trackingDuration={parseInt(trackingDuration) || 3}
              style={styles.map}
              onRouteCalculated={handleRouteCalculated}
              onTrackingUpdate={handleTrackingUpdate}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
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
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
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
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  orderIdInput: {
    flex: 1,
    marginBottom: 0,
    marginRight: 10,
  },
  generateButton: {
    backgroundColor: '#FF9800',
    padding: 12,
    borderRadius: 8,
  },
  generateButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#4285F4',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
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
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
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
  trackingContainer: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 10,
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  trackingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  trackingItem: {
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  trackingTime: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
  },
  trackingMessage: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  trackingStatus: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  trackingEta: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginTop: 2,
  },
  mapContainer: {
    height: 500,
    margin: 10,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: 'white',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  mapTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    padding: 10,
    backgroundColor: '#f0f0f0',
    color: '#333',
  },
  map: {
    flex: 1,
  },
});

export default MapTestScreen;