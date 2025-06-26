-- Enhanced Journal with Semantic Indexing and AI-Powered Content Analysis
-- Phase 3, Step 5: Content Journal with Semantic Indexing

-- Add enhanced metadata columns to journal_entries table
ALTER TABLE public.journal_entries 
ADD COLUMN IF NOT EXISTS meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'beverage', 'meal_prep', 'other')),
ADD COLUMN IF NOT EXISTS dietary_pattern TEXT CHECK (dietary_pattern IN ('high_protein', 'low_carb', 'keto', 'vegan', 'vegetarian', 'paleo', 'mediterranean', 'balanced', 'other')),
ADD COLUMN IF NOT EXISTS nutrition_focus TEXT CHECK (nutrition_focus IN ('muscle_building', 'fat_loss', 'energy_boost', 'recovery', 'general_health', 'performance', 'comfort', 'other')),
ADD COLUMN IF NOT EXISTS cooking_method TEXT CHECK (cooking_method IN ('grilled', 'baked', 'fried', 'steamed', 'boiled', 'raw', 'sauteed', 'roasted', 'air_fried', 'slow_cooked', 'other')),
ADD COLUMN IF NOT EXISTS meal_timing TEXT CHECK (meal_timing IN ('pre_workout', 'post_workout', 'morning', 'afternoon', 'evening', 'late_night', 'between_meals', 'other')),
ADD COLUMN IF NOT EXISTS estimated_calories INTEGER,
ADD COLUMN IF NOT EXISTS estimated_protein DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS estimated_carbs DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS estimated_fat DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS ingredients TEXT[], -- Array of detected ingredients
ADD COLUMN IF NOT EXISTS ai_analysis_confidence DECIMAL(3,2) DEFAULT 0.7,
ADD COLUMN IF NOT EXISTS ai_generated_insights TEXT[], -- Array of AI insights about the meal
ADD COLUMN IF NOT EXISTS semantic_embedding_generated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_analyzed_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for the new metadata columns
CREATE INDEX IF NOT EXISTS journal_entries_meal_type_idx ON public.journal_entries(meal_type);
CREATE INDEX IF NOT EXISTS journal_entries_dietary_pattern_idx ON public.journal_entries(dietary_pattern);
CREATE INDEX IF NOT EXISTS journal_entries_nutrition_focus_idx ON public.journal_entries(nutrition_focus);
CREATE INDEX IF NOT EXISTS journal_entries_ingredients_idx ON public.journal_entries USING GIN(ingredients);
CREATE INDEX IF NOT EXISTS journal_entries_semantic_embedding_idx ON public.journal_entries(semantic_embedding_generated);

