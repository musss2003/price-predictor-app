# api_enhanced.py
"""
Enhanced API endpoints for multi-source property listings
Supports listings_olx, listings_nekretnine, and all_listings view
"""

from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from supabase import Client
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

router = APIRouter()

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)


# ============================================================
#              LISTINGS ENDPOINTS
# ============================================================

@router.get("/api/v2/listings")
async def get_listings_v2(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    source: Optional[str] = Query(None, regex="^(olx|nekretnine|all)$"),
    municipality: Optional[str] = None,
    property_type: Optional[str] = None,
    ad_type: Optional[str] = None,
    price_min: Optional[int] = None,
    price_max: Optional[int] = None,
    rooms_min: Optional[float] = None,
    rooms_max: Optional[float] = None,
    size_min: Optional[float] = None,
    size_max: Optional[float] = None,
    deal_score_min: Optional[int] = None,
    sort_by: str = Query("deal_score", regex="^(deal_score|price|date|size)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
):
    """
    Get property listings with advanced filtering
    - Supports multi-source querying (olx, nekretnine, or all)
    - Rich filtering options
    - Pagination support
    """
    try:
        # Determine table/view to query
        if source == "olx":
            table = "listings_olx"
        elif source == "nekretnine":
            table = "listings_nekretnine"
        else:
            table = "all_listings"
        
        # Build query
        query = supabase.table(table).select("*", count="exact")
        
        # Apply filters
        if municipality:
            query = query.ilike("municipality", f"%{municipality}%")
        
        if property_type:
            query = query.eq("property_type", property_type)
        
        if ad_type:
            query = query.eq("ad_type", ad_type)
        
        if price_min is not None:
            query = query.gte("price_numeric", price_min)
        
        if price_max is not None:
            query = query.lte("price_numeric", price_max)
        
        if rooms_min is not None:
            query = query.gte("rooms", rooms_min)
        
        if rooms_max is not None:
            query = query.lte("rooms", rooms_max)
        
        if size_min is not None:
            query = query.gte("square_m2", size_min)
        
        if size_max is not None:
            query = query.lte("square_m2", size_max)
        
        if deal_score_min is not None:
            query = query.gte("deal_score", deal_score_min)
        
        # Only active listings
        query = query.eq("is_active", True)
        
        # Sorting
        sort_column_map = {
            "deal_score": "deal_score",
            "price": "price_numeric",
            "date": "last_updated",
            "size": "square_m2"
        }
        
        sort_column = sort_column_map.get(sort_by, "deal_score")
        query = query.order(sort_column, desc=(sort_order == "desc"))
        
        # Pagination
        query = query.range(offset, offset + limit - 1)
        
        # Execute query
        response = query.execute()
        
        return {
            "success": True,
            "data": response.data,
            "count": len(response.data),
            "total": response.count if hasattr(response, 'count') else None,
            "offset": offset,
            "limit": limit
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching listings: {str(e)}")


@router.get("/api/v2/listings/{source}/{listing_id}")
async def get_listing_detail(source: str, listing_id: int):
    """
    Get detailed information about a specific listing
    """
    try:
        if source not in ["olx", "nekretnine"]:
            raise HTTPException(status_code=400, detail="Invalid source. Use 'olx' or 'nekretnine'")
        
        table = f"listings_{source}"
        
        response = supabase.table(table).select("*").eq("id", listing_id).single().execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        return {
            "success": True,
            "data": response.data
        }
    
    except Exception as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail="Listing not found")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/v2/listings/similar/{source}/{listing_id}")
async def get_similar_listings(
    source: str,
    listing_id: int,
    limit: int = Query(10, ge=1, le=50)
):
    """
    Find similar listings based on price, size, location
    """
    try:
        # Get the reference listing
        table = f"listings_{source}"
        ref_listing = supabase.table(table).select("*").eq("id", listing_id).single().execute()
        
        if not ref_listing.data:
            raise HTTPException(status_code=404, detail="Reference listing not found")
        
        ref = ref_listing.data
        
        # Search for similar listings across all sources
        query = supabase.table("all_listings").select("*")
        
        # Similar municipality
        if ref.get("municipality"):
            query = query.eq("municipality", ref["municipality"])
        
        # Similar property type
        if ref.get("property_type"):
            query = query.eq("property_type", ref["property_type"])
        
        # Price range ±20%
        if ref.get("price_numeric"):
            price = ref["price_numeric"]
            query = query.gte("price_numeric", price * 0.8)
            query = query.lte("price_numeric", price * 1.2)
        
        # Size range ±20%
        if ref.get("square_m2"):
            size = ref["square_m2"]
            query = query.gte("square_m2", size * 0.8)
            query = query.lte("square_m2", size * 1.2)
        
        # Exclude the reference listing itself
        query = query.neq("id", listing_id)
        
        # Only active listings
        query = query.eq("is_active", True)
        
        # Sort by deal score
        query = query.order("deal_score", desc=True)
        query = query.limit(limit)
        
        response = query.execute()
        
        return {
            "success": True,
            "reference_listing": ref,
            "similar_listings": response.data,
            "count": len(response.data)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
#              ANALYTICS & STATISTICS
# ============================================================

@router.get("/api/v2/statistics/summary")
async def get_statistics_summary():
    """
    Get overall market statistics
    """
    try:
        # Get counts by source
        olx_count = supabase.table("listings_olx").select("id", count="exact").eq("is_active", True).execute()
        nekretnine_count = supabase.table("listings_nekretnine").select("id", count="exact").eq("is_active", True).execute()
        
        # Get price statistics
        all_listings = supabase.table("all_listings").select("price_numeric, square_m2, municipality").eq("is_active", True).execute()
        
        prices = [l["price_numeric"] for l in all_listings.data if l.get("price_numeric")]
        
        stats = {
            "total_listings": len(all_listings.data),
            "olx_listings": olx_count.count if hasattr(olx_count, 'count') else 0,
            "nekretnine_listings": nekretnine_count.count if hasattr(nekretnine_count, 'count') else 0,
            "price_stats": {
                "min": min(prices) if prices else 0,
                "max": max(prices) if prices else 0,
                "avg": sum(prices) / len(prices) if prices else 0
            }
        }
        
        return {
            "success": True,
            "data": stats
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/v2/statistics/by-municipality")
async def get_municipality_stats():
    """
    Get statistics grouped by municipality
    """
    try:
        listings = supabase.table("all_listings").select("municipality, price_numeric, square_m2").eq("is_active", True).execute()
        
        # Group by municipality
        municipality_stats = {}
        for listing in listings.data:
            muni = listing.get("municipality", "Unknown")
            if muni not in municipality_stats:
                municipality_stats[muni] = {
                    "count": 0,
                    "prices": [],
                    "sizes": []
                }
            
            municipality_stats[muni]["count"] += 1
            
            if listing.get("price_numeric"):
                municipality_stats[muni]["prices"].append(listing["price_numeric"])
            
            if listing.get("square_m2"):
                municipality_stats[muni]["sizes"].append(listing["square_m2"])
        
        # Calculate averages
        result = []
        for muni, data in municipality_stats.items():
            avg_price = sum(data["prices"]) / len(data["prices"]) if data["prices"] else 0
            avg_size = sum(data["sizes"]) / len(data["sizes"]) if data["sizes"] else 0
            price_per_m2 = avg_price / avg_size if avg_size > 0 else 0
            
            result.append({
                "municipality": muni,
                "count": data["count"],
                "avg_price": round(avg_price, 2),
                "avg_size": round(avg_size, 2),
                "price_per_m2": round(price_per_m2, 2)
            })
        
        # Sort by count
        result.sort(key=lambda x: x["count"], reverse=True)
        
        return {
            "success": True,
            "data": result
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/v2/statistics/price-trends")
async def get_price_trends(
    municipality: Optional[str] = None,
    days: int = Query(30, ge=7, le=90)
):
    """
    Get price trends over time
    """
    try:
        since_date = datetime.now() - timedelta(days=days)
        
        query = supabase.table("price_history").select("*")
        query = query.gte("changed_at", since_date.isoformat())
        
        if municipality:
            # This requires joining with listings, which is complex in Supabase
            # For now, return error asking for direct listing ID
            pass
        
        query = query.order("changed_at", desc=False)
        response = query.execute()
        
        return {
            "success": True,
            "data": response.data,
            "period_days": days
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
#              SEARCH & DISCOVERY
# ============================================================

@router.get("/api/v2/search")
async def search_listings(
    q: str = Query(..., min_length=2),
    limit: int = Query(20, ge=1, le=50)
):
    """
    Full-text search across listings
    """
    try:
        # Search in title and description
        query = supabase.table("all_listings").select("*")
        query = query.or_(f"title.ilike.%{q}%,description.ilike.%{q}%")
        query = query.eq("is_active", True)
        query = query.order("deal_score", desc=True)
        query = query.limit(limit)
        
        response = query.execute()
        
        return {
            "success": True,
            "query": q,
            "data": response.data,
            "count": len(response.data)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/v2/filters/options")
async def get_filter_options():
    """
    Get all available filter options (municipalities, property types, etc.)
    """
    try:
        # Get distinct municipalities
        municipalities_response = supabase.table("all_listings").select("municipality").eq("is_active", True).execute()
        municipalities = list(set([l["municipality"] for l in municipalities_response.data if l.get("municipality")]))
        
        # Get distinct property types
        property_types_response = supabase.table("all_listings").select("property_type").eq("is_active", True).execute()
        property_types = list(set([l["property_type"] for l in property_types_response.data if l.get("property_type")]))
        
        # Get distinct ad types
        ad_types_response = supabase.table("all_listings").select("ad_type").eq("is_active", True).execute()
        ad_types = list(set([l["ad_type"] for l in ad_types_response.data if l.get("ad_type")]))
        
        return {
            "success": True,
            "filters": {
                "municipalities": sorted(municipalities),
                "property_types": sorted(property_types),
                "ad_types": sorted(ad_types),
                "price_range": {
                    "min": 0,
                    "max": 1000000,
                    "step": 10000
                },
                "rooms_range": {
                    "min": 0,
                    "max": 10,
                    "step": 0.5
                },
                "size_range": {
                    "min": 0,
                    "max": 500,
                    "step": 10
                }
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
#              SYNC STATUS
# ============================================================

@router.get("/api/v2/sync/status")
async def get_sync_status():
    """
    Get the status of data synchronization from sources
    """
    try:
        response = supabase.table("source_sync_status").select("*").order("last_sync_at", desc=True).execute()
        
        return {
            "success": True,
            "sources": response.data
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/v2/health")
async def health_check():
    """
    API health check endpoint
    """
    try:
        # Test database connection
        test_query = supabase.table("all_listings").select("id").limit(1).execute()
        
        return {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "database": "connected",
            "version": "2.0.0"
        }
    
    except Exception as e:
        return {
            "status": "unhealthy",
            "timestamp": datetime.now().isoformat(),
            "error": str(e)
        }
