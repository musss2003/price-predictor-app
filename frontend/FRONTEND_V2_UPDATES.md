# Frontend V2 API Integration

## Overview
Updated the React Native frontend to use the new enhanced v2 backend APIs with multi-source support, advanced filtering, and new features.

## Updated Files

### 1. `services/api.ts` - Complete API Service Rewrite
**New Features:**
- ✅ Enhanced Listings API v2 with `getListingsV2()`
- ✅ Multi-source support (OLX + Nekretnine.ba)
- ✅ Advanced filtering with ListingsParams interface
- ✅ Search functionality with `searchListings()`
- ✅ Filter options API with `getFilterOptions()`
- ✅ Statistics & analytics endpoints
- ✅ User favorites system with source tracking
- ✅ Saved searches with notifications
- ✅ Notification management
- ✅ Sync status monitoring
- ✅ Health check endpoint
- ✅ Backward compatibility for legacy methods

**New Functions:**
```typescript
// Enhanced Listings
getListingsV2(params: ListingsParams)
getListingDetail(source, id)
getSimilarListings(source, id, limit)

// Search & Discovery
searchListings(query, limit)
getFilterOptions()

// Statistics
getStatisticsSummary()
getStatisticsByMunicipality()

// Favorites
addToFavorites(source, listingId, notes?)
getFavorites()
removeFromFavorites(source, listingId)
checkIfFavorited(source, listingId)

// Saved Searches
createSavedSearch(searchParams, name, notifyOnNew)
getSavedSearches()
deleteSavedSearch(searchId)

// Notifications
getNotifications(unreadOnly)
markNotificationAsRead(notificationId)

// System
getSyncStatus()
checkHealth()
```

### 2. `app/(tabs)/explore.tsx` - Property Listings Screen
**New Features:**
- ✅ Multi-source filtering (All, OLX, Nekretnine)
- ✅ Source badge on each listing card
- ✅ Enhanced filter options from API
- ✅ Ad type filtering (Sale/Rent)
- ✅ Min/max ranges for rooms and size
- ✅ Real-time filter options from backend
- ✅ Improved filter UI with source selector
- ✅ Active filter chips with individual removal
- ✅ Better empty states and error handling

**Updated Interface:**
```typescript
interface Listing {
  id: number
  source: 'olx' | 'nekretnine'  // NEW
  title: string
  price_numeric: number
  municipality: string
  property_type: string
  rooms: number
  square_m2: number
  condition: string
  deal_score: number
  url: string
  equipment: string
  heating: string
  level: string
  ad_type?: string              // NEW
  latitude?: number             // NEW
  longitude?: number            // NEW
}

interface Filters {
  source: 'all' | 'olx' | 'nekretnine'  // NEW
  priceMin: string
  priceMax: string
  municipality: string
  propertyType: string
  adType: string                        // NEW
  roomsMin: string
  roomsMax: string                      // NEW
  sizeMin: string
  sizeMax: string                       // NEW
  condition: string
  dealScoreMin: string
}
```

**UI Improvements:**
- Source badge shows data origin (OLX = blue, Nekretnine = red)
- Filter modal includes source selector at top
- Ad type filter section (Sale/Rent)
- Max values for rooms and size
- Dynamic filter options loaded from API
- Better visual hierarchy in filters

## API Endpoint Changes

### Old (v1)
```typescript
GET /listings?limit=50&sort=deal_score_desc
```

### New (v2)
```typescript
GET /api/v2/listings?source=all&limit=50&municipality=Sarajevo
```

## Key Benefits

1. **Multi-Source Support**
   - Listings from both OLX and Nekretnine.ba
   - Source filtering and identification
   - Unified deal scoring across sources

2. **Better Filtering**
   - More filter options from backend
   - Min/max ranges for numeric fields
   - Ad type filtering (Sale/Rent)
   - Property type filtering
   - Deal score filtering

3. **Enhanced Features**
   - User favorites with source tracking
   - Saved searches with notifications
   - Real-time statistics
   - Better error handling
   - Health monitoring

4. **Performance**
   - Proper pagination with offset/limit
   - Filter options cached from API
   - Efficient data fetching
   - Better loading states

## Usage Examples

### Basic Listing Fetch
```typescript
const result = await getListingsV2({
  source: 'all',
  municipality: 'Sarajevo - Centar',
  rooms_min: 2,
  price_max: 200000,
  limit: 20
})
```

### Search
```typescript
const results = await searchListings('novo sarajevo', 20)
```

### Add to Favorites
```typescript
await addToFavorites('nekretnine', 12345, 'Great apartment!')
```

### Get Statistics
```typescript
const stats = await getStatisticsSummary()
// Returns: total_listings, olx_listings, nekretnine_listings, price_stats
```

## Next Steps

### Recommended Enhancements

1. **Favorites Screen** (`app/(tabs)/saved.tsx`)
   - Update to show favorites from both sources
   - Add source badges
   - Enable filtering by source

2. **Search Feature** (new screen)
   - Add dedicated search screen
   - Use `searchListings()` API
   - Show results with source indicators

3. **Statistics Dashboard** (new screen)
   - Market overview using `getStatisticsSummary()`
   - Municipality breakdown with `getStatisticsByMunicipality()`
   - Price trends visualization

4. **Saved Searches** (new feature)
   - Save filter combinations
   - Get notifications for new matches
   - Quick filter presets

5. **Listing Detail Screen**
   - Show all listing details
   - Similar listings section using `getSimilarListings()`
   - Favorite/unfavorite button
   - Map with latitude/longitude

6. **Notifications** (new screen)
   - Show user notifications
   - Mark as read functionality
   - Filter by unread

## Testing

### Test the Updates
1. Start the backend server:
   ```bash
   cd backend
   python3 main.py
   ```

2. Start the frontend:
   ```bash
   cd frontend
   npm start
   ```

3. Test features:
   - Navigate to Explore tab
   - Try source filtering (All/OLX/Nekretnine)
   - Apply various filters
   - Check source badges on cards
   - Test pagination by scrolling
   - Try clearing individual filters

### Verify API Calls
Open React Native debugger and check network requests:
- Should use `/api/v2/listings` endpoint
- Should send source parameter
- Should handle pagination correctly

## Migration Notes

### Breaking Changes
- None! Old methods still work via legacy wrappers

### Backward Compatibility
All old API methods still work:
```typescript
getListings()          // Maps to getListingsV2()
getSavedListings()     // Maps to getFavorites()
saveListing()          // Maps to addToFavorites()
removeSavedListing()   // Maps to removeFromFavorites()
```

### Gradual Migration Path
1. ✅ Update core API service (Done)
2. ✅ Update Explore screen (Done)
3. ⏳ Update Saved/Favorites screen
4. ⏳ Add Search screen
5. ⏳ Add Statistics dashboard
6. ⏳ Add Notifications

## Support

For questions or issues:
1. Check backend API documentation: `backend/API_DOCUMENTATION.md`
2. Review backend quick start: `backend/QUICK_START.md`
3. Test endpoints directly: `http://localhost:8000/docs`
