/**
 * Reusable Source Badge Component
 * Displays data source with consistent styling
 */

import React from 'react'
import { View, Text, StyleSheet, Image } from 'react-native'
import { getSourceConfig } from '@/config/sources.config'
import { DataSource } from '@/types/listing.types'

interface SourceBadgeProps {
  source: Exclude<DataSource, 'all'>
  size?: 'small' | 'medium' | 'large'
}

export const SourceBadge: React.FC<SourceBadgeProps> = ({ source, size = 'medium' }) => {
  const config = getSourceConfig(source)
  
  const sizeStyles = {
    small: { paddingHorizontal: 6, paddingVertical: 1 },
    medium: { paddingHorizontal: 10, paddingVertical: 2},
    large: { paddingHorizontal: 14, paddingVertical: 3 }
  }
  
  const textSizeStyles = {
    small: { fontSize: 9 },
    medium: { fontSize: 11 },
    large: { fontSize: 13 }
  }
  
  const imageSizeStyles = {
    small: { width: 40, height: 14 },
    medium: { width: 50, height: 18 },
    large: { width: 80, height: 52 }
  }
  
  // Use OLX logo image for olx source
  if (source === 'olx') {
    return (
      <Image
        source={require('@/assets/images/olx-icon.png')}
        style={imageSizeStyles[size]}
        resizeMode="contain"
      />
    )
  }
  
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.color },
        sizeStyles[size]
      ]}
    >
      <Text style={[styles.text, textSizeStyles[size]]}>
        {config.label}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 8,
    alignSelf: 'flex-start'
  },
  text: {
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  }
})
