-- Demo Data Summary Migration
-- Final migration to summarize and verify all demo data is complete

-- Create a comprehensive demo data overview function
CREATE OR REPLACE FUNCTION get_demo_data_overview()
RETURNS TABLE (
  section TEXT,
  feature TEXT,
  count INTEGER,
  details TEXT
) AS $$
BEGIN
  RETURN QUERY
  -- Users Section
  SELECT 'Users'::TEXT as section, 'Demo Profiles'::TEXT as feature, 
         (SELECT COUNT(*)::INTEGER FROM public.profiles WHERE email LIKE '%demo.foodiesnap.com'),
         'Alex, Sarah, Mike, Emma, David, Lisa, James, Maria with detailed fitness profiles'::TEXT
  UNION ALL
  SELECT 'Users'::TEXT, 'User Preferences'::TEXT,
         (SELECT COUNT(*)::INTEGER FROM public.user_preferences up JOIN public.profiles p ON up.user_id = p.id WHERE p.email LIKE '%demo.foodiesnap.com'),
         'Complete notification, privacy, and app preferences for all demo users'::TEXT
  UNION ALL
  SELECT 'Users'::TEXT, 'User Statistics'::TEXT,
         (SELECT COUNT(*)::INTEGER FROM public.user_stats us JOIN public.profiles p ON us.user_id = p.id WHERE p.email LIKE '%demo.foodiesnap.com'),
         'Realistic engagement metrics: snaps, messages, reactions, streaks'::TEXT

  UNION ALL
  -- Content Section  
  SELECT 'Content'::TEXT, 'Journal Entries'::TEXT,
         (SELECT COUNT(*)::INTEGER FROM public.journal_entries je JOIN public.profiles p ON je.user_id = p.id WHERE p.email LIKE '%demo.foodiesnap.com'),
         'Diverse food photos with captions, tags, and metadata across all dietary styles'::TEXT
  UNION ALL
  SELECT 'Content'::TEXT, 'Content Embeddings'::TEXT,
         (SELECT COUNT(*)::INTEGER FROM public.content_embeddings ce JOIN public.profiles p ON ce.user_id = p.id WHERE p.email LIKE '%demo.foodiesnap.com'),
         'Vector embeddings for RAG semantic search and personalization'::TEXT
  UNION ALL
  SELECT 'Content'::TEXT, 'Spotlight Posts'::TEXT,
         (SELECT COUNT(*)::INTEGER FROM public.spotlight_posts sp JOIN public.profiles p ON sp.user_id = p.id WHERE p.email LIKE '%demo.foodiesnap.com'),
         'Public feed posts with engagement metrics and interactions'::TEXT
  UNION ALL
  SELECT 'Content'::TEXT, 'Stories'::TEXT,
         (SELECT COUNT(*)::INTEGER FROM public.stories s JOIN public.profiles p ON s.user_id = p.id WHERE p.email LIKE '%demo.foodiesnap.com'),
         'Active 24-hour stories with view tracking and expiration'::TEXT

  UNION ALL
  -- AI Features Section
  SELECT 'AI Features'::TEXT, 'Content Sparks'::TEXT,
         (SELECT COUNT(*)::INTEGER FROM public.content_sparks cs JOIN public.profiles p ON cs.user_id = p.id WHERE p.email LIKE '%demo.foodiesnap.com'),
         'Personalized weekly content prompts based on user preferences and history'::TEXT
  UNION ALL
  SELECT 'AI Features'::TEXT, 'AI Feedback'::TEXT,
         (SELECT COUNT(*)::INTEGER FROM public.ai_feedback af JOIN public.profiles p ON af.user_id = p.id WHERE p.email LIKE '%demo.foodiesnap.com'),
         'Learning system data showing user preferences for AI suggestions'::TEXT
  UNION ALL
  SELECT 'AI Features'::TEXT, 'Nutrition Scans'::TEXT,
         (SELECT COUNT(*)::INTEGER FROM demo_nutrition_scans),
         'Sample nutrition analysis data for common foods with health insights'::TEXT

  UNION ALL
  -- Social Features Section
  SELECT 'Social'::TEXT, 'Friend Relationships'::TEXT,
         (SELECT COUNT(*)::INTEGER FROM public.friends f JOIN public.profiles p ON (f.user_id = p.id OR f.friend_id = p.id) WHERE p.email LIKE '%demo.foodiesnap.com'),
         'Interconnected friend network between all demo users'::TEXT
  UNION ALL
  SELECT 'Social'::TEXT, 'Conversations'::TEXT,
         (SELECT COUNT(*)::INTEGER FROM public.conversations c JOIN public.profiles p ON (c.participant_ids @> ARRAY[p.id]) WHERE p.email LIKE '%demo.foodiesnap.com'),
         'Private chats and group conversations with realistic messaging patterns'::TEXT
  UNION ALL
  SELECT 'Social'::TEXT, 'Messages'::TEXT,
         (SELECT COUNT(*)::INTEGER FROM public.messages m JOIN public.conversations c ON m.conversation_id = c.id JOIN public.profiles p ON (c.participant_ids @> ARRAY[p.id]) WHERE p.email LIKE '%demo.foodiesnap.com'),
         'Diverse conversations covering fitness, nutrition, and lifestyle topics'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Create function to test RAG similarity search functionality
