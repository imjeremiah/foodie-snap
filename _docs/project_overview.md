# FoodieSnap

_Share Moments. Disappear. Discover More._

## Background

Visual communication has become the dominant language of digital connection. Over 5 billion people worldwide use ephemeral messaging daily—from teenagers sharing moments with friends to professionals networking at events. The visual social media market has grown to over $15 billion annually, with Snapchat alone serving 750 million daily users and generating $4+ billion in revenue.

Yet despite this massive adoption, current platforms are fundamentally limited by their shallow understanding of content and user preferences. Users are drowning in generic content, struggling to find personalized experiences, and missing out on AI-generated content that could perfectly match their interests and social contexts.

## The Current Problem:

- **Surface-Level Personalization**: While platforms have recommendation algorithms, they lack deep semantic understanding of user interests and content meaning.
- **Limited Content Assistance**: Users must generate all content themselves without intelligent AI assistance for creation.
- **Manual Content Creation**: No tools to help users create engaging captions, stories, or post ideas based on their interests.
- **Context-Aware Generation Gap**: Apps can't leverage user history and preferences to generate relevant, personalized content suggestions.
- **Reactive Rather Than Proactive**: Platforms show existing content but don't help users create better content.

## The Market Opportunity

Snapchat's success proves massive demand for ephemeral visual communication, but their pre-AI architecture leaves enormous room for improvement. Users consistently report frustration with irrelevant content, repetitive experiences, and lack of intelligent content assistance.

## The RAG Revolution

Retrieval-Augmented Generation represents a fundamental breakthrough in personalized content experiences. Instead of static recommendations, RAG enables real-time access to vast knowledge bases about user preferences, interests, and behaviors to generate perfectly tailored content and suggestions.

What if we could rebuild Snapchat with RAG at its core? Instead of users seeing generic content, AI could understand their interests deeply and generate personalized snaps, captions, and recommendations. Rather than manual content creation, RAG could assist users in creating content that resonates with their audience and personal brand.

Today, we're building the next generation of social platforms: RAG-powered applications that don't just share content, but intelligently generate and curate personalized experiences based on deep understanding of user preferences and social contexts.

## Project Overview

This project challenges you to build a fully functional Snapchat clone, then enhance it with cutting-edge RAG (Retrieval-Augmented Generation) capabilities that surpass existing social platforms. You'll leverage modern AI development tools and implement sophisticated content generation and personalization systems throughout the entire user experience.

### MVP Phase: Core Clone

Build a complete ephemeral messaging platform with essential features:

- Real-time photo/video sharing with disappearing messages (note: no live video requured)
- Simple AR filters and camera effects (think simple frames, etc)
- User authentication and friend management
- Stories and group messaging functionality
- Core social features matching Snapchat's core experience

### Full Phase: RAG Enhancement

Transform your clone by integrating advanced RAG capabilities tailored to your chosen user niche:

- Personalized content generation based on user interests and history
- Intelligent caption and story suggestions using RAG
- Context-aware friend and content recommendations
- AI-generated content ideas and prompts

### Ultimate Goal

Create a better version of Snapchat built with RAG-first principles, demonstrating how retrieval-augmented generation can revolutionize content creation and personalization beyond what traditional platforms offer.

## Key Development Focus: RAG-Powered Content Generation

Your project centers on building an intelligent social platform using Retrieval-Augmented Generation for personalized content experiences. Choose one primary user type and build a complete RAG-enhanced experience for them.

### Choose Your Primary User

Our primary user is a hybrid of a **Content Creator** and an **Interest Enthusiast**. They are passionate about their health and fitness journey and motivated to create content that documents their progress and shares their knowledge with a like-minded community.

### Specify Your Niche

Our specific niche is **The Health-Conscious Meal Prepper**.

This user is focused on fitness, nutrition, and planning their meals to achieve specific health goals (e.g., muscle gain, fat loss, clean eating). They create both photo and video content showcasing their meals, recipes, and healthy habits.

### Define RAG-Enhanced User Stories

Our 6 core user stories are a mix of direct RAG features and the essential supporting features that make the AI smart and personalized.

