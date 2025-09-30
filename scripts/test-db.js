#!/usr/bin/env node
/**
 * Supabase DB テストスクリプト
 * テーブル作成確認とAPI疎通テスト
 */

const fs = require('fs');
const path = require('path');

const PROJECT_REF = 'sfscmpjplvxtikmifqhe';
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;

console.log('🧪 Supabase DB テスト');
console.log('================================\n');

// Service Role Key を取得
console.log('🔑 認証情報取得...');
let serviceRoleKey;
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const match = envContent.match(/SUPABASE_SERVICE_ROLE_KEY\s*=\s*["']?([^"'\n]+)["']?/);
  if (match) {
    serviceRoleKey = match[1].trim();
  }
}

if (!serviceRoleKey) {
  console.error('❌ Service Role Key が見つかりません\n');
  process.exit(1);
}
console.log('✅ 取得完了\n');

(async () => {
  // Test 1: テーブル一覧確認
  console.log('📊 Test 1: テーブル一覧確認...');
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/users?select=id&limit=0`, {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
      }
    });
    
    if (response.ok) {
      console.log('  ✅ users テーブル存在');
    } else {
      console.log('  ❌ users テーブル未作成');
    }
  } catch (error) {
    console.log('  ❌ users:', error.message);
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/applicant_profiles?select=user_id&limit=0`, {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
      }
    });
    
    if (response.ok) {
      console.log('  ✅ applicant_profiles テーブル存在');
    } else {
      console.log('  ❌ applicant_profiles テーブル未作成');
    }
  } catch (error) {
    console.log('  ❌ applicant_profiles:', error.message);
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/viewing_history?select=id&limit=0`, {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
      }
    });
    
    if (response.ok) {
      console.log('  ✅ viewing_history テーブル存在');
    } else {
      console.log('  ❌ viewing_history テーブル未作成');
    }
  } catch (error) {
    console.log('  ❌ viewing_history:', error.message);
  }

  console.log('');

  // Test 2: ユーザー作成テスト
  console.log('👤 Test 2: ユーザー作成テスト...');
  try {
    const testUserId = '00000000-0000-0000-0000-000000000001';
    
    // 既存のテストユーザーを削除
    await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${testUserId}`, {
      method: 'DELETE',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
      }
    });
    
    // テストユーザー作成
    const response = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
      method: 'POST',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        id: testUserId,
        email: 'test@example.com',
        display_name: 'Test User',
        role: 'applicant'
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('  ✅ ユーザー作成成功:', data[0]?.display_name);
    } else {
      const error = await response.text();
      console.log('  ❌ ユーザー作成失敗:', error.substring(0, 100));
    }
  } catch (error) {
    console.log('  ❌ エラー:', error.message);
  }

  console.log('');

  // Test 3: プロフィール作成テスト
  console.log('📝 Test 3: プロフィール作成テスト...');
  try {
    const testUserId = '00000000-0000-0000-0000-000000000001';
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/applicant_profiles`, {
      method: 'POST',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        user_id: testUserId,
        nickname: 'テストユーザー',
        birthdate: '1990-01-01'
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('  ✅ プロフィール作成成功:', data[0]?.nickname);
    } else {
      const error = await response.text();
      console.log('  ❌ プロフィール作成失敗:', error.substring(0, 100));
    }
  } catch (error) {
    console.log('  ❌ エラー:', error.message);
  }

  console.log('');

  // Test 4: 閲覧履歴作成テスト
  console.log('👁  Test 4: 閲覧履歴作成テスト...');
  try {
    const testUserId = '00000000-0000-0000-0000-000000000001';
    const testAuditionId = '00000000-0000-0000-0000-000000000002';
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/viewing_history`, {
      method: 'POST',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        user_id: testUserId,
        audition_id: testAuditionId,
        action: 'view'
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('  ✅ 閲覧履歴作成成功:', data[0]?.action);
    } else {
      const error = await response.text();
      console.log('  ❌ 閲覧履歴作成失敗:', error.substring(0, 100));
    }
  } catch (error) {
    console.log('  ❌ エラー:', error.message);
  }

  console.log('');
  console.log('================================');
  console.log('🎉 テスト完了！\n');
  console.log('次のステップ:');
  console.log('  make deploy-workers  # Workers デプロイ');
  console.log('  make deploy-web      # Web 再起動\n');
})();
