# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Basic Commands
- `npm start` - Start Expo development server
- `npm run android` - Run on Android device/emulator  
- `npm run ios` - Run on iOS device/simulator
- `npm run web` - Run web version

### Environment Setup
- Copy `.env.example` to `.env` and configure Supabase credentials:
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## Architecture Overview

### Tech Stack
- **Framework**: React Native with Expo (~53.0.12)
- **Navigation**: Expo Router with file-based routing
- **Backend**: Supabase (authentication, database)
- **State Management**: TanStack Query for server state, React Context for auth
- **UI Components**: React Native Paper, custom components
- **Maps**: MapLibre React Native
- **Animations**: React Native Reanimated
- **Location**: Expo Location
- **Audio**: Expo AV

### Project Structure

#### App Structure (File-based Routing)
- `app/_layout.tsx` - Root layout with providers (Auth, Query, Gesture Handler)
- `app/(auth)/` - Authentication screens (sign-in, sign-up, forgot-password)
- `app/(protected)/` - Authenticated user screens
- `app/(protected)/(tabs)/` - Main tab navigation (index, earthquakes, network, news)
- `app/(protected)/profile/` - Profile and settings screens

#### Core Directories
- `providers/` - Context providers (AuthProvider, QueryProvider)
- `hooks/` - Custom React hooks for data fetching (useEarthquakes, useAuth, etc.)
- `components/` - Reusable UI components
- `lib/` - External service configurations (supabase.ts)
- `types/` - TypeScript type definitions
- `utils/` - Utility functions
- `constants/` - App constants (colors, maps, etc.)
- `assets/` - Static assets (fonts, images, sounds, data)

### Authentication Flow
- Uses Supabase Auth with AsyncStorage for persistence
- AuthProvider wraps the app and provides authentication state
- Protected routes redirect to sign-in if not authenticated
- Auto-refresh tokens when app becomes active

### Data Layer
- TanStack Query for server state management and caching
- Custom hooks in `hooks/` directory for data fetching
- Supabase client configured in `lib/supabase.ts`
- Background data prefetching and refresh setup

### Key Features
- **Earthquake Tracking**: Real-time earthquake data and statistics
- **News System**: Earthquake-related news with categories
- **User Networks**: Community features for earthquake preparedness
- **Risk Assessment**: Safety forms and risk analysis
- **Emergency Features**: Whistle sounds, first aid information
- **Location Services**: Location-based earthquake alerts and mapping
- **Premium Features**: Subscription-based advanced features (commented out)

### Component Patterns
- Components use React Native Paper for consistent UI
- Custom hooks for data fetching with error handling
- Location-based features require appropriate permissions
- Background processes for data synchronization
- Audio features for emergency sounds

### Development Notes
- TypeScript with strict mode enabled
- Path aliases configured (`@/*` maps to root directory)
- Metro config wrapped with Reanimated for animations
- Expo plugins configured for location, audio, and maps
- React Native new architecture enabled