import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import RouteMapView from '../components/RouteMapView';
import { routeAPI } from '../services/api';

const RouteTestScreen: React.FC = () => {
  const [origin, setOrigin] = useState('1600 Amphitheatre Parkway, Mountain View, CA');
  const [destination, setDestination] = useState('1 Hacker Way, Menlo Park, CA');
  const [routeInfo, setRouteInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // 预设的测试地址
  const presetRoutes = [
    {
      name: 'Google to Facebook',
      origin: '1600 Amphitheatre Parkway, Mountain View, CA',
      destination: '1 Hacker Way, Menlo Park, CA',
    },
    {
      name: 'SF Downtown',
      origin: 'Union Square, San Francisco, CA',
      destination: 'Fishermans Wharf, San Francisco, CA',
    },
    {
      name: 'SF to SFO',
      origin: 'San Francisco, CA',
      destination: 'San Francisco International Airport, CA',
    },
  ];

  const handleRouteCalculated = (info: any) => {
    setRouteInfo(info);
    console.log('路径计算完成:', info);
  };

  const testAPI = async () => {
    if (!origin || !destination) {
      Alert.alert('错误', '请输入起点和终点地址');
      return;
    }

    setLoading(true);
    try {
      // 测试后端API
      const response = await routeAPI.calculateRoute(origin, destination);
      console.log('API响应:', response);
      
      if (response.success) {
        Alert.alert('API测试成功', 
          `距离: ${response.data.distance}\n时间: ${response.data.duration}`
        );
      } else {
        Alert.alert('API测试失败', response.error || '未知错误');
      }
    } catch (error) {
      console.error('API测试错误:', error);
      Alert.alert('API测试失败', error.message);
    } finally {
      setLoading(false);
    }
  };

  const usePresetRoute = (preset: any) => {
    setOrigin(preset.origin);
    setDestination(preset.destination);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Google Maps 路径测试</Text>
      
      {/* 预设路线 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>快速测试路线:</Text>
        <View style={styles.presetContainer}>
          {presetRoutes.map((preset, index) => (
            <TouchableOpacity
              key={index}
              style={styles.presetButton}
              onPress={() => usePresetRoute(preset)}
            >
              <Text style={styles.presetText}>{preset.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 地址输入 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>自定义地址:</Text>
        
        <Text style={styles.label}>起点地址:</Text>
        <TextInput
          style={styles.input}
          value={origin}
          onChangeText={setOrigin}
          placeholder="输入起点地址"
          multiline
        />
        
        <Text style={styles.label}>终点地址:</Text>
        <TextInput
          style={styles.input}
          value={destination}
          onChangeText={setDestination}
          placeholder="输入终点地址"
          multiline
        />
        
        <TouchableOpacity
          style={styles.testButton}
          onPress={testAPI}
          disabled={loading}
        >
          <Text style={styles.testButtonText}>
            {loading ? '测试中...' : '测试后端API'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 路径信息显示 */}
      {routeInfo && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>路径信息:</Text>
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>距离: {routeInfo.distance}</Text>
            <Text style={styles.infoText}>时间: {routeInfo.duration}</Text>
            <Text style={styles.infoText}>起点: {routeInfo.startAddress}</Text>
            <Text style={styles.infoText}>终点: {routeInfo.endAddress}</Text>
            {routeInfo.alternatives && routeInfo.alternatives.length > 0 && (
              <Text style={styles.infoText}>
                备选路线: {routeInfo.alternatives.length} 条
              </Text>
            )}
          </View>
        </View>
      )}

      {/* 地图显示 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>路径地图:</Text>
        <View style={styles.mapContainer}>
          <RouteMapView
            origin={origin}
            destination={destination}
            showAlternatives={true}
            onRouteCalculated={handleRouteCalculated}
            style={styles.map}
          />
        </View>
      </View>
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
  section: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  presetContainer: {
    flexDirection: 'column',
    gap: 10,
  },
  presetButton: {
    backgroundColor: '#4285F4',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  presetText: {
    color: 'white',
    fontWeight: 'bold',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 10,
    marginBottom: 5,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  testButton: {
    backgroundColor: '#34A853',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  testButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  infoContainer: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#333',
  },
  mapContainer: {
    height: 300,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  map: {
    flex: 1,
  },
});

export default RouteTestScreen;