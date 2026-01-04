import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, Modal, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const router = useRouter();
  
  const [settings, setSettings] = useState({
    notifications: true,
    geofenceAlerts: true,
    healthAlerts: true,
    batteryAlerts: true,
    autoSync: true,
    darkMode: true
  });

  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [modalAnimation] = useState(new Animated.Value(0));

  const toggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const showLogoutModal = () => {
    setLogoutModalVisible(true);
    Animated.spring(modalAnimation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  };

  const hideLogoutModal = () => {
    Animated.timing(modalAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setLogoutModalVisible(false);
    });
  };

  const handleLogout = () => {
    hideLogoutModal();
    // Add logout logic here
  };

  const handleTechnicalSupport = (type) => {
    router.push(`/support?type=${type}`);
  };

  const handleThingsBoardConfig = () => {
    router.push('/thingsboard-config');
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
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>Manage your preferences</Text>
        </View>
        
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <SettingItem
            icon="notifications"
            iconColor="#3B82F6"
            iconBg="rgba(59, 130, 246, 0.2)"
            title="Push Notifications"
            description="Receive alerts on your device"
            value={settings.notifications}
            onToggle={() => toggleSetting('notifications')}
          />
          
          <SettingItem
            icon="location"
            iconColor="#8B5CF6"
            iconBg="rgba(139, 92, 246, 0.2)"
            title="Geofence Alerts"
            description="Alert when animals leave safe zone"
            value={settings.geofenceAlerts}
            onToggle={() => toggleSetting('geofenceAlerts')}
          />
          
          <SettingItem
            icon="heart"
            iconColor="#EF4444"
            iconBg="rgba(239, 68, 68, 0.2)"
            title="Health Alerts"
            description="Critical biometric warnings"
            value={settings.healthAlerts}
            onToggle={() => toggleSetting('healthAlerts')}
          />
          
          <SettingItem
            icon="battery-charging"
            iconColor="#10B981"
            iconBg="rgba(16, 185, 129, 0.2)"
            title="Battery Alerts"
            description="Low battery notifications"
            value={settings.batteryAlerts}
            onToggle={() => toggleSetting('batteryAlerts')}
          />
        </View>

        {/* Data & Sync Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Sync</Text>
          
          <SettingItem
            icon="sync"
            iconColor="#F59E0B"
            iconBg="rgba(245, 158, 11, 0.2)"
            title="Auto Sync"
            description="Automatically sync with ThingsBoard"
            value={settings.autoSync}
            onToggle={() => toggleSetting('autoSync')}
          />
          
          <TouchableOpacity 
            style={styles.settingButton}
            onPress={handleThingsBoardConfig}
            activeOpacity={0.7}
          >
            <View style={styles.settingButtonLeft}>
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
                <Ionicons name="cloud" size={24} color="#3B82F6" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>ThingsBoard Configuration</Text>
                <Text style={styles.settingDescription}>Manage device connections</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Technical Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Technical Support</Text>
          
          <TouchableOpacity 
            style={styles.supportCard}
            onPress={() => handleTechnicalSupport('hardware')}
            activeOpacity={0.7}
          >
            <View style={[styles.supportIcon, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
              <Ionicons name="hardware-chip" size={28} color="#EF4444" />
            </View>
            <View style={styles.supportTextContainer}>
              <Text style={styles.supportTitle}>Hardware Issue</Text>
              <Text style={styles.supportDescription}>
                ESP32 device malfunction, sensor errors
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.supportCard}
            onPress={() => handleTechnicalSupport('battery')}
            activeOpacity={0.7}
          >
            <View style={[styles.supportIcon, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
              <Ionicons name="battery-dead" size={28} color="#F59E0B" />
            </View>
            <View style={styles.supportTextContainer}>
              <Text style={styles.supportTitle}>Battery Problem</Text>
              <Text style={styles.supportDescription}>
                Low battery life, charging issues
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.supportCard}
            onPress={() => handleTechnicalSupport('connectivity')}
            activeOpacity={0.7}
          >
            <View style={[styles.supportIcon, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
              <Ionicons name="wifi" size={28} color="#3B82F6" />
            </View>
            <View style={styles.supportTextContainer}>
              <Text style={styles.supportTitle}>Connectivity Issue</Text>
              <Text style={styles.supportDescription}>
                MQTT connection, data transmission problems
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.supportCard}
            onPress={() => handleTechnicalSupport('rfid')}
            activeOpacity={0.7}
          >
            <View style={[styles.supportIcon, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
              <Ionicons name="pricetag" size={28} color="#8B5CF6" />
            </View>
            <View style={styles.supportTextContainer}>
              <Text style={styles.supportTitle}>RFID Tag Issue</Text>
              <Text style={styles.supportDescription}>
                Tag not reading, replacement needed
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Device Health Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Device Health</Text>
          
          <View style={styles.healthCard}>
            <View style={styles.healthRow}>
              <View style={styles.healthLabelContainer}>
                <Ionicons name="hardware-chip-outline" size={18} color="#9CA3AF" />
                <Text style={styles.healthLabel}>Connected Devices</Text>
              </View>
              <Text style={styles.healthValue}>1</Text>
            </View>
            
            <View style={styles.healthRow}>
              <View style={styles.healthLabelContainer}>
                <Ionicons name="battery-half-outline" size={18} color="#9CA3AF" />
                <Text style={styles.healthLabel}>Average Battery</Text>
              </View>
              <Text style={[styles.healthValue, { color: '#10B981' }]}>85%</Text>
            </View>
            
            <View style={styles.healthRow}>
              <View style={styles.healthLabelContainer}>
                <Ionicons name="time-outline" size={18} color="#9CA3AF" />
                <Text style={styles.healthLabel}>Last Sync</Text>
              </View>
              <Text style={styles.healthValue}>Just now</Text>
            </View>
            
            <View style={[styles.healthRow, { borderBottomWidth: 0 }]}>
              <View style={styles.healthLabelContainer}>
                <Ionicons name="wifi-outline" size={18} color="#9CA3AF" />
                <Text style={styles.healthLabel}>Connection Status</Text>
              </View>
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Active</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <TouchableOpacity 
            style={styles.settingButton}
            onPress={() => router.push('/profile')}
            activeOpacity={0.7}
          >
            <View style={styles.settingButtonLeft}>
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
                <Ionicons name="person" size={24} color="#8B5CF6" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Profile Settings</Text>
                <Text style={styles.settingDescription}>Manage your account</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#6B7280" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingButton}
            onPress={() => router.push('/about')}
            activeOpacity={0.7}
          >
            <View style={styles.settingButtonLeft}>
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(107, 114, 128, 0.2)' }]}>
                <Ionicons name="information-circle" size={24} color="#6B7280" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>About</Text>
                <Text style={styles.settingDescription}>Version 1.0.0</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={showLogoutModal}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Logout Modal */}
      <Modal
        visible={logoutModalVisible}
        transparent
        animationType="none"
        onRequestClose={hideLogoutModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1}
            onPress={hideLogoutModal}
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
              <Ionicons name="log-out-outline" size={48} color="#EF4444" />
            </View>
            
            <Text style={styles.modalTitle}>Logout</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to logout? You'll need to sign in again to access your account.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={hideLogoutModal}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleLogout}
              >
                <Text style={styles.confirmButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

function SettingItem({ icon, iconColor, iconBg, title, description, value, onToggle }) {
  return (
    <View style={styles.settingItem}>
      <View style={styles.settingItemLeft}>
        <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
          <Ionicons name={icon} size={24} color={iconColor} />
        </View>
        <View style={styles.settingTextContainer}>
          <Text style={styles.settingTitle}>{title}</Text>
          <Text style={styles.settingDescription}>{description}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#3F3F46', true: 'rgba(59, 130, 246, 0.5)' }}
        thumbColor={value ? '#3B82F6' : '#A1A1AA'}
        ios_backgroundColor="#3F3F46"
      />
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
  section: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  settingButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  settingButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  supportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  supportIcon: {
    width: 52,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  supportTextContainer: {
    flex: 1,
  },
  supportTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
  },
  supportDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    lineHeight: 16,
  },
  healthCard: {
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  healthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  healthLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  healthLabel: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  healthValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  logoutButtonText: {
    color: '#EF4444',
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
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
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
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#242424',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  confirmButton: {
    backgroundColor: '#EF4444',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});