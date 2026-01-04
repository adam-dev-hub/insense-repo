import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Animated } from 'react-native';
import { WebView } from 'react-native-webview';
import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

// Farm center (Tunis, Tunisia coordinates)
const FARM_CENTER = {
  latitude: 36.0993,
  longitude: 9.5811,
};

const SAFE_RADIUS = 500; // 500 meters radius

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function MapScreen() {
  const router = useRouter();
  
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sound, setSound] = useState();
  const [geofenceRadius, setGeofenceRadius] = useState(SAFE_RADIUS);
  const [alertedAnimals, setAlertedAnimals] = useState(new Set());
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [isPanelExpanded, setIsPanelExpanded] = useState(true);
  const webviewRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const panelHeight = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const init = async () => {
      await requestNotificationPermissions();
      await fetchAnimalLocations();
      setLoading(false);
    };
    
    init();
    
    const interval = setInterval(fetchAnimalLocations, 3000);
    
    // Pulse animation for alert
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    return () => {
      clearInterval(interval);
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  const togglePanel = () => {
    const toValue = isPanelExpanded ? 0 : 1;
    setIsPanelExpanded(!isPanelExpanded);
    
    Animated.spring(panelHeight, {
      toValue,
      useNativeDriver: false,
      tension: 50,
      friction: 8
    }).start();
  };

  useEffect(() => {
    if (webviewRef.current && animals.length > 0) {
      updateMapMarkers();
    }
  }, [animals, geofenceRadius]);

  const requestNotificationPermissions = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('Notification permissions not granted');
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
    }
  };

  const fetchAnimalLocations = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('animals_data');
      
      if (!jsonValue) {
        console.log('No animal data in storage');
        return;
      }
      
      const localAnimals = JSON.parse(jsonValue);
      
      // Validate and sanitize animal data
      const validAnimals = localAnimals.filter(animal => {
        if (!animal || !animal.location) return false;
        
        const lat = parseFloat(animal.location.latitude);
        const lon = parseFloat(animal.location.longitude);
        
        return !isNaN(lat) && !isNaN(lon) && 
               lat >= -90 && lat <= 90 && 
               lon >= -180 && lon <= 180;
      }).map(animal => ({
        ...animal,
        location: {
          latitude: parseFloat(animal.location.latitude),
          longitude: parseFloat(animal.location.longitude)
        }
      }));
      
      console.log(`Loaded ${validAnimals.length} valid animals`);
      
      if (validAnimals.length > 0) {
        setAnimals(validAnimals);
        
        // Check geofence for each animal
        validAnimals.forEach(animal => {
          checkGeofence(animal);
        });
      }
    } catch (error) {
      console.error('Error reading local animals:', error);
    }
  };

  const updateMapMarkers = () => {
    if (!webviewRef.current) return;
    
    const markersData = animals.map(animal => {
      const distance = calculateDistance(
        FARM_CENTER.latitude,
        FARM_CENTER.longitude,
        animal.location.latitude,
        animal.location.longitude
      );
      const isOutside = distance > geofenceRadius;
      
      return {
        id: animal.id,
        lat: animal.location.latitude,
        lng: animal.location.longitude,
        name: animal.name,
        breed: animal.breed,
        type: animal.type,
        distance: Math.round(distance),
        isOutside
      };
    });

    const jsCode = `
      if (typeof updateMarkers === 'function') {
        updateMarkers(${JSON.stringify(markersData)}, ${geofenceRadius});
      }
    `;
    
    webviewRef.current.injectJavaScript(jsCode);
  };

  const checkGeofence = (animal) => {
    try {
      const distance = calculateDistance(
        FARM_CENTER.latitude,
        FARM_CENTER.longitude,
        animal.location.latitude,
        animal.location.longitude
      );
      
      if (distance > geofenceRadius && !alertedAnimals.has(animal.id)) {
        triggerSecurityAlert(animal, distance);
        setAlertedAnimals(prev => new Set(prev).add(animal.id));
      } else if (distance <= geofenceRadius) {
        setAlertedAnimals(prev => {
          const newSet = new Set(prev);
          newSet.delete(animal.id);
          return newSet;
        });
      }
    } catch (error) {
      console.error('Error checking geofence:', error);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  const triggerSecurityAlert = async (animal, distance) => {
    try {
      await playAlertSound();
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🚨 Security Breach Detected',
          body: `${animal.name} has left the safe zone! Currently ${Math.round(distance)}m from farm center.`,
          data: { animalId: animal.id },
          sound: true,
        },
        trigger: null,
      });
      
    } catch (error) {
      console.error('Error triggering alert:', error);
    }
  };

  const playAlertSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' },
        { shouldPlay: true, isLooping: false, volume: 1.0 }
      );
      setSound(sound);
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  const centerOnAnimal = (animal) => {
    if (!webviewRef.current || !animal?.location) return;
    
    setSelectedAnimal(animal.id);
    
    const jsCode = `
      if (typeof centerOnLocation === 'function') {
        centerOnLocation(${animal.location.latitude}, ${animal.location.longitude}, '${animal.id}');
      }
    `;
    
    webviewRef.current.injectJavaScript(jsCode);
  };

  const adjustGeofence = (increase) => {
    setGeofenceRadius(prev => {
      const newRadius = increase ? prev + 100 : Math.max(prev - 100, 100);
      return newRadius;
    });
  };

  const getAnimalIcon = (type) => {
    switch(type) {
      case 'cow': return '🐄';
      case 'sheep': return '🐑';
      case 'goat': return '🐐';
      default: return '🐄';
    }
  };

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body, html { 
      margin: 0; 
      padding: 0; 
      height: 100%; 
      overflow: hidden;
      background: #f9fafb;
    }
    #map { 
      height: 100%; 
      width: 100%;
    }
    .leaflet-container {
      background: #f9fafb;
    }
    
    /* Custom marker styles */
    .animal-marker {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      transition: all 0.3s ease;
    }
    .animal-marker.safe {
      background: #10b981;
    }
    .animal-marker.danger {
      background: #ef4444;
      animation: pulse 1.5s infinite;
    }
    .animal-marker.selected {
      width: 20px;
      height: 20px;
      border-width: 4px;
      box-shadow: 0 4px 16px rgba(59, 130, 246, 0.6);
    }
    
    @keyframes pulse {
      0%, 100% {
        box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
      }
      50% {
        box-shadow: 0 2px 20px rgba(239, 68, 68, 0.8);
      }
    }
    
    /* Center marker */
    .center-marker {
      width: 20px;
      height: 20px;
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.5);
      position: relative;
    }
    .center-marker::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 8px;
      height: 8px;
      background: white;
      border-radius: 50%;
    }
    
    /* Custom popup */
    .leaflet-popup-content-wrapper {
      background: white;
      color: #111827;
      border-radius: 12px;
      padding: 0;
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    }
    .leaflet-popup-content {
      margin: 16px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    .leaflet-popup-tip {
      background: white;
    }
    .popup-title {
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .popup-detail {
      font-size: 13px;
      color: #9ca3af;
      margin: 4px 0;
    }
    .popup-status {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      margin-top: 8px;
    }
    .popup-status.safe {
      background: rgba(16, 185, 129, 0.2);
      color: #10b981;
    }
    .popup-status.danger {
      background: rgba(239, 68, 68, 0.2);
      color: #ef4444;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    // Initialize map with dark tiles
    const map = L.map('map', {
      zoomControl: false
    }).setView([${FARM_CENTER.latitude}, ${FARM_CENTER.longitude}], 15);
    
    // Add standard map tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);
    
    // Custom zoom control position
    L.control.zoom({
      position: 'bottomright'
    }).addTo(map);
    
    // Geofence circle with gradient
    let geofenceCircle = L.circle([${FARM_CENTER.latitude}, ${FARM_CENTER.longitude}], {
      color: '#3b82f6',
      weight: 2,
      fillColor: '#3b82f6',
      fillOpacity: 0.1,
      radius: ${SAFE_RADIUS}
    }).addTo(map);
    
    // Farm center marker
    const centerIcon = L.divIcon({
      className: 'center-marker',
      html: '',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
    
    L.marker([${FARM_CENTER.latitude}, ${FARM_CENTER.longitude}], { icon: centerIcon })
      .addTo(map)
      .bindPopup(\`
        <div class="popup-title">🏠 Farm Center</div>
        <div class="popup-detail">Safe Zone Radius: ${SAFE_RADIUS}m</div>
      \`);
    
    // Store animal markers
    let animalMarkers = {};
    let selectedMarkerId = null;
    
    // Function to update markers from React Native
    window.updateMarkers = function(animals, radius) {
      // Update geofence radius
      geofenceCircle.setRadius(radius);
      
      // Clear existing animal markers
      Object.values(animalMarkers).forEach(marker => map.removeLayer(marker));
      animalMarkers = {};
      
      // Add new markers
      animals.forEach(animal => {
        const isSelected = selectedMarkerId === animal.id;
        const markerIcon = L.divIcon({
          className: \`animal-marker \${animal.isOutside ? 'danger' : 'safe'} \${isSelected ? 'selected' : ''}\`,
          html: '',
          iconSize: isSelected ? [20, 20] : [16, 16],
          iconAnchor: isSelected ? [10, 10] : [8, 8]
        });
        
        const marker = L.marker([animal.lat, animal.lng], { icon: markerIcon })
          .addTo(map)
          .bindPopup(\`
            <div class="popup-title">\${animal.name}</div>
            <div class="popup-detail">Breed: \${animal.breed}</div>
            <div class="popup-detail">Distance: \${animal.distance}m</div>
            <div class="popup-status \${animal.isOutside ? 'danger' : 'safe'}">
              \${animal.isOutside ? '⚠️ OUTSIDE ZONE' : '✓ SAFE ZONE'}
            </div>
          \`);
        
        animalMarkers[animal.id] = marker;
      });
    };
    
    // Function to center on location
    window.centerOnLocation = function(lat, lng, animalId) {
      selectedMarkerId = animalId;
      map.flyTo([lat, lng], 17, {
        duration: 1,
        easeLinearity: 0.25
      });
      
      // Open popup for selected animal
      setTimeout(() => {
        if (animalMarkers[animalId]) {
          animalMarkers[animalId].openPopup();
        }
      }, 1000);
    };
  </script>
</body>
</html>
  `;

  const outsideAnimals = animals.filter(a => {
    const distance = calculateDistance(
      FARM_CENTER.latitude,
      FARM_CENTER.longitude,
      a.location.latitude,
      a.location.longitude
    );
    return distance > geofenceRadius;
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Live GPS Tracking</Text>
          <Text style={styles.headerSubtitle}>{animals.length} Animals</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={fetchAnimalLocations}
        >
          <Ionicons name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Map */}
      <WebView
        ref={webviewRef}
        source={{ html: htmlContent }}
        style={styles.map}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView error: ', nativeEvent);
        }}
      />

      {/* Alert Banner */}
      {outsideAnimals.length > 0 && (
        <Animated.View 
          style={[
            styles.alertBanner,
            { transform: [{ scale: pulseAnim }] }
          ]}
        >
          <View style={styles.alertContent}>
            <Ionicons name="warning" size={20} color="#fff" />
            <Text style={styles.alertText}>
              {outsideAnimals.length} animal{outsideAnimals.length > 1 ? 's' : ''} outside safe zone!
            </Text>
          </View>
        </Animated.View>
      )}

      {/* Controls Panel */}
      <Animated.View 
        style={[
          styles.controlsPanel,
          {
            maxHeight: panelHeight.interpolate({
              inputRange: [0, 1],
              outputRange: [80, 450]
            })
          }
        ]}
      >
        {/* Drag Handle */}
        <TouchableOpacity 
          style={styles.dragHandle}
          onPress={togglePanel}
          activeOpacity={0.7}
        >
          <View style={styles.dragBar} />
        </TouchableOpacity>

        {isPanelExpanded && (
          <>
            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Ionicons name="shield-checkmark" size={18} color="#3b82f6" />
                <Text style={styles.statValue}>{geofenceRadius}m</Text>
                <Text style={styles.statLabel}>Safe Radius</Text>
              </View>
              
              <View style={styles.statBox}>
                <Ionicons name="location" size={18} color="#10b981" />
                <Text style={styles.statValue}>{animals.length - outsideAnimals.length}</Text>
                <Text style={styles.statLabel}>In Zone</Text>
              </View>
              
              <View style={styles.statBox}>
                <Ionicons name="warning" size={18} color="#ef4444" />
                <Text style={styles.statValue}>{outsideAnimals.length}</Text>
                <Text style={styles.statLabel}>Outside</Text>
              </View>
            </View>

            {/* Geofence Controls */}
            <View style={styles.geofenceControls}>
              <TouchableOpacity 
                style={[styles.adjustButton, styles.decreaseButton]}
                onPress={() => adjustGeofence(false)}
              >
                <Ionicons name="remove" size={20} color="#fff" />
              </TouchableOpacity>
              
              <Text style={styles.radiusText}>Adjust Safe Zone</Text>
              
              <TouchableOpacity 
                style={[styles.adjustButton, styles.increaseButton]}
                onPress={() => adjustGeofence(true)}
              >
                <Ionicons name="add" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Animal List */}
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>Tracked Animals</Text>
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
                  <Text style={styles.legendText}>Safe</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
                  <Text style={styles.legendText}>Outside</Text>
                </View>
              </View>
            </View>

            <ScrollView 
              style={styles.animalScrollView}
              showsVerticalScrollIndicator={false}
            >
              {animals.map(animal => {
                try {
                  const distance = calculateDistance(
                    FARM_CENTER.latitude,
                    FARM_CENTER.longitude,
                    animal.location.latitude,
                    animal.location.longitude
                  );
                  const isOutside = distance > geofenceRadius;
                  const isSelected = selectedAnimal === animal.id;
                  
                  return (
                    <TouchableOpacity
                      key={animal.id}
                      style={[
                        styles.animalCard,
                        isOutside && styles.animalCardDanger,
                        isSelected && styles.animalCardSelected
                      ]}
                      onPress={() => centerOnAnimal(animal)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.animalCardLeft}>
                        <View style={[
                          styles.animalDot,
                          { backgroundColor: isOutside ? '#ef4444' : '#10b981' }
                        ]} />
                        <View style={styles.animalTextContainer}>
                          <Text style={styles.animalCardName}>{animal.name}</Text>
                          <Text style={styles.animalCardBreed}>{animal.breed}</Text>
                        </View>
                      </View>
                      
                      <View style={styles.animalCardRight}>
                        <Text style={[
                          styles.distanceText,
                          isOutside && styles.distanceTextDanger
                        ]}>
                          {Math.round(distance)}m
                        </Text>
                        <Ionicons 
                          name="navigate" 
                          size={20} 
                          color={isOutside ? '#ef4444' : '#6b7280'} 
                        />
                      </View>
                    </TouchableOpacity>
                  );
                } catch (error) {
                  console.error('Error rendering card:', error);
                  return null;
                }
              })}
            </ScrollView>
          </>
        )}
        
        {!isPanelExpanded && (
          <View style={styles.collapsedInfo}>
            <Text style={styles.collapsedText}>
              {animals.length} Animals • {outsideAnimals.length} Outside
            </Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', // Background from index.jsx
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  loadingText: {
    color: '#9CA3AF',
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#1A1A1A', // Header color from index.jsx
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#242424',
    borderRadius: 12,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  refreshButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#242424',
    borderRadius: 12,
  },
  map: {
    flex: 1,
  },
  alertBanner: {
    position: 'absolute',
    top: 120,
    left: 16,
    right: 16,
    backgroundColor: '#EF4444', // Red alert from index.jsx
    borderRadius: 12,
    padding: 12,
    zIndex: 9,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alertText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  controlsPanel: {
    position: 'absolute',
    bottom: -1,
    left: -1,
    right: -1,
    backgroundColor: '#1A1A1A', // Dark panel background
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  dragHandle: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  dragBar: {
    width: 40,
    height: 5,
    backgroundColor: '#3F3F46',
    borderRadius: 3,
  },
  collapsedInfo: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  collapsedText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#242424', // Stat card color from index.jsx
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  geofenceControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#242424',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  adjustButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  decreaseButton: {
    backgroundColor: '#EF4444',
  },
  increaseButton: {
    backgroundColor: '#10B981',
  },
  radiusText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  legendRow: {
    flexDirection: 'row',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  animalScrollView: {
    maxHeight: 200,
  },
  animalCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#1E1E1E', // Matching animal card background
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  animalCardDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: '#EF4444',
  },
  animalCardSelected: {
    borderColor: '#3B82F6',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  animalCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  animalDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#1E1E1E',
  },
  animalTextContainer: {
    flex: 1,
  },
  animalCardName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 2,
  },
  animalCardBreed: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  animalCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  distanceText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  distanceTextDanger: {
    color: '#EF4444',
    fontWeight: '700',
  },
});