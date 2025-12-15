# Requirements Document — Social Dining Group Planner

## 1. Document Control
**Project Name:** Social Dining (AI-Enhanced)  
**Version:** 2.0 (Post-Implementation)  
**Hackathon:** Yelp AI API Hackathon  
**Primary Data Source:** Yelp AI API  

## 2. Overview

### 2.1 Purpose
Social Dining helps groups agree on a dining location by acting as an **intelligent mediator**. It aggregates individual preferences, detects conflicts, and uses Yelp AI to recommend compromise options, finally handling the reservation process via an AI agent.

### 2.2 Solution Summary
- **Session-Based Planning**: Share a link to invite friends.
- **AI Conflict Resolution**: Automatically detects incompatibilities (e.g., "Meat Eaters vs Vegans") and suggests a strategy.
- **Curated Recommendations**: Uses Yelp AI to pick the top 3 spots with reasoning.
- **AI Reservation Agent**: Simulates calling the restaurant to book the table.

---

## 3. Functional Requirements

### FR-1: Session Creation (Host)
- Host inputs Name, Location, and **Date/Time**.
- System generates a unique invite link.
- **UI**: Clear inputs with visibility-enhanced text.

### FR-2: Participant Onboarding
- Join via URL (no login required for guests).
- Submit preferences:
    - **Dietary**: (e.g., Vegan, Gluten-Free)
    - **Cuisines**: (e.g., Thai, Italian)
    - **Vibe**: (e.g., Quiet, Rooftop)

### FR-3: AI Recommendation Engine
1.  **Conflict Analysis**: Before searching, the AI analyzes the group profile for clashes.
2.  **Smart Query**: Generates a natural language prompt for Yelp AI.
3.  **Result**: Returns 3 curated picks with:
    - **"Why Picked"**: Personalized reasoning.
    - **"Trade-offs"**: Honest assessment of downsides (e.g., "Pricey").

### FR-4: Voting & Leaderboard
- Participants vote (Like/Dislike).
- Real-time leaderboard updates.
- Top card highlighted as "Current Leader".

### FR-5: AI Reservation Agent (New)
- **Trigger**: Host clicks "Have AI Book This Table" on the winning card.
- **Simulation**:
    - System simulates a 3-second negotiation delay.
    - **Outcomes**:
        - ✅ Success: Returns unique Confirmation Code.
        - ❌ Busy: Returns "No tables available at [Time]" message.
- **Persistence**: Booking status updates for all users in real-time.

---

## 4. User Interface (UI) Priorities
- **Mobile First**: Responsive design for on-the-go planning.
- **Visibility**: High-contrast text for input fields.
- **Shareability**: "Copy Link" button in the Lobby.
- **Transparency**: Display "AI Thinking" states and Reservation status.

---

## 5. Data Model (Schema)

### Session
- `id` (UUID)
- `host_name`
- `location`
- `scheduled_time` (DateTime)
- `conflict_analysis` (JSON: {has_conflicts, resolution})
- `booking_status` (Enum: none, pending, booked, busy)

### Recommendation
- `business_id` (Yelp ID)
- `ai_reasoning` (Full summary)
- `why_picked` (Selling point)
- `trade_offs` (List of cons)

---

## 6. Technical Stack
- **Frontend**: Next.js 14, Tailwind CSS, SWR.
- **Backend**: FastAPI (Python 3.9).
- **Database**: Supabase (PostgreSQL).
- **Deployment**: Google Cloud Run (Dockerized).

---

## 7. Success Metrics
- **Time to Consensus**: < 5 minutes.
- **Conflict Handling**: Successfully identifies mixed dietary groups.
- **Booking Simulation**: Realistic success/fail rates (70/30).
