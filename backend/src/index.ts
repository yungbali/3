import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import podcastRoutes from './routes/podcast';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'kotomo-backend' });
});

// API routes
app.use('/api', podcastRoutes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`🎙️ KOTOMO backend running on port ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
  console.log(`   Generate endpoint: POST http://localhost:${PORT}/api/generate`);
});
