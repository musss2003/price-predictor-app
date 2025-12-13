# Scalable Architecture Guide

## 🏗️ Overview

This app has been refactored into a scalable, maintainable architecture that makes it easy to:
- Add new property data sources
- Create consistent UI across screens
- Share business logic and state management
- Maintain type safety throughout

## 📁 Project Structure

```
frontend/
├── types/
│   └── listing.types.ts          # Core TypeScript definitions
├── config/
│   └── sources.config.ts         # Data source configuration
├── utils/
│   └── formatting.utils.ts       # Formatting & display utilities
├── components/
│   ├── listings/
│   │   ├── ListingCard.tsx       # Reusable listing card
│   │   ├── SourceBadge.tsx       # Source identifier badge
│   │   └── index.ts              # Exports
│   └── filters/
│       ├── FilterModal.tsx       # Generic filter interface
│       └── index.ts              # Exports
├── hooks/
│   └── useListings.ts            # Custom hook for listings data
└── services/
    └── api.ts                    # API client
```

## 🔌 Adding a New Data Source

To add a new property source (e.g., "Klix.ba"), follow these steps:

### Step 1: Update Types
In `types/listing.types.ts`:
```typescript
export type DataSource = 'olx' | 'nekretnine' | 'klix' | 'all'
```

### Step 2: Add Source Configuration
In `config/sources.config.ts`:
```typescript
export const DATA_SOURCES: Record<Exclude<DataSource, 'all'>, SourceConfig> = {
  olx: { ... },
  nekretnine: { ... },
  klix: {
    id: 'klix',
    label: 'Klix.ba',
    color: '#FF5722',
    backgroundColor: '#FF572220',
    website: 'https://www.klix.ba'
  }
}
```

**That's it!** The new source will automatically appear in:
- Filter dropdowns
- Source badges
- API calls
- Type checking

## 🎨 Using Reusable Components

### ListingCard
```typescript
import { ListingCard } from '@/components/listings'

<ListingCard 
  listing={item} 
  index={0} 
  showSource={true}
  onPress={(listing) => console.log(listing)}
/>
```

### SourceBadge
```typescript
import { SourceBadge } from '@/components/listings'

<SourceBadge source="olx" size="medium" />
```

### FilterModal
```typescript
import { FilterModal } from '@/components/filters'

<FilterModal
  visible={showModal}
  filters={filters}
  filterOptions={filterOptions}
  totalCount={100}
  onClose={() => setShowModal(false)}
  onFiltersChange={setFilters}
  onClearAll={clearFilters}
/>
```

## 🪝 Using the useListings Hook

```typescript
import { useListings } from '@/hooks/useListings'

const MyScreen = () => {
  const {
    listings,           // Current listings array
    loading,            // Initial loading state
    loadingMore,        // Pagination loading
    error,              // Error message
    totalCount,         // Total results
    filters,            // Current filters
    filterOptions,      // Available filter options
    setFilters,         // Update filters
    clearFilters,       // Reset all filters
    loadMore,           // Load next page
    refresh             // Refresh from start
  } = useListings({ 
    pageSize: 50,
    initialFilters: { source: 'olx' }
  })

  return (
    <FlashList
      data={listings}
      onEndReached={loadMore}
      onRefresh={refresh}
      refreshing={loading}
    />
  )
}
```

## 🛠️ Utility Functions

```typescript
import {
  formatPrice,
  formatPriceEur,
  formatSquareMeters,
  formatRooms,
  getDealScoreColor,
  getDealScoreLabel,
  calculatePricePerM2,
  formatPricePerM2,
  formatDate,
  formatRelativeTime,
  truncateText
} from '@/utils/formatting.utils'

// Examples
formatPrice(250000)           // "250,000 KM"
formatPriceEur(250000)        // "≈ €125,000"
getDealScoreColor(85)         // "#3b82f6" (blue)
getDealScoreLabel(85)         // "Good Deal"
formatPricePerM2(200000, 80)  // "2,500 KM/m²"
```

## 📝 Type Safety

All components and hooks are fully typed:

```typescript
import { Listing, ListingFilters, DataSource } from '@/types/listing.types'

const listing: Listing = {
  id: 1,
  source: 'olx',
  title: 'Beautiful apartment',
  price_numeric: 200000,
  // ... TypeScript will enforce all required fields
}

const filters: ListingFilters = {
  source: 'all',
  priceMin: '100000',
  priceMax: '300000',
  // ... TypeScript will enforce correct types
}
```

## 🔄 Migration Path

### Old Code (explore.tsx)
```typescript
// 1000+ lines of mixed concerns
// Hardcoded source configs
// Duplicate filter logic
// Difficult to maintain
```

### New Code (explore-refactored.tsx)
```typescript
// ~300 lines, clean separation
// Uses reusable components
// Centralized configuration
// Easy to extend
```

### Migration Steps:
1. ✅ Types defined
2. ✅ Config created
3. ✅ Components built
4. ✅ Hook implemented
5. ✅ New screen created
6. ⏳ Replace old explore.tsx
7. ⏳ Update other screens

## 🎯 Best Practices

### DO ✅
- Use `useListings` hook for data fetching
- Import types from `types/listing.types.ts`
- Use utility functions for formatting
- Add new sources through config only
- Keep components small and focused
- Use TypeScript strictly

### DON'T ❌
- Hardcode source names/colors
- Duplicate filtering logic
- Mix business logic with UI
- Skip type annotations
- Create source-specific components

## 📊 Example: Creating a New Screen

```typescript
import React, { useState } from 'react'
import { View } from 'react-native'
import { useListings } from '@/hooks/useListings'
import { ListingCard } from '@/components/listings'
import { FilterModal } from '@/components/filters'

export default function NewListingsScreen() {
  const [showFilters, setShowFilters] = useState(false)
  
  const {
    listings,
    loading,
    filters,
    filterOptions,
    setFilters,
    clearFilters,
    loadMore,
    refresh
  } = useListings()

  return (
    <View>
      <FlashList
        data={listings}
        renderItem={({ item, index }) => (
          <ListingCard listing={item} index={index} />
        )}
        onEndReached={loadMore}
        onRefresh={refresh}
        refreshing={loading}
      />
      
      <FilterModal
        visible={showFilters}
        filters={filters}
        filterOptions={filterOptions}
        onClose={() => setShowFilters(false)}
        onFiltersChange={setFilters}
        onClearAll={clearFilters}
      />
    </View>
  )
}
```

That's ~30 lines for a fully functional, filterable listings screen! 🚀

## 🧪 Testing New Sources

1. Add source to `sources.config.ts`
2. Backend adds scraper for new source
3. Frontend automatically supports it
4. Test filter dropdown shows new source
5. Test source badge displays correctly
6. Test API calls include new source

## 📚 Further Reading

- `types/listing.types.ts` - All TypeScript definitions
- `config/sources.config.ts` - Source configuration
- `hooks/useListings.ts` - Data fetching logic
- `components/listings/ListingCard.tsx` - Card implementation
- `components/filters/FilterModal.tsx` - Filter UI

## 🤝 Contributing

When adding features:
1. Check if reusable component exists
2. Add types to `types/` first
3. Update config if needed
4. Create/update components
5. Document in this guide
