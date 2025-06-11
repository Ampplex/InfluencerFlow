/**
 * get_instagram_business.js
 *
 * Hard-coded credentials for demo purposes ONLY!
 * To run: npm install facebook-nodejs-business-sdk
 * node get_instagram_business.js
 */

const bizSdk = require('facebook-nodejs-business-sdk');
const {
  FacebookAdsApi,
  User,
  Business,
} = bizSdk;
const crypto = require('crypto');

// 🔐 Your credentials (do NOT do this in prod)
const APP_ID = '1170139421507955';
const APP_SECRET = '271bd685602093631ddbaab33b1e8091';
const PAGE_ID = '664866780046977';
const ACCESS_TOKEN = 'EAAQoPFCOgXMBO4nZB3sX0FM2D0CcvZBOqbreGYCwcUL9havpFrNyL7kEjBDoi708DCqofuHqXw58ob5LXYYUwpAgeprVNyTmjGYkkZB1P5NVeS2ppzZCrn0h57ADZAGnAVQwBZAZCoZCo4GyRzSqd4kKe16mBeD9d46M1qiOmqbb5eVqBZCVC0nSGVlfw1fEC9fsDZBQZDZD';

// Generate appsecret_proof (sha256 HMAC of access token using app secret)
function getAppSecretProof(token, appSecret) {
  return crypto
    .createHmac('sha256', appSecret)
    .update(token)
    .digest('hex');
}

async function main() {
  // Initialize API with token and proof
  FacebookAdsApi.init(ACCESS_TOKEN, APP_SECRET, APP_ID);
  const api = FacebookAdsApi.getInstance();
  api.setDebug(false); // Set true to inspect calls

  const appSecretProof = getAppSecretProof(ACCESS_TOKEN, APP_SECRET);

  try {
    console.log('📦 Fetching Page info and Instagram Business...');
    const page = new bizSdk.Page(PAGE_ID);
    const pageFields = [
      'id',
      'name',
      'instagram_business_account{id,username,followers_count,profile_picture_url}'
    ];
    const pageInfo = await page.api_get({
      fields: pageFields,
      appsecret_proof: appSecretProof,
    });

    console.log('✅ Page Info:', JSON.stringify(pageInfo, null, 2));

    const ig = pageInfo.instagram_business_account;
    if (ig && ig.id) {
      console.log('✅ Instagram Business Account info:', JSON.stringify(ig, null, 2));
    } else {
      console.log('⚠️ No Instagram Business Account linked to this Page.');
    }
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

main();