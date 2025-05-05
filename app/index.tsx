import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Alert, Animated, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from './context/ThemeContext';

interface Course {
  id: string;
  name: string;
  grade: string;
  credits: string;
  courseType: 'regular' | 'honors' | 'ap';
  semester: number;
}

type GradeScale = string;

interface GradeScaleConfig {
  name: GradeScale;
  points: { [key: string]: number };
  description: string;
}

const STORAGE_KEYS = {
  COURSES: '@gpa_calculator_courses',
  CUSTOM_SCALES: '@gpa_calculator_custom_scales',
  SELECTED_SCALE: '@gpa_calculator_selected_scale'
};

const defaultGradeScales: GradeScaleConfig[] = [
  {
    name: '4.0 Unweighted',
    points: {
      'A+': 4.0, 'A': 4.0, 'A-': 3.7,
      'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0, 'C-': 1.7,
      'D+': 1.3, 'D': 1.0, 'D-': 0.7,
      'F': 0.0,
      'H A+': 4.0, 'H A': 4.0, 'H A-': 3.7,
      'H B+': 3.3, 'H B': 3.0, 'H B-': 2.7,
      'H C+': 2.3, 'H C': 2.0, 'H C-': 1.7,
      'H D+': 1.3, 'H D': 1.0, 'H D-': 0.7,
      'H F': 0.0,
      'AP A+': 4.0, 'AP A': 4.0, 'AP A-': 3.7,
      'AP B+': 3.3, 'AP B': 3.0, 'AP B-': 2.7,
      'AP C+': 2.3, 'AP C': 2.0, 'AP C-': 1.7,
      'AP D+': 1.3, 'AP D': 1.0, 'AP D-': 0.7,
      'AP F': 0.0
    },
    description: 'Standard 4.0 scale, no honors/AP bonus'
  },
  {
    name: '4.0 Weighted',
    points: {
      'A+': 4.0, 'A': 4.0, 'A-': 3.7,
      'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0, 'C-': 1.7,
      'D+': 1.3, 'D': 1.0, 'D-': 0.7,
      'F': 0.0,
      'H A+': 4.5, 'H A': 4.5, 'H A-': 4.2,
      'H B+': 3.8, 'H B': 3.5, 'H B-': 3.2,
      'H C+': 2.8, 'H C': 2.5, 'H C-': 2.2,
      'H D+': 1.8, 'H D': 1.5, 'H D-': 1.2,
      'H F': 0.0,
      'AP A+': 5.0, 'AP A': 5.0, 'AP A-': 4.7,
      'AP B+': 4.3, 'AP B': 4.0, 'AP B-': 3.7,
      'AP C+': 3.3, 'AP C': 3.0, 'AP C-': 2.7,
      'AP D+': 2.3, 'AP D': 2.0, 'AP D-': 1.7,
      'AP F': 0.0
    },
    description: '4.0 scale with 0.5 bonus for Honors and 1.0 bonus for AP'
  },
  {
    name: '5.0 Weighted',
    points: {
      'A+': 4.0, 'A': 4.0, 'A-': 3.7,
      'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0, 'C-': 1.7,
      'D+': 1.3, 'D': 1.0, 'D-': 0.7,
      'F': 0.0,
      'H A+': 4.5, 'H A': 4.5, 'H A-': 4.2,
      'H B+': 3.8, 'H B': 3.5, 'H B-': 3.2,
      'H C+': 2.8, 'H C': 2.5, 'H C-': 2.2,
      'H D+': 1.8, 'H D': 1.5, 'H D-': 1.2,
      'H F': 0.0,
      'AP A+': 5.0, 'AP A': 5.0, 'AP A-': 4.7,
      'AP B+': 4.3, 'AP B': 4.0, 'AP B-': 3.7,
      'AP C+': 3.3, 'AP C': 3.0, 'AP C-': 2.7,
      'AP D+': 2.3, 'AP D': 2.0, 'AP D-': 1.7,
      'AP F': 0.0
    },
    description: '5.0 scale with 0.5 bonus for Honors and 1.0 bonus for AP'
  }
];

