import fetch from 'node-fetch';

async function testInstagramMonitor() {
  const response = await fetch('http://localhost:3000/api/monitor/instagram/monitor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      postUrl: 'https://www.instagram.com/p/DChNHw7tDP-/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==' // Replace with a real reel URL from your business account
    })
  });
  const data = await response.json();
  console.log('Instagram API result:', data);
}

async function testYoutubeMonitor() {
  const response = await fetch('http://localhost:3000/api/monitor/youtube/monitor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      videoUrl: 'https://youtu.be/r-rRKiQ-5PM' // Replace with a real YouTube video URL
    })
  });
  const data = await response.json();
  console.log('YouTube API result:', data);
}

(async () => {
  await testInstagramMonitor();
  await testYoutubeMonitor();
})(); 