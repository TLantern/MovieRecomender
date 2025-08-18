// Simple test script to verify the API endpoint
// Run with: node test-api.js

async function testAPI() {
  try {
    console.log('🔍 Testing environment configuration...');
    
    const envResponse = await fetch('http://localhost:3001/api/check-env');
    const envData = await envResponse.json();
    
    console.log(`🔑 API Key configured: ${envData.apiKeyConfigured}`);
    console.log(`📝 ${envData.message}\n`);
    
    if (!envData.hasApiKey) {
      console.log('❌ Please configure your TMDb API key in .env.local file');
      return;
    }
    
    console.log('🎬 Testing /api/movies endpoint...');
    
    const response = await fetch('http://localhost:3001/api/movies');
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ API endpoint working!');
      console.log(`📽️ Found ${data.movies?.length || 0} movies`);
      
      if (data.movies && data.movies.length > 0) {
        const firstMovie = data.movies[0];
        console.log('🎬 Sample movie:', {
          title: firstMovie.title,
          rating: firstMovie.rating,
          year: firstMovie.year,
          genre: firstMovie.genre,
          image: firstMovie.image ? '✅ Has poster' : '❌ No poster'
        });
      }
    } else {
      console.log('❌ API error:', data.error);
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
    console.log('💡 Make sure the dev server is running on port 3001');
  }
}

testAPI(); 