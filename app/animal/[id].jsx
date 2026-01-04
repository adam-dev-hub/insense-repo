import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Heart, Thermometer, Battery, Droplet, Activity, AlertTriangle, TrendingUp } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LineChart } from 'react-native-chart-kit';

const STORAGE_KEY_PREFIX = 'animal_history_';
const STORAGE_KEY_ANIMALS = 'animals_data';

// Animal image arrays - 10 variations for each type
const ANIMAL_IMAGES = {
  cow: [
    require('../../assets/cow0.png'),
    require('../../assets/cow1.png'),
    require('../../assets/cow2.png'),
    require('../../assets/cow3.png'),
    require('../../assets/cow4.png'),
    require('../../assets/cow5.png'),
    require('../../assets/cow6.png'),
    require('../../assets/cow7.png'),
    require('../../assets/cow8.png'),
    require('../../assets/cow9.png'),
  ],
  sheep: [
    require('../../assets/sheep0.png'),
    require('../../assets/sheep1.png'),
    require('../../assets/sheep2.png'),
    require('../../assets/sheep3.png'),
    require('../../assets/sheep4.png'),
    require('../../assets/sheep5.png'),
  ],
   
  goat: [
    require('../../assets/goat0.png'),
    require('../../assets/goat1.png'),
    require('../../assets/goat2.png'),
    require('../../assets/goat3.png'),
    require('../../assets/goat4.png'),
    
  ],
};

const screenWidth = Dimensions.get('window').width;

