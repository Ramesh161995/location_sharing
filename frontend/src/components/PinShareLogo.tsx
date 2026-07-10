import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { useTheme } from '../contexts/ThemeContext';

interface PinShareLogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  style?: ViewStyle;
  variant?: 'horizontal' | 'vertical';
}

const PinShareLogo: React.FC<PinShareLogoProps> = ({ 
  size = 'medium', 
  showText = true,
  style,
  variant = 'horizontal'
}) => {
  const { theme } = useTheme();
  const isDark = theme.isDark;
  const videoRef = useRef<Video>(null);
  
  // Size configurations
  const sizeMap = {
    small: { icon: 60, fontSize: 16, spacing: 6 },
    medium: { icon: 120, fontSize: 24, spacing: 10 },
    large: { icon: 180, fontSize: 36, spacing: 14 },
  };
  
  const config = sizeMap[size];
  const textColor = isDark ? '#ffffff' : '#1a1a1a';
  const accentColor = isDark ? '#f093fb' : '#667eea';

  useEffect(() => {
    // Play video when component mounts
    if (videoRef.current) {
      videoRef.current.playAsync();
    }
  }, []);

  const containerStyle = variant === 'vertical' 
    ? [styles.containerVertical, style]
    : [styles.container, style];

  return (
    <View style={containerStyle}>
      <View style={[
        variant === 'vertical' ? styles.iconContainerVertical : styles.iconContainer,
        { width: config.icon, height: config.icon }
      ]}>
        <Video
          ref={videoRef}
          source={require('../../assets/Blue Black Modern Map Location Logo.mp4')}
          style={styles.video}
          resizeMode={ResizeMode.CONTAIN}
          isLooping
          isMuted
          shouldPlay
          useNativeControls={false}
        />
      </View>
     
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  containerVertical: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 10,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  iconContainerVertical: {
    marginBottom: 10,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  video: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  textContainerVertical: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  logoText: {
    fontWeight: '700',
    letterSpacing: 1,
  },
  logoTextAccent: {
    fontWeight: '700',
    letterSpacing: 1,
  },
});

export default PinShareLogo;
