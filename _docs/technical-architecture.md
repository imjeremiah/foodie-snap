# FoodieSnap Technical Architecture

**System Architecture and Data Flow Documentation**

## System Overview

### High-Level Architecture
```
Mobile App (React Native + Expo)
         │
         ▼
    API Layer (Supabase Auto APIs + Edge Functions)
         │
         ▼
Backend Services (PostgreSQL + pgvector + Storage)
         │
         ▼
External Services (OpenAI + CDN + Analytics)
```

### Technology Stack
- **Frontend**: React Native with Expo
- **State Management**: Redux Toolkit + RTK Query  
- **Styling**: NativeWind (Tailwind CSS)
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **AI Services**: OpenAI GPT-4, Vision, and Embeddings APIs
- **Vector Database**: pgvector extension for PostgreSQL
- **File Storage**: Supabase Storage (S3-compatible)

## Data Architecture

### Database Schema Overview
```
Core Tables:
- auth.users (Supabase managed)
- profiles (user data + preferences)
- journal_entries (user content)
- conversations + messages (chat system)
- stories (24-hour content)
- spotlight_posts (public content)

AI/RAG Tables:
- content_embeddings (vector storage)
- ai_feedback (user feedback on AI suggestions)
- content_sparks (weekly content prompts)

Social Tables:
- friends (relationship management)
- conversation_participants (chat membership)
- user_preferences (privacy/notification settings)
```

### Data Flow Patterns

#### Content Creation Flow
```
User Creates Content → Save to Journal → Generate Embeddings (Async) → Store Vector in pgvector
```

#### AI Caption Generation Flow  
```
User Requests Captions → Analyze Image (OpenAI Vision) → Generate Embedding → Search Similar Content (pgvector) → Get User Preferences → Generate Personalized Captions (GPT-4)
```

## RAG Pipeline Architecture

### Knowledge Ingestion
1. **Content Processing**: Extract text from captions, tags, metadata
2. **Embedding Generation**: OpenAI text-embedding-ada-002
3. **Vector Storage**: pgvector with HNSW indexing
4. **Metadata Enrichment**: User preferences, content type, timestamps

### Retrieval Engine
1. **Vector Similarity Search**: Cosine similarity with pgvector
2. **Contextual Filtering**: User preferences, content type, recency
3. **Relevance Ranking**: Combine similarity score with user context

### Generation Engine
1. **Prompt Engineering**: Dynamic prompts with user context
2. **Multi-option Generation**: 3 distinct caption styles
3. **Feedback Integration**: Learn from user thumbs up/down
4. **Quality Control**: Validate outputs for appropriateness

## API Architecture

### Supabase Auto-Generated APIs
- **Table CRUD**: Auto-generated REST/GraphQL APIs
- **Real-time Subscriptions**: WebSocket-based live updates
- **Authentication**: JWT-based with Row Level Security
- **File Upload**: Direct-to-storage with signed URLs

### Custom Edge Functions
- **generate-smart-captions**: AI caption generation
- **scan-nutrition-label**: Nutrition analysis with OpenAI Vision
- **generate-weekly-content-sparks**: Proactive content suggestions
- **generate-content-embeddings**: Async embedding generation

## Security Architecture

### Authentication & Authorization
- **Supabase Auth**: JWT tokens with secure session management
- **Row Level Security**: Database-level access controls
- **API Security**: Rate limiting, input validation, audit logging

### Data Protection
- **Encryption**: TLS in transit, AES-256 at rest
- **Privacy**: User data isolation with RLS policies
- **Compliance**: GDPR-ready with data export/deletion

## Deployment Architecture

### Environments
- **Development**: Local Supabase + Expo Go
- **Staging**: Supabase staging + Expo Development Build
- **Production**: Supabase production + App Store/Play Store

### CI/CD Pipeline
```
GitHub Push → Run Tests → Deploy Edge Functions → Update Database Schema → Deploy Mobile App
```

### Monitoring
- **Health Checks**: Database, AI services, storage availability
- **Performance Metrics**: API response times, AI processing duration
- **Error Tracking**: Centralized logging and alerting

## Integration Patterns

### OpenAI Integration
- **Retry Logic**: Exponential backoff for API failures
- **Cost Optimization**: Caching and request batching
- **Fallback Strategies**: Generic responses when AI fails

### Real-time Features
- **Messaging**: Supabase Realtime for instant delivery
- **Presence**: Online status and typing indicators
- **Live Updates**: Feed refreshes and notification delivery

### External Services
- **CDN**: Optimized media delivery
- **Analytics**: Usage tracking and performance monitoring
- **Push Notifications**: Cross-platform notification delivery

This architecture provides a scalable foundation for FoodieSnap's AI-powered social features while maintaining security and performance standards. 