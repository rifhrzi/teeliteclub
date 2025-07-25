import { createClient } from '@supabase/supabase-js';

// You'll need to replace these with your actual Supabase credentials
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMaintenanceTable() {
  console.log('🔍 Checking maintenance_settings table...\n');
  
  try {
    // Check if table exists and has data
    const { data, error } = await supabase
      .from('maintenance_settings')
      .select('*');
    
    if (error) {
      console.log('❌ Error querying maintenance_settings table:');
      console.log('   ', error.message);
      console.log('   Code:', error.code);
      console.log('   Details:', error.details);
      
      if (error.code === '42P01') {
        console.log('\n💡 The table does not exist. You may need to run the migration:');
        console.log('   supabase db push');
      }
      return;
    }
    
    if (!data || data.length === 0) {
      console.log('⚠️  Table exists but has no data');
      console.log('💡 Creating default maintenance settings...');
      
      // Insert default settings
      const { data: insertData, error: insertError } = await supabase
        .from('maintenance_settings')
        .insert({
          is_enabled: false,
          title: 'Produk Baru Segera Hadir!',
          message: 'Kami sedang mempersiapkan koleksi terbaru untuk Anda. Terima kasih atas kesabaran Anda.',
          countdown_message: 'Produk baru akan tersedia dalam:'
        })
        .select();
      
      if (insertError) {
        console.log('❌ Error inserting default settings:', insertError.message);
        return;
      }
      
      console.log('✅ Default settings created:', insertData[0]);
    } else {
      console.log('✅ Table exists with data:');
      data.forEach((row, index) => {
        console.log(`\n📋 Record ${index + 1}:`);
        console.log('   ID:', row.id);
        console.log('   Enabled:', row.is_enabled);
        console.log('   Start:', row.maintenance_start || 'Not set');
        console.log('   End:', row.maintenance_end || 'Not set');
        console.log('   Title:', row.title);
        console.log('   Message:', row.message);
        console.log('   Created:', row.created_at);
        console.log('   Updated:', row.updated_at);
      });
    }
    
    // Test enabling maintenance mode
    console.log('\n🧪 Testing maintenance mode toggle...');
    
    const { data: updateData, error: updateError } = await supabase
      .from('maintenance_settings')
      .update({ is_enabled: true })
      .eq('id', data[0]?.id || insertData[0]?.id)
      .select();
    
    if (updateError) {
      console.log('❌ Error enabling maintenance mode:', updateError.message);
      return;
    }
    
    console.log('✅ Maintenance mode enabled successfully');
    console.log('📊 Updated record:', updateData[0]);
    
    // Wait a moment then disable it again
    console.log('\n⏳ Waiting 3 seconds then disabling...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const { data: disableData, error: disableError } = await supabase
      .from('maintenance_settings')
      .update({ is_enabled: false })
      .eq('id', updateData[0].id)
      .select();
    
    if (disableError) {
      console.log('❌ Error disabling maintenance mode:', disableError.message);
      return;
    }
    
    console.log('✅ Maintenance mode disabled successfully');
    console.log('📊 Final record:', disableData[0]);
    
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }
}

checkMaintenanceTable();
