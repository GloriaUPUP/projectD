import React, { useRef, useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions,
  Platform,
  StatusBar,
  Animated,
  PanResponder,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useOrder } from '../../contexts/OrderContext';
import { theme } from '../../utils/theme';
import { Ionicons } from '@expo/vector-icons';
import GoogleMapView from '../../components/GoogleMapView';
import { apiService } from '../../services/api';
import EnhancedRouteMapView from '../../components/EnhancedRouteMapView';
import SimpleLogo from '../../assets/simple-logo';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const BOTTOM_SHEET_MAX_HEIGHT = screenHeight * 0.75;
const BOTTOM_SHEET_MIN_HEIGHT = screenHeight * 0.45;

interface HomeScreenProps {
  navigation: any;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { orders } = useOrder();
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [showRealTimeMap, setShowRealTimeMap] = useState(false);
  const [trackingUpdates, setTrackingUpdates] = useState<any[]>([]);
  const [currentETA, setCurrentETA] = useState<string>('');
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [isTrackingStarted, setIsTrackingStarted] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  // Bottom sheet animation
  const animatedValue = useRef(new Animated.Value(0)).current;
  const lastGestureDy = useRef(0);
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        animatedValue.setOffset(lastGestureDy.current);
      },
      onPanResponderMove: (e, gesture) => {
        const clampedValue = Math.max(
          0,
          Math.min(BOTTOM_SHEET_MAX_HEIGHT - BOTTOM_SHEET_MIN_HEIGHT, gesture.dy)
        );
        animatedValue.setValue(clampedValue);
      },
      onPanResponderRelease: (e, gesture) => {
        animatedValue.flattenOffset();
        lastGestureDy.current += gesture.dy;
        
        const threshold = BOTTOM_SHEET_MIN_HEIGHT + (BOTTOM_SHEET_MAX_HEIGHT - BOTTOM_SHEET_MIN_HEIGHT) * 0.3;
        
        if (gesture.dy > 0) {
          // Dragging down
          if (lastGestureDy.current < threshold) {
            springAnimation('up');
          } else {
            springAnimation('down');
          }
        } else {
          // Dragging up  
          if (lastGestureDy.current > threshold) {
            springAnimation('down');
          } else {
            springAnimation('up');
          }
        }
      },
    })
  ).current;

  const springAnimation = (direction: 'up' | 'down') => {
    const targetValue = direction === 'down' 
      ? BOTTOM_SHEET_MAX_HEIGHT - BOTTOM_SHEET_MIN_HEIGHT 
      : 0;
    lastGestureDy.current = targetValue;
    Animated.spring(animatedValue, {
      toValue: targetValue,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };


  // 检查是否有进行中的订单
  const checkActiveOrder = () => {
    // 查找最新的进行中订单
    const inProgressOrder = orders.find(order => 
      order.status === 'in_transit' || 
      order.status === 'confirmed' || 
      order.status === 'picked_up'
    );
    
    if (inProgressOrder && inProgressOrder.id !== activeOrder?.id && !isTrackingStarted) {
      setActiveOrder(inProgressOrder);
      startRealTimeTracking(inProgressOrder);
    }
  };

  const handleTrackingUpdate = (update: any) => {
    console.log('🏠 HomeScreen received tracking update:', update);
    
    // 检查是否来自当前活跃会话
    if (currentSessionId && update.sessionId && update.sessionId !== currentSessionId) {
      console.log('❌ Ignoring update from old session:', update.sessionId);
      return;
    }
    
    // 如果没有会话ID，但有活跃订单，且订单ID不匹配，则忽略
    if (!update.sessionId && activeOrder && update.orderId !== activeOrder.id) {
      console.log('❌ Ignoring update from different order:', update.orderId);
      return;
    }
    
    // Ensure update has required properties
    const validUpdate = {
      orderId: update.orderId || '',
      status: update.status || 'unknown',
      message: update.message || 'Tracking update',
      timestamp: update.timestamp || new Date().toLocaleTimeString(),
      eta: update.eta || '',
      progress: typeof update.progress === 'number' ? update.progress : 0,
      sessionId: update.sessionId
    };
    
    // 对于同一个 sessionId，只保留最新的一条记录
    setTrackingUpdates(prev => {
      // 移除同一 sessionId 的旧记录
      const filteredPrev = prev.filter(p => p.sessionId !== validUpdate.sessionId);
      // 只保留最新的一条记录
      return [validUpdate];
    });
    
    if (validUpdate.eta) {
      setCurrentETA(validUpdate.eta);
    }
  };

  const startRealTimeTracking = (order: any) => {
    if (!order || isTrackingStarted) return;
    
    console.log('🚀 Starting real-time tracking for order:', order.id);
    
    // 停止之前的跟踪（如果有）
    if (currentSessionId) {
      console.log('🛑 Stopping previous tracking session:', currentSessionId);
    }
    
    setIsTrackingStarted(true);
    
    // 设置新的会话ID
    const newSessionId = `${order.id}-${Date.now()}`;
    setCurrentSessionId(newSessionId);
    
    const origin = order.sender.address || order.sender.name;
    const destination = order.recipient.address || order.recipient.name;
    
    setShowRealTimeMap(true);
    
    // 清空之前的更新记录
    setTrackingUpdates([]);
    setCurrentETA('计算中...');
    
    console.log('🗺️ Map will handle the tracking updates automatically. Session:', newSessionId);
  };

  useEffect(() => {
    // 检查是否有活跃订单
    checkActiveOrder();
    
    // 定期检查订单状态，但减少频率避免重复启动
    const interval = setInterval(checkActiveOrder, 30000); // 30秒检查一次而不是10秒
    
    return () => {
      clearInterval(interval);
      // 清理跟踪状态
      setIsTrackingStarted(false);
      setCurrentSessionId(null);
    };
  }, [orders, isTrackingStarted]);

  const bottomSheetAnimation = {
    transform: [
      {
        translateY: animatedValue.interpolate({
          inputRange: [0, BOTTOM_SHEET_MAX_HEIGHT - BOTTOM_SHEET_MIN_HEIGHT],
          outputRange: [0, BOTTOM_SHEET_MAX_HEIGHT - BOTTOM_SHEET_MIN_HEIGHT],
          extrapolate: 'clamp',
        }),
      },
    ],
  };


  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Google Maps */}
      <View style={styles.mapContainer}>
        {showRealTimeMap && activeOrder ? (
          <EnhancedRouteMapView
            origin={activeOrder.sender.address || activeOrder.sender.name}
            destination={activeOrder.recipient.address || activeOrder.recipient.name}
            orderId={activeOrder.id}
            onTrackingUpdate={handleTrackingUpdate}
            enableRealTimeTracking={true}
            autoStartTracking={true}
            trackingDuration={3}
            showAlternatives={false}
            style={styles.mapPlaceholder}
          />
        ) : (
          <GoogleMapView
            userLocation={{ lat: 37.7749, lng: -122.4194 }}
            stations={[
              { lat: 37.7677, lng: -122.3958, name: 'Mission Bay Station' },
              { lat: 37.7930, lng: -122.3978, name: 'Financial District Station' },
              { lat: 37.7855, lng: -122.3967, name: 'SOMA Station' },
            ]}
            activeDeliveries={[]}
            style={styles.mapPlaceholder}
          />
        )}

        {/* Map Controls */}
        <SafeAreaView style={styles.mapOverlay}>
          <View style={styles.mapHeader}>
            <TouchableOpacity 
              style={styles.menuButton}
              onPress={() => navigation.openDrawer()}
            >
              <Ionicons name="menu" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
            
            <View style={styles.headerLogo}>
              <SimpleLogo size={40} />
            </View>
            
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => navigation.navigate('Profile')}
            >
              <View style={styles.profileAvatar}>
                <Text style={styles.profileInitial}>
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      {/* Bottom Sheet */}
      <Animated.View 
        style={[styles.bottomSheet, bottomSheetAnimation]}
        {...panResponder.panHandlers}
      >
        {/* Drag Handle */}
        <View style={styles.dragHandle} />
        
        {/* Main Action */}
        <View style={styles.mainAction}>
          <Text style={styles.mainActionTitle}>Where to?</Text>
          <TouchableOpacity 
            style={styles.searchBar}
            onPress={() => navigation.navigate('OrderStep1')}
          >
            <Ionicons name="search" size={20} color={theme.colors.text.tertiary} />
            <Text style={styles.searchPlaceholder}>Enter pickup and delivery addresses</Text>
          </TouchableOpacity>
        </View>

        {/* Service Options */}
        <ScrollView 
          style={styles.serviceList}
          showsVerticalScrollIndicator={false}
        >
          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <Text style={styles.sectionTitle}>Quick actions</Text>
            <View style={styles.quickActionRow}>
              <TouchableOpacity 
                style={styles.quickActionButton}
                onPress={() => navigation.navigate('MyParcels')}
              >
                <Ionicons name="cube-outline" size={20} color={theme.colors.primary} />
                <Text style={styles.quickActionText}>Track</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quickActionButton}
                onPress={() => navigation.navigate('OrderStep1')}
              >
                <Ionicons name="add-outline" size={20} color={theme.colors.primary} />
                <Text style={styles.quickActionText}>Send</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quickActionButton}
                onPress={() => navigation.navigate('Support')}
              >
                <Ionicons name="help-circle-outline" size={20} color={theme.colors.primary} />
                <Text style={styles.quickActionText}>Support</Text>
              </TouchableOpacity>
            </View>
          </View>



          {/* Live Tracking Updates */}
          {activeOrder && trackingUpdates.length > 0 && (
            <View style={styles.activeDeliveries}>
              <Text style={styles.sectionTitle}>📍 Live Tracking - Order #{activeOrder.id}</Text>
              <View style={styles.orderSummary}>
                <Text style={styles.orderRoute}>
                  From: {activeOrder.sender?.address || activeOrder.sender?.name || 'Unknown'}
                </Text>
                <Text style={styles.orderRoute}>
                  To: {activeOrder.recipient?.address || activeOrder.recipient?.name || 'Unknown'}
                </Text>
                <Text style={styles.orderEta}>
                  ETA: {currentETA || 'Calculating...'}
                </Text>
              </View>
              
              {trackingUpdates.slice(0, 3).map((update, index) => (
                <View key={`tracking-${index}-${update.orderId}`} style={styles.trackingUpdateCard}>
                  <View style={styles.updateIcon}>
                    <Ionicons 
                      name="location" 
                      size={16} 
                      color={theme.colors.primary} 
                    />
                  </View>
                  <View style={styles.updateInfo}>
                    <Text style={styles.updateMessage}>{update.message || 'Update'}</Text>
                    <Text style={styles.updateTime}>{update.timestamp || ''}</Text>
                  </View>
                  {(update.progress !== undefined && update.progress !== null) && (
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBar}>
                        <View 
                          style={[
                            styles.progressFill, 
                            { 
                              width: `${update.progress}%`,
                              backgroundColor: theme.colors.primary
                            }
                          ]} 
                        />
                      </View>
                      <Text style={styles.progressText}>{update.progress}%</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Recent Activity */}
          {orders.length > 0 && (
            <View style={styles.recentActivity}>
              <Text style={styles.sectionTitle}>Recent deliveries</Text>
              {orders.slice(0, 2).map((order) => (
                <TouchableOpacity
                  key={order.id}
                  style={styles.recentCard}
                  onPress={() => navigation.navigate('Tracking', { orderId: order.id })}
                >
                  <View style={styles.recentIcon}>
                    <Ionicons 
                      name={order.status === 'in_transit' ? "car" : "time-outline"} 
                      size={20} 
                      color={order.status === 'in_transit' ? theme.colors.primary : theme.colors.text.secondary} 
                    />
                  </View>
                  <View style={styles.recentInfo}>
                    <Text style={styles.recentAddress}>
                      {order.recipient.address}
                    </Text>
                    <Text style={styles.recentDate}>
                      {order.createdAt.toLocaleDateString()} • {order.status}
                    </Text>
                  </View>
                  <Ionicons 
                    name="chevron-forward" 
                    size={20} 
                    color={theme.colors.text.tertiary} 
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  mapContainer: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    position: 'relative',
  },
  mapGrid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'column',
    justifyContent: 'space-evenly',
  },
  mapGridHorizontal: {
    flexDirection: 'row',
  },
  mapLine: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: '#E8E8E8',
  },
  locationMarker: {
    position: 'absolute',
    backgroundColor: theme.colors.background.primary,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    ...theme.shadows.md,
  },
  userLocation: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.accent.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userLocationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.background.primary,
  },
  mapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  headerLogo: {
    flex: 1,
    alignItems: 'center',
  },
  menuButton: {
    width: 44,
    height: 44,
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.md,
  },
  profileButton: {
    width: 44,
    height: 44,
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.md,
  },
  profileAvatar: {
    width: 36,
    height: 36,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: BOTTOM_SHEET_MAX_HEIGHT,
    backgroundColor: theme.colors.background.primary,
    borderTopLeftRadius: theme.borderRadius['2xl'],
    borderTopRightRadius: theme.borderRadius['2xl'],
    ...theme.shadows.xl,
    overflow: 'hidden',
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.border.medium,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  mainAction: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  mainActionTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.md,
  },
  searchPlaceholder: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.tertiary,
  },
  serviceList: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  quickActions: {
    marginTop: theme.spacing['2xl'],
    marginBottom: theme.spacing.xl,
  },
  quickActionRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  quickActionText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  recentActivity: {
    marginBottom: theme.spacing['6xl'],
  },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  recentIcon: {
    width: 40,
    height: 40,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  recentInfo: {
    flex: 1,
  },
  recentAddress: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  recentDate: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.tertiary,
    marginTop: 2,
  },
  activeDeliveries: {
    marginBottom: theme.spacing.xl,
  },
  orderSummary: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  orderRoute: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  orderEta: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.primary,
    marginTop: 4,
  },
  trackingUpdateCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
  },
  updateIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  updateInfo: {
    flex: 1,
  },
  updateMessage: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  updateTime: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
  },
  progressContainer: {
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  progressText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  progressBar: {
    width: 60,
    height: 6,
    backgroundColor: '#E5E5E5',
    borderRadius: 3,
    marginLeft: theme.spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
});

export default HomeScreen;