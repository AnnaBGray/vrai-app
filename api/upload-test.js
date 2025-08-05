// Simple test API endpoint to verify our API setup
module.exports = async function handler(req, res) {
  try {
    console.log('Upload test API called');
    
    return res.status(200).json({ 
      success: true, 
      message: 'API endpoint is working', 
      timestamp: new Date().toISOString(),
      url: 'https://example.com/test.pdf'
    });
    
  } catch (error) {
    console.error('Test API error:', error);
    return res.status(500).json({ error: `Server error: ${error.message}` });
  }
} 