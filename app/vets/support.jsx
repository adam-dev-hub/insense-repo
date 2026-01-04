import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Modal, Animated, Linking } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const ISSUE_TYPES = {
  hardware: {
    title: 'Hardware Issue',
    icon: 'hardware-chip',
    color: '#EF4444',
    examples: [
      'ESP32 not responding',
      'Sensor malfunction',
      'Device overheating',
      'Physical damage'
    ]
  },
  battery: {
    title: 'Battery Problem',
    icon: 'battery-dead',
    color: '#F59E0B',
    examples: [
      'Battery drains quickly',
      'Won\'t charge',
      'Battery swelling',
      'Power loss'
    ]
  },
  connectivity: {
    title: 'Connectivity Issue',
    icon: 'wifi',
    color: '#3B82F6',
    examples: [
      'MQTT connection failed',
      'Data not syncing',
      'Network timeout',
      'ThingsBoard disconnected'
    ]
  },
  rfid: {
    title: 'RFID Tag Issue',
    icon: 'pricetag',
    color: '#8B5CF6',
    examples: [
      'Tag not reading',
      'Tag damaged',
      'Need replacement',
      'Wrong animal association'
    ]
  }
};

export default function SupportRequest() {
  const router = useRouter();
  const { type } = useLocalSearchParams();
  
  const issueType = ISSUE_TYPES[type] || ISSUE_TYPES.hardware;
  
  const [formData, setFormData] = useState({
    deviceId: '',
    animalId: '',
    priority: 'medium',
    description: '',
    errorCode: ''
  });

  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [modalAnimation] = useState(new Animated.Value(0));

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const showSuccessModal = () => {
    setSuccessModalVisible(true);
    Animated.spring(modalAnimation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  };

  const hideSuccessModal = () => {
    Animated.timing(modalAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setSuccessModalVisible(false);
      router.back();
    });
  };

  const handleSubmit = () => {
    if (!formData.description.trim()) {
      // Could add a toast/snackbar here instead of Alert
      return;
    }

    showSuccessModal();
  };

  const handleEmergencyCall = () => {
    Linking.openURL('tel:+21671999888');
  };

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
          <Text style={styles.headerTitle}>Technical Support</Text>
          <Text style={styles.headerSubtitle}>Get help with your device</Text>
        </View>
        
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Issue Type Card */}
        <View style={styles.issueTypeCard}>
          <View style={[styles.issueIcon, { backgroundColor: issueType.color + '33' }]}>
            <Ionicons name={issueType.icon} size={32} color={issueType.color} />
          </View>
          <View style={styles.issueTextContainer}>
            <Text style={styles.issueTitle}>{issueType.title}</Text>
            <Text style={styles.issueSubtitle}>Fill in the details below</Text>
          </View>
        </View>

        {/* Common Examples */}
        <View style={styles.examplesSection}>
          <Text style={styles.sectionLabel}>COMMON ISSUES</Text>
          <View style={styles.examplesList}>
            {issueType.examples.map((example, index) => (
              <View key={index} style={styles.exampleItem}>
                <View style={styles.exampleDot} />
                <Text style={styles.exampleText}>{example}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Device ID (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., dqdio37xc12ymuel698o"
              placeholderTextColor="#6B7280"
              value={formData.deviceId}
              onChangeText={(value) => updateField('deviceId', value)}
            />
            <Text style={styles.helperText}>
              The ThingsBoard device token
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Animal ID (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Cow #001"
              placeholderTextColor="#6B7280"
              value={formData.animalId}
              onChangeText={(value) => updateField('animalId', value)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Priority Level</Text>
            <View style={styles.priorityOptions}>
              <TouchableOpacity
                style={[styles.priorityOption, formData.priority === 'low' && styles.priorityOptionActive]}
                onPress={() => updateField('priority', 'low')}
                activeOpacity={0.7}
              >
                <View style={[styles.priorityIndicator, { backgroundColor: '#10B981' }]} />
                <View style={styles.priorityTextContainer}>
                  <Text style={[styles.priorityTitle, formData.priority === 'low' && styles.priorityTitleActive]}>Low</Text>
                  <Text style={styles.prioritySubtitle}>Can wait a few days</Text>
                </View>
                {formData.priority === 'low' && (
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.priorityOption, formData.priority === 'medium' && styles.priorityOptionActive]}
                onPress={() => updateField('priority', 'medium')}
                activeOpacity={0.7}
              >
                <View style={[styles.priorityIndicator, { backgroundColor: '#F59E0B' }]} />
                <View style={styles.priorityTextContainer}>
                  <Text style={[styles.priorityTitle, formData.priority === 'medium' && styles.priorityTitleActive]}>Medium</Text>
                  <Text style={styles.prioritySubtitle}>Should fix soon</Text>
                </View>
                {formData.priority === 'medium' && (
                  <Ionicons name="checkmark-circle" size={24} color="#F59E0B" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.priorityOption, formData.priority === 'high' && styles.priorityOptionActive]}
                onPress={() => updateField('priority', 'high')}
                activeOpacity={0.7}
              >
                <View style={[styles.priorityIndicator, { backgroundColor: '#EF4444' }]} />
                <View style={styles.priorityTextContainer}>
                  <Text style={[styles.priorityTitle, formData.priority === 'high' && styles.priorityTitleActive]}>High</Text>
                  <Text style={styles.prioritySubtitle}>Urgent, animals at risk</Text>
                </View>
                {formData.priority === 'high' && (
                  <Ionicons name="checkmark-circle" size={24} color="#EF4444" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Error Code (if any)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., ERR_MQTT_TIMEOUT"
              placeholderTextColor="#6B7280"
              value={formData.errorCode}
              onChangeText={(value) => updateField('errorCode', value)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Describe the Problem *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Please describe what happened, when it started, and any steps you've already taken..."
              placeholderTextColor="#6B7280"
              value={formData.description}
              onChangeText={(value) => updateField('description', value)}
              multiline
              numberOfLines={6}
            />
          </View>

          {/* Troubleshooting Tips */}
          <View style={styles.tipsCard}>
            <View style={styles.tipsHeader}>
              <View style={styles.tipsIconContainer}>
                <Ionicons name="bulb-outline" size={22} color="#F59E0B" />
              </View>
              <Text style={styles.tipsTitle}>Quick Troubleshooting</Text>
            </View>
            
            {type === 'connectivity' && (
              <View style={styles.tipsList}>
                <TipItem text="Check your internet connection" />
                <TipItem text="Verify ThingsBoard credentials" />
                <TipItem text="Restart the ESP32 device" />
                <TipItem text="Check device is within WiFi range" />
              </View>
            )}
            
            {type === 'battery' && (
              <View style={styles.tipsList}>
                <TipItem text="Try a different charging cable" />
                <TipItem text="Check for physical damage" />
                <TipItem text="Ensure proper voltage (5V)" />
                <TipItem text="Let device cool down if hot" />
              </View>
            )}
            
            {type === 'hardware' && (
              <View style={styles.tipsList}>
                <TipItem text="Check all cable connections" />
                <TipItem text="Look for physical damage" />
                <TipItem text="Try resetting the device" />
                <TipItem text="Check LED indicators" />
              </View>
            )}
            
            {type === 'rfid' && (
              <View style={styles.tipsList}>
                <TipItem text="Clean the RFID tag" />
                <TipItem text="Check tag is not damaged" />
                <TipItem text="Ensure tag is close to reader" />
                <TipItem text="Verify correct tag number" />
              </View>
            )}
          </View>

          {/* Contact Information */}
          <View style={styles.contactCard}>
            <View style={styles.contactHeader}>
              <View style={styles.contactIconContainer}>
                <Ionicons name="call-outline" size={22} color="#EF4444" />
              </View>
              <Text style={styles.contactTitle}>Emergency Contact</Text>
            </View>
            <Text style={styles.contactText}>
              For critical issues affecting animal safety
            </Text>
            <TouchableOpacity 
              style={styles.emergencyButton}
              onPress={handleEmergencyCall}
              activeOpacity={0.8}
            >
              <Ionicons name="call" size={20} color="#fff" />
              <Text style={styles.emergencyButtonText}>+216 71 999 888</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.submitButton, !formData.description.trim() && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            activeOpacity={0.8}
            disabled={!formData.description.trim()}
          >
            <Ionicons name="paper-plane" size={20} color="#fff" />
            <Text style={styles.submitButtonText}>Submit Request</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Success Modal */}
      <Modal
        visible={successModalVisible}
        transparent
        animationType="none"
        onRequestClose={hideSuccessModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1}
            onPress={hideSuccessModal}
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
            <View style={styles.modalIconContainer}>
              <Ionicons name="checkmark-circle" size={64} color="#10B981" />
            </View>
            
            <Text style={styles.modalTitle}>Request Submitted!</Text>
            <Text style={styles.modalMessage}>
              Our technical team will contact you within 24 hours to resolve your issue.
            </Text>

            <TouchableOpacity 
              style={styles.modalButton}
              onPress={hideSuccessModal}
            >
              <Text style={styles.modalButtonText}>Done</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

function TipItem({ text }) {
  return (
    <View style={styles.tipItem}>
      <Ionicons name="checkmark-circle" size={18} color="#10B981" />
      <Text style={styles.tipText}>{text}</Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  issueTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#1E1E1E',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  issueIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  issueTextContainer: {
    flex: 1,
  },
  issueTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  issueSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  examplesSection: {
    backgroundColor: '#1E1E1E',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  examplesList: {
    gap: 10,
  },
  exampleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  exampleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6B7280',
  },
  exampleText: {
    fontSize: 14,
    color: '#D1D5DB',
    flex: 1,
  },
  form: {
    paddingHorizontal: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#FFF',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
  },
  pickerContainer: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 12,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    color: '#FFF',
  },
  priorityOptions: {
    gap: 10,
  },
  priorityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    gap: 12,
  },
  priorityOptionActive: {
    borderColor: '#3B82F6',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  priorityIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
  },
  priorityTextContainer: {
    flex: 1,
  },
  priorityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 2,
  },
  priorityTitleActive: {
    color: '#FFF',
  },
  prioritySubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  tipsCard: {
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  tipsIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  tipsList: {
    gap: 10,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tipText: {
    fontSize: 14,
    color: '#D1D5DB',
    flex: 1,
  },
  contactCard: {
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  contactIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  contactText: {
    fontSize: 14,
    color: '#D1D5DB',
    marginBottom: 12,
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#EF4444',
    padding: 14,
    borderRadius: 10,
  },
  emergencyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 12
  },
  submitButtonDisabled: {
    backgroundColor: '#374151',
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
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
    width: '85%',
    backgroundColor: '#1E1E1E',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  modalIconContainer: {
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalButton: {
    width: '100%',
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});