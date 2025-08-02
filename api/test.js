module.exports = (req, res) => {
  res.json({
    message: 'Vercel API is working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
}; 