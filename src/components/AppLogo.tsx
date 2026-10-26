import React from 'react';
import { Image, ImageStyle, StyleProp, StyleSheet, View, Text } from 'react-native';
import { AppColors } from '../constants/theme';

interface AppLogoProps {
  size?: number;
  width?: number;
  height?: number;
  style?: StyleProp<ImageStyle>;
  resizeMode?: 'contain' | 'cover' | 'stretch' | 'center';
  withBadge?: boolean;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 40,
  width,
  height,
  style,
  resizeMode = 'contain',
  withBadge = false,
}) => {
  const finalWidth = width || size;
  const finalHeight = height || size;

  const image = (
    <Image
      source={require('../../assets/logoyazi512.png')}
      style={[
        {
          width: finalWidth,
          height: finalHeight,
        },
        style,
      ]}
      resizeMode={resizeMode}
    />
  );

  if (withBadge) {
    return (
      <View style={styles.badgeWrapper}>
        {image}
        <View style={styles.adminTag}>
          <Text style={styles.adminTagText}>ADMIN</Text>
        </View>
      </View>
    );
  }

  return image;
};

const styles = StyleSheet.create({
  badgeWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminTag: {
    position: 'absolute',
    bottom: -4,
    right: -8,
    backgroundColor: AppColors.accent,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: AppColors.surface,
  },
  adminTagText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: AppColors.white,
    letterSpacing: 0.5,
  },
});
