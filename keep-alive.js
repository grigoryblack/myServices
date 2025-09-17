/**
 * External keep-alive script for Render.com
 * Run this script on a separate service (like GitHub Actions, Heroku Scheduler, etc.)
 * to ping your Render service every 14 minutes
 */

const https = require('https');

// Replace with your actual Render service URL
const SERVICE_URL = process.env.SERVICE_URL || 'https://your-app-name.onrender.com';
const PING_INTERVAL = 14 * 60 * 1000; // 14 minutes

function pingService() {
  const url = `${SERVICE_URL}/api/ping`;
  
  console.log(`🏓 Pinging ${url} at ${new Date().toISOString()}`);
  
  https.get(url, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log('✅ Ping successful:', JSON.parse(data));
      } else {
        console.log(`❌ Ping failed with status: ${res.statusCode}`);
      }
    });
  }).on('error', (err) => {
    console.error('❌ Ping error:', err.message);
  });
}

// For one-time execution (GitHub Actions, cron jobs)
if (require.main === module) {
  pingService();
}

// For continuous execution (if running as a service)
function startKeepAlive() {
  console.log('🚀 Starting keep-alive service...');
  
  // Ping immediately
  pingService();
  
  // Set up interval
  setInterval(pingService, PING_INTERVAL);
}

module.exports = { pingService, startKeepAlive };

// Uncomment the line below if you want to run continuously
// startKeepAlive();
