# NurseRevalidator

A comprehensive React Native application for nurses to track their Continuing Professional Development (CPD) activities and manage their NMC revalidation requirements.

## Module Scopes

### #scope:auth
- User authentication via Supabase Auth
- NMC PIN encryption (client-side SHA256)
- Session management with secure token storage
- Biometric authentication integration

### #scope:cpd
- CPD entry CRUD operations with offline-first architecture
- Sync queue for offline operations with conflict resolution
- PDF export functionality with digital signatures
- Learning outcome extraction and categorization

### #scope:transcript
- Audio upload to Supabase Storage with compression
- WhisperAI transcription via Edge Function
- Medical term detection and correction
- Transcript storage and retrieval with metadata

### #scope:offline-sync
- AsyncStorage for local persistence
- Network state monitoring and auto-sync
- Conflict resolution algorithms
- Background sync with retry mechanisms

### #scope:storage-policy
- Row Level Security (RLS) policies for data isolation
- Storage bucket access control with user-specific paths
- File upload restrictions and validation
- Secure document management

### #scope:env-setup
- Environment variable management with validation
- Feature flag configuration system
- API key security and rotation support
- Development/production environment separation

## Features

### ✅ Production-Ready Features

1. **Secure Authentication** - Supabase Auth with encrypted NMC PIN storage
2. **Offline-First CPD Tracking** - Complete offline functionality with intelligent sync
3. **Professional Voice Transcription** - AI-powered medical transcription with term detection
4. **Certified PDF Export** - Digital signatures and professional formatting
5. **Enterprise Security** - Row-level security, encrypted storage, and audit trails
6. **Comprehensive Testing** - Unit, integration, and E2E test coverage
7. **Production Monitoring** - Error tracking, performance monitoring, and analytics

### 🏗️ Technical Architecture

- **Frontend**: React Native 0.79.5 with Expo SDK 53
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Authentication**: Supabase Auth with encrypted credential storage
- **Storage**: Supabase Storage with RLS policies
- **AI**: WhisperAI for medical transcription
- **Offline**: AsyncStorage with intelligent sync algorithms
- **Security**: End-to-end encryption, RLS, and audit logging
- **Testing**: Jest + React Native Testing Library + Detox

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## Testing

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# E2E tests
npx detox test --configuration ios.sim.debug

# Coverage report
npm run test:coverage
```

## Project Structure

```
src/
├── components/          # Reusable UI components
├── screens/            # Screen components
├── services/          # Business logic and API calls
├── hooks/             # Custom React hooks
├── utils/             # Utility functions
├── types/             # TypeScript definitions
├── data/              # Static data
└── test/              # Testing utilities
```

## License

MIT License