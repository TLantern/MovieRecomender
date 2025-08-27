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
        
      case 'duplicates':
        const duplicates = await recommendationLogger.getDuplicateTitles();
        return NextResponse.json(duplicates);
        
      case 'unique-titles':
        const uniqueTitles = await recommendationLogger.getAllPreviouslyRecommendedTitles();
        return NextResponse.json({
          totalUniqueTitles: uniqueTitles.length,
          titles: uniqueTitles
        });
        
      case 'exclude-titles':
        const excludeTitles = await recommendationLogger.getAllPreviouslyRecommendedTitles();
        return NextResponse.json({
          totalExcludeTitles: excludeTitles.length,
          excludeTitles: excludeTitles,
          message: 'These titles should be excluded from future recommendations to prevent duplicates'
        });
        
      case 'session-files':
        const sessionFiles = await recommendationLogger.getSessionFiles();
        return NextResponse.json({
          totalSessions: sessionFiles.length,
          sessions: sessionFiles
        });
        
      default:
        return NextResponse.json({
          message: 'Available actions: stats, recent, duplicates, unique-titles, exclude-titles, session-files',
          usage: {
            stats: '/api/logs?action=stats',
            recent: '/api/logs?action=recent&limit=10',
            duplicates: '/api/logs?action=duplicates',
            uniqueTitles: '/api/logs?action=unique-titles',
            excludeTitles: '/api/logs?action=exclude-titles',
            sessionFiles: '/api/logs?action=session-files'
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