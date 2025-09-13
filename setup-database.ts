import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
    
    // Split schema into individual statements and execute them
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Executing ${statements.length} SQL statements...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const statement of statements) {
      try {
        // Use raw SQL execution
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.log('Statement failed:', statement.substring(0, 50) + '...');
          console.log('Error:', error.message);
          errorCount++;
        } else {
          successCount++;
        }
        
        // Small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 50));
        
      } catch (err) {
        console.log('Statement error:', err instanceof Error ? err.message : String(err));
        errorCount++;
      }
    }
    
    console.log(`✅ Setup completed: ${successCount} successful, ${errorCount} errors`);
    
    if (successCount > 0) {
      console.log('🎉 Database setup completed! Your wellness app is ready to use.');
    } else {
      console.log('❌ Database setup failed. Please run the schema manually in Supabase SQL Editor.');
    }
    
  } catch (error) {
    console.error('❌ Database setup failed:', error instanceof Error ? error.message : String(error));
    console.log('');
    console.log('📋 Manual Setup Instructions:');
    console.log('1. Go to https://supabase.com/dashboard/project/' + supabaseUrl.split('//')[1].split('.')[0] + '/sql/new');
    console.log('2. Copy the content from supabase-schema.sql');
    console.log('3. Paste it in the SQL Editor and click "Run"');
  }
}

// Run the setup
setupDatabase();