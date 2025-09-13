#!/usr/bin/env node

/**
 * Database Setup Script
 * 
 * This script automatically sets up the database schema in Supabase
 * Run with: node setup-database.js
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
if (typeof require !== 'undefined') {
  try {
    require('dotenv').config();
  } catch (_e) {
    // dotenv not available, continue
  }
}

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('EXPO_PUBLIC_SUPABASE_URL:', !!SUPABASE_URL);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!SUPABASE_SERVICE_KEY);
  process.exit(1);
}

async function setupDatabase() {
  try {
    console.log('🚀 Setting up database schema...');
    
    // Read the schema file
    const schemaPath = path.join(process.cwd(), 'supabase-schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      console.error('❌ Schema file not found:', schemaPath);
      process.exit(1);
    }
    
    const schema = fs.readFileSync(schemaPath, 'utf8');
    console.log('📖 Schema file loaded successfully');
    
    // Execute the schema using Supabase REST API
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY
      },
      body: JSON.stringify({
        sql: schema
      })
    });
    
    if (response.ok) {
      console.log('✅ Database schema setup completed successfully!');
      console.log('🎉 Your wellness app database is ready to use.');
    } else {
      const errorText = await response.text();
      console.error('❌ Schema execution failed:', response.status, response.statusText);
      console.error('Response:', errorText);
      
      // Try alternative approach - execute statements individually
      console.log('🔄 Trying alternative setup method...');
      await setupDatabaseAlternative(schema);
    }
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.log('');
    console.log('📋 Manual Setup Instructions:');
    console.log('1. Go to https://supabase.com/dashboard/project/' + SUPABASE_URL.split('//')[1].split('.')[0] + '/sql/new');
    console.log('2. Copy the content from supabase-schema.sql');
    console.log('3. Paste it in the SQL Editor and click "Run"');
    process.exit(1);
  }
}

async function setupDatabaseAlternative(schema) {
  try {
    // Split schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Executing ${statements.length} SQL statements individually...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'apikey': SUPABASE_SERVICE_KEY
          },
          body: JSON.stringify({
            sql: statement + ';'
          })
        });
        
        if (response.ok) {
          successCount++;
          process.stdout.write('.');
        } else {
          errorCount++;
          process.stdout.write('x');
        }
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => {
          if (resolve && typeof resolve === 'function') {
            setTimeout(resolve, 100);
          }
        });
        
      } catch (_err) {
        errorCount++;
        process.stdout.write('x');
      }
    }
    
    console.log('');
    console.log(`✅ Setup completed: ${successCount} successful, ${errorCount} errors`);
    
    if (successCount > 0) {
      console.log('🎉 Database setup partially successful. The app should work now.');
    }
    
  } catch (error) {
    console.error('❌ Alternative setup failed:', error.message);
    throw error;
  }
}

// Run the setup
setupDatabase();