// app/index.jsx
import React, { useEffect, useState } from 'react';
import { 
  View, Text, FlatList, Image, TouchableOpacity, StyleSheet, 
  RefreshControl, ActivityIndicator, ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  Heart, Thermometer, Battery, TrendingUp, 
  AlertTriangle, ChevronRight
} from 'lucide-react-native';
import { thingsboardService, TB_CONFIG } from '../src/services/thingsboard';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Animal image arrays - 10 variations for each type
const ANIMAL_IMAGES = {
  cow: [
    require('../assets/cow0.png'),
    require('../assets/cow1.png'),
    require('../assets/cow2.png'),
    require('../assets/cow3.png'),
    require('../assets/cow4.png'),
    require('../assets/cow5.png'),
    require('../assets/cow6.png'),
    require('../assets/cow7.png'),
    require('../assets/cow8.png'),
    require('../assets/cow9.png'),
  ],
  sheep: [
    require('../assets/sheep0.png'),
    require('../assets/sheep1.png'),
    require('../assets/sheep2.png'),
    require('../assets/sheep3.png'),
    require('../assets/sheep4.png'),
    require('../assets/sheep5.png'),
  ],
  goat: [
    require('../assets/goat0.png'),
    require('../assets/goat1.png'),
    require('../assets/goat2.png'),
    require('../assets/goat3.png'),
    require('../assets/goat4.png'),
  ],
};

const HISTORY_LIMIT = 100;
const UPDATE_INTERVAL = 180000;// 3minutes
const STORAGE_KEY_PREFIX = 'animal_history_';
const STORAGE_KEY_ANIMALS = 'animals_data';
const STORAGE_KEY_IMAGE_MAP = 'animal_image_mapping';

