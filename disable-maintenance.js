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

async function disableMaintenanceMode() {
  console.log('🔧 Disabling maintenance mode...\n');
  
  try {
    // Check current settings
    const { data: existingData, error: selectError } = await supabase
      .from('maintenance_settings')
      .select('*');
    
    if (selectError) {
      console.error('❌ Error checking table:', selectError.message);
      return;
    }
    
    if (!existingData || existingData.length === 0) {
      console.log('⚠️ No maintenance settings found');
      return;
    }
    
    console.log('📊 Current settings:', existingData[0]);
    
    if (!existingData[0].is_enabled) {
      console.log('⚠️ Maintenance mode is already disabled');
      return;
    }
    
    console.log('🔧 Disabling maintenance mode...');
    
    const { data: updateData, error: updateError } = await supabase
      .from('maintenance_settings')
      .update({ is_enabled: false })
      .eq('id', existingData[0].id)
      .select();
    
    if (updateError) {
      console.error('❌ Error disabling maintenance:', updateError.message);
      return;
    }
    
    console.log('✅ Maintenance mode disabled:', updateData[0]);
    console.log('\n🎯 Maintenance mode is now DISABLED');
    console.log('✅ All routes should now be accessible normally');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

disableMaintenanceMode();
