// #scope:env-setup
export const ENV = {
  supabase: {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  },
  
  features: {
    pdfExport: process.env.EXPO_PUBLIC_FEATURE_PDF_EXPORT === 'true',
    voiceTranscription: process.env.EXPO_PUBLIC_FEATURE_VOICE_TRANSCRIPTION === 'true',
    offlineMode: process.env.EXPO_PUBLIC_FEATURE_OFFLINE_MODE === 'true',
  },
  
  security: {
    encryptionEnabled: process.env.EXPO_PUBLIC_ENCRYPTION_ENABLED === 'true',
  },
  
  isDevelopment: __DEV__,
  isProduction: !__DEV__,
};

// Validate required environment variables
const requiredEnvVars = [
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export default ENV;