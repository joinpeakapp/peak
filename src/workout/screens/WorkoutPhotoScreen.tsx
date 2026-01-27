import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  Platform,
  Dimensions,
  ActivityIndicator,
  Alert
} from 'react-native';
import { CameraView, CameraType, FlashMode, Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList, SummaryStackParamList } from '../../types/navigation';
import { useActiveWorkout } from '../contexts/ActiveWorkoutContext';
import { PhotoStorageService } from '../../services/photoStorageService';

type WorkoutPhotoRouteProp = RouteProp<SummaryStackParamList, 'WorkoutPhoto'>;

export const WorkoutPhotoScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<WorkoutPhotoRouteProp>();
  const { workout } = route.params;
  const { updatePhotoInfo } = useActiveWorkout();
  
  // Référence à la caméra
  const cameraRef = useRef<any>(null);
  // Flag pour vérifier que le composant est toujours monté
  const isMountedRef = useRef(true);
  
  // États pour la caméra
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraType, setCameraType] = useState<CameraType>('front');
  const [flashMode, setFlashMode] = useState<FlashMode>('off');
  const [isCapturing, setIsCapturing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  
  // Nettoyer le flag au démontage
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Demander les permissions de caméra et galerie au chargement
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      
      // Demander aussi les permissions de la galerie
      await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          "Permissions requises",
          "Nous avons besoin de l'accès à votre caméra pour prendre une photo de votre entraînement.",
          [
            { 
              text: "Réessayer", 
              onPress: async () => {
                const { status } = await Camera.requestCameraPermissionsAsync();
                setHasPermission(status === 'granted');
              }
            },
            {
              text: "Annuler",
              onPress: () => navigation.goBack(),
              style: "cancel"
            }
          ]
        );
      }
    })();
  }, []);

  // Basculer entre les caméras avant et arrière
  const toggleCameraType = () => {
    setCameraType(current => (current === 'back' ? 'front' : 'back'));
  };
  
  // Changer le mode de flash
  const toggleFlashMode = () => {
    setFlashMode(current => {
      switch (current) {
        case 'off':
          return 'on';
        case 'on':
          return 'auto';
        case 'auto':
          return 'off';
        default:
          return 'off';
      }
    });
  };
  
  // Afficher l'icône de flash appropriée
  const getFlashIcon = () => {
    switch(flashMode) {
      case 'on':
        return "flash";
      case 'auto':
        return "flash-outline";
      case 'off':
      default:
        return "flash-off";
    }
  };
  
  // 🖼️ Traiter une photo (depuis la caméra ou la galerie)
  const processPhoto = async (photoUri: string, isFromGallery: boolean = false) => {
    // Vérifier que le composant est toujours monté
    if (!isMountedRef.current) {
      console.warn('🖼️ [WorkoutPhoto] Component unmounted, skipping photo processing');
      return;
    }
    
    setIsCapturing(true);
    
    try {
      // Sauvegarder la photo de manière permanente
      const permanentUri = await PhotoStorageService.saveWorkoutPhoto(photoUri, workout.id);
      
      // Vérifier à nouveau que le composant est toujours monté avant la navigation
      if (!isMountedRef.current) {
        console.warn('🖼️ [WorkoutPhoto] Component unmounted during photo processing');
        return;
      }
      
      // Mettre à jour l'URI de la photo et l'info de la caméra
      updatePhotoInfo(permanentUri, isFromGallery ? false : cameraType === 'front');
      
      // Naviguer vers l'écran de prévisualisation avec l'URI permanent
      navigation.navigate('SummaryFlow', {
        screen: 'WorkoutOverview',
        params: {
          workout: { ...workout, photo: permanentUri, isFrontCamera: isFromGallery ? false : cameraType === 'front' },
          photoUri: permanentUri,
          sourceType: 'tracking'
        }
      });
    } catch (error) {
      console.error('🖼️ [WorkoutPhoto] Error processing picture:', error);
      // Ne pas afficher d'alerte si le composant est démonté
      if (isMountedRef.current) {
        Alert.alert("Erreur", "Impossible de traiter la photo. Veuillez réessayer.");
      }
    } finally {
      if (isMountedRef.current) {
        setIsCapturing(false);
      }
    }
  };

  // 🖼️ Prendre une photo avec optimisation automatique
  const takePicture = async () => {
    // Vérifier que le composant est toujours monté et que la caméra est disponible
    if (!isMountedRef.current || !cameraRef.current || isCapturing) {
      return;
    }
    
    try {
      setIsCapturing(true);
      
      // Vérifier que la caméra est toujours disponible avant de prendre la photo
      if (!cameraRef.current) {
        console.warn('🖼️ [WorkoutPhoto] Camera ref is null');
        setIsCapturing(false);
        return;
      }
      
      // Prendre la photo avec qualité maximale
      const options = {
        quality: 1, // Qualité maximale pour la photo originale
        base64: false,
        skipProcessing: Platform.OS === 'android', // Pour éviter un crash sur Android
      };
      
      const photo = await cameraRef.current.takePictureAsync(options);
      
      // Vérifier que le composant est toujours monté après la capture
      if (!isMountedRef.current) {
        console.warn('🖼️ [WorkoutPhoto] Component unmounted during photo capture');
        return;
      }
      
      // Vérifier que la photo a bien été capturée
      if (!photo || !photo.uri) {
        throw new Error('Photo capture returned invalid result');
      }
      
      await processPhoto(photo.uri, false);
    } catch (error: any) {
      console.error('🖼️ [WorkoutPhoto] Error taking picture:', error);
      
      // Gérer spécifiquement l'erreur de caméra démontée
      if (error?.message?.includes('unmounted') || error?.message?.includes('Camera unmounted')) {
        console.warn('🖼️ [WorkoutPhoto] Camera was unmounted during capture - this is expected if user navigated away');
        // Ne pas afficher d'erreur à l'utilisateur dans ce cas
      } else if (isMountedRef.current) {
        // Afficher l'erreur seulement si le composant est toujours monté
        Alert.alert("Erreur", "Impossible de prendre une photo. Veuillez réessayer.");
      }
    } finally {
      if (isMountedRef.current) {
        setIsCapturing(false);
      }
    }
  };

  // 📷 Sélectionner une photo depuis la galerie
  const pickImageFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          "Permissions requises",
          "Nous avons besoin de l'accès à votre galerie pour sélectionner une photo."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        await processPhoto(result.assets[0].uri, true);
      }
    } catch (error) {
      console.error('🖼️ [WorkoutPhoto] Error picking image:', error);
      Alert.alert("Erreur", "Impossible de sélectionner une photo. Veuillez réessayer.");
    }
  };
  
  // Annuler et retourner à l'écran précédent
  const handleCancel = () => {
    navigation.goBack();
  };
  

  // Afficher un écran de chargement pendant la vérification des permissions
  if (hasPermission === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>Chargement de la caméra...</Text>
      </View>
    );
  }
  
  // Afficher un message si les permissions ont été refusées
  if (hasPermission === false) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="camera-outline" size={64} color="#FFFFFF" />
        <Text style={styles.errorText}>Accès à la caméra refusé</Text>
        <Text style={styles.errorDescription}>
          Nous avons besoin de l'accès à votre caméra pour prendre une photo.
        </Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
          }}
        >
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera view en plein écran */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={cameraType}
        flash={flashMode}
        zoom={0}
      />
      
      {/* Bouton back en haut à gauche - en dehors du SafeAreaView pour éviter les problèmes de touch */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={handleCancel}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      
      <SafeAreaView style={styles.safeArea}>
        
        {/* Texte explicatif centré en haut */}
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerText} numberOfLines={2}>
            Take a picture and create your workout card!
          </Text>
        </View>
        
        {/* Indicateur d'optimisation */}
        {isOptimizing && (
          <View style={styles.optimizingOverlay}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.optimizingText}>Optimizing photo...</Text>
          </View>
        )}
      </SafeAreaView>
        
      {/* Contrôles inférieurs */}
      <View style={styles.bottomControls}>
        {/* Bouton galerie à gauche */}
        <TouchableOpacity 
          style={styles.floatingButton}
          onPress={pickImageFromGallery}
          disabled={isCapturing || isOptimizing}
        >
          <Ionicons name="images" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        
        {/* Bouton capture centré */}
        <TouchableOpacity 
          style={[
            styles.captureButton,
            (isCapturing || isOptimizing) && styles.capturingButton
          ]}
          onPress={takePicture}
          disabled={isCapturing || isOptimizing}
        >
          {(isCapturing || isOptimizing) ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <View style={styles.captureButtonInner} />
          )}
        </TouchableOpacity>
        
        {/* Colonne droite : flash, changer caméra */}
        <View style={styles.rightControls}>
          <TouchableOpacity 
            style={styles.floatingButton} 
            onPress={toggleFlashMode}
          >
            <Ionicons name={getFlashIcon()} size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.floatingButton, { marginTop: 12 }]}
            onPress={toggleCameraType}
            disabled={isCapturing || isOptimizing}
          >
            <Ionicons name="camera-reverse" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  cameraWrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  camera: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  safeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#191A1D',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 20,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#191A1D',
    padding: 20,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
  },
  errorDescription: {
    color: '#CCCCCC',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  retryButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    elevation: 10,
  },
  headerTextContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    paddingHorizontal: 60,
    maxWidth: width * 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  floatingButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optimizingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  optimizingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  bottomControls: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 50 : 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 40,
    zIndex: 10,
  },
  rightControls: {
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  capturingButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
  }
}); 