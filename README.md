# YelpTogether

**Stop arguing, start eating.**
YelpTogether is a collaborative social dining app that helps groups decide where to eat using the Yelp AI API.

## 🚀 Tech Stack
- **Frontend**: Next.js 14, Tailwind CSS, SWR
- **Backend**: FastAPI, Python, Supabase (PostgreSQL)
- **AI**: Yelp AI API (or OpenAI)

## 🛠️ Prerequisites
- Node.js & npm
- Python 3.8+
- Supabase Account (for Database)
- Yelp Fusion API Key (for AI)

## 🗄️ Database Setup (Supabase)

Since this project uses a real PostgreSQL database via Supabase, you need to create the tables manually.

1.  **Create a Project** on [Supabase](https://supabase.com/).
2.  **Get Credentials**: Copy your `SUPABASE_URL` and `SUPABASE_KEY` into `backend/.env`.
3.  **Run SQL Schema**:
    - Go to the **SQL Editor** in your Supabase Dashboard.
    - Copy the contents of `backend/schema.sql`.
    - Paste and run the script to create the `sessions`, `participants`, and `recommendations` tables.

## 🏃‍♂️ Running Locally

### Backend
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start the app!
