const https = require('https');

const data = JSON.stringify({ action: 'getData', pin: 'Og99200647' });

const req = https.request('https://script.google.com/macros/s/AKfycbyhxSzYQSJbXhKzUDtq9G6gTTTFlqDjlnPTiSsy10FtdsI6mkGtuxHEFjOcg4InYqhh/exec', {
  method: 'POST',
  headers: {
    'Content-Type': 'text/plain;charset=utf-8'
  }
}, (res) => {
  let chunks = '';
  res.on('data', chunk => chunks += chunk);
  res.on('end', () => console.log('Status:', res.statusCode, 'Body:', chunks));
});

req.on('error', (e) => console.error(e));
req.write(data);
req.end();
