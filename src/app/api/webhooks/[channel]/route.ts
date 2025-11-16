import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getChannelAdapter } from '@/lib/channels/adapter-factory'

export async function POST(
  request: NextRequest,
  { params }: { params: { channel: string } }
) {
  try {
    const payload = await request.json()

    // Generate unique webhook ID (use channel's webhook ID if available)
    const webhookId = payload.id || payload.webhook_id || `${params.channel}_${Date.now()}_${Math.random()}`

    // Check if already processed (idempotency)
    const existing = await prisma.processedWebhook.findUnique({
      where: { webhookId },
    })

    if (existing) {
      return NextResponse.json({ status: 'already_processed' })
    }

    // Get channel
    const channel = await prisma.salesChannel.findUnique({
      where: { name: params.channel },
    })

    if (!channel) {
      return NextResponse.json(
        { error: 'Channel not found' },
        { status: 404 }
      )
    }

    // Process webhook using channel adapter
    const adapter = getChannelAdapter(channel.name, channel.apiCredentials)
    await adapter.handleWebhook(payload)

    // Mark as processed
    await prisma.processedWebhook.create({
      data: {
        webhookId,
        channelId: channel.id,
      },
    })

    return NextResponse.json({ status: 'processed' })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
