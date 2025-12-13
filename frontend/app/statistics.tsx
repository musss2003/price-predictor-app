import { LinearGradient } from 'expo-linear-gradient'
import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  RefreshControl,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { MotiView } from 'moti'
import { router } from 'expo-router'
import { getStatisticsSummary, getStatisticsByMunicipality, getSyncStatus } from '@/services/api'

interface Statistics {
  total_listings: number
  olx_listings: number
  nekretnine_listings: number
  price_stats: {
    min: number
    max: number
    avg: number
  }
}

interface MunicipalityStats {
  municipality: string
  total_count: number
  avg_price: number
  avg_deal_score: number
  avg_size: number
}

interface SyncSource {
  source: string
  last_sync_at: string | null
  total_listings: number
  active_listings: number
}

export default function StatisticsScreen() {
  const [stats, setStats] = useState<Statistics | null>(null)
  const [municipalityStats, setMunicipalityStats] = useState<MunicipalityStats[]>([])
  const [syncStatus, setSyncStatus] = useState<SyncSource[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchStatistics()
  }, [])

  const fetchStatistics = async () => {
    setError('')
    
    try {
      const [summaryResult, municipalityResult, syncResult] = await Promise.all([
        getStatisticsSummary(),
        getStatisticsByMunicipality(),
        getSyncStatus()
      ])

      if (summaryResult.success) {
        setStats(summaryResult.data)
      }

      if (municipalityResult.success) {
        setMunicipalityStats(municipalityResult.data || [])
      }

      if (syncResult.success) {
        setSyncStatus(syncResult.sources || [])
      }
    } catch (err) {
      console.error(err)
      setError('Failed to load statistics')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchStatistics()
  }

  const StatCard = ({ title, value, subtitle, icon, color, index }: any) => (
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'timing', duration: 400, delay: index * 100 }}
      style={[styles.statCard, { borderLeftColor: color }]}
    >
      <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statValue}>{value}</Text>
        {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
      </View>
    </MotiView>
  )

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Statistics</Text>
            <View style={{ width: 40 }} />
          </View>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Loading statistics...</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Market Statistics</Text>
          <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
            <Ionicons name="refresh" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>Real-time market insights</Text>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#667eea']} />
        }
      >
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={64} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchStatistics}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Overview Stats */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📊 Overview</Text>
              <StatCard
                title="Total Properties"
                value={stats?.total_listings.toLocaleString() || '0'}
                subtitle="Active listings"
                icon="home"
                color="#667eea"
                index={0}
              />
              <StatCard
                title="Average Price"
                value={`${(stats?.price_stats.avg || 0).toLocaleString()} KM`}
                subtitle={`≈ €${((stats?.price_stats.avg || 0) / 2).toLocaleString()}`}
                icon="cash"
                color="#10b981"
                index={1}
              />
              <View style={styles.priceRange}>
                <View style={styles.priceRangeItem}>
                  <Text style={styles.priceRangeLabel}>Lowest</Text>
                  <Text style={styles.priceRangeValue}>
                    {(stats?.price_stats.min || 0).toLocaleString()} KM
                  </Text>
                </View>
                <View style={styles.priceRangeDivider} />
                <View style={styles.priceRangeItem}>
                  <Text style={styles.priceRangeLabel}>Highest</Text>
                  <Text style={styles.priceRangeValue}>
                    {(stats?.price_stats.max || 0).toLocaleString()} KM
                  </Text>
                </View>
              </View>
            </View>

            {/* Source Breakdown */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📦 Data Sources</Text>
              <View style={styles.sourceCards}>
                <MotiView
                  from={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ delay: 200 }}
                  style={[styles.sourceCard, { borderTopColor: '#4A90E2' }]}
                >
                  <Text style={styles.sourceTitle}>OLX Bosnia</Text>
                  <Text style={styles.sourceCount}>{stats?.olx_listings.toLocaleString() || '0'}</Text>
                  <Text style={styles.sourceLabel}>listings</Text>
                </MotiView>
                <MotiView
                  from={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ delay: 300 }}
                  style={[styles.sourceCard, { borderTopColor: '#E2574C' }]}
                >
                  <Text style={styles.sourceTitle}>Nekretnine.ba</Text>
                  <Text style={styles.sourceCount}>{stats?.nekretnine_listings.toLocaleString() || '0'}</Text>
                  <Text style={styles.sourceLabel}>listings</Text>
                </MotiView>
              </View>
            </View>

            {/* Sync Status */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🔄 Last Sync</Text>
              {syncStatus.map((source, index) => (
                <MotiView
                  key={source.source}
                  from={{ opacity: 0, translateX: -20 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{ delay: 400 + index * 100 }}
                  style={styles.syncCard}
                >
                  <View style={styles.syncHeader}>
                    <Text style={styles.syncSource}>{source.source.toUpperCase()}</Text>
                    <View style={[
                      styles.syncStatus,
                      { backgroundColor: source.last_sync_at ? '#10b981' : '#666' }
                    ]}>
                      <Text style={styles.syncStatusText}>
                        {source.last_sync_at ? 'Active' : 'Pending'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.syncTime}>
                    Last sync: {formatDate(source.last_sync_at)}
                  </Text>
                  <View style={styles.syncStats}>
                    <View>
                      <Text style={styles.syncStatValue}>{source.total_listings}</Text>
                      <Text style={styles.syncStatLabel}>Total</Text>
                    </View>
                    <View>
                      <Text style={styles.syncStatValue}>{source.active_listings}</Text>
                      <Text style={styles.syncStatLabel}>Active</Text>
                    </View>
                  </View>
                </MotiView>
              ))}
            </View>

            {/* Municipality Breakdown */}
            {municipalityStats.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📍 By Municipality</Text>
                {municipalityStats.slice(0, 10).map((muni, index) => (
                  <MotiView
                    key={muni.municipality}
                    from={{ opacity: 0, translateX: -20 }}
                    animate={{ opacity: 1, translateX: 0 }}
                    transition={{ delay: 600 + index * 50 }}
                    style={styles.municipalityCard}
                  >
                    <View style={styles.municipalityHeader}>
                      <Text style={styles.municipalityName}>{muni.municipality}</Text>
                      <Text style={styles.municipalityCount}>{muni.total_count} listings</Text>
                    </View>
                    <View style={styles.municipalityStats}>
                      <View style={styles.municipalityStat}>
                        <Text style={styles.municipalityStatLabel}>Avg Price</Text>
                        <Text style={styles.municipalityStatValue}>
                          {Math.round(muni.avg_price).toLocaleString()} KM
                        </Text>
                      </View>
                      <View style={styles.municipalityStat}>
                        <Text style={styles.municipalityStatLabel}>Avg Size</Text>
                        <Text style={styles.municipalityStatValue}>
                          {Math.round(muni.avg_size)} m²
                        </Text>
                      </View>
                      <View style={styles.municipalityStat}>
                        <Text style={styles.municipalityStatLabel}>Deal Score</Text>
                        <Text style={styles.municipalityStatValue}>
                          {Math.round(muni.avg_deal_score)}
                        </Text>
                      </View>
                    </View>
                  </MotiView>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statContent: {
    flex: 1,
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  statSubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 2,
  },
  priceRange: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  priceRangeItem: {
    flex: 1,
    alignItems: 'center',
  },
  priceRangeDivider: {
    width: 1,
    backgroundColor: '#e5e5e5',
    marginHorizontal: 16,
  },
  priceRangeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  priceRangeValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  sourceCards: {
    flexDirection: 'row',
    gap: 12,
  },
  sourceCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderTopWidth: 4,
  },
  sourceTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  sourceCount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  sourceLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  syncCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  syncHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  syncSource: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  syncStatus: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  syncStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  syncTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  syncStats: {
    flexDirection: 'row',
    gap: 24,
  },
  syncStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  syncStatLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  municipalityCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  municipalityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  municipalityName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  municipalityCount: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
  },
  municipalityStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  municipalityStat: {
    alignItems: 'center',
  },
  municipalityStatLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  municipalityStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
})