export default function AnimalDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [animalData, setAnimalData] = useState(null);
  const [telemetry, setTelemetry] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('temperature');
  const [aiResponse, setAiResponse] = useState("");
  const [isAskingAi, setIsAskingAi] = useState(false);

  useEffect(() => {
    setAiResponse("");
    setIsAskingAi(false);
  }, [id]);

  const getAnimalImage = (animalType, imageIndex) => {
    const images = ANIMAL_IMAGES[animalType] || ANIMAL_IMAGES.cow;
    return images[imageIndex] || images[0];
  };

  const handleAnalyze = () => {
    setIsAskingAi(true);
    setAiResponse("");

    const { temperature, bpm } = telemetry || {};
    let mockMessage = "";

    if (!telemetry) {
      mockMessage = "Unable to analyze: No live telemetry data received from the collar.";
    } else if (temperature > 39.5) {
      mockMessage = "AI Analysis: Critical heat stress detected. Vital signs show temperature at " + temperature + "°C. Immediate cooling and hydration required.";
    } else if (bpm > 100) {
      mockMessage = "AI Analysis: Elevated heart rate detected (" + bpm + " BPM). Possible predator stress or high physical exertion. Monitor GPS position.";
    } else {
      mockMessage = "AI Analysis: All vitals within normal range. Metabolic patterns suggest the animal is in a resting or grazing state.";
    }

    setTimeout(() => {
      setAiResponse(mockMessage);
      setIsAskingAi(false);
    }, 1500);
  };

  const loadStoredData = async () => {
    try {
      // Load animal metadata from the main animals storage
      const animalsDataStr = await AsyncStorage.getItem(STORAGE_KEY_ANIMALS);
      if (animalsDataStr) {
        const allAnimals = JSON.parse(animalsDataStr);
        const animal = allAnimals.find(a => a.id === id);
        if (animal) {
          setAnimalData(animal);
        }
      }

      // Load telemetry history
      const storageKey = `${STORAGE_KEY_PREFIX}${id}`;
      const existingData = await AsyncStorage.getItem(storageKey);
      
      if (existingData) {
        const historyData = JSON.parse(existingData);
        setHistory(historyData);
        const latestEntry = historyData[historyData.length - 1];
        setTelemetry(latestEntry);
      }
    } catch (error) {
      console.error('Error loading stored telemetry:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStoredData();
    const interval = setInterval(loadStoredData, 5000);
    return () => clearInterval(interval);
  }, [id]);

  const getChartData = (metric) => {
    if (history.length === 0) return null;
    
    const recentHistory = history.slice(-10);
    const values = recentHistory.map(entry => entry[metric] || 0);
    const labels = recentHistory.map((entry, index) => {
      if (index % 2 === 0) return `${index + 1}`;
      return '';
    });

    return {
      labels,
      datasets: [{
        data: values,
        color: (opacity = 1) => getMetricColor(metric, opacity),
        strokeWidth: 3
      }]
    };
  };

  const getMetricColor = (metric, opacity = 1) => {
    const colors = {
      temperature: `rgba(239, 68, 68, ${opacity})`,
      bpm: `rgba(236, 72, 153, ${opacity})`,
      glucose: `rgba(59, 130, 246, ${opacity})`,
      battery: `rgba(245, 158, 11, ${opacity})`
    };
    return colors[metric] || `rgba(156, 163, 175, ${opacity})`;
  };

  const getMetricInfo = (metric) => {
    const info = {
      temperature: { label: 'Temperature', unit: '°C', icon: Thermometer, normal: '37.5-39.5', color: '#EF4444' },
      bpm: { label: 'Heart Rate', unit: 'BPM', icon: Heart, normal: '60-90', color: '#EC4899' },
      glucose: { label: 'Glucose', unit: 'mmol/L', icon: Droplet, normal: '3.5-5.5', color: '#3B82F6' },
      battery: { label: 'Battery', unit: '%', icon: Battery, normal: '20-100', color: '#F59E0B' }
    };
    return info[metric];
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const temp = telemetry?.temperature || 0;
  const bpm = telemetry?.bpm || 0;
  const glucose = telemetry?.glucose || 0;
  const battery = telemetry?.battery || 0;

  // Use animal data from storage
  const animalName = animalData?.name || `Animal ${id}`;
  const animalType = animalData?.type || 'cow';
  const animalImageIndex = animalData?.imageIndex || 0;
  const animalBreed = animalData?.breed || 'Livestock Monitor';
  const healthScore = animalData?.healthScore || 0;
  const hasSensorIssue = animalData?.hasSensorIssue || false;

  // Get the correct image based on type and index
  const animalImage = getAnimalImage(animalType, animalImageIndex);

  // Calculate status based on actual health score
  const getHealthStatus = (score) => {
    if (score === -1 || hasSensorIssue) return { text: 'ISSUE', color: '#F59E0B', isCritical: true };
    if (score >= 80) return { text: 'HEALTHY', color: '#10B981', isCritical: false };
    if (score >= 50) return { text: 'MONITOR', color: '#3B82F6', isCritical: true };
    return { text: 'CRITICAL', color: '#EF4444', isCritical: true };
  };

  const healthStatus = getHealthStatus(healthScore);
  const isCritical = healthStatus.isCritical;
  const chartData = getChartData(selectedMetric);
  const currentMetric = getMetricInfo(selectedMetric);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{animalName}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollContent}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileImageContainer}>
            <Image 
              source={animalImage}
              style={styles.profileImage} 
              resizeMode="contain"
            />
            <View style={[styles.statusDot, { backgroundColor: healthStatus.color }]} />
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{animalName}</Text>
            <Text style={styles.profileBreed}>{animalBreed}</Text>
            <View style={[styles.statusBadge, { backgroundColor: `${healthStatus.color}20` }]}>
              {isCritical && <AlertTriangle size={14} color={healthStatus.color} />}
              <Text style={[styles.statusText, { color: healthStatus.color }]}>
                {healthStatus.text}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <View style={styles.statItem}>
            <Thermometer size={20} color="#EF4444" />
            <Text style={styles.statValue}>{temp}°</Text>
            <Text style={styles.statLabel}>Temp</Text>
          </View>
          <View style={styles.statItem}>
            <Heart size={20} color="#EC4899" />
            <Text style={styles.statValue}>{bpm}</Text>
            <Text style={styles.statLabel}>BPM</Text>
          </View>
          <View style={styles.statItem}>
            <Droplet size={20} color="#3B82F6" />
            <Text style={styles.statValue}>{glucose}</Text>
            <Text style={styles.statLabel}>Glucose</Text>
          </View>
          <View style={styles.statItem}>
            <Battery size={20} color="#F59E0B" />
            <Text style={styles.statValue}>{battery}%</Text>
            <Text style={styles.statLabel}>Battery</Text>
          </View>
        </View>

        {/* Chart Section */}
        <View style={styles.chartSection}>
          <View style={styles.chartHeader}>
            <View style={styles.chartTitleRow}>
              <TrendingUp size={20} color="#3B82F6" />
              <Text style={styles.chartTitle}>Historical Data</Text>
            </View>
            <Text style={styles.chartSubtitle}>Last 10 readings</Text>
          </View>

          {/* Metric Selector */}
          <View style={styles.metricSelector}>
            {['temperature', 'bpm', 'glucose', 'battery'].map((metric) => {
              const info = getMetricInfo(metric);
              const Icon = info.icon;
              return (
                <TouchableOpacity
                  key={metric}
                  style={[
                    styles.metricButton,
                    selectedMetric === metric && { 
                      backgroundColor: info.color + '20',
                      borderColor: info.color 
                    }
                  ]}
                  onPress={() => setSelectedMetric(metric)}
                >
                  <Icon 
                    size={16} 
                    color={selectedMetric === metric ? info.color : '#9CA3AF'} 
                  />
                  <Text style={[
                    styles.metricButtonText,
                    selectedMetric === metric && { color: info.color }
                  ]}>
                    {info.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Chart */}
          {chartData && history.length > 0 ? (
            <View style={styles.chartContainer}>
              <LineChart
                data={chartData}
                width={screenWidth - 64}
                height={220}
                chartConfig={{
                  backgroundColor: '#1E1E1E',
                  backgroundGradientFrom: '#1E1E1E',
                  backgroundGradientTo: '#1E1E1E',
                  decimalPlaces: 1,
                  color: (opacity = 1) => getMetricColor(selectedMetric, opacity),
                  labelColor: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
                  style: { borderRadius: 16 },
                  propsForDots: {
                    r: '4',
                    strokeWidth: '2',
                    stroke: currentMetric.color
                  },
                  propsForBackgroundLines: {
                    strokeDasharray: '',
                    stroke: '#2A2A2A',
                    strokeWidth: 1
                  }
                }}
                bezier
                style={styles.chart}
              />
              <View style={styles.chartInfo}>
                <Text style={styles.chartInfoLabel}>Normal Range</Text>
                <Text style={styles.chartInfoValue}>{currentMetric.normal} {currentMetric.unit}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.noDataContainer}>
              <Activity size={40} color="#666" />
              <Text style={styles.noDataText}>No historical data available</Text>
            </View>
          )}
        </View>

        {/* AI Section */}
        <View style={styles.aiSection}>
          <View style={styles.aiHeader}>
            <View style={styles.aiIconContainer}>
              <Activity size={20} color="#3B82F6" />
            </View>
            <Text style={styles.aiTitle}>In-Sense AI</Text>
          </View>

          <TouchableOpacity 
            style={styles.analyzeButton} 
            onPress={handleAnalyze}
            disabled={isAskingAi}
          >
            {isAskingAi ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.buttonText}>Generate AI Health Report</Text>
            )}
          </TouchableOpacity>

          {aiResponse !== '' && (
            <View style={styles.responseBox}>
              <Text style={styles.aiLabel}>DIAGNOSIS</Text>
              <Text style={styles.responseText}>{aiResponse}</Text>
            </View>
          )}
        </View>
  
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#121212',
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#121212'
  },
  loadingText: { 
    marginTop: 12, 
    color: '#666',
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#242424',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: '700',
    color: '#fff',
  },
  scrollContent: {
    flex: 1,
  },
  profileCard: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    alignItems: 'center',
    gap: 16,
  },
  profileImageContainer: {
    position: 'relative',
  },
  profileImage: { 
    width: 80, 
    height: 80, 
    borderRadius: 16,
    backgroundColor: '#2A2A2A',
  },
  statusDot: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#1E1E1E',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: { 
    fontSize: 22, 
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  profileBreed: { 
    fontSize: 14, 
    color: '#9CA3AF',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusText: { 
    fontSize: 12, 
    fontWeight: '700',
  },
  quickStats: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    gap: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  statLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  chartSection: {
    backgroundColor: '#1E1E1E',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  chartHeader: {
    marginBottom: 16,
  },
  chartTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  chartSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  metricSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  metricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#242424',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  metricButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  chartContainer: {
    alignItems: 'center',
  },
  chart: {
    borderRadius: 16,
    marginVertical: 8,
  },
  chartInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#242424',
    borderRadius: 12,
    marginTop: 8,
  },
  chartInfoLabel: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  chartInfoValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '700',
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  noDataText: {
    fontSize: 14,
    color: '#666',
  },
  aiSection: {
    backgroundColor: '#1E1E1E',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  aiIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#3B82F620',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  analyzeButton: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },
  responseBox: {
    marginTop: 12,
    backgroundColor: '#242424',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  aiLabel: {
    color: '#3B82F6',
    fontSize: 10,
    fontWeight: '900',
    marginBottom: 8,
    letterSpacing: 1,
  },
  responseText: {
    color: '#FFF',
    fontSize: 14,
    lineHeight: 20,
  },
});