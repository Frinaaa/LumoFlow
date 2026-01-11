import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';

const { width } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen = ({ onFinish }: SplashScreenProps) => {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('INITIALIZING CORE...');
  const [isReady, setIsReady] = useState(false);
  
  // Animation values
  const logoFloat = new Animated.Value(0);
  const fadeAnim = new Animated.Value(1);

  // 1. Loading Logic
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          finishLoading();
          return 100;
        }

        // Update Text based on progress
        const newProgress = prev + 1;
        if (newProgress === 30) setStatusText('LOADING MODULES...');
        if (newProgress === 70) setStatusText('ESTABLISHING NEURAL LINK...');
        if (newProgress === 90) setStatusText('FINALIZING...');
        
        return newProgress;
      });
    }, 30); // Speed of loader

    // 2. Logo Floating Animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoFloat, {
          toValue: -10,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(logoFloat, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
      ])
    ).start();

    return () => clearInterval(interval);
  }, []);

  const finishLoading = () => {
    setStatusText('READY');
    setIsReady(true);
  };

  const handleEnter = () => {
    // Fade out animation
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 800,
      useNativeDriver: true,
    }).start(() => {
      onFinish(); // Switch to main app
    });
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Background Grid Simulation (Simple lines for Windows perf) */}
      <View style={styles.bgGrid} />
      
      {/* Ambient Glow */}
      <View style={styles.ambientGlow} />

      <View style={styles.content}>
        
        {/* Logo Icon */}
        <Animated.View style={[styles.logoContainer, { transform: [{ translateY: logoFloat }] }]}>
          <Text style={styles.logoIcon}>⚡</Text>
        </Animated.View>

        {/* Title */}
        <Text style={styles.title}>
          LUMO<Text style={styles.titleHighlight}>FLOW</Text>
        </Text>
        
        <Text style={styles.subtitle}>Illuminating Workflows</Text>

        {/* Loading Bar */}
        {!isReady ? (
          <View style={styles.loaderContainer}>
            <View style={styles.statusRow}>
              <Text style={styles.statusText}>{statusText}</Text>
              <Text style={styles.statusText}>{progress}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
          </View>
        ) : (
          /* Enter Button (Appears when ready) */
          <TouchableOpacity style={styles.enterBtn} onPress={handleEnter}>
            <Text style={styles.enterBtnText}>Enter Application →</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

// --- Styles Translation ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050508',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bgGrid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.1,
    backgroundColor: '#050508',
    // In React Native Windows, simple backgrounds perform best
    borderWidth: 1,
    borderColor: '#333',
  },
  ambientGlow: {
    position: 'absolute',
    width: 600,
    height: 600,
    backgroundColor: '#bc13fe',
    opacity: 0.1,
    borderRadius: 300,
    transform: [{ scale: 1.2 }],
  },
  content: {
    zIndex: 10,
    alignItems: 'center',
    width: 400, // Fixed width for desktop feel
  },
  logoContainer: {
    width: 60,
    height: 60,
    backgroundColor: 'rgba(0, 242, 255, 0.1)',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 255, 0.3)',
    marginBottom: 15,
    shadowColor: '#00f2ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  logoIcon: {
    fontSize: 30,
    color: '#00f2ff',
  },
  title: {
    fontSize: 56,
    fontWeight: '800', // Boldest available without custom fonts
    color: '#ffffff',
    letterSpacing: 4,
    marginBottom: 5,
  },
  titleHighlight: {
    color: '#00f2ff',
    textShadowColor: 'rgba(0, 242, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    letterSpacing: 6,
    textTransform: 'uppercase',
    marginBottom: 40,
  },
  loaderContainer: {
    width: '100%',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusText: {
    fontFamily: 'Courier New', // Monospace fallback for Windows
    fontSize: 12,
    color: '#bc13fe',
    fontWeight: 'bold',
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#222',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#bc13fe', // Use solid color or install linear-gradient lib
  },
  enterBtn: {
    marginTop: 20,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderColor: '#00f2ff',
    borderWidth: 1,
    borderRadius: 30,
    backgroundColor: 'transparent',
  },
  enterBtnText: {
    color: '#ffffff',
    fontSize: 16,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
});

export default SplashScreen;