-- Function to analyze journal entry content and extract metadata
CREATE OR REPLACE FUNCTION analyze_journal_entry_content(
  entry_id UUID,
  image_description TEXT DEFAULT NULL,
  user_caption TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  analysis_result JSONB;
  user_preferences JSONB;
  entry_data RECORD;
BEGIN
  -- Get journal entry data
  SELECT je.*, p.primary_fitness_goal, p.dietary_restrictions, p.preferred_content_style
  INTO entry_data
  FROM public.journal_entries je
  JOIN public.profiles p ON je.user_id = p.id
  WHERE je.id = entry_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Journal entry not found');
  END IF;
  
  -- For now, return a structured analysis template
  -- In a real implementation, this would call an AI service
  analysis_result := json_build_object(
    'meal_type', 'other',
    'dietary_pattern', 'balanced',
    'nutrition_focus', 'general_health',
    'cooking_method', 'other',
    'meal_timing', 'other',
    'estimated_calories', 400,
    'estimated_protein', 20,
    'estimated_carbs', 30,
    'estimated_fat', 15,
    'ingredients', ARRAY['ingredient1', 'ingredient2'],
    'ai_generated_insights', ARRAY[
      'This meal appears to be well-balanced with good macronutrient distribution',
      'Great choice for supporting your fitness goals'
    ],
    'ai_analysis_confidence', 0.8,
    'analysis_timestamp', NOW()
  );
  
  RETURN analysis_result;
END;
$$;

-- Function to update journal entry with AI analysis
CREATE OR REPLACE FUNCTION update_journal_entry_analysis(
  entry_id UUID,
  analysis_data JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.journal_entries 
  SET 
    meal_type = COALESCE(analysis_data->>'meal_type', meal_type),
    dietary_pattern = COALESCE(analysis_data->>'dietary_pattern', dietary_pattern),
    nutrition_focus = COALESCE(analysis_data->>'nutrition_focus', nutrition_focus),
    cooking_method = COALESCE(analysis_data->>'cooking_method', cooking_method),
    meal_timing = COALESCE(analysis_data->>'meal_timing', meal_timing),
    estimated_calories = COALESCE((analysis_data->>'estimated_calories')::INTEGER, estimated_calories),
    estimated_protein = COALESCE((analysis_data->>'estimated_protein')::DECIMAL, estimated_protein),
    estimated_carbs = COALESCE((analysis_data->>'estimated_carbs')::DECIMAL, estimated_carbs),
    estimated_fat = COALESCE((analysis_data->>'estimated_fat')::DECIMAL, estimated_fat),
    ingredients = COALESCE(
      ARRAY(SELECT jsonb_array_elements_text(analysis_data->'ingredients')), 
      ingredients
    ),
    ai_generated_insights = COALESCE(
      ARRAY(SELECT jsonb_array_elements_text(analysis_data->'ai_generated_insights')), 
      ai_generated_insights
    ),
    ai_analysis_confidence = COALESCE((analysis_data->>'ai_analysis_confidence')::DECIMAL, ai_analysis_confidence),
    last_analyzed_at = NOW(),
    updated_at = NOW()
  WHERE id = entry_id;
  
  RETURN FOUND;
END;
$$;

-- Enhanced semantic search function for journal entries
CREATE OR REPLACE FUNCTION search_journal_entries_semantic(
  user_id_param UUID,
  query_text TEXT,
  query_embedding vector(1536) DEFAULT NULL,
  meal_types TEXT[] DEFAULT NULL,
  dietary_patterns TEXT[] DEFAULT NULL,
  nutrition_focus_filter TEXT[] DEFAULT NULL,
  ingredients_filter TEXT[] DEFAULT NULL,
  similarity_threshold FLOAT DEFAULT 0.6,
  max_results INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  image_url TEXT,
  caption TEXT,
  content_type TEXT,
  meal_type TEXT,
  dietary_pattern TEXT,
  nutrition_focus TEXT,
  ingredients TEXT[],
  estimated_calories INTEGER,
  estimated_protein DECIMAL,
  estimated_carbs DECIMAL,
  estimated_fat DECIMAL,
  ai_generated_insights TEXT[],
  similarity FLOAT,
  created_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    je.id,
    je.image_url,
    je.caption,
    je.content_type,
    je.meal_type,
    je.dietary_pattern,
    je.nutrition_focus,
    je.ingredients,
    je.estimated_calories,
    je.estimated_protein,
    je.estimated_carbs,
    je.estimated_fat,
    je.ai_generated_insights,
    CASE 
      WHEN query_embedding IS NOT NULL THEN 
        COALESCE((1 - (ce.embedding <=> query_embedding)), 0.0)
      ELSE 0.0 
    END as similarity,
    je.created_at
  FROM public.journal_entries je
  LEFT JOIN public.content_embeddings ce ON ce.journal_entry_id = je.id
  WHERE je.user_id = user_id_param
    AND (meal_types IS NULL OR je.meal_type = ANY(meal_types))
    AND (dietary_patterns IS NULL OR je.dietary_pattern = ANY(dietary_patterns))
    AND (nutrition_focus_filter IS NULL OR je.nutrition_focus = ANY(nutrition_focus_filter))
    AND (ingredients_filter IS NULL OR je.ingredients && ingredients_filter)
    AND (
      query_text IS NULL 
      OR je.caption ILIKE '%' || query_text || '%'
      OR je.ingredients::TEXT ILIKE '%' || query_text || '%'
      OR EXISTS (
        SELECT 1 FROM unnest(je.ai_generated_insights) AS insight 
        WHERE insight ILIKE '%' || query_text || '%'
      )
    )
    AND (
      query_embedding IS NULL 
      OR ce.embedding IS NULL 
      OR (1 - (ce.embedding <=> query_embedding)) > similarity_threshold
    )
  ORDER BY 
    CASE WHEN query_embedding IS NOT NULL THEN 
      (1 - (ce.embedding <=> query_embedding)) 
    ELSE 0 
    END DESC,
    je.created_at DESC
  LIMIT max_results;
END;
$$;

-- Function to find similar meals to a specific journal entry
CREATE OR REPLACE FUNCTION find_similar_meals(
  user_id_param UUID,
  entry_id UUID,
  similarity_threshold FLOAT DEFAULT 0.7,
  max_results INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  image_url TEXT,
  caption TEXT,
  meal_type TEXT,
  dietary_pattern TEXT,
  ingredients TEXT[],
  similarity FLOAT,
  created_at TIMESTAMP WITH TIME ZONE,
  similarity_reasons TEXT[]
) 
LANGUAGE plpgsql
AS $$
DECLARE
  reference_entry RECORD;
  reference_embedding vector(1536);
BEGIN
  -- Get reference entry data
  SELECT je.* INTO reference_entry
  FROM public.journal_entries je
  WHERE je.id = entry_id AND je.user_id = user_id_param;
  
  -- Get reference embedding separately
  SELECT ce.embedding INTO reference_embedding
  FROM public.content_embeddings ce
  WHERE ce.journal_entry_id = entry_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    je.id,
    je.image_url,
    je.caption,
    je.meal_type,
    je.dietary_pattern,
    je.ingredients,
    GREATEST(
      CASE WHEN reference_embedding IS NOT NULL AND ce.embedding IS NOT NULL THEN 
        (1 - (ce.embedding <=> reference_embedding))
      ELSE 0.0 END,
      CASE WHEN je.meal_type = reference_entry.meal_type THEN 0.2 ELSE 0.0 END,
      CASE WHEN je.dietary_pattern = reference_entry.dietary_pattern THEN 0.15 ELSE 0.0 END,
      CASE WHEN je.ingredients && reference_entry.ingredients THEN 0.25 ELSE 0.0 END
    ) as similarity,
    je.created_at,
    ARRAY[
      CASE WHEN je.meal_type = reference_entry.meal_type THEN 'Same meal type' ELSE NULL END,
      CASE WHEN je.dietary_pattern = reference_entry.dietary_pattern THEN 'Similar dietary pattern' ELSE NULL END,
      CASE WHEN je.ingredients && reference_entry.ingredients THEN 'Common ingredients' ELSE NULL END,
      CASE WHEN reference_embedding IS NOT NULL AND ce.embedding IS NOT NULL AND 
        (1 - (ce.embedding <=> reference_embedding)) > 0.8 THEN 'High content similarity' ELSE NULL END
    ]::TEXT[] as similarity_reasons
  FROM public.journal_entries je
  LEFT JOIN public.content_embeddings ce ON ce.journal_entry_id = je.id
  WHERE je.user_id = user_id_param 
    AND je.id != entry_id
    AND (
      (reference_embedding IS NOT NULL AND ce.embedding IS NOT NULL AND 
       (1 - (ce.embedding <=> reference_embedding)) > similarity_threshold)
      OR je.meal_type = reference_entry.meal_type
      OR je.dietary_pattern = reference_entry.dietary_pattern
      OR je.ingredients && reference_entry.ingredients
    )
  ORDER BY similarity DESC
  LIMIT max_results;
END;
$$;

-- Function to get journal analytics and AI insights
CREATE OR REPLACE FUNCTION get_journal_analytics_with_insights(
  user_id_param UUID,
  time_range_days INTEGER DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  analytics_result JSONB;
  total_entries INTEGER;
  meal_type_distribution JSONB;
  nutrition_trends JSONB;
  top_ingredients TEXT[];
  ai_insights TEXT[];
  cutoff_date TIMESTAMP WITH TIME ZONE;
BEGIN
  cutoff_date := NOW() - INTERVAL '1 day' * time_range_days;
  
  -- Get total entries
  SELECT COUNT(*) INTO total_entries
  FROM public.journal_entries 
  WHERE user_id = user_id_param AND created_at >= cutoff_date;
  
  -- Get meal type distribution
  SELECT COALESCE(
    json_object_agg(meal_type, entry_count),
    '{}'::jsonb
  ) INTO meal_type_distribution
  FROM (
    SELECT 
      COALESCE(meal_type, 'unclassified') as meal_type,
      COUNT(*) as entry_count
    FROM public.journal_entries 
    WHERE user_id = user_id_param AND created_at >= cutoff_date
    GROUP BY meal_type
  ) meal_counts;
  
  -- Get nutrition trends (averages)
  SELECT json_build_object(
    'avg_calories', ROUND(AVG(estimated_calories)),
    'avg_protein', ROUND(AVG(estimated_protein), 1),
    'avg_carbs', ROUND(AVG(estimated_carbs), 1),
    'avg_fat', ROUND(AVG(estimated_fat), 1),
    'total_meals_analyzed', COUNT(*) FILTER (WHERE estimated_calories IS NOT NULL)
  ) INTO nutrition_trends
  FROM public.journal_entries 
  WHERE user_id = user_id_param 
    AND created_at >= cutoff_date
    AND estimated_calories IS NOT NULL;
  
  -- Get top ingredients
  SELECT array_agg(ingredient ORDER BY ingredient_count DESC) 
  INTO top_ingredients
  FROM (
    SELECT 
      unnest(ingredients) as ingredient,
      COUNT(*) as ingredient_count
    FROM public.journal_entries 
    WHERE user_id = user_id_param 
      AND created_at >= cutoff_date
      AND ingredients IS NOT NULL
    GROUP BY unnest(ingredients)
    ORDER BY ingredient_count DESC
    LIMIT 10
  ) top_ingredients_query;
  
  -- Generate AI insights based on data
  ai_insights := ARRAY[
    'You''ve logged ' || total_entries || ' meals in the last ' || time_range_days || ' days',
    CASE 
      WHEN (meal_type_distribution->>'breakfast')::INTEGER > (meal_type_distribution->>'dinner')::INTEGER 
      THEN 'Great job prioritizing breakfast! This supports your metabolism throughout the day'
      ELSE 'Consider adding more breakfast entries to track your morning nutrition'
    END,
    CASE 
      WHEN (nutrition_trends->>'avg_protein')::DECIMAL >= 20 
      THEN 'Your protein intake looks solid for supporting your fitness goals'
      ELSE 'You might benefit from increasing protein in your meals'
    END
  ];
  
  -- Build final analytics result
  analytics_result := json_build_object(
    'total_entries', total_entries,
    'meal_type_distribution', meal_type_distribution,
    'nutrition_trends', nutrition_trends,
    'top_ingredients', COALESCE(top_ingredients, ARRAY[]::TEXT[]),
    'ai_insights', ai_insights,
    'time_range_days', time_range_days,
    'analysis_date', NOW()
  );
  
  RETURN analytics_result;
END;
$$;

-- Grant permissions for new functions
GRANT EXECUTE ON FUNCTION analyze_journal_entry_content(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_journal_entry_analysis(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION search_journal_entries_semantic(UUID, TEXT, vector, TEXT[], TEXT[], TEXT[], TEXT[], FLOAT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION find_similar_meals(UUID, UUID, FLOAT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_journal_analytics_with_insights(UUID, INTEGER) TO authenticated;

-- Update the trigger to analyze content when journal entries are inserted
CREATE OR REPLACE FUNCTION trigger_analyze_journal_entry()
RETURNS TRIGGER AS $$
BEGIN
  -- Trigger async analysis (in a real implementation, this would queue a background job)
  -- For now, we'll just mark that analysis is needed
  NEW.semantic_embedding_generated := FALSE;
  NEW.last_analyzed_at := NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new journal entries
DROP TRIGGER IF EXISTS analyze_journal_entry_trigger ON public.journal_entries;
CREATE TRIGGER analyze_journal_entry_trigger
  BEFORE INSERT ON public.journal_entries
  FOR EACH ROW EXECUTE FUNCTION trigger_analyze_journal_entry(); 