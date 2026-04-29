import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function GET() {
  try {
    const [
      { count: totalRequests },
      { count: criticalPending },
      { count: activeVolunteers },
      { count: completedToday },
      { data: recentRequests },
    ] = await Promise.all([
      supabase.from('requests').select('*', { count: 'exact', head: true }),
      supabase.from('requests').select('*', { count: 'exact', head: true })
        .eq('priority', 'Critical').neq('status', 'completed'),
      supabase.from('profiles').select('*', { count: 'exact', head: true })
        .eq('availability', 'Available'),
      supabase.from('requests').select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('created_at', new Date(Date.now() - 86400000).toISOString()),
      supabase.from('requests').select('*')
        .neq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    return NextResponse.json({
      stats: {
        totalRequests: totalRequests || 0,
        criticalPending: criticalPending || 0,
        activeVolunteers: activeVolunteers || 0,
        completedToday: completedToday || 0,
      },
      recentRequests: recentRequests || [],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
