import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      category, description, latitude, longitude, user_id,
      rescue_requirements, priority, summary,
      people_count, requester_name, requester_phone, blood_group,
    } = body;

    if (!category || !description || latitude === undefined || longitude === undefined || !user_id) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('requests')
      .insert([{
        category,
        description,
        latitude,
        longitude,
        user_id,
        rescue_requirements,
        priority: priority || 'Medium',
        summary: summary || description.slice(0, 100),
        volunteer_count: 0,
        status: 'active',
        people_count: people_count || 1,
        requester_name: requester_name || null,
        requester_phone: requester_phone || null,
        blood_group: blood_group || null,
      }])
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
    const { id, action, user_id } = body;

    if (!id || !action) {
      return NextResponse.json({ success: false, error: 'ID and action are required' }, { status: 400 });
    }

    let updateData: Record<string, any> = {};

    if (action === 'volunteer') {
      // Fetch current state
      const { data: current, error: fetchError } = await supabase
        .from('requests')
        .select('volunteer_count, status')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      if (current?.status === 'completed') {
        return NextResponse.json({ success: false, error: 'Request already completed' }, { status: 400 });
      }

      if (current && current.volunteer_count >= 10) {
        return NextResponse.json({ success: false, error: 'Enough volunteers already assigned. Help is on the way!' }, { status: 400 });
      }

      // Check for duplicate assignment using volunteer_assignments table
      if (user_id) {
        const { data: existing } = await supabase
          .from('volunteer_assignments')
          .select('id')
          .eq('request_id', id)
          .eq('user_id', user_id)
          .single();

        if (existing) {
          return NextResponse.json({ success: false, error: 'You are already assigned to this mission.' }, { status: 400 });
        }

        // Record the assignment
        await supabase.from('volunteer_assignments').insert({ request_id: id, user_id });
      }

      updateData = {
        volunteer_count: (current?.volunteer_count || 0) + 1,
        status: 'accepted',
      };
    } else if (action === 'complete') {
      updateData = { status: 'completed' };
    } else {
      return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
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
