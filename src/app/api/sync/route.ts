import { NextRequest, NextResponse } from 'next/server'
import { ChannelSyncService } from '@/services/channel-sync-service'

export async function POST(request: NextRequest) {
  try {
    const { limit } = await request.json()

    const results = await ChannelSyncService.processSyncQueue(limit || 10)

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    })
  } catch (error) {
    console.error('Sync processing error:', error)
    return NextResponse.json(
      {
        error: 'Sync processing failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const status = await ChannelSyncService.getSyncQueueStatus()

    return NextResponse.json({
      success: true,
      status,
    })
  } catch (error) {
    console.error('Get sync status error:', error)
    return NextResponse.json(
      {
        error: 'Failed to get sync status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
