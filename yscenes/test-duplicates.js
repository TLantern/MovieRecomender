// Test script to check for duplicate movie titles
// Run with: node test-duplicates.js

const BASE_URL = 'http://localhost:3000'; // Adjust if your app runs on a different port

async function testDuplicateDetection() {
  console.log('🎬 Testing Movie Duplicate Detection System\n');

  try {
    // 1. Get overall stats including duplicate detection
    console.log('1. 📊 Getting overall stats...');
    const statsResponse = await fetch(`${BASE_URL}/api/logs?action=stats`);
    const stats = await statsResponse.json();
    
    console.log(`   Total Recommendations: ${stats.totalRecommendations}`);
    console.log(`   Total Movies: ${stats.totalMovies}`);
    console.log(`   Unique Titles: ${stats.duplicateDetection.totalUniqueTitles}`);
    console.log(`   Duplicate Titles: ${stats.duplicateDetection.totalDuplicateTitles}`);
    
    if (stats.duplicateDetection.duplicateTitles.length > 0) {
      console.log('\n   🚨 Duplicate titles found:');
      stats.duplicateDetection.duplicateTitles.forEach(title => {
        console.log(`      - ${title}`);
      });
    } else {
      console.log('\n   ✅ No duplicate titles found!');
    }

    // 2. Get detailed duplicate information
    console.log('\n2. 🔍 Getting detailed duplicate information...');
    const duplicatesResponse = await fetch(`${BASE_URL}/api/logs?action=duplicates`);
    const duplicates = await duplicatesResponse.json();
    
    if (duplicates.duplicateTitles.length > 0) {
      console.log(`   Found ${duplicates.duplicateTitles.length} titles with duplicates:`);
      duplicates.duplicateTitles.forEach(title => {
        const count = duplicates.titleCounts[title];
        console.log(`      - ${title} (recommended ${count} times)`);
      });
      
      console.log('\n   📝 Recommendations containing duplicates:');
      duplicates.recommendationsWithDuplicates.forEach(rec => {
        console.log(`      [${rec.timestamp}] ${rec.mood} (Session: ${rec.sessionId || 'N/A'})`);
        rec.duplicateTitles.forEach(title => {
          console.log(`        - ${title}`);
        });
      });
    }

    // 3. Get all unique titles
    console.log('\n3. 📋 Getting all unique titles...');
    const uniqueResponse = await fetch(`${BASE_URL}/api/logs?action=unique-titles`);
    const uniqueData = await uniqueResponse.json();
    
    console.log(`   Total unique titles: ${uniqueData.totalUniqueTitles}`);
    if (uniqueData.titles.length > 0) {
      console.log('   First 10 unique titles:');
      uniqueData.titles.slice(0, 10).forEach((title, index) => {
        console.log(`      ${index + 1}. ${title}`);
      });
      if (uniqueData.titles.length > 10) {
        console.log(`      ... and ${uniqueData.titles.length - 10} more`);
      }
    }

    // 4. Get recent recommendations
    console.log('\n4. 🕒 Getting recent recommendations...');
    const recentResponse = await fetch(`${BASE_URL}/api/logs?action=recent&limit=5`);
    const recentLogs = await recentResponse.json();
    
    console.log(`   Recent ${recentLogs.length} recommendations:`);
    recentLogs.forEach((log, index) => {
      console.log(`   ${index + 1}. [${log.timestamp}] ${log.mood} - ${log.movies.length} movies`);
      log.movies.forEach(movie => {
        console.log(`      - ${movie.title} (${movie.year})`);
      });
    });

  } catch (error) {
    console.error('❌ Error testing duplicate detection:', error);
  }
}

// Run the test
testDuplicateDetection(); 