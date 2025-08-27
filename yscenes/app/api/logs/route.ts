import { NextRequest, NextResponse } from 'next/server';
import { recommendationLogger } from '../../../utils/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    switch (action) {
      case 'stats':
        const stats = await recommendationLogger.getStats();
        return NextResponse.json(stats);
        
      case 'recent':
        const limit = parseInt(searchParams.get('limit') || '10');
        const recentLogs = await recommendationLogger.getRecentLogs(limit);
        return NextResponse.json(recentLogs);
        
      default:
        return NextResponse.json({
          message: 'Available actions: stats, recent',
          usage: {
            stats: '/api/logs?action=stats',
            recent: '/api/logs?action=recent&limit=10'
          }
        });
    }
  } catch (error) {
    console.error('Logs API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logs' },
      { status: 500 }
    );
  }
} 