1.  **AI-Powered Content Co-Pilot:** "As a user, when I upload a photo or a short video of my meal, I want the AI to instantly generate three distinct options for a caption or a brief voice-over script that match my personal tone and fitness goals."
2.  **Proactive Idea & Prompt Generator:** "As a user, I want to receive a weekly 'Content Spark' notification with three personalized photo and video prompts to help me create engaging content about my health journey."
3.  **"Scan-a-Snack" Knowledge Assistant:** "As a user, I want to scan an ingredient or a nutritional label and have the AI generate an interactive story card with key nutritional facts and a healthy recipe suggestion."
4.  **Personalized Onboarding:** "As a new user during onboarding, I want to select my primary fitness goal, dietary needs, and preferred content style to ensure the AI's first suggestions are immediately relevant."
5.  **The Content Journal:** "As a user, I want a dedicated 'Journal' tab (similar to Snapchat Memories) that displays all my past content, allowing me to track my progress and providing the AI with a rich history to improve its suggestions."
6.  **The Feedback Loop:** "As a user, for every AI-generated suggestion, I want the ability to give it a simple thumbs-up or thumbs-down to actively teach the AI about my specific tastes and improve future recommendations."

### Build RAG-First

Every feature should leverage RAG capabilities for intelligent content generation and personalization. Each RAG implementation should work end-to-end before moving to the next.

For example, if you choose Content Creators:

- ✅ Complete user interest profiling → content knowledge base → personalized generation pipeline
- ❌ Partial implementation of basic recommendations, caption generation, AND audience analysis

If you choose Social Connectors:

- ✅ Complete friend interaction history → relationship context → personalized content suggestions flow
- ❌ Partial implementation of friend suggestions, group features, AND content recommendations

Remember: A fully functional RAG app for one user type is more valuable than a partial implementation trying to serve everyone.

## Core Requirements

To successfully complete this project, you must:

### 1. Build and Deploy a Working Application

- **User Focus**: Pick one primary user type (Content Creators/Social Connectors/Interest Enthusiasts)
- **Niche Selection**: Choose a specific niche within your user type
- **Feature Set**: Identify 6 core user stories that leverage or support RAG capabilities

### 2. Implement RAG-Powered Features

- **Personalized Content Generation**: AI-generated captions, stories, and post ideas based on user interests and history
- **Intelligent Content Suggestions**: Context-aware recommendations for what to post, when to post, and how to engage
- **Knowledge-Enhanced Responses**: Use external knowledge bases to generate relevant, accurate, and engaging content
- **Adaptive Learning**: RAG system that improves suggestions based on user feedback and behavior patterns

### 3. Showcase Your Implementation

- **Demo Video**: Highlight your chosen path, niche, and RAG-powered user stories
- **Working Features**: Demonstrate functionality that matches your 6 user stories
- **RAG Integration**: Show how RAG enhances the content creation or social experience

## Technical Architecture Recommendations

### Frontend Stack

- **Framework**: React Native with Expo for rapid cross-platform development
- **Build Tool**: Expo for React Native for rapid development
- **Styling**: NativeWind/Tailwind CSS for responsive design
- **State Management**: Zustand or Redux Toolkit for complex state management
- **Real-time Features**: Supabase Realtime

### Backend & RAG Integration

**Option : Supabase**

- **Authentication**: Supabase Auth
- **Database**: PostgreSQL on Supabase with vector extensions
- **Functions**: Edge Functions for RAG processing
- **Storage**: Supabase Storage for media files
- **Hosting**: Vercel

### RAG Services

- **Primary LLM**: OpenAI GPT-4 API for content generation and understanding
- **Vector Database**: Supabase Vector for semantic search
- **Processing**: Edge Functions for RAG orchestration

## Success Metrics

### Core Functionality

- **Feature Completeness**: All 6 identified user stories fully functional
- **Performance**: Sub-3 second response time for RAG-generated content
- **User Experience**: Seamless content generation/consumption without interrupting user flow
- **Deployment**: Fully deployed and accessible mobile application

### RAG Quality

- **Content Quality**: Generated content matches user interests and writing style
- **Personalization**: Demonstrable improvement in content quality through user-specific RAG
- **Knowledge Integration**: Effective use of external knowledge for enhanced content generation
- **Learning**: Personalization improves with user feedback and interaction history
