import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

// Railway provides DATABASE_URL automatically
export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Initialize database schema
export async function initDatabase() {
    const client = await pool.connect();
    try {
        // Read and execute schema.sql
        const schemaPath = path.join(__dirname, 'schema.sql');
        if (fs.existsSync(schemaPath)) {
            const schema = fs.readFileSync(schemaPath, 'utf8');
            await client.query(schema);
            console.log('Database schema applied');
        }
    } finally {
        client.release();
    }
}

// Helper function for queries
export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
    const result = await pool.query(text, params);
    return result.rows as T[];
}

// Helper function for single row queries
export async function queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
    const result = await pool.query(text, params);
    return result.rows[0] as T || null;
}
