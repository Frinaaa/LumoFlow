import React, { useState } from 'react';
import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NewAppScreen } from '@react-native/new-app-screen';

// Import your new component
import SplashScreen from './SplashScreen';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  
  // State to track if we are in the Splash Screen or Main App
  const [showSplash, setShowSplash] = useState(true);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#050508" />
      
      {showSplash ? (
        // Show Splash Screen
        <SplashScreen onFinish={() => setShowSplash(false)} />
      ) : (
        // Show Main App Content
        <AppContent />
      )}
      
    </SafeAreaProvider>
  );
}

function AppContent() {
  return (
    <View style={styles.container}>
      {/* 
         Replace NewAppScreen with your actual Editor Layout later. 
         For now, this is the default React Native template.
      */}
      <NewAppScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050508', // Match background to prevent white flash
  },
});

export default App;