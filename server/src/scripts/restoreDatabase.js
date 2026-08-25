import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("MONGO_URI is not defined in .env");
  process.exit(1);
}

// Get the backup folder from command line arguments
const backupFolderName = process.argv[2];

if (!backupFolderName) {
  console.error("Please provide the backup folder path to restore from.");
  console.error("Usage: node restoreDatabase.js <path-to-backup-folder>");
  console.error("Example: node restoreDatabase.js ../../backups/backup-2023-10-25T10-30-00-000Z/database_name");
  process.exit(1);
}

const restorePath = path.resolve(backupFolderName);

if (!fs.existsSync(restorePath)) {
  console.error(`Restore path does not exist: ${restorePath}`);
  process.exit(1);
}

console.log(`Starting database restore from: ${restorePath}`);
console.log(`Using MONGO_URI: ${MONGO_URI.replace(/:([^:@]+)@/, ':****@')}`); // Mask password

// WARNING: --drop will drop collections before restoring them.
const command = `mongorestore --uri="${MONGO_URI}" --drop "${restorePath}"`;

console.log("WARNING: This will drop existing collections and replace them with the backup.");
console.log("Running command in 5 seconds... Press Ctrl+C to cancel.");

setTimeout(() => {
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Restore failed: ${error.message}`);
      console.error('Make sure MongoDB Database Tools (mongorestore) is installed on this system and in the PATH.');
      process.exit(1);
    }
    
    if (stderr) {
      console.log(`mongorestore stderr: ${stderr}`);
    }
    
    console.log(`Restore completed successfully from ${restorePath}`);
  });
}, 5000);
