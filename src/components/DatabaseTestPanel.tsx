import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { 
  Database, 
  CheckCircle,
  XCircle,
  RefreshCw,
  Plus,
  Settings
} from "lucide-react";

export const DatabaseTestPanel = () => {
  const [tableExists, setTableExists] = useState<boolean | null>(null);
  const [hasData, setHasData] = useState<boolean | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkDatabase = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Checking maintenance_settings table...');
      
      // Try to query the table
      const { data, error } = await supabase
        .from('maintenance_settings')
        .select('*');
      
      if (error) {
        console.error('❌ Database error:', error);
        
        if (error.code === '42P01') {
          // Table doesn't exist
          setTableExists(false);
          setHasData(false);
          setError('Table does not exist');
        } else {
          setTableExists(null);
          setHasData(null);
          setError(`Database error: ${error.message}`);
        }
        return;
      }
      
      // Table exists
      setTableExists(true);
      
      if (!data || data.length === 0) {
        console.warn('⚠️ Table exists but has no data');
        setHasData(false);
        setSettings(null);
      } else {
        console.log('✅ Table has data:', data);
        setHasData(true);
        setSettings(data[0]);
      }
      
    } catch (err) {
      console.error('❌ Exception:', err);
      setError(`Exception: ${err}`);
      setTableExists(null);
      setHasData(null);
    } finally {
      setLoading(false);
    }
  };

  const createTable = async () => {
    try {
      setLoading(true);
      console.log('🔧 Creating maintenance_settings table...');
      
      // Execute the SQL to create the table
      const { error } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS maintenance_settings (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            is_enabled BOOLEAN NOT NULL DEFAULT false,
            maintenance_start TIMESTAMPTZ,
            maintenance_end TIMESTAMPTZ,
            title TEXT NOT NULL DEFAULT 'Maintenance Mode',
            message TEXT NOT NULL DEFAULT 'We are currently under maintenance. Please check back later.',
            countdown_message TEXT NOT NULL DEFAULT 'New products will be available in:',
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now()
          );
        `
      });
      
      if (error) {
        console.error('❌ Error creating table:', error);
        setError(`Failed to create table: ${error.message}`);
        return;
      }
      
      console.log('✅ Table created successfully');
      await checkDatabase();
      
    } catch (err) {
      console.error('❌ Exception creating table:', err);
      setError(`Exception: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const insertDefaultData = async () => {
    try {
      setLoading(true);
      console.log('🔧 Inserting default maintenance settings...');
      
      const { data, error } = await supabase
        .from('maintenance_settings')
        .insert({
          is_enabled: false,
          title: 'Produk Baru Segera Hadir!',
          message: 'Kami sedang mempersiapkan koleksi terbaru untuk Anda. Terima kasih atas kesabaran Anda.',
          countdown_message: 'Produk baru akan tersedia dalam:'
        })
        .select();
      
      if (error) {
        console.error('❌ Error inserting data:', error);
        setError(`Failed to insert data: ${error.message}`);
        return;
      }
      
      console.log('✅ Default data inserted:', data);
      await checkDatabase();
      
    } catch (err) {
      console.error('❌ Exception inserting data:', err);
      setError(`Exception: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleMaintenance = async () => {
    if (!settings) return;
    
    try {
      setLoading(true);
      const newEnabled = !settings.is_enabled;
      
      console.log(`🔧 ${newEnabled ? 'Enabling' : 'Disabling'} maintenance mode...`);
      
      const { data, error } = await supabase
        .from('maintenance_settings')
        .update({ is_enabled: newEnabled })
        .eq('id', settings.id)
        .select();
      
      if (error) {
        console.error('❌ Error toggling maintenance:', error);
        setError(`Failed to toggle maintenance: ${error.message}`);
        return;
      }
      
      console.log(`✅ Maintenance ${newEnabled ? 'enabled' : 'disabled'}`);
      setSettings(data[0]);
      
    } catch (err) {
      console.error('❌ Exception toggling maintenance:', err);
      setError(`Exception: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkDatabase();
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Database Test Panel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={checkDatabase} disabled={loading} size="sm">
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Check Database
            </Button>
          </div>

          {loading && (
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Checking database...
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-600">
                <XCircle className="w-4 h-4" />
                <strong>Error:</strong>
              </div>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span><strong>Table Exists:</strong></span>
              {tableExists === null ? (
                <Badge variant="secondary">Unknown</Badge>
              ) : tableExists ? (
                <Badge variant="default">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Yes
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="w-3 h-3 mr-1" />
                  No
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span><strong>Has Data:</strong></span>
              {hasData === null ? (
                <Badge variant="secondary">Unknown</Badge>
              ) : hasData ? (
                <Badge variant="default">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Yes
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="w-3 h-3 mr-1" />
                  No
                </Badge>
              )}
            </div>

            {settings && (
              <div className="flex items-center justify-between">
                <span><strong>Maintenance Enabled:</strong></span>
                <Badge variant={settings.is_enabled ? "destructive" : "secondary"}>
                  {settings.is_enabled ? 'YES' : 'NO'}
                </Badge>
              </div>
            )}
          </div>

          {tableExists === false && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800">
                The maintenance_settings table doesn't exist. You need to create it first.
              </p>
              <Button onClick={createTable} className="mt-2" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Create Table
              </Button>
            </div>
          )}

          {tableExists === true && hasData === false && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800">
                The table exists but has no data. Insert default settings to get started.
              </p>
              <Button onClick={insertDefaultData} className="mt-2" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Insert Default Data
              </Button>
            </div>
          )}

          {settings && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 mb-2">
                Database is ready! You can now test maintenance mode.
              </p>
              <Button onClick={toggleMaintenance} size="sm" variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                {settings.is_enabled ? 'Disable' : 'Enable'} Maintenance
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
