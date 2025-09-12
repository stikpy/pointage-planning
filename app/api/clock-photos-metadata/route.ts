import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.SUPABASE_URL || 'https://ztgqzlrvrgnvilkipznr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_kYJzfGKahg7cgWnYKR8WVw_46EjlJLl';

export async function POST(request: NextRequest) {
  try {
    const photoData = await request.json();
    
    if (!photoData.employee_id || !photoData.photo_url) {
      return NextResponse.json(
        { error: 'employee_id and photo_url are required' },
        { status: 400 }
      );
    }

    // Créer le client Supabase avec la clé secrète
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Créer l'enregistrement de métadonnées de photo
    const { data, error } = await supabase
      .from('clock_photos')
      .insert([{
        employee_id: photoData.employee_id,
        photo_url: photoData.photo_url,
        photo_data: photoData.photo_data || null,
        timestamp: photoData.timestamp || new Date().toISOString(),
        metadata: photoData.metadata || null
      }])
      .select();

    if (error) {
      console.error('❌ Erreur création métadonnées:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Métadonnées photo créées:', data[0]);
    
    return NextResponse.json({ 
      success: true, 
      data: data[0]
    });

  } catch (error) {
    console.error('❌ Erreur endpoint clock-photos-metadata:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
