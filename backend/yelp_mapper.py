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
    def parse_conflict_response(data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parse the conflict analysis response.
        Attempts to find a JSON object in the response text.
        """
        import json
        import re

        # Try to find text content
        content = ""
        # Check various possible keys for chat response
        if "message" in data:
            content = data["message"]
        elif "text" in data:
            content = data["text"]
        elif "answer" in data:
            content = data["answer"]
        elif "reply" in data:
            content = data["reply"]
        
        # Fallback: Check if it returned a business list but put the text in a summary? Unlikely for this query.
        
        if not content:
            # If no content found, print keys for debugging
            print(f"⚠️ Could not find content in conflict response. Keys: {list(data.keys())}")
            return {"has_conflicts": False, "conflicts": [], "resolution": "Could not parse analysis."}

        # Clean markdown code blocks if present
        content = re.sub(r'```json\s*', '', content)
        content = re.sub(r'```\s*', '', content)
        content = content.strip()

        try:
            # Try parsing JSON
            result = json.loads(content)
            # Ensure keys exist
            return {
                "has_conflicts": result.get("has_conflicts", False),
                "conflicts": result.get("conflicts", []),
                "resolution": result.get("resolution", "")
            }
        except json.JSONDecodeError:
            print(f"⚠️ Failed to parse JSON from conflict content: {content[:100]}...")
            return {"has_conflicts": False, "conflicts": [], "resolution": "Analysis format error."}

    @staticmethod
    def _map_business_to_recommendation(biz: Dict[str, Any]) -> Recommendation:
        """
        Map a single business object to a Recommendation.
        Extracts structured data from AI summaries if present.
        """
        import re
        
        # Extract categories
        categories = []
        for cat in biz.get("categories", []):
            if isinstance(cat, dict) and "title" in cat:
                categories.append(cat["title"])
        
        # Get AI reasoning from summaries (with fallback chain)
        summaries = biz.get("summaries", {})
        full_summary = (
            summaries.get("short") or 
            summaries.get("medium") or 
            "Recommended based on your preferences."
        )
        
        # Extract Why Picked and Trade-offs from summary if formatted
        # Format expected: "Why Picked: ... Trade-offs: ..."
        why_picked = "Great choice for the group."
        trade_offs = []
        
        # Regex to find "Why Picked:"
        why_match = re.search(r'Why Picked:\s*(.*?)(?:Trade-offs:|$)', full_summary, re.IGNORECASE | re.DOTALL)
        if why_match:
            why_picked = why_match.group(1).strip()
            
        # Regex to find "Trade-offs:"
        trade_match = re.search(r'Trade-offs:\s*(.*)', full_summary, re.IGNORECASE | re.DOTALL)
        if trade_match:
            trade_text = trade_match.group(1).strip()
            # Split by comma or bullet points
            trade_offs = [t.strip(' -•') for t in re.split(r'[,;]|\n', trade_text) if t.strip()]
            
        # Clean the summary for display (remove the structured parts)
        display_reasoning = full_summary
        if why_match:
            # If we extracted data, maybe we want to keep the reasoning short or clean it?
            # actually let's just keep the full summary as 'ai_reasoning' for now, 
            # and use the extracted fields for specific UI elements.
            pass

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
            ai_reasoning=display_reasoning,
            categories=categories,
            why_picked=why_picked,
            trade_offs=trade_offs
        )