// Add helper functions before the App component
const getDefaultScaleValues = () => {
  const defaultScale = defaultGradeScales.find(scale => scale.name === '5.0 Weighted');
  if (!defaultScale) return {};

  const values: { [key: string]: string } = {};
  Object.entries(defaultScale.points).forEach(([grade, points]) => {
    values[grade] = points.toFixed(1);
  });
  return values;
};

export default function App() {
  const { theme, currentTheme, isDarkMode } = useTheme();
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseName, setCourseName] = useState('');
  const [grade, setGrade] = useState('');
  const [credits, setCredits] = useState('');
  const [selectedScale, setSelectedScale] = useState<string>('4.0 Unweighted');
  const [courseType, setCourseType] = useState<'regular' | 'honors' | 'ap'>('regular');
  const [showScaleModal, setShowScaleModal] = useState(false);
  const [showCustomScaleModal, setShowCustomScaleModal] = useState(false);
  const [customScaleName, setCustomScaleName] = useState('');
  const [customScalePoints, setCustomScalePoints] = useState<{ [key: string]: string }>(() => {
    const emptyValues: { [key: string]: string } = {};
    Object.keys(getDefaultScaleValues()).forEach(grade => {
      emptyValues[grade] = '';
    });
    return emptyValues;
  });
  const [customScaleDescription, setCustomScaleDescription] = useState('');
  const [gradeScales, setGradeScales] = useState<GradeScaleConfig[]>(defaultGradeScales);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editCourseName, setEditCourseName] = useState('');
  const [editGrade, setEditGrade] = useState('');
  const [editCredits, setEditCredits] = useState('');
  const [editCourseType, setEditCourseType] = useState<'regular' | 'honors' | 'ap'>('regular');
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState(1);
  const [showSemesterSelector, setShowSemesterSelector] = useState(true);

  const scrollY = new Animated.Value(0);
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [60, 20],
    extrapolate: 'clamp'
  });
  const scaleSelectorHeight = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [showSemesterSelector ? 150 : 75, showSemesterSelector ? 130 : 65],
    extrapolate: 'clamp'
  });
  const semesterSelectorHeight = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [75, 65],
    extrapolate: 'clamp'
  });

  // Reset custom scale form when modal is opened
  useEffect(() => {
    if (showCustomScaleModal) {
      // Initialize with empty values for all grades
      const emptyValues: { [key: string]: string } = {};
      Object.keys(getDefaultScaleValues()).forEach(grade => {
        emptyValues[grade] = '';
      });
      setCustomScalePoints(emptyValues);
      setCustomScaleName('');
      setCustomScaleDescription('');
    }
  }, [showCustomScaleModal]);

  // Load saved data when app starts
  useEffect(() => {
    loadSavedData();
  }, []);

  const loadSavedData = async () => {
    try {
      // Load saved courses
      const savedCourses = await AsyncStorage.getItem(STORAGE_KEYS.COURSES);
      if (savedCourses) {
        setCourses(JSON.parse(savedCourses));
      }

      // Load saved custom scales
      const savedCustomScales = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOM_SCALES);
      if (savedCustomScales) {
        const customScales = JSON.parse(savedCustomScales);
        setGradeScales([...defaultGradeScales, ...customScales]);
      }

      // Load selected scale
      const savedSelectedScale = await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_SCALE);
      if (savedSelectedScale) {
        setSelectedScale(savedSelectedScale as GradeScale);
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  };

  // Save courses whenever they change
  useEffect(() => {
    saveCourses();
  }, [courses]);

  const saveCourses = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(courses));
    } catch (error) {
      console.error('Error saving courses:', error);
    }
  };

  const currentScale = gradeScales.find(scale => scale.name === selectedScale) || defaultGradeScales[0];

  const calculateGPA = () => {
    if (courses.length === 0) return 0;
    
    let totalPoints = 0;
    let totalCredits = 0;

    courses.forEach(course => {
      const prefix = course.courseType === 'ap' ? 'AP ' : 
                    course.courseType === 'honors' ? 'H ' : '';
      const gradeKey = prefix + course.grade.toUpperCase();
      const gradePoint = currentScale.points[gradeKey] || 0;
      const creditHours = parseFloat(course.credits) || 0;
      totalPoints += gradePoint * creditHours;
      totalCredits += creditHours;
    });

    return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
  };

  const calculateSemesterGPA = (semester: number) => {
    const semesterCourses = courses.filter(course => course.semester === semester);
    if (semesterCourses.length === 0) return '0.00';
    
    let totalPoints = 0;
    let totalCredits = 0;

    semesterCourses.forEach(course => {
      const prefix = course.courseType === 'ap' ? 'AP ' : 
                    course.courseType === 'honors' ? 'H ' : '';
      const gradeKey = prefix + course.grade.toUpperCase();
      const gradePoint = currentScale.points[gradeKey] || 0;
      const creditHours = parseFloat(course.credits) || 0;
      totalPoints += gradePoint * creditHours;
      totalCredits += creditHours;
    });

    return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
  };

  const addCourse = () => {
    if (!courseName || !grade || !credits) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const newCourse: Course = {
      id: Date.now().toString(),
      name: courseName,
      grade: grade.toUpperCase(),
      credits,
      courseType,
      semester: selectedSemester
    };

    setCourses([...courses, newCourse]);
    setCourseName('');
    setGrade('');
    setCredits('');
    setCourseType('regular');
  };

  const removeCourse = (id: string) => {
    setCourses(courses.filter(course => course.id !== id));
  };

  const createCustomScale = async () => {
    if (!customScaleName) {
      Alert.alert('Error', 'Please enter a scale name');
      return;
    }

    const defaultValues = getDefaultScaleValues();
    const points: { [key: string]: number } = {};

    // For each grade, use the custom value if provided, otherwise use the default value
    Object.entries(customScalePoints).forEach(([grade, value]) => {
      const numValue = value ? parseFloat(value) : parseFloat(defaultValues[grade]);
      if (isNaN(numValue)) {
        Alert.alert('Error', `Invalid number for grade ${grade}`);
        return;
      }
      points[grade] = numValue;
    });

    const newScale: GradeScaleConfig = {
      name: customScaleName,
      points,
      description: customScaleDescription || `${customScaleName} grade scale`
    };

    try {
      // Get existing custom scales
      const savedCustomScales = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOM_SCALES);
      const customScales = savedCustomScales ? JSON.parse(savedCustomScales) : [];
      
      // Add new scale
      const updatedScales = [...customScales, newScale];
      await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_SCALES, JSON.stringify(updatedScales));
      
      // Update state
      setGradeScales([...defaultGradeScales, ...updatedScales]);
      setSelectedScale(customScaleName);
      await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_SCALE, customScaleName);
      
      setShowCustomScaleModal(false);
    } catch (error) {
      console.error('Error saving custom scale:', error);
      Alert.alert('Error', 'Failed to save custom scale');
    }
  };

  const handleScaleChange = async (scale: GradeScale) => {
    setSelectedScale(scale);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_SCALE, scale);
    } catch (error) {
      console.error('Error saving selected scale:', error);
    }
  };

  const deleteCustomScale = async (scaleName: string) => {
    Alert.alert(
      'Delete Scale',
      `Are you sure you want to delete "${scaleName}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Get existing custom scales
              const savedCustomScales = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOM_SCALES);
              if (savedCustomScales) {
                const customScales = JSON.parse(savedCustomScales);
                const updatedScales = customScales.filter((scale: GradeScaleConfig) => scale.name !== scaleName);
                await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_SCALES, JSON.stringify(updatedScales));
                
                // Update state
                setGradeScales([...defaultGradeScales, ...updatedScales]);
                
                // If the deleted scale was selected, switch to the first default scale
                if (selectedScale === scaleName) {
                  setSelectedScale(defaultGradeScales[0].name);
                  await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_SCALE, defaultGradeScales[0].name);
                }
              }
            } catch (error) {
              console.error('Error deleting custom scale:', error);
              Alert.alert('Error', 'Failed to delete custom scale');
            }
          }
        }
      ]
    );
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    setEditCourseName(course.name);
    setEditGrade(course.grade);
    setEditCredits(course.credits);
    setEditCourseType(course.courseType);
    setShowEditModal(true);
  };

  const saveEditedCourse = () => {
    if (!editingCourse || !editCourseName || !editGrade || !editCredits) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const updatedCourses = courses.map(course => 
      course.id === editingCourse.id 
        ? {
            ...course,
            name: editCourseName,
            grade: editGrade.toUpperCase(),
            credits: editCredits,
            courseType: editCourseType
          }
        : course
    );

    setCourses(updatedCourses);
    setShowEditModal(false);
    setEditingCourse(null);
  };

  const renderScaleModal = () => {
    const isCustomScale = !defaultGradeScales.some(scale => scale.name === currentScale.name);
    
    return (
      <Modal
        visible={showScaleModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowScaleModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Current Grade Scale</Text>
            <View style={styles.scaleInfo}>
              <Text style={[styles.scaleName, { color: theme.text }]}>{currentScale.name}</Text>
              <Text style={[styles.scaleDescription, { color: theme.text }]}>
                {currentScale.description}
              </Text>
              <ScrollView style={styles.pointsListContainer}>
                <View style={styles.pointsList}>
                  {Object.entries(currentScale.points).map(([grade, points]) => (
                    <View key={grade} style={[styles.pointItem, { borderColor: theme.border }]}>
                      <Text style={[styles.grade, { color: theme.text }]}>{grade}</Text>
                      <Text style={[styles.points, { color: theme.text }]}>{points.toFixed(1)}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
            <View style={styles.modalButtons}>
              {isCustomScale && (
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: theme.secondary }]}
                  onPress={() => {
                    setShowScaleModal(false);
                    deleteCustomScale(currentScale.name);
                  }}
                >
                  <Text style={styles.modalButtonText}>Delete Scale</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.primary }]}
                onPress={() => setShowScaleModal(false)}
              >
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderCustomScaleModal = () => {
    const defaultValues = getDefaultScaleValues();
    
  return (
      <Modal
        visible={showCustomScaleModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowCustomScaleModal(false);
        }}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Create Custom Scale</Text>
            
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.inputBackground,
                color: theme.text,
                borderColor: theme.border,
                marginBottom: 16
              }]}
              placeholder="Scale Name"
              placeholderTextColor={theme.text + '80'}
              value={customScaleName}
              onChangeText={setCustomScaleName}
            />

            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.inputBackground,
                color: theme.text,
                borderColor: theme.border,
                marginBottom: 16
              }]}
              placeholder="Description"
              placeholderTextColor={theme.text + '80'}
              value={customScaleDescription}
              onChangeText={setCustomScaleDescription}
            />

            <ScrollView style={styles.gradeList}>
              <Text style={[styles.gradeListTitle, { color: theme.text }]}>Regular Grades</Text>
              {Object.entries(customScalePoints)
                .filter(([grade]) => !grade.startsWith('H ') && !grade.startsWith('AP '))
                .map(([grade, value]) => (
                  <View key={grade} style={[styles.gradeInputRow, { borderColor: theme.border }]}>
                    <Text style={[styles.gradeLabel, { color: theme.text }]}>{grade}</Text>
                    <TextInput
                      style={[styles.gradeInput, { 
                        backgroundColor: theme.inputBackground,
                        color: theme.text,
                        borderColor: theme.border
                      }]}
                      placeholder={defaultValues[grade]}
                      placeholderTextColor={theme.text + '80'}
                      value={value}
                      onChangeText={(text) => {
                        if (/^\d*\.?\d*$/.test(text)) {
                          setCustomScalePoints({
                            ...customScalePoints,
                            [grade]: text
                          });
                        }
                      }}
                      keyboardType="decimal-pad"
                      maxLength={4}
                    />
                  </View>
                ))}

              <Text style={[styles.gradeListTitle, { color: theme.text, marginTop: 16 }]}>Honors Grades</Text>
              {Object.entries(customScalePoints)
                .filter(([grade]) => grade.startsWith('H '))
                .map(([grade, value]) => (
                  <View key={grade} style={[styles.gradeInputRow, { borderColor: theme.border }]}>
                    <Text style={[styles.gradeLabel, { color: theme.text }]}>{grade.replace('H ', '')}</Text>
                    <TextInput
                      style={[styles.gradeInput, { 
                        backgroundColor: theme.inputBackground,
                        color: theme.text,
                        borderColor: theme.border
                      }]}
                      placeholder={defaultValues[grade]}
                      placeholderTextColor={theme.text + '80'}
                      value={value}
                      onChangeText={(text) => {
                        if (/^\d*\.?\d*$/.test(text)) {
                          setCustomScalePoints({
                            ...customScalePoints,
                            [grade]: text
                          });
                        }
                      }}
                      keyboardType="decimal-pad"
                      maxLength={4}
                    />
                  </View>
                ))}

              <Text style={[styles.gradeListTitle, { color: theme.text, marginTop: 16 }]}>AP Grades</Text>
              {Object.entries(customScalePoints)
                .filter(([grade]) => grade.startsWith('AP '))
                .map(([grade, value]) => (
                  <View key={grade} style={[styles.gradeInputRow, { borderColor: theme.border }]}>
                    <Text style={[styles.gradeLabel, { color: theme.text }]}>{grade.replace('AP ', '')}</Text>
                    <TextInput
                      style={[styles.gradeInput, { 
                        backgroundColor: theme.inputBackground,
                        color: theme.text,
                        borderColor: theme.border
                      }]}
                      placeholder={defaultValues[grade]}
                      placeholderTextColor={theme.text + '80'}
                      value={value}
                      onChangeText={(text) => {
                        if (/^\d*\.?\d*$/.test(text)) {
                          setCustomScalePoints({
                            ...customScalePoints,
                            [grade]: text
                          });
                        }
                      }}
                      keyboardType="decimal-pad"
                      maxLength={4}
                    />
                  </View>
                ))}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.secondary }]}
                onPress={() => {
                  setShowCustomScaleModal(false);
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.primary }]}
                onPress={createCustomScale}
              >
                <Text style={styles.modalButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderEditModal = () => (
    <Modal
      visible={showEditModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowEditModal(false)}
    >
      <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
        <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Course</Text>
          
          <TextInput
            style={[styles.input, { 
              backgroundColor: theme.inputBackground,
              color: theme.text,
              borderColor: theme.border,
              marginBottom: 16
            }]}
            placeholder="Course Name"
            placeholderTextColor={theme.text + '80'}
            value={editCourseName}
            onChangeText={setEditCourseName}
          />

          <TextInput
            style={[styles.input, { 
              backgroundColor: theme.inputBackground,
              color: theme.text,
              borderColor: theme.border,
              marginBottom: 16
            }]}
            placeholder="Grade (A+, A, A-, etc.)"
            placeholderTextColor={theme.text + '80'}
            value={editGrade}
            onChangeText={setEditGrade}
            autoCapitalize="characters"
          />

          <TextInput
            style={[styles.input, { 
              backgroundColor: theme.inputBackground,
              color: theme.text,
              borderColor: theme.border,
              marginBottom: 16
            }]}
            placeholder="Credits"
            placeholderTextColor={theme.text + '80'}
            value={editCredits}
            onChangeText={setEditCredits}
            keyboardType="numeric"
          />

          <View style={styles.courseTypeContainer}>
            <TouchableOpacity
              style={[
                styles.courseTypeButton,
                { 
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.border,
                  borderWidth: 1,
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 12,
                  flex: 1,
                  marginRight: 6
                },
                editCourseType === 'regular' && { borderColor: theme.primary, borderWidth: 2 }
              ]}
              onPress={() => setEditCourseType('regular')}
            >
              <Text style={[styles.courseTypeText, { color: theme.text }]}>Regular</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.courseTypeButton,
                { 
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.border,
                  borderWidth: 1,
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 12,
                  flex: 1,
                  marginHorizontal: 3
                },
                editCourseType === 'honors' && { borderColor: theme.primary, borderWidth: 2 }
              ]}
              onPress={() => setEditCourseType('honors')}
            >
              <Text style={[styles.courseTypeText, { color: theme.text }]}>Honors</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.courseTypeButton,
                { 
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.border,
                  borderWidth: 1,
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 12,
        flex: 1,
                  marginLeft: 6
                },
                editCourseType === 'ap' && { borderColor: theme.primary, borderWidth: 2 }
              ]}
              onPress={() => setEditCourseType('ap')}
            >
              <Text style={[styles.courseTypeText, { color: theme.text }]}>AP</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.secondary }]}
              onPress={() => {
                setShowEditModal(false);
                setEditingCourse(null);
              }}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.primary }]}
              onPress={saveEditedCourse}
            >
              <Text style={styles.modalButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderCourseTypeSelector = () => (
    <View style={styles.courseTypeContainer}>
      <TouchableOpacity
        style={[
          styles.courseTypeButton,
          { 
            backgroundColor: theme.inputBackground,
            borderColor: theme.border,
            borderWidth: 1,
            borderRadius: 8,
            padding: 12,
            marginBottom: 12,
            flex: 1,
            marginRight: 6
          },
          courseType === 'regular' && { borderColor: theme.primary, borderWidth: 2 }
        ]}
        onPress={() => setCourseType('regular')}
      >
        <Text style={[styles.courseTypeText, { color: theme.text }]}>Regular</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.courseTypeButton,
          { 
            backgroundColor: theme.inputBackground,
            borderColor: theme.border,
            borderWidth: 1,
            borderRadius: 8,
            padding: 12,
            marginBottom: 12,
            flex: 1,
            marginHorizontal: 3
          },
          courseType === 'honors' && { borderColor: theme.primary, borderWidth: 2 }
        ]}
        onPress={() => setCourseType('honors')}
      >
        <Text style={[styles.courseTypeText, { color: theme.text }]}>Honors</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.courseTypeButton,
          { 
            backgroundColor: theme.inputBackground,
            borderColor: theme.border,
            borderWidth: 1,
            borderRadius: 8,
            padding: 12,
            marginBottom: 12,
            flex: 1,
            marginLeft: 6
          },
          courseType === 'ap' && { borderColor: theme.primary, borderWidth: 2 }
        ]}
        onPress={() => setCourseType('ap')}
      >
        <Text style={[styles.courseTypeText, { color: theme.text }]}>AP</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCourseItem = (course: Course) => (
    <View key={course.id} style={[styles.courseItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={[styles.courseInfo, { backgroundColor: theme.inputBackground }]}>
        <View style={styles.courseHeader}>
          <Text style={[styles.courseName, { color: theme.text }]}>{course.name}</Text>
          <View style={[
            styles.courseTypeBadge,
            { backgroundColor: theme.primary }
          ]}>
            <Text style={[styles.courseTypeText, { color: '#fff' }]}>
              {course.courseType.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={[styles.courseGrade, { color: theme.text }]}>
          Grade: {course.grade}
        </Text>
        <Text style={[styles.courseCredits, { color: theme.text }]}>Credits: {course.credits}</Text>
      </View>
      <View style={styles.courseActions}>
        <TouchableOpacity
          style={[styles.editButton, { backgroundColor: theme.primary }]}
          onPress={() => handleEditCourse(course)}
        >
          <Ionicons name="pencil" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.removeButton, { backgroundColor: theme.secondary }]}
          onPress={() => removeCourse(course.id)}
        >
          <Ionicons name="trash" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const semesterOptions = [
    { label: 'Freshman Year, Semester 1', value: 1 },
    { label: 'Freshman Year, Semester 2', value: 2 },
    { label: 'Sophomore Year, Semester 1', value: 3 },
    { label: 'Sophomore Year, Semester 2', value: 4 },
    { label: 'Junior Year, Semester 1', value: 5 },
    { label: 'Junior Year, Semester 2', value: 6 },
    { label: 'Senior Year, Semester 1', value: 7 },
    { label: 'Senior Year, Semester 2', value: 8 },
  ];

  const renderSemesterSelector = () => (
    <View style={[styles.semesterSelector, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.semesterLabel, { color: theme.text }]}>Semester:</Text>
      <View style={[styles.pickerContainer, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
        <Picker
          selectedValue={selectedSemester}
          onValueChange={(value: number) => setSelectedSemester(value)}
          style={[styles.picker, { color: theme.text }]}
          dropdownIconColor={theme.text}
          mode="dropdown"
          itemStyle={{ color: theme.text, backgroundColor: theme.inputBackground }}
        >
          {semesterOptions.map(option => (
            <Picker.Item 
              key={option.value} 
              label={option.label} 
              value={option.value}
              color={theme.text}
              style={{ backgroundColor: theme.inputBackground }}
            />
          ))}
        </Picker>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style="auto" />
      <Animated.View style={[styles.header, { 
        backgroundColor: theme.primary,
        paddingTop: headerHeight
      }]}>
        <Text style={[styles.title, { color: theme.text }]}>GPA Calculator</Text>
      </Animated.View>

      <Animated.View style={[styles.scaleSelector, { 
        backgroundColor: theme.card, 
        borderColor: theme.border,
        height: scaleSelectorHeight
      }]}>
        <Animated.View style={[styles.scaleSelectorContent, { 
          height: semesterSelectorHeight 
        }]}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scaleScrollContent}
            style={{ flex: 1 }}
          >
            {gradeScales.map((scale) => (
              <TouchableOpacity
                key={scale.name}
                style={[
                  styles.scaleButton,
                  selectedScale === scale.name && styles.selectedScale,
                  { backgroundColor: selectedScale === scale.name ? theme.primary : theme.card }
                ]}
                onPress={() => handleScaleChange(scale.name as GradeScale)}
              >
                <Text style={[
                  styles.scaleButtonText,
                  { color: selectedScale === scale.name ? '#fff' : theme.text }
                ]}>
                  {scale.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.scaleActions}>
            <TouchableOpacity
              style={[styles.infoButton, { backgroundColor: theme.card }]}
              onPress={() => setShowScaleModal(true)}
            >
              <Ionicons name="information-circle" size={24} color={theme.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.customButton, { backgroundColor: theme.card }]}
              onPress={() => setShowCustomScaleModal(true)}
            >
              <Ionicons name="add-circle" size={24} color={theme.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, { backgroundColor: theme.card }]}
              onPress={() => setShowSemesterSelector(!showSemesterSelector)}
            >
              <Ionicons 
                name={showSemesterSelector ? "chevron-up" : "chevron-down"} 
                size={24} 
                color={theme.primary} 
              />
            </TouchableOpacity>
          </View>
        </Animated.View>
        {showSemesterSelector && (
          <Animated.View style={[styles.semesterSelector, { 
            borderColor: theme.border,
            height: semesterSelectorHeight
          }]}>
            <Text style={[styles.semesterLabel, { color: theme.text }]}>Semester:</Text>
            <View style={[styles.pickerContainer, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
              <Picker
                selectedValue={selectedSemester}
                onValueChange={(value: number) => setSelectedSemester(value)}
                style={[styles.picker, { color: theme.text }]}
                dropdownIconColor={theme.text}
                mode="dropdown"
                itemStyle={{ color: theme.text, backgroundColor: theme.inputBackground }}
              >
                {semesterOptions.map(option => (
                  <Picker.Item 
                    key={option.value} 
                    label={option.label} 
                    value={option.value}
                    color={theme.text}
                    style={{ backgroundColor: theme.inputBackground }}
                  />
                ))}
              </Picker>
            </View>
          </Animated.View>
        )}
      </Animated.View>

      <Animated.ScrollView 
        style={[styles.mainScrollView, { backgroundColor: theme.background }]}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        <View style={styles.courseListContent}>
          <View style={[styles.inputContainer, { 
            backgroundColor: theme.card,
            borderColor: theme.border,
            borderWidth: 1
          }]}>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.inputBackground,
                color: theme.text,
                borderColor: theme.border
              }]}
              placeholder="Course Name"
              placeholderTextColor={theme.text + '80'}
              value={courseName}
              onChangeText={setCourseName}
            />
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.inputBackground,
                color: theme.text,
                borderColor: theme.border
              }]}
              placeholder="Grade (A+, A, A-, etc.)"
              placeholderTextColor={theme.text + '80'}
              value={grade}
              onChangeText={setGrade}
              autoCapitalize="characters"
            />
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.inputBackground,
                color: theme.text,
                borderColor: theme.border
              }]}
              placeholder="Credits"
              placeholderTextColor={theme.text + '80'}
              value={credits}
              onChangeText={setCredits}
              keyboardType="numeric"
            />
            {renderCourseTypeSelector()}
            <TouchableOpacity style={[styles.addButton, { backgroundColor: theme.primary }]} onPress={addCourse}>
              <Ionicons name="add-circle" size={24} color="#fff" />
              <Text style={[styles.buttonText, { color: theme.text }]}>Add Course</Text>
            </TouchableOpacity>
          </View>

          {courses
            .filter(course => course.semester === selectedSemester)
            .map(renderCourseItem)}
        </View>
      </Animated.ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={[styles.gpaContainer, { backgroundColor: theme.inputBackground }]}>
          <View style={styles.gpaRow}>
            <View style={styles.gpaItem}>
              <Text style={[styles.gpaLabel, { color: theme.text }]}>Semester GPA</Text>
              <Text style={[styles.gpaValue, { color: theme.primary }]}>{calculateSemesterGPA(selectedSemester)}</Text>
            </View>
            <View style={styles.gpaDivider} />
            <View style={styles.gpaItem}>
              <Text style={[styles.gpaLabel, { color: theme.text }]}>Overall GPA</Text>
              <Text style={[styles.gpaValue, { color: theme.primary }]}>{calculateGPA()}</Text>
            </View>
          </View>
        </View>
      </View>

      {renderScaleModal()}
      {renderCustomScaleModal()}
      {renderEditModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: 20,
    paddingHorizontal: 20,
    zIndex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  scaleSelector: {
    borderBottomWidth: 1,
    width: '100%',
  },
  scaleSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  scaleSelectorLeft: {
    flex: 1,
    marginRight: 8,
  },
  scaleScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 32,
  },
  scaleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  scaleButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedScale: {
    backgroundColor: '#3498db',
  },
  scaleButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoButton: {
    padding: 6,
    marginLeft: 6,
    opacity: 0.9,
  },
  customButton: {
    padding: 6,
    marginLeft: 6,
    opacity: 0.9,
  },
  inputContainer: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  apButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  apButtonText: {
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#3498db',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    opacity: 0.9,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  courseList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  courseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  courseInfo: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  courseTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  courseTypeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  courseName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  courseGrade: {
    fontSize: 16,
    marginTop: 4,
    opacity: 0.8,
  },
  courseCredits: {
    fontSize: 16,
    marginTop: 4,
    opacity: 0.8,
  },
  removeButton: {
    padding: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  footer: {
    padding: 12,
    borderTopWidth: 1,
  },
  gpaContainer: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
  },
  gpaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  gpaItem: {
    flex: 1,
    alignItems: 'center',
  },
  gpaDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#ccc',
    marginHorizontal: 16,
  },
  gpaLabel: {
    fontSize: 14,
    marginBottom: 2,
  },
  gpaValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  scaleInfo: {
    marginBottom: 20,
  },
  scaleName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  scaleDescription: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  pointsListContainer: {
    maxHeight: 300,
    marginBottom: 20,
  },
  pointsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 8,
  },
  pointItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 80,
    justifyContent: 'center',
  },
  grade: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  points: {
    fontSize: 16,
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
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  gradeList: {
    maxHeight: 300,
    marginBottom: 20,
  },
  gradeListTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  gradeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  gradeLabel: {
    fontSize: 16,
    fontWeight: '500',
    width: 60,
  },
  gradeInput: {
    width: 80,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 16,
  },
  courseTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  courseTypeButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  courseActions: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    marginLeft: 10,
  },
  editButton: {
    padding: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  mainScrollView: {
    flex: 1,
  },
  courseListContent: {
    paddingHorizontal: 16,
  },
  semesterSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderTopWidth: 1,
    height: 75,
  },
  semesterLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
    width: 70,
  },
  pickerContainer: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    height: 50,
  },
  picker: {
    height: 50,
    width: '100%',
    backgroundColor: 'transparent',
    marginTop: 0,
    color: '#000',
  },
  toggleButton: {
    padding: 6,
    marginLeft: 6,
    opacity: 0.9,
  },
});
