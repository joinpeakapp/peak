import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  BackHandler
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ExerciseFilterModalProps {
  visible: boolean;
  onClose: () => void;
  availableTags: string[];
  selectedTags: string[];
  onTagsSelected: (tags: string[]) => void;
}

const { height } = Dimensions.get('window');
const ANIMATION_DURATION = 300;

export const ExerciseFilterModal: React.FC<ExerciseFilterModalProps> = ({
  visible,
  onClose,
  availableTags,
  selectedTags,
  onTagsSelected
}) => {
  // État local pour gérer les tags sélectionnés dans la modale
  const [localSelectedTags, setLocalSelectedTags] = useState<string[]>([]);
  const [modalVisible, setModalVisible] = useState(visible);
  const slideAnim = React.useRef(new Animated.Value(height)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  // Catégoriser les tags disponibles
  const bodySectionTags = availableTags.filter(tag => 
    tag.includes("Body")
  );
  
  const muscleSectionTags = availableTags.filter(tag => 
    ["Chest", "Back", "Shoulders", "Biceps", "Triceps", 
     "Abs", "Quads", "Hamstrings", "Glutes", "Calves"].includes(tag)
  );
  
  const otherTags = availableTags.filter(tag => 
    !bodySectionTags.includes(tag) && !muscleSectionTags.includes(tag)
  );

  // Synchroniser avec les tags sélectionnés quand la modale s'ouvre
  React.useEffect(() => {
    if (visible) {
      setLocalSelectedTags([...selectedTags]);
      setModalVisible(true);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: height,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setModalVisible(false);
      });
    }
  }, [visible, selectedTags]);

  // Gérer le bouton retour sur Android
  React.useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (modalVisible) {
        closeModal();
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [modalVisible]);

  // Fonction pour basculer un tag dans la sélection
  const toggleTag = (tag: string) => {
    setLocalSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };

  // Fonction pour fermer la modale avec animation
  const closeModal = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: height,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  // Fonction pour confirmer les filtres et fermer la modale
  const handleConfirm = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: height,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
      onTagsSelected(localSelectedTags);
    });
  };

  // Fonction pour effacer tous les filtres localement
  const handleClearAll = () => {
    setLocalSelectedTags([]);
  };

  // Fonction pour effacer les filtres et fermer la modale
  const handleClearAndClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: height,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
      onTagsSelected([]);
    });
  };

  // Rendu d'une section de tags avec titre
  const renderTagSection = (title: string, tags: string[]) => {
    if (tags.length === 0) return null;
    
    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.tagsGrid}>
          {tags.map(tag => (
            <TouchableOpacity
              key={tag}
              style={[
                styles.tagButton,
                localSelectedTags.includes(tag) && styles.tagButtonSelected
              ]}
              onPress={() => toggleTag(tag)}
            >
              <Text 
                style={[
                  styles.tagButtonText,
                  localSelectedTags.includes(tag) && styles.tagButtonTextSelected
                ]}
              >
                {tag}
              </Text>
              {localSelectedTags.includes(tag) && (
                <Ionicons name="checkmark" size={16} color="#000000" style={{ marginLeft: 6 }} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      onRequestClose={closeModal}
    >
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.overlay,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.overlayTouchable}
            activeOpacity={1}
            onPress={closeModal}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.modalContent,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.handle} />
          
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter exercises</Text>
            <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.tagsContainer}>
            {renderTagSection("Body Focus", bodySectionTags)}
            {renderTagSection("Muscle Groups", muscleSectionTags)}
            {renderTagSection("Other Tags", otherTags)}
          </ScrollView>

          <View style={styles.buttonsContainer}>
            <TouchableOpacity 
              style={styles.clearButton} 
              onPress={handleClearAll}
            >
              <Text style={styles.clearButtonText}>Clear all</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.applyButton} 
              onPress={handleConfirm}
            >
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayTouchable: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: 'rgba(36, 37, 38, 0.95)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    paddingBottom: 32,
    maxHeight: '80%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 4,
  },
  tagsContainer: {
    maxHeight: 400,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 1000,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    margin: 4,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  tagButtonSelected: {
    backgroundColor: '#FFFFFF',
  },
  tagButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  tagButtonTextSelected: {
    color: '#000000',
    fontWeight: '600',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  clearButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  applyButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },
  applyButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '500',
  },
}); 