import express from 'express';

const router = express.Router();

// Example route
router.get('/', (req, res) => {
  res.json({ 
    message: 'Example API endpoint',
    timestamp: new Date().toISOString()
  });
});

export default router;

