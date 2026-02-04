import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './db.js';
import apiRoutes from './routes/api.js';
import apexRoutes from './routes/apex.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;
// Middleware
app.use(cors());
app.use(express.json());
// API Routes
app.use('/api', apiRoutes);
app.use('/api/apex', apexRoutes);
// Serve static files from dist folder
app.use(express.static(path.join(__dirname, '../dist')));
// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, '../dist/index.html'));
    }
});
// Initialize database and start server
async function start() {
    try {
        await initDatabase();
        console.log('✅ Database initialized');
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}
start();
