'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { channelSchema, channelListingSchema } from '@/lib/validations'
import { getChannelAdapter } from '@/lib/channels/adapter-factory'
import { ChannelSyncService } from '@/services/channel-sync-service'

export async function createChannel(data: unknown) {
  try {
    const validated = channelSchema.parse(data)

    const channel = await prisma.salesChannel.create({
      data: validated,
    })

    revalidatePath('/channels')
    return { success: true, channel }
  } catch (error) {
    console.error('Create channel error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create channel'
    }
  }
}

export async function updateChannel(id: string, data: unknown) {
  try {
    const validated = channelSchema.parse(data)

    const channel = await prisma.salesChannel.update({
      where: { id },
      data: validated,
    })

    revalidatePath('/channels')
    revalidatePath(`/channels/${id}`)
    return { success: true, channel }
  } catch (error) {
    console.error('Update channel error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update channel'
    }
  }
}

export async function deleteChannel(id: string) {
  try {
    await prisma.salesChannel.delete({
      where: { id },
    })

    revalidatePath('/channels')
    return { success: true }
  } catch (error) {
    console.error('Delete channel error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete channel'
    }
  }
}

export async function createChannelListing(data: unknown) {
  try {
    const validated = channelListingSchema.parse(data)

    const listing = await prisma.channelListing.create({
      data: validated,
    })

    revalidatePath('/channels')
    return { success: true, listing }
  } catch (error) {
    console.error('Create channel listing error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create listing'
    }
  }
}

export async function updateChannelListing(id: string, data: Partial<{ price: number; isActive: boolean }>) {
  try {
    const listing = await prisma.channelListing.update({
      where: { id },
      data,
    })

    revalidatePath('/channels')
    return { success: true, listing }
  } catch (error) {
    console.error('Update channel listing error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update listing'
    }
  }
}

export async function deleteChannelListing(id: string) {
  try {
    await prisma.channelListing.delete({
      where: { id },
    })

    revalidatePath('/channels')
    return { success: true }
  } catch (error) {
    console.error('Delete channel listing error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete listing'
    }
  }
}

export async function getChannels() {
  const channels = await prisma.salesChannel.findMany({
    include: {
      _count: {
        select: {
          listings: true,
          orders: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return channels
}

export async function getChannel(id: string) {
  const channel = await prisma.salesChannel.findUnique({
    where: { id },
    include: {
      listings: {
        include: {
          variant: {
            include: {
              product: true,
              inventory: true,
            },
          },
        },
      },
      _count: {
        select: {
          orders: true,
        },
      },
    },
  })

  return channel
}

export async function testChannelConnection(id: string) {
  try {
    const channel = await prisma.salesChannel.findUnique({
      where: { id },
    })

    if (!channel) {
      throw new Error('Channel not found')
    }

    const adapter = getChannelAdapter(channel.name, channel.apiCredentials)
    const isConnected = await adapter.testConnection()

    return { success: true, isConnected }
  } catch (error) {
    console.error('Test connection error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to test connection'
    }
  }
}

export async function processSyncQueue() {
  try {
    const results = await ChannelSyncService.processSyncQueue()
    revalidatePath('/channels')
    return { success: true, results }
  } catch (error) {
    console.error('Process sync queue error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process sync queue'
    }
  }
}

export async function getSyncQueueStatus() {
  try {
    const status = await ChannelSyncService.getSyncQueueStatus()
    return { success: true, status }
  } catch (error) {
    console.error('Get sync queue status error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get sync queue status'
    }
  }
}
