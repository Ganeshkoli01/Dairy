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

const BACKUP_DIR = path.join(__dirname, '../../backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Generate backup filename based on current timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.join(BACKUP_DIR, `backup-${timestamp}`);

console.log(`Starting database backup to: ${backupPath}`);
console.log(`Using MONGO_URI: ${MONGO_URI.replace(/:([^:@]+)@/, ':****@')}`); // Mask password

// Run mongodump command
// mongodump --uri="mongodb+srv://user:pass@cluster.net/dbname" --out="/path/to/backup"
const command = `mongodump --uri="${MONGO_URI}" --out="${backupPath}"`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Backup failed: ${error.message}`);
    console.error('Make sure MongoDB Database Tools (mongodump) is installed on this system and in the PATH.');
    process.exit(1);
  }
  
  if (stderr) {
    console.log(`mongodump stderr: ${stderr}`);
  }
  
  console.log(`Backup completed successfully at ${backupPath}`);
  
  // Optional: Compress the backup folder, clean up old backups, etc.
});
