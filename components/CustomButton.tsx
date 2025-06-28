import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  GestureResponderEvent,
  Image,
  ImageSourcePropType,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Fonts } from '@/constants/Fonts'; // Adjust the import path as necessary

type ButtonVariant = 'solid' | 'outline' | 'text';

type Props = {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
  icon?: keyof typeof FontAwesome.glyphMap;
  variant?: ButtonVariant;
  image?: ImageSourcePropType; // <-- Updated type for image prop
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
};

export default function CustomButton({
  title,
  onPress,
  icon,
  variant = 'solid',
  image,
  backgroundColor,
  textColor,
  borderColor,
}: Props) {
  const isOutline = variant === 'outline';
  const isText = variant === 'text';

  const defaultBg = isText || isOutline ? 'transparent' : '#007AFF';
  const defaultText = isOutline || isText ? '#007AFF' : '#000';
  const defaultBorder = isOutline ? '#007AFF' : 'transparent';

  const finalBgColor = backgroundColor ?? defaultBg;
  const finalTextColor = textColor ?? defaultText;
  const finalBorderColor = borderColor ?? defaultBorder;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.button,
        {
          backgroundColor: finalBgColor,
          borderColor: finalBorderColor,
          borderWidth: isOutline ? 0.5 : 0,
        },
      ]}
    >
      {/* Render image if provided */}
      {image && <Image source={image} style={styles.image} />}

      {/* Render icon if provided */}
      {icon && (
        <FontAwesome
          name={icon}
          size={20}
          color={finalTextColor}
          style={styles.icon}
        />
      )}

      <Text style={[styles.text, { color: finalTextColor }]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 20,
    width: '100%',
    marginBottom: 8,
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    fontFamily: Fonts.bold,
  },
  icon: {
    marginRight: 8,
  },
  image: {
    width: 24,
    height: 24,
    marginRight: 8,
    resizeMode: 'contain',
  },
});
