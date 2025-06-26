# Production RAG Setup Guide

This guide walks you through setting up the Smart Caption Engine with RAG Pipeline in your production Supabase environment.

## 🎯 Prerequisites

- ✅ Production Supabase project
- ✅ OpenAI API key
- ✅ Supabase CLI installed
- ✅ Project linked to your Supabase project

## 🚀 Step 1: Environment Variables Setup

### 1.1 Supabase Secrets (Edge Functions)
You've already done this, but to confirm:

```bash
# Set OpenAI API key for Edge Functions
supabase secrets set OPENAI_API_KEY=your_openai_api_key_here

# Verify it's set
supabase secrets list
```

### 1.2 Local Environment (.env.local)
Ensure your `.env.local` has:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key_here
```

**Note**: The client app doesn't need the OpenAI API key - only Edge Functions use it.

## 🗄️ Step 2: Database Migration

### 2.1 Enable pgvector Extension
First, enable pgvector in your Supabase project:

1. Go to your Supabase Dashboard
2. Navigate to **Database** → **Extensions**
3. Enable the **vector** extension

### 2.2 Run the Migration
Deploy the RAG database schema:

```bash
# Make sure you're linked to the right project
supabase projects list
supabase link --project-ref your-project-ref

# Run the migration
supabase db push

# Or if you prefer to run the specific migration:
supabase migration up --include-all
```

### 2.3 Verify Migration Success
Check that these tables exist in your database:
- `content_embeddings`
- `ai_feedback`

You can verify in the Supabase Dashboard → **Database** → **Tables**.

## ⚡ Step 3: Deploy Edge Functions

### 3.1 Deploy Both Functions
```bash
# Deploy the caption generation function
supabase functions deploy generate-smart-captions

# Deploy the embedding generation function  
supabase functions deploy generate-content-embeddings

# Verify deployment
supabase functions list
```

### 3.2 Test Edge Functions
Test that the functions can access the OpenAI API key:

```bash
# Test caption generation (replace with your actual URL and auth token)
curl -X POST 'https://your-project-ref.supabase.co/functions/v1/generate-smart-captions' \
  -H 'Authorization: Bearer your-anon-key' \
  -H 'Content-Type: application/json' \
  -d '{
    "imageDescription": "A healthy salad with grilled chicken",
    "contentType": "photo"
  }'
```

## 🔧 Step 4: Configuration Verification

### 4.1 Check Function Logs
Monitor function execution:

```bash
# View logs for caption generation
supabase functions logs generate-smart-captions

# View logs for embedding generation
supabase functions logs generate-content-embeddings
```

### 4.2 Database Permissions
Verify RLS policies are working by testing in the SQL Editor:

```sql
-- Test that current user can insert embeddings
SELECT * FROM content_embeddings WHERE user_id = auth.uid() LIMIT 1;

-- Test AI feedback insertion
SELECT * FROM ai_feedback WHERE user_id = auth.uid() LIMIT 1;
```

## 🧪 Step 5: Testing the Complete Flow

### 5.1 Test in App
1. Open your app and complete onboarding (nutrition preferences)
2. Capture a food photo
3. Tap the AI Caption button (purple sparkles)
4. Verify 3 captions are generated
5. Select a caption and save to journal
6. Check that embeddings are generated in background

### 5.2 Verify Database Records
After testing, check these tables have data:

```sql
-- Check journal entries
SELECT * FROM journal_entries WHERE user_id = auth.uid() ORDER BY created_at DESC LIMIT 5;

-- Check embeddings were generated
SELECT * FROM content_embeddings WHERE user_id = auth.uid() ORDER BY created_at DESC LIMIT 5;

-- Check AI feedback
SELECT * FROM ai_feedback WHERE user_id = auth.uid() ORDER BY created_at DESC LIMIT 5;
```

## 🛠️ Step 6: Performance Monitoring

### 6.1 Monitor Function Performance
- Check Edge Function logs for response times
- Monitor OpenAI API usage in your OpenAI dashboard
- Watch for any timeout or error patterns

### 6.2 Database Performance
- Monitor query performance in Supabase Dashboard
- Check that vector indexes are being used effectively

## 🚨 Troubleshooting

### Common Issues:

**1. "No OpenAI API key" Error**
```bash
# Re-set the secret
supabase secrets set OPENAI_API_KEY=your_key_here

# Redeploy functions
supabase functions deploy generate-smart-captions
supabase functions deploy generate-content-embeddings
```

**2. pgvector Extension Not Found**
- Enable the `vector` extension in Supabase Dashboard
- Re-run the migration: `supabase db push`

**3. RLS Policy Errors**
- Check that the migration ran successfully
- Verify user authentication is working

**4. Slow Caption Generation**
- Check OpenAI API status
- Monitor function logs for bottlenecks
- Consider adjusting prompt length or model

**5. Embeddings Not Generated**
- Check that `generate-content-embeddings` function deployed
- Verify it's being called after journal saves
- Check function logs for errors

## 📊 Success Criteria

✅ **Database Setup**
- pgvector extension enabled
- Migration applied successfully
- Tables created with proper RLS policies

✅ **Edge Functions**
- Both functions deployed and accessible
- OpenAI API key working in function environment
- Functions returning expected responses

✅ **App Integration**
- AI Caption button appears in preview
- Captions generate in <3 seconds
- Feedback system records user interactions
- Embeddings generate after journal saves

✅ **Performance**
- Caption generation: <3 seconds
- No errors in function logs
- Database queries performing well

## 🔄 Next Steps

Once everything is working:

1. **Monitor Usage**: Track OpenAI API costs and optimize
2. **Collect Feedback**: Monitor user feedback to improve captions
3. **Performance Tuning**: Optimize based on real usage patterns
4. **Phase 3 Step 3**: Ready for Nutrition Knowledge Engine implementation!

## 📞 Need Help?

Check these resources:
- Supabase Edge Functions docs
- OpenAI API documentation  
- pgvector documentation
- Function logs: `supabase functions logs <function-name>` 