import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.SUPABASE_URL || 'https://ztgqzlrvrgnvilkipznr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_kYJzfGKahg7cgWnYKR8WVw_46EjlJLl';

export async function POST(request: NextRequest) {
  try {
    const { fileName, imageData } = await request.json();
    
    if (!fileName || !imageData) {
      return NextResponse.json(
        { error: 'fileName and imageData are required' },
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

    // Convertir base64 en buffer
    const buffer = Buffer.from(imageData, 'base64');
    
    // Uploader vers Supabase Storage
    const { data, error } = await supabase.storage
      .from('clock-photos')
      .upload(fileName, buffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600'
      });

    if (error) {
      console.error('❌ Erreur upload Supabase:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Photo uploadée via API:', data.path);
    
    return NextResponse.json({ 
      success: true, 
      data: {
        path: data.path,
        publicUrl: `https://ztgqzlrvrgnvilkipznr.supabase.co/storage/v1/object/public/clock-photos/${fileName}`
      }
    });

  } catch (error) {
    console.error('❌ Erreur endpoint clock-photos:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}