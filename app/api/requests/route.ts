import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { category, description, latitude, longitude, user_id, rescue_requirements, priority, summary } = body;

    if (!category || !description || latitude === undefined || longitude === undefined || !user_id) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('requests')
      .insert([
        {
          category,
          description,
          latitude,
          longitude,
          user_id,
          rescue_requirements,
          priority: priority || 'Medium',
          summary: summary || description.slice(0, 100),
          volunteer_count: 0,
          status: 'active'
        },
      ])
      .select();

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, action } = body;

    if (!id || !action) {
      return NextResponse.json({ success: false, error: 'ID and action are required' }, { status: 400 });
    }

    let updateData = {};

    if (action === 'volunteer') {
      const { data: current, error: fetchError } = await supabase
        .from('requests')
        .select('volunteer_count, status')
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;

      if (current && current.volunteer_count >= 10) {
        return NextResponse.json({ success: false, error: 'Enough volunteers assigned' }, { status: 400 });
      }

      if (current && current.status === 'completed') {
        return NextResponse.json({ success: false, error: 'Request already completed' }, { status: 400 });
      }

      updateData = { 
        volunteer_count: (current?.volunteer_count || 0) + 1,
        status: 'active' // Keep it active if it was, or ensure it's not 'completed'
      };
    } else if (action === 'complete') {
      updateData = { status: 'completed' };
    }

    const { data, error } = await supabase
      .from('requests')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, data: data[0] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