export default function Dashboard() {
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deviceId, setDeviceId] = useState(null);
  const [imageMapping, setImageMapping] = useState({});
  const router = useRouter();

  // Load or create image mapping for animals
  const getOrCreateImageMapping = async (animalId, animalType) => {
    try {
      // Load existing mapping
      const mappingJson = await AsyncStorage.getItem(STORAGE_KEY_IMAGE_MAP);
      let mapping = mappingJson ? JSON.parse(mappingJson) : {};

      // If this animal doesn't have a mapping yet, create one
      if (mapping[animalId] === undefined) {
        // Generate random index (0-9) for this animal
        const randomIndex = Math.floor(Math.random() * 10);
        mapping[animalId] = randomIndex;
        
        // Save updated mapping
        await AsyncStorage.setItem(STORAGE_KEY_IMAGE_MAP, JSON.stringify(mapping));
      }

      return mapping[animalId];
    } catch (error) {
      console.error('Error with image mapping:', error);
      return 0; // Default to first image on error
    }
  };

  const getAnimalImage = (animalType, imageIndex) => {
    const images = ANIMAL_IMAGES[animalType] || ANIMAL_IMAGES.cow;
    return images[imageIndex] || images[0];
  };

  const saveToHistory = async (animalId, telemetryData) => {
    try {
      const storageKey = `${STORAGE_KEY_PREFIX}${animalId}`;
      const existingData = await AsyncStorage.getItem(storageKey);
      let history = existingData ? JSON.parse(existingData) : [];
      
      const newEntry = { timestamp: Date.now(), ...telemetryData };
      history.push(newEntry);
      if (history.length > HISTORY_LIMIT) history = history.slice(-HISTORY_LIMIT);
      
      await AsyncStorage.setItem(storageKey, JSON.stringify(history));
    } catch (error) {
      console.error(`Error saving history:`, error);
    }
  };

  const fetchDeviceData = async () => {
    try {
      let currentDeviceId = deviceId;
      if (!currentDeviceId) {
        currentDeviceId = await thingsboardService.getDeviceByName(TB_CONFIG.DEVICE_NAME);
        setDeviceId(currentDeviceId);
      }

      const telemetry = await thingsboardService.getLatestTelemetry(
        currentDeviceId,
        TB_CONFIG.TELEMETRY_KEYS.concat(['animalData'])
      );

      if (!telemetry || Object.keys(telemetry).length === 0) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      let animalsData = [];
      if (telemetry.animalData && telemetry.animalData[0]) {
        try {
          animalsData = JSON.parse(telemetry.animalData[0].value);
        } catch (error) {
          console.error('Error parsing animalData:', error);
        }
      }

      // Process animals and assign persistent images
      const processedAnimals = await Promise.all(animalsData.map(async (animal) => {
        const hasSensorIssue = animal.sensorStatus === 'MALFUNCTION' || 
                               animal.temperature === 0 || animal.temperature > 45;

        // Validate and parse location coordinates
        const parseLat = (val) => {
          const num = parseFloat(val);
          return (!isNaN(num) && num >= -90 && num <= 90) ? num : 36.8065;
        };
        
        const parseLon = (val) => {
          const num = parseFloat(val);
          return (!isNaN(num) && num >= -180 && num <= 180) ? num : 10.1815;
        };

        const animalId = animal.animalId || animal.rfid;
        const animalType = animal.type?.toLowerCase().includes('sheep') ? 'sheep' : 
                          animal.type?.toLowerCase().includes('goat') ? 'goat' : 'cow';

        // Get or create persistent image index for this animal
        const imageIndex = await getOrCreateImageMapping(animalId, animalType);

        const animalObj = {
          id: animalId,
          name: animal.name || animalId,
          type: animalType,
          imageIndex: imageIndex, // Store the index
          breed: animal.breed || "Purebred",
          rfid: animal.rfid || animalId,
          location: {
            latitude: parseLat(animal.latitude), 
            longitude: parseLon(animal.longitude),
          },
          sensorStatus: animal.sensorStatus || 'UNKNOWN',
          hasSensorIssue: hasSensorIssue,
          telemetry: {
            temperature: animal.temperature || 0,
            bpm: animal.bpm || 0,
            glucose: animal.glucose || 0,
            battery: animal.battery || 0,
          },
          healthScore: calculateHealthScore(animal, hasSensorIssue),
          lastUpdate: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        saveToHistory(animalObj.id, animalObj.telemetry);
        return animalObj;
      }));

      setAnimals(processedAnimals);
      
      // Save complete animals data for detail page access
      await AsyncStorage.setItem(STORAGE_KEY_ANIMALS, JSON.stringify(processedAnimals));
      
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateHealthScore = (animal, hasSensorIssue) => {
    if (hasSensorIssue) return -1;
    let score = 100;
    if (animal.temperature < 37.5 || animal.temperature > 39.5) score -= 20;
    if (animal.bpm < 60 || animal.bpm > 90) score -= 20;
    return Math.max(Math.round(score), 0);
  };

  useEffect(() => {
    fetchDeviceData();
    const interval = setInterval(fetchDeviceData, UPDATE_INTERVAL);
    return () => clearInterval(interval);
  }, [deviceId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDeviceData();
  };

  const getHealthStatus = (score) => {
    if (score === -1) return { text: 'ISSUE', color: '#F59E0B' };
    if (score >= 80) return { text: 'HEALTHY', color: '#10B981' };
    if (score >= 50) return { text: 'MONITOR', color: '#3B82F6' };
    return { text: 'CRITICAL', color: '#EF4444' };
  };

  const healthyCount = animals.filter(a => a.healthScore >= 80 && a.healthScore !== -1).length;
  const issueCount = animals.filter(a => a.healthScore === -1).length;
  const alertCount = animals.filter(a => a.healthScore < 80 && a.healthScore !== -1).length;

  const ListHeader = () => {
    return (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your Herd ({animals.length})</Text>
      </View>
    );
  };

  const renderAnimal = ({ item }) => {
    const health = getHealthStatus(item.healthScore);
    const animalImage = getAnimalImage(item.type, item.imageIndex);
    
    return (
      <TouchableOpacity 
        style={styles.animalCard}
        onPress={() => router.push(`/animal/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.animalImageContainer}>
          <Image source={animalImage} style={styles.animalImage}   resizeMode='contain' />
          <View style={[styles.statusDot, { backgroundColor: health.color }]} />
        </View>
        
        <View style={styles.animalInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.animalName}>{item.name}</Text>
            {item.hasSensorIssue && (
              <View style={styles.issueIcon}>
                <AlertTriangle size={12} color="#F59E0B" />
              </View>
            )}
          </View>
          <Text style={styles.animalBreed}>{item.breed}</Text>
          
          <View style={styles.metricsRow}>
            <View style={styles.metric}>
              <Thermometer size={12} color="#9CA3AF" />
              <Text style={styles.metricText}>{item.telemetry.temperature}°</Text>
            </View>
            <View style={styles.metric}>
              <Heart size={12} color="#9CA3AF" />
              <Text style={styles.metricText}>{item.telemetry.bpm}</Text>
            </View>
            <View style={styles.metric}>
              <Battery size={12} color="#9CA3AF" />
              <Text style={styles.metricText}>{item.telemetry.battery}%</Text>
            </View>
          </View>
        </View>

        <View style={styles.animalRight}>
          {item.healthScore !== -1 && (
            <Text style={styles.healthScore}>{item.healthScore}</Text>
          )}
          <View style={[styles.healthBadge, { backgroundColor: `${health.color}20` }]}>
            <Text style={[styles.healthText, { color: health.color }]}>{health.text}</Text>
          </View>
          <ChevronRight size={20} color="#666" style={{ marginTop: 4 }} />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.fixedHeader}>
        <View style={styles.headerTop}>
          <View style={styles.logoPlaceholder}>
            <Image 
              source={require('../assets/logo-insense.png')} 
              style={styles.logoImage} 
              resizeMode="contain"
            />
          </View>
          <View style={styles.headerTitles}>
            <Text style={styles.greeting}>InSense</Text>
            <Text style={styles.title}>Overview</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{animals.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#10B981' }]}>{healthyCount}</Text>
            <Text style={styles.statLabel}>Healthy</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#F59E0B' }]}>{issueCount}</Text>
            <Text style={styles.statLabel}>Issues</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#EF4444' }]}>{alertCount}</Text>
            <Text style={styles.statLabel}>Monitor</Text>
          </View>
        </View>
      </View>

      <FlatList 
        data={animals} 
        renderItem={renderAnimal} 
        keyExtractor={item => item.id}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#121212',
  },
  fixedHeader: {
    backgroundColor: '#1A1A1A',
    paddingTop: 60,
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 16,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    shadowRadius: 8,
  },
  logoImage: {
    width: 100,
    height: 100,
  },
  headerTitles: {
    flex: 1,
  },
  centerContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#121212' 
  },
  loadingText: { 
    color: '#666', 
    marginTop: 12,
    fontSize: 14,
  },
  greeting: { 
    fontSize: 20, 
    color: '#9CA3AF',
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 0,
  },
  title: { 
    fontSize: 32, 
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.8,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#242424',
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  statNumber: { 
    fontSize: 32, 
    fontWeight: '900',
    color: '#fff',
    marginBottom: 6,
    letterSpacing: -1,
  },
  statLabel: { 
    fontSize: 11, 
    color: '#9CA3AF',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  listContent: { 
    paddingBottom: 10,
  },
  animalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  animalImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  animalImage: { 
    width: 56, 
    height: 56, 
    borderRadius: 12,
    backgroundColor: '#2A2A2A',
  },
  statusDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#1E1E1E',
  },
  animalInfo: { 
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  animalName: { 
    fontSize: 16, 
    fontWeight: '700',
    color: '#fff',
  },
  issueIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  animalBreed: { 
    fontSize: 13, 
    color: '#9CA3AF',
    marginBottom: 8,
  },
  metricsRow: { 
    flexDirection: 'row', 
    gap: 12,
  },
  metric: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4,
  },
  metricText: { 
    fontSize: 12, 
    color: '#9CA3AF',
    fontWeight: '500',
  },
  animalRight: { 
    alignItems: 'flex-end',
    gap: 6,
  },
  healthScore: { 
    fontSize: 24, 
    fontWeight: '800',
    color: '#fff',
  },
  healthBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  healthText: { 
    fontSize: 10, 
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});