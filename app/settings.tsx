import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Theme, useTheme } from './context/ThemeContext';

const STORAGE_KEYS = {
  THEME: '@gpa_calculator_theme',
  DARK_MODE: '@gpa_calculator_dark_mode',
  DECIMAL_PLACES: '@gpa_calculator_decimal_places',
  COURSES: '@gpa_calculator_courses',
  CUSTOM_SCALES: '@gpa_calculator_custom_scales'
};

const themes = {
  blue: {
    name: 'blue',
    primary: '#3498db',
    secondary: '#2980b9',
    accent: '#e3f2fd',
    label: 'Blue'
  },
  green: {
    name: 'green',
    primary: '#2ecc71',
    secondary: '#27ae60',
    accent: '#e8f8f5',
    label: 'Green'
  },
  purple: {
    name: 'purple',
    primary: '#9b59b6',
    secondary: '#8e44ad',
    accent: '#f5eef8',
    label: 'Purple'
  },
  orange: {
    name: 'orange',
    primary: '#e67e22',
    secondary: '#d35400',
    accent: '#fef5e7',
    label: 'Orange'
  }
};

export default function Settings() {
  const { theme, currentTheme, isDarkMode, setTheme, setDarkMode } = useTheme();
  const [decimalPlaces, setDecimalPlaces] = useState(2);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedDecimalPlaces = await AsyncStorage.getItem(STORAGE_KEYS.DECIMAL_PLACES);
      if (savedDecimalPlaces) {
        setDecimalPlaces(parseInt(savedDecimalPlaces));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleThemeChange = async (themeName: Theme) => {
    setTheme(themeName);
    setShowThemeModal(false);
  };

  const handleDarkModeChange = async (value: boolean) => {
    setDarkMode(value);
  };

  const handleDecimalPlacesChange = (text: string) => {
    const value = parseInt(text);
    if (isNaN(value) || value < 0 || value > 4) {
      Alert.alert('Invalid Input', 'Please enter a number between 0 and 4');
      return;
    }
    setDecimalPlaces(value);
    AsyncStorage.setItem(STORAGE_KEYS.DECIMAL_PLACES, value.toString()).catch(error => {
      console.error('Error saving decimal places setting:', error);
    });
  };

  const handleResetPreferences = () => {
    Alert.alert(
      'Reset Preferences',
      'Are you sure you want to reset all preferences? This will reset your theme, dark mode, and decimal places settings. This cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await Promise.all([
                AsyncStorage.removeItem(STORAGE_KEYS.THEME),
                AsyncStorage.removeItem(STORAGE_KEYS.DARK_MODE),
                AsyncStorage.removeItem(STORAGE_KEYS.DECIMAL_PLACES)
              ]);
              navigation.goBack();
              setTimeout(() => {
                Alert.alert(
                  'Success',
                  'All preferences have been reset. Please restart the app to see the changes.',
                  [{ text: 'OK' }]
                );
              }, 100);
            } catch (error) {
              console.error('Error resetting preferences:', error);
              Alert.alert('Error', 'Failed to reset preferences. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleResetCourses = () => {
    Alert.alert(
      'Reset Courses',
      'Are you sure you want to reset all courses? This cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(STORAGE_KEYS.COURSES);
              navigation.goBack();
              setTimeout(() => {
                Alert.alert(
                  'Success',
                  'All courses have been reset. Please restart the app to see the changes.',
                  [{ text: 'OK' }]
                );
              }, 100);
            } catch (error) {
              console.error('Error resetting courses:', error);
              Alert.alert('Error', 'Failed to reset courses. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleResetScales = () => {
    Alert.alert(
      'Reset Custom Scales',
      'Are you sure you want to reset all custom scales? This cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(STORAGE_KEYS.CUSTOM_SCALES);
              navigation.goBack();
              setTimeout(() => {
                Alert.alert(
                  'Success',
                  'All custom scales have been reset. Please restart the app to see the changes.',
                  [{ text: 'OK' }]
                );
              }, 100);
            } catch (error) {
              console.error('Error resetting scales:', error);
              Alert.alert('Error', 'Failed to reset scales. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleResetData = () => {
    Alert.alert(
      'Reset All Data',
      'Are you sure you want to reset all data? This will delete all your courses, custom scales, and preferences. This cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear all AsyncStorage data
              await AsyncStorage.clear();
              
              // Navigate back to main screen to force refresh
              navigation.goBack();
              
              // Show success message after navigation
              setTimeout(() => {
                Alert.alert(
                  'Success',
                  'All data has been reset. Please restart the app to see the changes.',
                  [{ text: 'OK' }]
                );
              }, 100);
            } catch (error) {
              console.error('Error resetting data:', error);
              Alert.alert('Error', 'Failed to reset data. Please try again.');
            }
          }
        }
      ]
    );
  };

  const renderThemeModal = () => (
    <Modal
      visible={showThemeModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowThemeModal(false)}
    >
      <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
        <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>Select Theme</Text>
          <View style={styles.themeGrid}>
            {Object.entries(themes).map(([key, themeConfig]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.themeOption,
                  { borderColor: theme.border },
                  currentTheme === key && { borderColor: themeConfig.primary, borderWidth: 2 }
                ]}
                onPress={() => handleThemeChange(key as Theme)}
              >
                <View style={[styles.themePreview, { backgroundColor: themeConfig.primary }]}>
                  <View style={[styles.themePreviewSecondary, { backgroundColor: themeConfig.secondary }]} />
                  <View style={[styles.themePreviewAccent, { backgroundColor: themeConfig.accent }]} />
                </View>
                <Text style={[styles.themeName, { color: theme.text }]}>
                  {themeConfig.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: theme.primary }]}
            onPress={() => setShowThemeModal(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style="auto" />
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Appearance</Text>
          
          <TouchableOpacity
            style={[styles.settingItem, { borderColor: theme.border }]}
            onPress={() => setShowThemeModal(true)}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>Theme</Text>
              <View style={styles.themeValueContainer}>
                <Text style={[styles.settingValue, { color: theme.text }]}>
                  {themes[currentTheme].label}
                </Text>
                <View style={[styles.colorCircle, { backgroundColor: themes[currentTheme].primary }]} />
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.text} />
          </TouchableOpacity>

          <View style={[styles.settingItem, { borderColor: theme.border }]}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>Dark Mode</Text>
            <Switch
              value={isDarkMode}
              onValueChange={handleDarkModeChange}
              trackColor={{ false: '#767577', true: theme.primary }}
              thumbColor={isDarkMode ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Preferences</Text>
          
          <View style={[styles.settingItem, { borderColor: theme.border }]}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>Decimal Places</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.inputBackground,
                color: theme.text,
                borderColor: theme.border
              }]}
              value={decimalPlaces.toString()}
              onChangeText={handleDecimalPlacesChange}
              keyboardType="number-pad"
              maxLength={1}
            />
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Data Management</Text>
          
          <TouchableOpacity
            style={[styles.settingItem, { borderColor: theme.border }]}
            onPress={handleResetPreferences}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: '#ff3b30' }]}>Reset Preferences</Text>
            </View>
            <Ionicons name="trash-outline" size={24} color="#ff3b30" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingItem, { borderColor: theme.border }]}
            onPress={handleResetCourses}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: '#ff3b30' }]}>Reset Courses</Text>
            </View>
            <Ionicons name="trash-outline" size={24} color="#ff3b30" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingItem, { borderColor: theme.border }]}
            onPress={handleResetScales}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: '#ff3b30' }]}>Reset Custom Scales</Text>
            </View>
            <Ionicons name="trash-outline" size={24} color="#ff3b30" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingItem, { borderColor: theme.border }]}
            onPress={handleResetData}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: '#ff3b30' }]}>Reset All Data</Text>
            </View>
            <Ionicons name="trash-outline" size={24} color="#ff3b30" />
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>About</Text>
          <Text style={[styles.version, { color: theme.text }]}>Version 1.0.0</Text>
        </View>
      </ScrollView>

      {renderThemeModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  section: {
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    padding: 16,
    paddingBottom: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  settingInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLabel: {
    fontSize: 16,
    marginRight: 12,
  },
  settingValue: {
    fontSize: 16,
  },
  input: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 20,
  },
  themeOption: {
    width: '45%',
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  themePreview: {
    height: 100,
    padding: 12,
    justifyContent: 'space-between',
  },
  themePreviewSecondary: {
    height: 20,
    width: '60%',
    borderRadius: 4,
  },
  themePreviewAccent: {
    height: 20,
    width: '40%',
    borderRadius: 4,
  },
  themeName: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    padding: 12,
  },
  closeButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  version: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    padding: 16,
  },
  themeValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
}); 