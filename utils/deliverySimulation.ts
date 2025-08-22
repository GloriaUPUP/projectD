export interface DeliveryProgress {
  orderId: string;
  currentLocation: { latitude: number; longitude: number };
  progress: number; // 0-100
  estimatedTime: number; // minutes
  status: 'picked_up' | 'in_transit' | 'near_destination' | 'delivered';
  route: { latitude: number; longitude: number }[];
}

import { routeAPI } from '../services/api';
import polyline from '@mapbox/polyline';

export interface SimulationConfig {
  orderId: string;
  startLocation: { lat: number; lng: number };
  endLocation: { lat: number; lng: number };
  totalTimeMinutes?: number;
  updateIntervalMs?: number;
  // New fields for real address-based simulation
  originAddress?: string;
  destinationAddress?: string;
  useRealRoute?: boolean;
  // New fields for speed-based time calculation
  vehicleType?: 'robot' | 'drone';
  useSpeedBasedTime?: boolean;
}

export class DeliverySimulator {
  private simulations: Map<string, any> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;
  private callbacks: Map<string, (deliveries: DeliveryProgress[]) => void> = new Map();

  // Vehicle speed configuration (km/h)
  private static readonly VEHICLE_SPEEDS = {
    robot: 15,   // 机器人速度 15 km/h
    drone: 45    // 无人机速度 45 km/h
  };

  constructor(private updateIntervalMs: number = 2000) {}

  // Calculate delivery time based on distance and vehicle speed
  private static calculateDeliveryTime(distanceKm: number, vehicleType: 'robot' | 'drone'): number {
    const speed = this.VEHICLE_SPEEDS[vehicleType];
    
    // Calculate base travel time in hours
    const baseTimeHours = distanceKm / speed;
    
    // Convert to minutes
    const baseTimeMinutes = Math.ceil(baseTimeHours * 60);
    
    // Add buffer time for preparation and delivery (5-10 minutes)
    const bufferMinutes = Math.max(5, Math.min(10, Math.floor(baseTimeMinutes / 10)));
    
    // Total time with minimum of 15 minutes and maximum of 120 minutes
    const totalMinutes = baseTimeMinutes + bufferMinutes;
    return Math.max(15, Math.min(120, totalMinutes));
  }

  // Decode Google polyline to get route points using Mapbox library
  private static decodePolyline(encoded: string): { lat: number; lng: number }[] {
    try {
      const decoded = polyline.decode(encoded);
      return decoded.map(([lat, lng]) => ({ lat, lng }));
    } catch (error) {
      console.error('Failed to decode polyline:', error);
      return [];
    }
  }

  // Get real route points from backend API
  private static async getRealRoutePoints(originAddress: string, destinationAddress: string): Promise<{ lat: number; lng: number }[]> {
    try {
      const routeResponse = await routeAPI.calculateRoute(originAddress, destinationAddress);
      
      if (!routeResponse.success || !routeResponse.data) {
        throw new Error('Failed to get route data');
      }

      const routeData = routeResponse.data;
      
      // If we have encoded polyline, decode it
      if (routeData.polyline) {
        const points = this.decodePolyline(routeData.polyline);
        // Sample points if there are too many (for performance)
        if (points.length > 50) {
          const step = Math.floor(points.length / 50);
          return points.filter((_, index) => index % step === 0);
        }
        return points;
      }
      
      // Fallback to start/end points if no polyline
      if (routeData.startLocation && routeData.endLocation) {
        return [
          { lat: routeData.startLocation.lat, lng: routeData.startLocation.lng },
          { lat: routeData.endLocation.lat, lng: routeData.endLocation.lng }
        ];
      }
      
      throw new Error('No route data available');
      
    } catch (error) {
      console.error('Failed to get real route points:', error);
      throw error;
    }
  }

  // 生成路线点（模拟真实路线）
  private static generateRoutePoints(start: { lat: number; lng: number }, end: { lat: number; lng: number }, numPoints: number = 30): { lat: number; lng: number }[] {
    const points = [];
    
    // 添加起点
    points.push({ ...start });
    
    // 生成中间点（添加一些随机性模拟真实路线）
    for (let i = 1; i < numPoints - 1; i++) {
      const ratio = i / (numPoints - 1);
      
      // 基础线性插值
      let lat = start.lat + (end.lat - start.lat) * ratio;
      let lng = start.lng + (end.lng - start.lng) * ratio;
      
      // 添加一些曲线效果，模拟真实道路
      const curveOffset = Math.sin(ratio * Math.PI) * 0.002; // 0.002度的曲线偏移
      lat += curveOffset;
      lng += curveOffset * 0.5;
      
      // 添加轻微的随机偏移模拟交通
      const randomOffset = (Math.random() - 0.5) * 0.0005;
      lat += randomOffset;
      lng += randomOffset;
      
      points.push({ lat, lng });
    }
    
    // 添加终点
    points.push({ ...end });
    
    return points;
  }

