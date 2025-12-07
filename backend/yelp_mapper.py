"""
Yelp AI API Response Mapper
Handles parsing and mapping of Yelp AI API responses to our internal Recommendation model.
"""
from typing import List, Dict, Any
from models import Recommendation


class YelpAIMapper:
    """Maps Yelp AI API responses to Recommendation objects."""
    
    @staticmethod
    def parse_response(data: Dict[str, Any]) -> List[Recommendation]:
        """
        Parse Yelp AI API response and extract business recommendations.
        
        Expected structure:
        {
            "entities": [
                {
                    "businesses": [
                        {
                            "id": "...",
                            "name": "...",
                            "rating": 4.5,
                            "price": "$$",
                            ...
                        }
                    ]
                }
            ]
        }
        
        Args:
            data: Raw response from Yelp AI API
            
        Returns:
            List of Recommendation objects
        """
        recommendations = []
        
        # Navigate to businesses array
        entities = data.get("entities", [])
        if not entities:
            print("⚠️  No entities found in response")
            return recommendations
            
        # Get first entity (should contain businesses)
        first_entity = entities[0]
        businesses = first_entity.get("businesses", [])
        
        if not businesses:
            print("⚠️  No businesses found in entities")
            return recommendations
        
        print(f"✅ Found {len(businesses)} businesses in response")
        
        # Map each business to a Recommendation
        for biz in businesses:
            try:
                rec = YelpAIMapper._map_business_to_recommendation(biz)
                recommendations.append(rec)
            except Exception as e:
                print(f"⚠️  Failed to map business {biz.get('name', 'Unknown')}: {e}")
                continue
        
        return recommendations
    
    @staticmethod
    def _map_business_to_recommendation(biz: Dict[str, Any]) -> Recommendation:
        """
        Map a single business object to a Recommendation.
        
        Args:
            biz: Business object from Yelp AI API
            
        Returns:
            Recommendation object
        """
        # Extract categories
        categories = []
        for cat in biz.get("categories", []):
            if isinstance(cat, dict) and "title" in cat:
                categories.append(cat["title"])
        
        # Get AI reasoning from summaries (with fallback chain)
        summaries = biz.get("summaries", {})
        ai_reasoning = (
            summaries.get("short") or 
            summaries.get("medium") or 
            "Recommended based on your preferences."
        )
        
        # Get image URL from contextual_info photos
        image_url = None
        contextual_info = biz.get("contextual_info", {})
        photos = contextual_info.get("photos", [])
        if photos and len(photos) > 0:
            image_url = photos[0].get("original_url")
        
        # Get price with fallback
        price = biz.get("price") or "$$"
        
        return Recommendation(
            id=None,  # DB auto-generates UUID
            business_id=biz.get("id", ""),
            name=biz.get("name", "Unknown Restaurant"),
            rating=float(biz.get("rating", 0.0)),
            price=price,
            image_url=image_url,
            ai_reasoning=ai_reasoning,
            categories=categories
        )
