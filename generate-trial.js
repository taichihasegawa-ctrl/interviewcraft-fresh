// トライアルリンク生成スクリプト
// 使い方: node generate-trial.js 2026-03-05
const crypto = require('crypto');

const SECRET = 'icf-fresh-2026-secret'; // Vercel環境変数のTRIAL_SECRETと同じ値にすること
const expiry = process.argv[2];

if (!expiry) {
  console.log('使い方: node generate-trial.js 2026-03-05');
  process.exit(1);
}

const hash = crypto.createHmac('sha256', SECRET).update(expiry).digest('hex').slice(0, 12);
console.log('');
console.log('期限:', expiry);
console.log('トークン:', expiry + '_' + hash);
console.log('');
console.log('配布URL:');
console.log('https://interviewcraft-fresh.vercel.app/?trial=' + expiry + '_' + hash);
console.log('');
