import { supabase } from './supabase'

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.199.127:8000'

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token

  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  }
}

export async function makePrediction(data: any) {
  const headers = await getAuthHeaders()
  
  const response = await fetch(`${API_URL}/predict`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  })
  
  if (!response.ok) {
    throw new Error('Prediction failed')
  }
  
  return response.json()
}

export async function getUserPredictions(limit = 50) {
  const headers = await getAuthHeaders()
  
  const response = await fetch(`${API_URL}/predictions?limit=${limit}`, {
    headers
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch predictions')
  }
  
  return response.json()
}

export async function getListings(limit = 100, sort = 'deal_score_desc') {
  const response = await fetch(`${API_URL}/listings?limit=${limit}&sort=${sort}`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch listings')
  }
  
  return response.json()
}

export async function getRecommendedListings(limit = 50) {
  const headers = await getAuthHeaders()
  
  const response = await fetch(`${API_URL}/listings/recommended?limit=${limit}`, {
    headers
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch recommendations')
  }
  
  return response.json()
}

export async function getSavedListings() {
  const headers = await getAuthHeaders()
  
  const response = await fetch(`${API_URL}/saved-listings`, {
    headers
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch saved listings')
  }
  
  return response.json()
}

export async function saveListing(listingId: number, notes?: string) {
  const headers = await getAuthHeaders()
  
  const response = await fetch(`${API_URL}/saved-listings`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ listing_id: listingId, notes })
  })
  
  if (!response.ok) {
    throw new Error('Failed to save listing')
  }
  
  return response.json()
}

export async function removeSavedListing(listingId: number) {
  const headers = await getAuthHeaders()
  
  const response = await fetch(`${API_URL}/saved-listings/${listingId}`, {
    method: 'DELETE',
    headers
  })
  
  if (!response.ok) {
    throw new Error('Failed to remove listing')
  }
  
  return response.json()
}

export async function updateUserPreferences(preferences: any) {
  const headers = await getAuthHeaders()
  
  const response = await fetch(`${API_URL}/profile/preferences`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(preferences)
  })
  
  if (!response.ok) {
    throw new Error('Failed to update preferences')
  }
  
  return response.json()
}

export async function getUserPreferences() {
  const headers = await getAuthHeaders()
  
  const response = await fetch(`${API_URL}/profile/preferences`, {
    headers
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch preferences')
  }
  
  return response.json()
}
