/**
 * Database Service - JSON-based persistence with localStorage
 * 
 * This module exports the JSON database for use throughout the app.
 * All existing code remains compatible - just import { db } from './services/db'
 */

import { jsonDB } from './jsonDB';

// Export the JSON database instance
export const db = jsonDB;

// Export utility functions
export const getDBStats = () => jsonDB.getStats();
export const exportDatabase = () => jsonDB.exportJSON();
export const importDatabase = (json: string) => jsonDB.importJSON(json);
export const resetDatabase = () => jsonDB.reset();

// Download database backup as JSON file
export const downloadDatabaseBackup = () => {
  const dataStr = exportDatabase();
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `psychx-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  console.log('✅ Database backup downloaded');
};

// Make utilities available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).downloadBackup = downloadDatabaseBackup;
  (window as any).exportDB = exportDatabase;
  (window as any).resetDB = resetDatabase;
  (window as any).dbStats = getDBStats;
  console.log('🛠️ Database utilities: downloadBackup(), exportDB(), resetDB(), dbStats()');
}
