# Database Directory

This directory contains database-related files, schemas, and utility scripts for the FoodieSnap application.

## Structure

```
database/
├── scripts/              # Database utility and maintenance scripts
│   ├── apply_database_fix.js    # Historical fix script for content_sparks table
│   └── verify_fix.js           # Historical verification script
├── schemas/              # Standalone schema files (future)
└── verification/         # Database verification scripts (future)
```

## Scripts

### Historical Scripts

These scripts were used for one-time fixes and are kept for historical reference:

#### `apply_database_fix.js`
- **Purpose**: One-time script to create the `content_sparks` table
- **Status**: ⚠️ **DEPRECATED** - Functionality now covered by migration `20250102000001_content_sparks_system.sql`
- **Usage**: Not recommended for new installations

#### `verify_fix.js`
- **Purpose**: Verification script to check if content_sparks table was created properly
- **Status**: ⚠️ **DEPRECATED** - Table creation now handled by migrations
- **Usage**: Can be used to verify existing installations

## Migration System

The primary database schema and data management is handled through Supabase migrations in:
```
supabase/migrations/
```

Key migrations include:
- `00001_initial_schema.sql` - Core tables and RLS policies
- `20250101000004_setup_pgvector_rag.sql` - RAG and vector search setup
- `20250102000001_content_sparks_system.sql` - Content sparks system
- `20250103000000_create_demo_users.sql` - Demo data setup

## Database Features

### Core Features
- **Authentication**: Supabase Auth with profile management
- **Social Features**: Friends, conversations, messages, stories
- **Content Management**: Journal entries, spotlight posts
- **AI Integration**: Content embeddings, AI feedback tracking

### Advanced Features
- **RAG (Retrieval-Augmented Generation)**: 
  - pgvector extension for similarity search
  - 1536-dimension embeddings for content
  - Semantic search across user content

- **Real-time Subscriptions**:
  - Live message updates
  - Friend request notifications
  - Story view tracking

- **Row Level Security (RLS)**:
  - User data isolation
  - Privacy-focused policies
  - Secure multi-tenant architecture

## Development

### Creating New Migrations
```bash
# Create a new migration
supabase migration new your_migration_name

# Apply migrations to local development
supabase db reset

# Apply migrations to remote (production)
supabase db push
```

### Database Functions
The application uses several PostgreSQL functions for:
- User context retrieval for RAG
- Content similarity search
- Weekly content spark generation
- User statistics aggregation

### Testing Database Functions
```bash
# Test database connectivity and functions
npm run test:database
```

## Notes

- All database changes should go through the migration system
- Historical scripts in this directory are for reference only
- The database uses PostgreSQL with the pgvector extension
- RLS policies ensure data security and user privacy 