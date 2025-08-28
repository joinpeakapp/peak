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
  Alert,
  GestureResponderEvent
} from 'react-native';
import Slider from '@react-native-community/slider';
import { CameraView, CameraType, FlashMode, Camera } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList, SummaryStackParamList } from '../../types/navigation';
import ImageOptimizationService from '../../services/imageOptimizationService';
import { useActiveWorkout } from '../contexts/ActiveWorkoutContext';

type WorkoutPhotoRouteProp = RouteProp<SummaryStackParamList, 'WorkoutPhoto'>;

export const WorkoutPhotoScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<WorkoutPhotoRouteProp>();
  const { workout } = route.params;
  const { updatePhotoUri } = useActiveWorkout();
  
  // Référence à la caméra
  const cameraRef = useRef<any>(null);
  
  // États pour la caméra
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraType, setCameraType] = useState<CameraType>('back');
  const [flashMode, setFlashMode] = useState<FlashMode>('off');
  const [zoom, setZoom] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showZoomSlider, setShowZoomSlider] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  
  // Demander les permissions de caméra au chargement
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      
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
  
  // 🖼️ Prendre une photo avec optimisation automatique
  const takePicture = async () => {
    if (cameraRef.current && !isCapturing) {
      setIsCapturing(true);
      
      try {
        console.log('🖼️ [WorkoutPhoto] Taking picture...');
        
        // 1. Prendre la photo avec qualité maximale
        const options = {
          quality: 1, // Qualité maximale pour la photo originale
          base64: false,
          skipProcessing: Platform.OS === 'android', // Pour éviter un crash sur Android
        };
        const photo = await cameraRef.current.takePictureAsync(options);
        
        console.log('🖼️ [WorkoutPhoto] Photo taken, starting optimization...');
        setIsOptimizing(true);
        
        // 2. Optimiser la photo avec le service d'optimisation
        const optimizedPhotoUri = await ImageOptimizationService.optimizeWorkoutPhoto(
          photo.uri,
          cameraType // Passer le type de caméra pour correction automatique du miroir
        );
        
        console.log('🖼️ [WorkoutPhoto] Photo optimization completed');
        
        // Sauvegarder l'URI de la photo dans le contexte ActiveWorkout
        updatePhotoUri(optimizedPhotoUri);
        
        setIsOptimizing(false);
        
        // 3. Naviguer vers l'écran de prévisualisation avec l'URI optimisée
        navigation.navigate('SummaryFlow', {
          screen: 'WorkoutOverview',
          params: {
            workout: { ...workout, photo: optimizedPhotoUri },
            photoUri: optimizedPhotoUri,
            sourceType: 'tracking'
          }
        });
      } catch (error) {
        console.error('🖼️ [WorkoutPhoto] Error taking or optimizing picture:', error);
        setIsOptimizing(false);
        Alert.alert("Erreur", "Impossible de prendre une photo. Veuillez réessayer.");
      } finally {
        setIsCapturing(false);
      }
    }
  };
  
  // Annuler et retourner à l'écran précédent
  const handleCancel = () => {
    navigation.goBack();
  };
  
  // Gérer le changement de zoom via le slider
  const handleZoomChange = (value: number) => {
    setZoom(value);
  };
  
  // Afficher le curseur de zoom
  const toggleZoomSlider = () => {
    setShowZoomSlider(current => !current);
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
      <SafeAreaView style={styles.safeArea}>
        {/* En-tête avec le titre */}
        <View style={styles.header}>
          <Text style={styles.headerText}>
            Take a picture and create your workout card !
          </Text>
        </View>
        
        {/* Conteneur de l'appareil photo redimensionné */}
        <View style={styles.cameraContainer}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={cameraType}
            flash={flashMode}
            zoom={zoom}
            ratio="4:3"
          />
          
          {/* Contrôles supérieurs (flash, zoom) */}
          <View style={styles.topControls}>
            <TouchableOpacity 
              style={styles.controlButton} 
              onPress={toggleFlashMode}
            >
              <Ionicons name={getFlashIcon()} size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.controlButton}
              onPress={toggleZoomSlider}
            >
              <Ionicons name="scan" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          {/* Slider de zoom */}
          {showZoomSlider && (
            <View style={styles.zoomContainer}>
              <Slider
                style={styles.zoom}
                minimumValue={0}
                maximumValue={1}
                value={zoom}
                onValueChange={handleZoomChange}
                minimumTrackTintColor="#FFFFFF"
                maximumTrackTintColor="rgba(255, 255, 255, 0.5)"
                thumbTintColor="#FFFFFF"
              />
              <Text style={styles.zoomText}>{Math.round(zoom * 10)}x</Text>
            </View>
          )}
          
          {/* Indicateur d'optimisation */}
          {isOptimizing && (
            <View style={styles.optimizingOverlay}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.optimizingText}>Optimizing photo...</Text>
            </View>
          )}
        </View>
          
        {/* Contrôles inférieurs (annuler, capture, basculer) */}
        <View style={styles.controls}>
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={handleCancel}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
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
          
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={toggleCameraType}
          >
            <Ionicons name="camera-reverse" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0F',
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
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
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  cameraContainer: {
    width: width * 0.9,  // 90% de la largeur de l'écran
    height: height * 0.6, // 60% de la hauteur de l'écran
    overflow: 'hidden',
    borderRadius: 20,
    position: 'relative',
    backgroundColor: '#000',
  },
  camera: {
    width: '100%',
    height: '100%',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
  },
  zoomContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 10,
  },
  zoom: {
    flex: 1,
    height: 40,
  },
  zoomText: {
    color: '#FFFFFF',
    width: 40,
    textAlign: 'center',
    fontSize: 14,
  },
  optimizingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  optimizingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 30,
    paddingHorizontal: 40,
    marginTop: 20,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  capturingButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  captureButtonInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
  }
}); 