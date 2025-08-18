import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SimpleLogo = ({ size = 100 }) => {
  const styles = StyleSheet.create({
    container: {
      width: size,
      height: size,
      backgroundColor: '#6366F1',
      borderRadius: size / 2,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 5,
    },
    box: {
      fontSize: size * 0.4,
      color: '#FFD700',
    },
    wings: {
      fontSize: size * 0.2,
      color: '#FFFFFF',
      position: 'absolute',
      top: size * 0.25,
    },
    leftWing: {
      left: size * 0.1,
    },
    rightWing: {
      right: size * 0.1,
    },
    glasses: {
      fontSize: size * 0.15,
      color: '#2C3E50',
      position: 'absolute',
      top: size * 0.15,
    }
  });

  return (
    <View style={styles.container}>
      {/* Wings */}
      <Text style={[styles.wings, styles.leftWing]}>〈</Text>
      <Text style={[styles.wings, styles.rightWing]}>〉</Text>
      
      {/* Glasses */}
      <Text style={styles.glasses}>🕶️</Text>
      
      {/* Package box */}
      <Text style={styles.box}>📦</Text>
    </View>
  );
};

export default SimpleLogo;