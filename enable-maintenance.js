import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function enableMaintenanceMode() {
  console.log('🔧 Enabling maintenance mode...\n');
  
  try {
    // First check if table exists and has data
    const { data: existingData, error: selectError } = await supabase
      .from('maintenance_settings')
      .select('*');
    
    if (selectError) {
      if (selectError.code === '42P01') {
        console.log('❌ Table maintenance_settings does not exist');
        console.log('💡 Please create the table first using the database test panel');
        console.log('   Visit: http://localhost:8081/database-test');
        return;
      } else {
        console.error('❌ Error checking table:', selectError.message);
        return;
      }
    }
    
    if (!existingData || existingData.length === 0) {
      console.log('📝 No maintenance settings found, creating default settings...');
      
      const { data: insertData, error: insertError } = await supabase
        .from('maintenance_settings')
        .insert({
          is_enabled: true,
          title: 'Produk Baru Segera Hadir!',
          message: 'Kami sedang mempersiapkan koleksi terbaru untuk Anda. Terima kasih atas kesabaran Anda.',
          countdown_message: 'Produk baru akan tersedia dalam:'
        })
        .select();
      
      if (insertError) {
        console.error('❌ Error creating settings:', insertError.message);
        return;
      }
      
      console.log('✅ Maintenance settings created and enabled:', insertData[0]);
    } else {
      console.log('📊 Found existing settings:', existingData[0]);
      
      if (existingData[0].is_enabled) {
        console.log('⚠️ Maintenance mode is already enabled');
        return;
      }
      
      console.log('🔧 Enabling maintenance mode...');
      
      const { data: updateData, error: updateError } = await supabase
        .from('maintenance_settings')
        .update({ is_enabled: true })
        .eq('id', existingData[0].id)
        .select();
      
      if (updateError) {
        console.error('❌ Error enabling maintenance:', updateError.message);
        return;
      }
      
      console.log('✅ Maintenance mode enabled:', updateData[0]);
    }
    
    console.log('\n🎯 Maintenance mode is now ENABLED');
    console.log('🧪 You can now test the route protection:');
    console.log('   • Visit blocked routes like /shop, /cart, /checkout');
    console.log('   • They should redirect to the home page');
    console.log('   • Allowed routes like /, /auth, /admin should still work');
    console.log('\n🔧 To disable maintenance mode, run: node disable-maintenance.js');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

enableMaintenanceMode();
