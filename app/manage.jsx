import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

export default function ManageAnimal() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    name: '',
    type: 'cow',
    breed: '',
    rfid: '',
    age: '',
    weight: '',
    deviceId: '',
    notes: ''
  });

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!formData.name || !formData.rfid || !formData.deviceId) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    Alert.alert(
      'Success',
      isEditing ? 'Animal updated successfully' : 'Animal added successfully',
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  const handleTransferOwnership = () => {
    Alert.alert(
      'Transfer Ownership',
      'Enter new owner details to transfer this animal',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Continue',
          onPress: () => router.push('/transfer-ownership')
        }
      ]
    );
  };

  const handleOverrideRFID = () => {
    Alert.alert(
      'Override RFID',
      'Are you sure you want to override the RFID tag? This will reassign the device to this animal.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Override',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Success', 'RFID tag overridden successfully');
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>
          {isEditing ? 'Edit Animal' : 'Add Animal'}
        </Text>
        
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.form}>
        <Text style={styles.sectionTitle}>Basic Information</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Animal Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Cow #001"
            value={formData.name}
            onChangeText={(value) => updateField('name', value)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Animal Type *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.type}
              onValueChange={(value) => updateField('type', value)}
              style={styles.picker}
            >
              <Picker.Item label="Cow" value="cow" />
              <Picker.Item label="Sheep" value="sheep" />
              <Picker.Item label="Goat" value="goat" />
            </Picker>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Breed</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Holstein"
            value={formData.breed}
            onChangeText={(value) => updateField('breed', value)}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Age</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 3 years"
              value={formData.age}
              onChangeText={(value) => updateField('age', value)}
            />
          </View>

          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Weight</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 650 kg"
              value={formData.weight}
              onChangeText={(value) => updateField('weight', value)}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Device Information</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>RFID Tag *</Text>
          <View style={styles.rfidInputContainer}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="e.g., RFID-001"
              value={formData.rfid}
              onChangeText={(value) => updateField('rfid', value)}
            />
            {isEditing && (
              <TouchableOpacity 
                style={styles.scanButton}
                onPress={handleOverrideRFID}
              >
                <Ionicons name="reload" size={20} color="#3b82f6" />
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.helperText}>
            Physical RFID tag attached to the animal
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>ThingsBoard Device ID *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., dqdio37xc12ymuel698o"
            value={formData.deviceId}
            onChangeText={(value) => updateField('deviceId', value)}
          />
          <Text style={styles.helperText}>
            Device token from ThingsBoard ESP32 device
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Additional notes about the animal..."
            value={formData.notes}
            onChangeText={(value) => updateField('notes', value)}
            multiline
            numberOfLines={4}
          />
        </View>

        {isEditing && (
          <>
            <Text style={styles.sectionTitle}>Ownership Management</Text>
            
            <TouchableOpacity 
              style={styles.transferButton}
              onPress={handleTransferOwnership}
            >
              <Ionicons name="swap-horizontal" size={24} color="#8b5cf6" />
              <View style={{ flex: 1 }}>
                <Text style={styles.transferButtonTitle}>Transfer Ownership</Text>
                <Text style={styles.transferButtonSubtitle}>
                  Transfer this animal to another farmer
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#8b5cf6" />
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSave}
        >
          <Ionicons name="checkmark-circle" size={24} color="#fff" />
          <Text style={styles.saveButtonText}>
            {isEditing ? 'Save Changes' : 'Add Animal'}
          </Text>
        </TouchableOpacity>

        {isEditing && (
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => {
              Alert.alert(
                'Delete Animal',
                'Are you sure you want to remove this animal from your farm?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                      Alert.alert('Success', 'Animal removed successfully');
                      router.back();
                    }
                  }
                ]
              );
            }}
          >
            <Ionicons name="trash" size={20} color="#ef4444" />
            <Text style={styles.deleteButtonText}>Remove Animal</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  backButton: {
    padding: 8
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827'
  },
  form: {
    padding: 16,
    paddingBottom: 40
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 24,
    marginBottom: 16
  },
  inputGroup: {
    marginBottom: 20
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#111827'
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top'
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    overflow: 'hidden'
  },
  picker: {
    height: 50
  },
  row: {
    flexDirection: 'row',
    gap: 12
  },
  rfidInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  scanButton: {
    backgroundColor: '#eff6ff',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3b82f6'
  },
  helperText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4
  },
  transferButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#8b5cf6',
    marginBottom: 20
  },
  transferButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8b5cf6',
    marginBottom: 2
  },
  transferButtonSubtitle: {
    fontSize: 12,
    color: '#6b7280'
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    marginTop: 24
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 2,
    borderColor: '#ef4444'
  },
  deleteButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600'
  }
});