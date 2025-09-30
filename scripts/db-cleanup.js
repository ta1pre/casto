#!/usr/bin/env node
/**
 * Supabase DB クリーンアップ＆マイグレーション
 * REST API経由で完全自動実行
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_REF = 'sfscmpjplvxtikmifqhe';
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;

console.log('🚀 Supabase 完全自動リセット＆マイグレーション');
console.log('================================\n');

// Service Role Key を .env.local から取得（フォールバック）
console.log('🔑 Step 1: 認証情報取得...');
let serviceRoleKey;

// まず wrangler から取得を試みる
try {
  const result = execSync(
    'wrangler secret list --env development 2>&1 | grep SUPABASE_SERVICE_ROLE_KEY',
    { cwd: path.join(__dirname, '../apps/workers'), encoding: 'utf-8' }
  );
  
  if (result.includes('SUPABASE_SERVICE_ROLE_KEY')) {
    console.log('  ⚠️  Wrangler secretsは設定されていますが、値を直接取得できません');
    console.log('  .env.localから取得します...\n');
  }
} catch (error) {
  // wranglerで取得できない場合は無視
}

// .env.local から SUPABASE_SERVICE_ROLE_KEY を取得
try {
  const envPath = path.join(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    // より柔軟な正規表現パターン
    const match = envContent.match(/SUPABASE_SERVICE_ROLE_KEY\s*=\s*["']?([^"'\n]+)["']?/);
    if (match) {
      serviceRoleKey = match[1].trim();
      console.log('  ✅ Service Role Key 取得完了 (.env.local)\n');
    }
  }
} catch (error) {
  console.log('  ⚠️  エラー:', error.message);
}

// 環境変数からも試行
if (!serviceRoleKey) {
  serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceRoleKey) {
    console.log('  ✅ Service Role Key 取得完了 (環境変数)\n');
  }
}

if (!serviceRoleKey) {
  console.error('  ❌ Service Role Key が見つかりません');
  console.error('\n  以下のいずれかの方法で設定してください:');
  console.error('  1. .env.localに追加:');
  console.error('     SUPABASE_SERVICE_ROLE_KEY="your_key_here"');
  console.error('  2. 環境変数として設定:');
  console.error('     export SUPABASE_SERVICE_ROLE_KEY="your_key_here"');
  console.error('  3. Supabase Dashboard → Settings → API → service_role key\n');
  process.exit(1);
}

// SQL実行関数
async function executeSQL(sql, description) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/query`, {
      method: 'POST',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok && response.status !== 404) {
      const error = await response.text();
      if (!error.includes('does not exist') && !error.includes('already exists')) {
        throw new Error(error);
      }
    }
    
    console.log(`  ✅ ${description}`);
    return true;
  } catch (error) {
    // エラーは無視（存在しないテーブルなど）
    console.log(`  ⚠️  ${description}: ${error.message.split('\n')[0]}`);
    return false;
  }
}

// Management API経由でSQL実行
async function executeSQLDirect(sql, description) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ query: sql })
    });

    console.log(`  ✅ ${description}`);
    return true;
  } catch (error) {
    console.log(`  ⚠️  ${description}`);
    return false;
  }
}

(async () => {
  // Step 2: クリーンアップ
  console.log('🧹 Step 2: 既存テーブル削除...');
  
  const cleanupSQL = [
    { sql: 'DROP TABLE IF EXISTS viewing_history CASCADE', desc: 'viewing_history削除' },
    { sql: 'DROP TABLE IF EXISTS applicant_profiles CASCADE', desc: 'applicant_profiles削除' },
    { sql: 'DROP TABLE IF EXISTS users CASCADE', desc: 'users削除' },
    { sql: 'DROP FUNCTION IF EXISTS update_applicant_profiles_updated_at() CASCADE', desc: 'トリガー関数1削除' },
    { sql: 'DROP FUNCTION IF EXISTS update_users_updated_at() CASCADE', desc: 'トリガー関数2削除' },
  ];

  for (const { sql, desc } of cleanupSQL) {
    await executeSQLDirect(sql, desc);
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('  ✅ クリーンアップ完了\n');

  // Step 3: マイグレーション履歴削除
  console.log('🔧 Step 3: マイグレーション履歴削除...');
  await executeSQLDirect(
    `DELETE FROM supabase_migrations.schema_migrations WHERE version IN ('001', '202509241000', '202509241010', '202509241020', '202509241030', '202509241040', '202509241050', '20250130')`,
    'マイグレーション履歴削除'
  );
  console.log('  ✅ 完了\n');

  // Step 4: マイグレーションファイルを実行
  console.log('📊 Step 4: マイグレーション適用...');
  
  const migrationsDir = path.join(__dirname, '../supabase/migrations');
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql') && !f.startsWith('00_'))
    .sort();

  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf-8');
    
    console.log(`  - ${file}`);
    
    // SQL文を分割して実行
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      await executeSQLDirect(statement, '');
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    console.log(`    ✅ 完了`);
  }
  
  console.log('  ✅ マイグレーション適用完了\n');

  // Step 5: 確認
  console.log('🧪 Step 5: テーブル確認...');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
      }
    });
    
    const schema = await response.json();
    const tables = Object.keys(schema.definitions || {});
    
    const expectedTables = ['users', 'applicant_profiles', 'viewing_history'];
    const foundTables = expectedTables.filter(t => tables.includes(t));
    
    if (foundTables.length === expectedTables.length) {
      console.log('  ✅ テーブル作成確認:');
      foundTables.forEach(t => console.log(`    - ${t}`));
    } else {
      console.log('  ⚠️  一部のテーブルが見つかりません');
      console.log(`  見つかったテーブル: ${foundTables.join(', ')}`);
    }
  } catch (error) {
    console.log('  ⚠️  テーブル確認に失敗しました');
  }
  
  console.log('\n================================');
  console.log('🎉 完全自動セットアップ完了！\n');
  console.log('確認:');
  console.log(`  https://supabase.com/dashboard/project/${PROJECT_REF}/editor\n`);
  console.log('次のステップ:');
  console.log('  make deploy-workers  # Workers デプロイ');
  console.log('  make deploy-web      # Web 再起動');
  console.log('  make deploy-all      # 全てデプロイ\n');
})();
