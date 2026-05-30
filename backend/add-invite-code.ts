import { initDatabasePromise, run, queryAll } from './src/database';

async function addInviteCode() {
  await initDatabasePromise();
  
  const codes = ['WELCOME2024', 'TEST123', 'INVITE001'];
  
  for (const code of codes) {
    try {
      run('INSERT OR IGNORE INTO invite_codes (code) VALUES (?)', [code]);
      console.log(`✅ 邀请码 ${code} 已创建`);
    } catch (err) {
      console.log(`⚠️ 邀请码 ${code} 已存在`);
    }
  }

  const allCodes = queryAll('SELECT * FROM invite_codes');
  console.log('\n📋 所有邀请码:');
  console.log(allCodes);
  
  process.exit(0);
}

addInviteCode();
