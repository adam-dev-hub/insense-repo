// Static vet data for demonstration purposes

import React, { useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, Linking, TextInput, Modal, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const VETERINARIANS = [
  {
    id: '1',
    name: 'Dr. Samia Mansour',
    specialty: 'Large Animal Medicine',
    address: 'Avenue Habib Bourguiba, Tunis 1001',
    phone: '+216 ** *** ***',
    email: 'sami.mansour@vet.tn',
    rating: 4.8,
    distance: '2.3 km',
    available: true,
    emergency: true,
    photo: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200'
  },
  {
    id: '2',
    name: 'Dr. Leila Ben Ahmed',
    specialty: 'Livestock Health & Reproduction',
    address: 'Rue de la Liberté, Ariana 2080',
    phone: '+216 ** *** ***',
    email: 'l.benahmed@livestock.tn',
    rating: 4.9,
    distance: '5.7 km',
    available: true,
    emergency: false,
    photo: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=200'
  },
  {
    id: '3',
    name: 'Dr. Mohamed Trabelsi',
    specialty: 'Emergency Veterinary Care',
    address: 'Route de Bizerte, Ben Arous 2013',
    phone: '+216 ** *** ***',
    email: 'm.trabelsi@emergency.tn',
    rating: 4.7,
    distance: '8.1 km',
    available: false,
    emergency: true,
    photo: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200'
  },
  {
    id: '4',
    name: 'Dr. Fatma Gharbi',
    specialty: 'Bovine Medicine',
    address: 'Avenue Mohamed V, La Marsa 2078',
    phone: '+216 ** *** ***',
    email: 'f.gharbi@bovine.tn',
    rating: 4.6,
    distance: '12.4 km',
    available: true,
    emergency: false,
    photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200'
  },
  {
    id: '5',
    name: 'Dr. Karim Bouazizi',
    specialty: 'Small & Large Animal Care',
    address: 'Rue Ibn Khaldoun, Manouba 2010',
    phone: '+216 ** *** ***',
    email: 'k.bouazizi@animalcare.tn',
    rating: 4.5,
    distance: '15.2 km',
    available: true,
    emergency: true,
    photo: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200'
  },
  {
    id: '6',
    name: 'Dr. Amina Mkacher',
    specialty: 'Poultry & Small Livestock',
    address: 'Rue de Marseille, Tunis 1000',
    phone: '+216 ** *** ***',
    email: 'a.mkacher@poultry.tn',
    rating: 4.7,
    distance: '3.5 km',
    available: true,
    emergency: false,
    photo: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=200'
  },
  {
    id: '7',
    name: 'Dr. Hichem Belhaj',
    specialty: 'Equine & Large Animal Surgery',
    address: 'Route de La Goulette, La Goulette 2060',
    phone: '+216 ** *** ***',
    email: 'h.belhaj@equine.tn',
    rating: 4.9,
    distance: '7.8 km',
    available: true,
    emergency: true,
    photo: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=200'
  },
  {
    id: '8',
    name: 'Dr. Salim Jlassi',
    specialty: 'Animal Nutrition & Wellness',
    address: 'Avenue de la République, Bizerte 7000',
    phone: '+216 ** *** ***',
    email: 's.jlassi@nutrition.tn',
    rating: 4.6,
    distance: '45.2 km',
    available: false,
    emergency: false,
    photo: 'https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=200'
  },
  {
    id: '9',
    name: 'Dr. Yassine Bouzid',
    specialty: 'Livestock Disease Prevention',
    address: 'Rue Mongi Slim, Nabeul 8000',
    phone: '+216 ** *** ***',
    email: 'y.bouzid@prevention.tn',
    rating: 4.8,
    distance: '62.5 km',
    available: true,
    emergency: false,
    photo: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=200'
  },
  {
    id: '10',
    name: 'Dr. Nadia Chahed',
    specialty: 'Mobile Veterinary Services',
    address: 'Avenue Farhat Hached, Sousse 4000',
    phone: '+216 ** *** ***',
    email: 'n.chahed@mobile.tn',
    rating: 4.7,
    distance: '140.3 km',
    available: true,
    emergency: true,
    photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200'
  }
];

export default function VetsScreen() {
  const router = useRouter();
  const [selectedVet, setSelectedVet] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [emergencyModalVisible, setEmergencyModalVisible] = useState(false);
  const [modalAnimation] = useState(new Animated.Value(0));

  const showEmergencyModal = () => {
    setEmergencyModalVisible(true);
    Animated.spring(modalAnimation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  };

  const hideEmergencyModal = () => {
    Animated.timing(modalAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setEmergencyModalVisible(false);
    });
  };

  const handleCall = (phone) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = (email) => {
    Linking.openURL(`mailto:${email}`);
  };

  const handleDirections = (address) => {
    const encodedAddress = encodeURIComponent(address);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`);
  };

  const getFilteredVets = () => {
    let filtered = VETERINARIANS;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(vet => 
        vet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vet.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vet.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    switch (activeFilter) {
      case 'Available Now':
        filtered = filtered.filter(vet => vet.available);
        break;
      case 'Emergency':
        filtered = filtered.filter(vet => vet.emergency);
        break;
      case 'Nearby':
        filtered = filtered.filter(vet => parseFloat(vet.distance) < 10);
        break;
      default:
        break;
    }

    return filtered;
  };

  const emergencyVets = VETERINARIANS.filter(vet => vet.emergency && vet.available);

  const renderVet = ({ item }) => (
    <TouchableOpacity 
      style={styles.vetCard}
      onPress={() => setSelectedVet(selectedVet?.id === item.id ? null : item)}
      activeOpacity={0.7}
    >
      <View style={styles.vetHeader}>
        <Image source={{ uri: item.photo }} style={styles.vetPhoto} />
        
        <View style={styles.vetInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.vetName}>{item.name}</Text>
            {item.available && (
              <View style={styles.availableBadge}>
                <View style={styles.availableDot} />
                <Text style={styles.availableText}>Available</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.specialty}>{item.specialty}</Text>
          
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={16} color="#fbbf24" />
            <Text style={styles.rating}>{item.rating}</Text>
            <Text style={styles.distance}>• {item.distance}</Text>
            {item.emergency && (
              <View style={styles.emergencyTag}>
                <Ionicons name="medical" size={10} color="#ef4444" />
              </View>
            )}
          </View>
        </View>
      </View>

      {selectedVet?.id === item.id && (
        <View style={styles.detailsSection}>
          <View style={styles.detailRow}>
            <Ionicons name="location" size={18} color="#9CA3AF" />
            <Text style={styles.detailText}>{item.address}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="call" size={18} color="#9CA3AF" />
            <Text style={styles.detailText}>{item.phone}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="mail" size={18} color="#9CA3AF" />
            <Text style={styles.detailText}>{item.email}</Text>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.callButton]}
              onPress={() => handleCall(item.phone)}
            >
              <Ionicons name="call" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Call</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.emailButton]}
              onPress={() => handleEmail(item.email)}
            >
              <Ionicons name="mail" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Email</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.directionsButton]}
              onPress={() => handleDirections(item.address)}
            >
              <Ionicons name="navigate" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Directions</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  const filteredVets = getFilteredVets();

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
          <Text style={styles.headerTitle}>Veterinarians</Text>
          <Text style={styles.headerSubtitle}>{filteredVets.length} Available</Text>
        </View>
        
        <View style={{ width: 40 }} />
      </View>

      {/* Search Section */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search veterinarians..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.filterChips}>
          {['All', 'Available Now', 'Emergency', 'Nearby'].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[styles.chip, activeFilter === filter && styles.chipActive]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[
                styles.chipText, 
                activeFilter === filter && styles.chipTextActive
              ]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Vets List */}
      <FlatList
        data={filteredVets}
        renderItem={renderVet}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={64} color="#6B7280" />
            <Text style={styles.emptyText}>No veterinarians found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
          </View>
        }
      />

      {/* Emergency FAB */}
      <TouchableOpacity 
        style={styles.emergencyFab}
        onPress={showEmergencyModal}
      >
        <Ionicons name="medical" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Emergency Modal */}
      <Modal
        visible={emergencyModalVisible}
        transparent
        animationType="none"
        onRequestClose={hideEmergencyModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1}
            onPress={hideEmergencyModal}
          />
          <Animated.View 
            style={[
              styles.modalContent,
              {
                transform: [
                  {
                    scale: modalAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1]
                    })
                  }
                ],
                opacity: modalAnimation
              }
            ]}
          >
            <View style={styles.modalHeader}>
              <View style={styles.emergencyIconContainer}>
                <Ionicons name="medical" size={32} color="#fff" />
              </View>
              <Text style={styles.modalTitle}>Emergency Services</Text>
              <Text style={styles.modalSubtitle}>
                Available 24/7 Emergency Veterinarians
              </Text>
            </View>

            <View style={styles.emergencyList}>
              {emergencyVets.map((vet) => (
                <TouchableOpacity
                  key={vet.id}
                  style={styles.emergencyVetCard}
                  onPress={() => {
                    hideEmergencyModal();
                    handleCall(vet.phone);
                  }}
                >
                  <Image source={{ uri: vet.photo }} style={styles.emergencyVetPhoto} />
                  <View style={styles.emergencyVetInfo}>
                    <Text style={styles.emergencyVetName}>{vet.name}</Text>
                    <Text style={styles.emergencyVetSpecialty}>{vet.specialty}</Text>
                    <View style={styles.emergencyVetMeta}>
                      <Ionicons name="location" size={12} color="#9CA3AF" />
                      <Text style={styles.emergencyVetDistance}>{vet.distance}</Text>
                    </View>
                  </View>
                  <View style={styles.callIconContainer}>
                    <Ionicons name="call" size={20} color="#fff" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity 
              style={styles.closeButton}
              onPress={hideEmergencyModal}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
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
  searchSection: {
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#242424',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
  },
  filterChips: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#242424',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  chipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  chipText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 10,
  },
  vetCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  vetHeader: {
    flexDirection: 'row',
  },
  vetPhoto: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: '#242424',
  },
  vetInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  vetName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  availableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  availableDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  availableText: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: '700',
  },
  emergencyTag: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  specialty: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  distance: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  detailsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  detailText: {
    flex: 1,
    fontSize: 14,
    color: '#9CA3AF',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
    borderRadius: 10,
  },
  callButton: {
    backgroundColor: '#10B981',
  },
  emailButton: {
    backgroundColor: '#3B82F6',
  },
  directionsButton: {
    backgroundColor: '#8B5CF6',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  emergencyFab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#1E1E1E',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  emergencyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  emergencyList: {
    gap: 12,
    marginBottom: 24,
  },
  emergencyVetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#242424',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  emergencyVetPhoto: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#1E1E1E',
  },
  emergencyVetInfo: {
    flex: 1,
    marginLeft: 12,
  },
  emergencyVetName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 2,
  },
  emergencyVetSpecialty: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  emergencyVetMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  emergencyVetDistance: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  callIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    backgroundColor: '#242424',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});