  // 根据进度获取状态
  private static getStatusByProgress(progress: number): DeliveryProgress['status'] {
    if (progress < 10) return 'picked_up';
    if (progress < 85) return 'in_transit';
    if (progress < 100) return 'near_destination';
    return 'delivered';
  }

  // 计算两点间距离（简单计算）
  private static calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
    const R = 6371; // 地球半径（公里）
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // 创建新的配送模拟
  createDeliverySimulation(config: SimulationConfig): string {
    this.createDeliverySimulationAsync(config);
    return config.orderId;
  }

  // 异步版本支持真实地址
  async createDeliverySimulationAsync(config: SimulationConfig): Promise<void> {
    const {
      orderId,
      startLocation,
      endLocation,
      totalTimeMinutes = 30,
      originAddress,
      destinationAddress,
      useRealRoute = false,
      vehicleType = 'robot',
      useSpeedBasedTime = false,
    } = config;

    let routePoints: { lat: number; lng: number }[];
    
    try {
      // If real addresses are provided and useRealRoute is true, get real route points
      if (useRealRoute && originAddress && destinationAddress) {
        console.log(`Getting real route for ${originAddress} to ${destinationAddress}`);
        routePoints = await DeliverySimulator.getRealRoutePoints(originAddress, destinationAddress);
        console.log(`Got ${routePoints.length} real route points`);
      } else {
        // Fall back to fake route generation
        routePoints = DeliverySimulator.generateRoutePoints(startLocation, endLocation);
      }
    } catch (error) {
      console.warn('Failed to get real route, falling back to fake route:', error);
      routePoints = DeliverySimulator.generateRoutePoints(startLocation, endLocation);
    }
    
    const totalDistance = DeliverySimulator.calculateDistance(
      routePoints[0] || startLocation,
      routePoints[routePoints.length - 1] || endLocation
    );
    
    // Calculate actual delivery time if using speed-based calculation
    let actualDeliveryTime = totalTimeMinutes;
    if (useSpeedBasedTime) {
      actualDeliveryTime = DeliverySimulator.calculateDeliveryTime(totalDistance, vehicleType);
      console.log(`Speed-based time calculation: ${totalDistance.toFixed(2)}km with ${vehicleType} = ${actualDeliveryTime} minutes`);
    }
    
    const simulation = {
      orderId,
      routePoints,
      currentPointIndex: 0,
      totalTimeMinutes: actualDeliveryTime,
      totalDistance,
      startTime: Date.now(),
      isCompleted: false,
      isRealRoute: useRealRoute && originAddress && destinationAddress,
      vehicleType,
      speedKmh: DeliverySimulator.VEHICLE_SPEEDS[vehicleType],
      
      getCurrentProgress: (): DeliveryProgress => {
        const { currentPointIndex, routePoints, totalTimeMinutes, startTime } = simulation;
        const progress = Math.round((currentPointIndex / (routePoints.length - 1)) * 100);
        const elapsedMinutes = (Date.now() - startTime) / (1000 * 60);
        const estimatedTime = Math.max(0, Math.round(totalTimeMinutes - elapsedMinutes));
        
        return {
          orderId,
          currentLocation: { 
            latitude: routePoints[currentPointIndex].lat, 
            longitude: routePoints[currentPointIndex].lng 
          },
          progress,
          estimatedTime,
          status: DeliverySimulator.getStatusByProgress(progress),
          route: routePoints.map(point => ({ latitude: point.lat, longitude: point.lng }))
        };
      },
      
      advance: (): boolean => {
        if (simulation.currentPointIndex < simulation.routePoints.length - 1) {
          simulation.currentPointIndex++;
          return true;
        } else {
          simulation.isCompleted = true;
          return false;
        }
      }
    };

    this.simulations.set(orderId, simulation);
    this.startUpdateLoop();
  }

  // 便捷方法：基于真实地址创建配送模拟
  async createRealAddressSimulation(
    orderId: string,
    originAddress: string,
    destinationAddress: string,
    totalTimeMinutes: number = 30
  ): Promise<void> {
    return this.createDeliverySimulationAsync({
      orderId,
      startLocation: { lat: 0, lng: 0 }, // Will be replaced with real data
      endLocation: { lat: 0, lng: 0 },   // Will be replaced with real data
      originAddress,
      destinationAddress,
      useRealRoute: true,
      totalTimeMinutes
    });
  }

