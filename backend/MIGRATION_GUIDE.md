  name text not null,
  rating float,
  price text,
  image_url text,
  ai_reasoning text,
  categories text[]
);

-- Step 3: Re-enable RLS
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

-- Step 4: Recreate policy
CREATE POLICY "Public recommendations access" ON public.recommendations FOR ALL USING (true);
```

## After Running Migration
1. Restart your backend server
2. Try generating recommendations again
3. The UUID error should be resolved

## Code Changes Made
- ✅ Updated `models.py`: Made `price` and `ai_reasoning` optional with defaults
- ✅ Updated `yelp_mapper.py`: Added None-safe handling with fallback values
- ✅ Updated `schema.sql`: Changed `id` from `uuid` to `text`
