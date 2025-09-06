// SPRAXXX Core Entry Point
import express from 'express';
import issueTunnel from './routes/issueTunnel.js';
import { createTables } from './models/storage.js';
const app = express();
const PORT = process.env.PORT || 3000;
// Middleware
app.use(express.json());
// Initialize database tables
createTables();
// Routes
app.use('/api', issueTunnel);
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        covenant: 'Festival-Moon',
        message: 'SPRAXXX Core with dignity-preserving financial management'
    });
});
// Root endpoint with covenant information
app.get('/', (req, res) => {
    res.json({
        name: 'SPRAXXX Core',
        version: '1.0.0',
        covenant: 'Festival-Moon Financial Management',
        ethos: 'The worker is worthy of his wages',
        features: [
            'Covenant-based financial ledger',
            'Fair wage verification',
            'Dignity preservation transactions',
            'Community treasury management',
            'Gift economy support',
            'WireGuard tunnel management'
        ],
        endpoints: {
            health: '/health',
            issueTunnel: '/api/issueTunnel',
            docs: 'See docs/FESTIVAL_MOON_COVENANT.md'
        }
    });
});
// Start server
app.listen(PORT, () => {
    console.log(`🌙 SPRAXXX Core (Festival-Moon) running on port ${PORT}`);
    console.log('✨ Covenant-based financial management initialized');
    console.log('📖 See docs/FESTIVAL_MOON_COVENANT.md for details');
});
export default app;