  // 便捷方法：基于速度创建配送模拟
  async createSpeedBasedSimulation(
    orderId: string,
    originAddress: string,
    destinationAddress: string,
    vehicleType: 'robot' | 'drone' = 'robot'
  ): Promise<void> {
    return this.createDeliverySimulationAsync({
      orderId,
      startLocation: { lat: 0, lng: 0 }, // Will be replaced with real data
      endLocation: { lat: 0, lng: 0 },   // Will be replaced with real data
      originAddress,
      destinationAddress,
      useRealRoute: true,
      useSpeedBasedTime: true,
      vehicleType
    });
  }

  // 删除配送模拟
  removeDeliverySimulation(orderId: string): boolean {
    const removed = this.simulations.delete(orderId);
    
    if (this.simulations.size === 0) {
      this.stopUpdateLoop();
    }
    
    return removed;
  }

  // 获取所有活跃配送
  getAllActiveDeliveries(): DeliveryProgress[] {
    const deliveries: DeliveryProgress[] = [];
    
    this.simulations.forEach((simulation) => {
      if (!simulation.isCompleted) {
        deliveries.push(simulation.getCurrentProgress());
      }
    });
    
    return deliveries;
  }

  // 订阅配送更新
  subscribe(key: string, callback: (deliveries: DeliveryProgress[]) => void): void {
    this.callbacks.set(key, callback);
  }

  // 取消订阅
  unsubscribe(key: string): void {
    this.callbacks.delete(key);
  }

  // 开始更新循环
  private startUpdateLoop(): void {
    if (this.updateInterval) return;
    
    this.updateInterval = setInterval(() => {
      let hasActiveDeliveries = false;
      const completedDeliveries: string[] = [];
      
      // 更新所有模拟
      this.simulations.forEach((simulation, orderId) => {
        if (!simulation.isCompleted) {
          const hasMore = simulation.advance();
          if (hasMore) {
            hasActiveDeliveries = true;
          } else {
            completedDeliveries.push(orderId);
          }
        }
      });
      
      // 移除已完成的配送
      completedDeliveries.forEach(orderId => {
        this.simulations.delete(orderId);
      });
      
      // 通知所有订阅者
      const activeDeliveries = this.getAllActiveDeliveries();
      this.callbacks.forEach((callback) => {
        callback(activeDeliveries);
      });
      
      // 如果没有活跃配送，停止更新循环
      if (!hasActiveDeliveries) {
        this.stopUpdateLoop();
      }
    }, this.updateIntervalMs);
  }

  // 停止更新循环
  private stopUpdateLoop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  // 清理所有模拟
  cleanup(): void {
    this.stopUpdateLoop();
    this.simulations.clear();
    this.callbacks.clear();
  }

  // 获取预定义的测试路线
  static getTestRoutes() {
    return {
      // 旧金山市区路线 - 使用真实地址
      sanFrancisco: [
        {
          name: "Downtown to Mission Bay",
          originAddress: "Union Square, San Francisco, CA",
          destinationAddress: "Mission Bay, San Francisco, CA",
          start: { lat: 37.7749, lng: -122.4194 },
          end: { lat: 37.7677, lng: -122.3958 }
        },
        {
          name: "Mission Bay to Financial District", 
          originAddress: "Mission Bay, San Francisco, CA",
          destinationAddress: "Financial District, San Francisco, CA",
          start: { lat: 37.7677, lng: -122.3958 },
          end: { lat: 37.7930, lng: -122.3978 }
        },
        {
          name: "Financial District to SOMA",
          originAddress: "Financial District, San Francisco, CA", 
          destinationAddress: "SOMA, San Francisco, CA",
          start: { lat: 37.7930, lng: -122.3978 },
          end: { lat: 37.7855, lng: -122.3967 }
        },
        {
          name: "Real Address Test - Short Distance",
          originAddress: "1 Market Street, San Francisco, CA",
          destinationAddress: "100 Market Street, San Francisco, CA",
          start: { lat: 37.7938, lng: -122.3951 },
          end: { lat: 37.7937, lng: -122.3930 }
        },
        {
          name: "Real Address Test - Medium Distance",
          originAddress: "Pier 39, San Francisco, CA",
          destinationAddress: "Golden Gate Park, San Francisco, CA",
          start: { lat: 37.8087, lng: -122.4098 },
          end: { lat: 37.7694, lng: -122.4862 }
        },
        {
          name: "Daly City to San Bruno",
          originAddress: "Daly City, CA",
          destinationAddress: "San Bruno, CA",
          start: { lat: 37.6879, lng: -122.4702 },
          end: { lat: 37.6305, lng: -122.4111 }
        },
        {
          name: "San Francisco to Daly City",
          originAddress: "Downtown San Francisco, CA",
          destinationAddress: "Daly City, CA", 
          start: { lat: 37.7749, lng: -122.4194 },
          end: { lat: 37.6879, lng: -122.4702 }
        }
      ]
    };
  }
}

// 创建全局单例实例
export const deliverySimulator = new DeliverySimulator(2000); // 每2秒更新一次