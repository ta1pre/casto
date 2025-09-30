#!/usr/bin/env node
/**
 * Supabase スキーマ生成スクリプト
 * リモートDBから最新のスキーマを取得してローカルに保存
 */

const fs = require('fs');
const path = require('path');

const PROJECT_REF = 'sfscmpjplvxtikmifqhe';
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;

console.log('📊 Supabase スキーマ取得');
console.log('================================\n');

// Service Role Key を取得
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
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY が見つかりません\n');
  process.exit(1);
}

(async () => {
  // テーブル一覧とカラム情報を取得
  console.log('🔍 テーブル情報取得中...\n');

  const schema = {
    generated_at: new Date().toISOString(),
    tables: {}
  };

  // PostgreSQL の information_schema から情報取得
  const tables = ['users', 'applicant_profiles', 'viewing_history'];

  for (const tableName of tables) {
    console.log(`  - ${tableName} テーブル...`);
    
    try {
      // テーブルのカラム情報を取得
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?select=*&limit=0`, {
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
        }
      });

      if (response.ok) {
        // OpenAPI スキーマから型情報を取得
        const schemaResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
          headers: {
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`,
          }
        });

        if (schemaResponse.ok) {
          const openApiSchema = await schemaResponse.json();
          const tableSchema = openApiSchema.definitions?.[tableName];
          
          if (tableSchema) {
            schema.tables[tableName] = {
              columns: tableSchema.properties || {},
              required: tableSchema.required || [],
              description: tableSchema.description || ''
            };
            console.log(`    ✅ ${Object.keys(tableSchema.properties || {}).length} カラム`);
          }
        }
      } else {
        console.log(`    ⚠️  取得失敗`);
      }
    } catch (error) {
      console.log(`    ❌ エラー: ${error.message}`);
    }
  }

  console.log('');

  // スキーマファイルに保存
  const schemaDir = path.join(__dirname, '../supabase');
  const schemaPath = path.join(schemaDir, 'schema.json');

  fs.writeFileSync(schemaPath, JSON.stringify(schema, null, 2), 'utf-8');
  console.log(`✅ スキーマ保存完了: supabase/schema.json\n`);

  // TypeScript型定義も生成
  let tsContent = `/**
 * Supabase Database Schema
 * Auto-generated at ${schema.generated_at}
 * DO NOT EDIT MANUALLY
 */

export interface Database {
  public: {
    Tables: {
`;

  for (const [tableName, tableInfo] of Object.entries(schema.tables)) {
    tsContent += `      ${tableName}: {
        Row: {
`;
    for (const [colName, colInfo] of Object.entries(tableInfo.columns)) {
      const tsType = postgresTypeToTS(colInfo.type);
      const nullable = !tableInfo.required.includes(colName) ? ' | null' : '';
      tsContent += `          ${colName}: ${tsType}${nullable};\n`;
    }
    tsContent += `        };
        Insert: {
`;
    for (const [colName, colInfo] of Object.entries(tableInfo.columns)) {
      const tsType = postgresTypeToTS(colInfo.type);
      const optional = !tableInfo.required.includes(colName) ? '?' : '';
      tsContent += `          ${colName}${optional}: ${tsType};\n`;
    }
    tsContent += `        };
        Update: {
`;
    for (const [colName, colInfo] of Object.entries(tableInfo.columns)) {
      const tsType = postgresTypeToTS(colInfo.type);
      tsContent += `          ${colName}?: ${tsType};\n`;
    }
    tsContent += `        };
      };
`;
  }

  tsContent += `    };
  };
}
`;

  const tsPath = path.join(schemaDir, 'types.ts');
  fs.writeFileSync(tsPath, tsContent, 'utf-8');
  console.log(`✅ TypeScript型定義生成: supabase/types.ts\n`);

  // マークダウン形式のドキュメントも生成
  let mdContent = `# Database Schema

**Generated at:** ${new Date(schema.generated_at).toLocaleString('ja-JP')}

---

`;

  for (const [tableName, tableInfo] of Object.entries(schema.tables)) {
    mdContent += `## ${tableName}

${tableInfo.description || 'No description'}

| Column | Type | Required | Description |
|--------|------|----------|-------------|
`;
    for (const [colName, colInfo] of Object.entries(tableInfo.columns)) {
      const required = tableInfo.required.includes(colName) ? '✅' : '';
      const desc = colInfo.description || '-';
      mdContent += `| \`${colName}\` | ${colInfo.type} | ${required} | ${desc} |\n`;
    }
    mdContent += '\n---\n\n';
  }

  const mdPath = path.join(schemaDir, 'SCHEMA.md');
  fs.writeFileSync(mdPath, mdContent, 'utf-8');
  console.log(`✅ ドキュメント生成: supabase/SCHEMA.md\n`);

  console.log('================================');
  console.log('🎉 スキーマ生成完了！\n');
  console.log('生成されたファイル:');
  console.log('  - supabase/schema.json     (JSON形式)');
  console.log('  - supabase/types.ts        (TypeScript型定義)');
  console.log('  - supabase/SCHEMA.md       (ドキュメント)');
  console.log('');
  console.log('💡 使い方:');
  console.log('  import { Database } from "./supabase/types";');
  console.log('  const supabase = createClient<Database>(...);');
  console.log('');
})();

// PostgreSQL型をTypeScript型に変換
function postgresTypeToTS(pgType) {
  if (!pgType) return 'unknown';
  
  const typeMap = {
    'string': 'string',
    'integer': 'number',
    'number': 'number',
    'boolean': 'boolean',
    'array': 'any[]',
    'object': 'Record<string, any>',
  };

  return typeMap[pgType] || 'unknown';
}
