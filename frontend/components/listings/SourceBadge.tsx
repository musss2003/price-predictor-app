/**
 * Reusable Source Badge Component
 * Displays data source with consistent styling
 */

import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { getSourceConfig } from '@/config/sources.config'
import { DataSource } from '@/types/listing.types'

interface SourceBadgeProps {
  source: Exclude<DataSource, 'all'>
  size?: 'small' | 'medium' | 'large'
}

export const SourceBadge: React.FC<SourceBadgeProps> = ({ source, size = 'medium' }) => {
  const config = getSourceConfig(source)
  
  const sizeStyles = {
    small: { paddingHorizontal: 6, paddingVertical: 2 },
    medium: { paddingHorizontal: 10, paddingVertical: 4 },
    large: { paddingHorizontal: 14, paddingVertical: 6 }
  }
  
  const textSizeStyles = {
    small: { fontSize: 9 },
    medium: { fontSize: 11 },
    large: { fontSize: 13 }
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