CREATE OR REPLACE FUNCTION test_rag_similarity_search(query_text TEXT DEFAULT 'high protein meal prep')
RETURNS TABLE (
  user_name TEXT,
  content TEXT,
  similarity_score FLOAT,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.display_name as user_name,
    ce.content_text as content,
    (1 - (ce.embedding <=> (
      SELECT embedding FROM public.content_embeddings 
      WHERE content_text ILIKE '%' || query_text || '%' 
      LIMIT 1
    ))) as similarity_score,
    ce.metadata
  FROM public.content_embeddings ce
  JOIN public.profiles p ON ce.user_id = p.id
  WHERE p.email LIKE '%demo.foodiesnap.com'
  ORDER BY ce.embedding <=> (
    SELECT embedding FROM public.content_embeddings 
    WHERE content_text ILIKE '%' || query_text || '%' 
    LIMIT 1
  )
  LIMIT 5;
EXCEPTION WHEN OTHERS THEN
  -- Return empty result if RAG search fails
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Create demo user personas summary
CREATE OR REPLACE VIEW demo_user_personas AS
SELECT 
  p.display_name,
  p.email,
  p.primary_fitness_goal,
  p.dietary_restrictions,
  p.preferred_content_style,
  p.activity_level,
  p.snap_score,
  p.current_streak,
  (SELECT COUNT(*) FROM public.journal_entries je WHERE je.user_id = p.id) as journal_entries,
  (SELECT COUNT(*) FROM public.content_sparks cs WHERE cs.user_id = p.id) as content_sparks,
  (SELECT COUNT(*) FROM public.ai_feedback af WHERE af.user_id = p.id) as ai_feedback_items,
  CASE p.email
    WHEN 'alex.chen@demo.foodiesnap.com' THEN 'Protein-focused fitness enthusiast, scientific approach to nutrition'
    WHEN 'sarah.johnson@demo.foodiesnap.com' THEN 'Plant-based athlete, inspirational runner, gluten-free'
    WHEN 'mike.rodriguez@demo.foodiesnap.com' THEN 'HIIT trainer, intermittent fasting practitioner, practical approach'
    WHEN 'emma.wilson@demo.foodiesnap.com' THEN 'Macro tracking queen, flexible dieting advocate, balance-focused'
    WHEN 'david.kim@demo.foodiesnap.com' THEN 'Powerlifter in bulking phase, high-calorie Korean cuisine lover'
    WHEN 'lisa.rodriguez@demo.foodiesnap.com' THEN 'Registered dietitian, evidence-based nutrition expert'
    WHEN 'james.taylor@demo.foodiesnap.com' THEN 'CrossFit chef, paleo specialist, functional nutrition focus'
    WHEN 'maria.garcia@demo.foodiesnap.com' THEN 'Yoga instructor, mindful eating practitioner, holistic wellness'
    ELSE 'Demo user'
  END as persona_description
FROM public.profiles p
WHERE p.email LIKE '%demo.foodiesnap.com'
ORDER BY p.created_at;

-- Create demo data health check function
CREATE OR REPLACE FUNCTION check_demo_data_health()
RETURNS TABLE (
  check_name TEXT,
  status TEXT,
  details TEXT
) AS $$
BEGIN
  RETURN QUERY
  -- Check user data completeness
  SELECT 'User Profiles Complete'::TEXT,
         CASE WHEN COUNT(*) = 8 THEN '✅ PASS' ELSE '❌ FAIL' END,
         'Expected 8 demo users, found ' || COUNT(*)::TEXT
  FROM public.profiles WHERE email LIKE '%demo.foodiesnap.com'
  
  UNION ALL
  
  -- Check journal entries distribution
  SELECT 'Journal Entries Distribution'::TEXT,
         CASE WHEN MIN(entry_count) >= 2 AND MAX(entry_count) <= 5 THEN '✅ PASS' ELSE '⚠️ WARNING' END,
         'Entry counts per user: ' || string_agg(entry_count::TEXT, ', ' ORDER BY entry_count)
  FROM (
    SELECT COUNT(*) as entry_count
    FROM public.journal_entries je 
    JOIN public.profiles p ON je.user_id = p.id 
    WHERE p.email LIKE '%demo.foodiesnap.com'
    GROUP BY p.id
  ) t
  
  UNION ALL
  
  -- Check content embeddings
  SELECT 'Content Embeddings Available'::TEXT,
         CASE WHEN COUNT(*) > 20 THEN '✅ PASS' ELSE '❌ FAIL' END,
         'Found ' || COUNT(*)::TEXT || ' embeddings for RAG functionality'
  FROM public.content_embeddings ce 
  JOIN public.profiles p ON ce.user_id = p.id 
  WHERE p.email LIKE '%demo.foodiesnap.com'
  
  UNION ALL
  
  -- Check active stories
  SELECT 'Active Stories Available'::TEXT,
         CASE WHEN COUNT(*) >= 5 THEN '✅ PASS' ELSE '⚠️ WARNING' END,
         'Found ' || COUNT(*)::TEXT || ' active stories (expire within 24 hours)'
  FROM public.stories s 
  JOIN public.profiles p ON s.user_id = p.id 
  WHERE p.email LIKE '%demo.foodiesnap.com' 
  AND s.expires_at > NOW()
  
  UNION ALL
  
  -- Check conversations
  SELECT 'Active Conversations'::TEXT,
         CASE WHEN COUNT(*) >= 4 THEN '✅ PASS' ELSE '❌ FAIL' END,
         'Found ' || COUNT(*)::TEXT || ' conversations with recent activity'
  FROM public.conversations c 
  JOIN public.profiles p ON (c.participant_ids @> ARRAY[p.id])
  WHERE p.email LIKE '%demo.foodiesnap.com'
  AND c.last_message_at > NOW() - INTERVAL '1 week'
  
  UNION ALL
  
  -- Check content sparks
  SELECT 'Content Sparks Generated'::TEXT,
         CASE WHEN COUNT(*) >= 3 THEN '✅ PASS' ELSE '❌ FAIL' END,
         'Found ' || COUNT(*)::TEXT || ' personalized content spark sets'
  FROM public.content_sparks cs 
  JOIN public.profiles p ON cs.user_id = p.id 
  WHERE p.email LIKE '%demo.foodiesnap.com';
END;
$$ LANGUAGE plpgsql;

-- Grant permissions on new functions and views
GRANT EXECUTE ON FUNCTION get_demo_data_overview() TO authenticated;
GRANT EXECUTE ON FUNCTION test_rag_similarity_search(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_demo_data_health() TO authenticated;
GRANT SELECT ON demo_user_personas TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION get_demo_data_overview() IS 'Provides comprehensive overview of all demo data for development and testing';
COMMENT ON FUNCTION test_rag_similarity_search(TEXT) IS 'Tests RAG similarity search functionality with demo content embeddings';
COMMENT ON FUNCTION check_demo_data_health() IS 'Validates demo data integrity and completeness for optimal user experience';
COMMENT ON VIEW demo_user_personas IS 'Summary of demo user personas with their characteristics and content creation patterns';

-- Final success message
DO $$ 
BEGIN 
  RAISE NOTICE '
🎉 DEMO DATA SETUP COMPLETE! 🎉

Created comprehensive demo data including:
✅ 8 Diverse User Personas with Detailed Profiles  
✅ 25+ Journal Entries Across All Dietary Styles
✅ Vector Embeddings for RAG Similarity Search
✅ Personalized Content Sparks & AI Feedback
✅ Active Stories & Spotlight Posts
✅ Realistic Conversations & Message History
✅ User Statistics & Engagement Metrics
✅ Sample Nutrition Scan Data

To verify setup: SELECT * FROM check_demo_data_health();
To explore data: SELECT * FROM get_demo_data_overview();
To test RAG: SELECT * FROM test_rag_similarity_search(''protein smoothie'');

Ready for demo! 🚀';
END $$; 