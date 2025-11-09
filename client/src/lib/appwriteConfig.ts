/**
 * Appwrite Configuration
 * 
 * Set up your Appwrite credentials:
 * 1. Create a project in Appwrite Console: https://cloud.appwrite.io
 * 2. Get your Project ID and API Endpoint from Project Settings
 * 3. Create a Database and get Database ID
 * 4. Add them to your environment variables or .env file:
 *    - VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
 *    - VITE_APPWRITE_PROJECT_ID=your-project-id
 *    - VITE_APPWRITE_DATABASE_ID=your-database-id
 * 5. Or replace the values directly below (not recommended for production)
 */

import { Client, Databases, Realtime, Query } from 'appwrite';

// Get Appwrite credentials from environment variables
const appwriteEndpoint = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const appwriteProjectId = import.meta.env.VITE_APPWRITE_PROJECT_ID || '';
const appwriteDatabaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID || '';

// Initialize Appwrite client
let client: Client | null = null;
let databases: Databases | null = null;
let realtime: Realtime | null = null;
let appwriteError: Error | null = null;

try {
  if (!appwriteProjectId || !appwriteDatabaseId) {
    throw new Error("Appwrite Project ID and Database ID are required. Set VITE_APPWRITE_PROJECT_ID and VITE_APPWRITE_DATABASE_ID environment variables.");
  }

  // Log configuration for debugging
  console.log("🔧 Appwrite Configuration:", {
    endpoint: appwriteEndpoint,
    projectId: appwriteProjectId ? `${appwriteProjectId.substring(0, 8)}...` : 'missing',
    databaseId: appwriteDatabaseId ? `${appwriteDatabaseId.substring(0, 8)}...` : 'missing',
  });

  client = new Client()
    .setEndpoint(appwriteEndpoint)
    .setProject(appwriteProjectId);

  databases = new Databases(client);
  realtime = new Realtime(client);

  console.log("✅ Appwrite initialized successfully");
  console.log(`   Endpoint: ${appwriteEndpoint}`);
  console.log(`   Project ID: ${appwriteProjectId.substring(0, 8)}...`);
  console.log(`   Database ID: ${appwriteDatabaseId.substring(0, 8)}...`);
} catch (error) {
  appwriteError = error instanceof Error ? error : new Error(String(error));
  console.error("❌ Appwrite initialization error:", appwriteError);
  console.error("   Endpoint used:", appwriteEndpoint);
  console.error("   Project ID:", appwriteProjectId || 'MISSING');
  console.error("   Database ID:", appwriteDatabaseId || 'MISSING');
  console.warn("⚠️ Appwrite unavailable - app will use LocalStorage only");
}

// Export database ID
export const DATABASE_ID = appwriteDatabaseId;

// Export with type guards
export { client, databases, realtime };
export const getAppwriteClient = (): Client | null => {
  if (!client && appwriteError) {
    console.warn("Appwrite not initialized. Using LocalStorage only.");
  }
  return client;
};

export const getAppwriteDatabases = (): Databases | null => {
  if (!databases && appwriteError) {
    console.warn("Appwrite not initialized. Using LocalStorage only.");
  }
  return databases;
};

export const getAppwriteRealtime = (): Realtime | null => {
  if (!realtime && appwriteError) {
    console.warn("Appwrite not initialized. Using LocalStorage only.");
  }
  return realtime;
};

export const isAppwriteAvailable = (): boolean => {
  return client !== null && databases !== null && realtime !== null;
};

// Export constants for collection IDs (you'll set these after creating collections)
export const COLLECTION_IDS = {
  CLASSES: 'classes',
  STUDENTS: 'students',
  ATTENDANCE: 'attendance',
  SUMMARY: 'summary',
} as const;

export default client;
