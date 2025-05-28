import { neon } from '@neondatabase/serverless'
import 'dotenv/config'

// Create a SQL connection using out DB URL
export const sql = neon(process.env.DATABASE_URL)

export async function initDB() {
  try {
    await sql`CREATE TABLE IF NOT EXISTS diaries(
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      text TEXT NOT NULL,
      image_url VARCHAR(255) NOT NULL,
      emotion_category VARCHAR(255) NOT NULL,
      animal_category VARCHAR(255) NOT NULL,
      created_at TIMESTAMP (0) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`

    console.log("Database initialized successfully")
  } catch (error) {
    console.log("Error initializing DB", error)
    process.exit(1)
  }
}
