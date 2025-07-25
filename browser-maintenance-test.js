// Browser Console Test Script for Maintenance Mode
// Copy and paste this into the browser console to test maintenance mode

console.log('🧪 Starting Browser Maintenance Mode Test...');

// Test function to enable maintenance mode
async function enableMaintenanceMode() {
  try {
    console.log('🔧 Enabling maintenance mode...');
    
    // Get Supabase client from window (if available)
    if (typeof window !== 'undefined' && window.supabase) {
      const supabase = window.supabase;
      
      const { data, error } = await supabase
        .from('maintenance_settings')
        .update({ is_enabled: true })
        .select();
      
      if (error) {
        console.error('❌ Error enabling maintenance:', error);
        return false;
      }
      
      console.log('✅ Maintenance enabled:', data);
      return true;
    } else {
      console.log('⚠️ Supabase client not available in window');
      return false;
    }
  } catch (error) {
    console.error('❌ Exception enabling maintenance:', error);
    return false;
  }
}

// Test function to disable maintenance mode
async function disableMaintenanceMode() {
  try {
    console.log('🔧 Disabling maintenance mode...');
    
    if (typeof window !== 'undefined' && window.supabase) {
      const supabase = window.supabase;
      
      const { data, error } = await supabase
        .from('maintenance_settings')
        .update({ is_enabled: false })
        .select();
      
      if (error) {
        console.error('❌ Error disabling maintenance:', error);
        return false;
      }
      
      console.log('✅ Maintenance disabled:', data);
      return true;
    } else {
      console.log('⚠️ Supabase client not available in window');
      return false;
    }
  } catch (error) {
    console.error('❌ Exception disabling maintenance:', error);
    return false;
  }
}

// Test function to check current maintenance status
async function checkMaintenanceStatus() {
  try {
    console.log('🔍 Checking maintenance status...');
    
    if (typeof window !== 'undefined' && window.supabase) {
      const supabase = window.supabase;
      
      const { data, error } = await supabase
        .from('maintenance_settings')
        .select('*')
        .single();
      
      if (error) {
        console.error('❌ Error checking maintenance:', error);
        return null;
      }
      
      console.log('📊 Current maintenance settings:', data);
      return data;
    } else {
      console.log('⚠️ Supabase client not available in window');
      return null;
    }
  } catch (error) {
    console.error('❌ Exception checking maintenance:', error);
    return null;
  }
}

// Test function to navigate to blocked routes
function testBlockedRoutes() {
  const blockedRoutes = ['/shop', '/cart', '/checkout', '/orders', '/account'];
  
  console.log('🚫 Testing blocked routes...');
  console.log('📝 You can manually test these routes:');
  
  blockedRoutes.forEach(route => {
    console.log(`   • ${window.location.origin}${route}`);
  });
  
  console.log('💡 Try opening these URLs in new tabs to test blocking');
}

// Main test function
async function runMaintenanceTest() {
  console.log('🎯 Running comprehensive maintenance test...');
  
  // Check current status
  const currentStatus = await checkMaintenanceStatus();
  
  if (!currentStatus) {
    console.log('❌ Cannot proceed - unable to check maintenance status');
    return;
  }
  
  console.log(`📊 Current maintenance status: ${currentStatus.is_enabled ? 'ENABLED' : 'DISABLED'}`);
  
  // If maintenance is disabled, enable it for testing
  if (!currentStatus.is_enabled) {
    console.log('🔧 Enabling maintenance for testing...');
    const enabled = await enableMaintenanceMode();
    
    if (enabled) {
      console.log('✅ Maintenance enabled - now test blocked routes');
      testBlockedRoutes();
      
      console.log('⏳ Waiting 5 seconds then disabling maintenance...');
      setTimeout(async () => {
        await disableMaintenanceMode();
        console.log('✅ Test complete - maintenance disabled');
      }, 5000);
    }
  } else {
    console.log('⚠️ Maintenance is already enabled');
    testBlockedRoutes();
  }
}

// Expose functions to global scope for manual testing
window.maintenanceTest = {
  enable: enableMaintenanceMode,
  disable: disableMaintenanceMode,
  check: checkMaintenanceStatus,
  testRoutes: testBlockedRoutes,
  runTest: runMaintenanceTest
};

console.log('🎮 Maintenance test functions available:');
console.log('   • maintenanceTest.enable() - Enable maintenance mode');
console.log('   • maintenanceTest.disable() - Disable maintenance mode');
console.log('   • maintenanceTest.check() - Check current status');
console.log('   • maintenanceTest.testRoutes() - List blocked routes to test');
console.log('   • maintenanceTest.runTest() - Run full automated test');
console.log('');
console.log('🚀 Quick start: Run maintenanceTest.runTest()');

// Auto-run the test
runMaintenanceTest();
