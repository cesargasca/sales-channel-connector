import { prisma } from '@/lib/prisma'
import { SyncAction, SyncStatus } from '@prisma/client'
import { getChannelAdapter } from '@/lib/channels/adapter-factory'

export class ChannelSyncService {
  /**
   * Update stock on a specific channel
   */
  static async updateChannelStock(variantId: string, channelId: string, quantity: number) {
    try {
      const listing = await prisma.channelListing.findUnique({
        where: {
          variantId_channelId: { variantId, channelId },
        },
        include: {
          channel: true,
        },
      })

      if (!listing || !listing.externalId) {
        throw new Error('Listing not found on channel')
      }

      const adapter = getChannelAdapter(listing.channel.name, listing.channel.apiCredentials)
      await adapter.updateStock(listing.externalId, quantity)

      await prisma.channelListing.update({
        where: { id: listing.id },
        data: { lastSyncedAt: new Date() },
      })

      return { success: true }
    } catch (error) {
      console.error(`Failed to update stock on channel ${channelId}:`, error)
      throw error
    }
  }

  /**
   * Sync stock to all active channels
   */
  static async syncStockToAllChannels(variantId: string) {
    const inventory = await prisma.inventory.findUnique({
      where: { variantId },
    })

    if (!inventory) {
      throw new Error('Inventory not found')
    }

    const listings = await prisma.channelListing.findMany({
      where: {
        variantId,
        isActive: true,
        channel: { isActive: true },
      },
      include: { channel: true },
    })

    const results = await Promise.allSettled(
      listings.map((listing) =>
        this.queueSync(variantId, listing.channelId, SyncAction.UPDATE_STOCK, {
          externalId: listing.externalId,
          quantity: inventory.quantityAvailable,
        })
      )
    )

    return results
  }

  /**
   * Queue a sync job for reliability
   */
  static async queueSync(
    variantId: string | null,
    channelId: string,
    action: SyncAction,
    payload: any
  ) {
    return await prisma.syncQueue.create({
      data: {
        variantId,
        channelId,
        action,
        payload,
        status: SyncStatus.PENDING,
      },
    })
  }

  /**
   * Process sync queue (called by background worker)
   */
  static async processSyncQueue(limit = 10) {
    const jobs = await prisma.syncQueue.findMany({
      where: {
        status: SyncStatus.PENDING,
        retryCount: { lt: 5 },
      },
      include: { channel: true },
      take: limit,
    })

    const results = []

    for (const job of jobs) {
      try {
        await prisma.syncQueue.update({
          where: { id: job.id },
          data: { status: SyncStatus.PROCESSING },
        })

        const adapter = getChannelAdapter(job.channel.name, job.channel.apiCredentials)
        let externalId: string | undefined

        switch (job.action) {
          case SyncAction.UPDATE_STOCK:
            await adapter.updateStock(job.payload.externalId, job.payload.quantity)
            break
          case SyncAction.UPDATE_PRICE:
            await adapter.updatePrice(job.payload.externalId, job.payload.price)
            break
          case SyncAction.CREATE_LISTING:
            externalId = await adapter.createListing(job.payload)
            // Update channel listing with external ID
            if (externalId && job.payload.listingId) {
              await prisma.channelListing.update({
                where: { id: job.payload.listingId },
                data: {
                  externalId,
                  lastSyncedAt: new Date(),
                },
              })
            }
            break
          case SyncAction.DELETE_LISTING:
            await adapter.deleteListing(job.payload.externalId)
            // Mark listing as inactive
            if (job.payload.listingId) {
              await prisma.channelListing.update({
                where: { id: job.payload.listingId },
                data: { isActive: false },
              })
            }
            break
        }

        await prisma.syncQueue.update({
          where: { id: job.id },
          data: {
            status: SyncStatus.COMPLETED,
            processedAt: new Date(),
          },
        })

        results.push({ id: job.id, success: true, externalId })
      } catch (error) {
        await prisma.syncQueue.update({
          where: { id: job.id },
          data: {
            status: SyncStatus.FAILED,
            retryCount: { increment: 1 },
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          },
        })

        results.push({ id: job.id, success: false, error })
      }
    }

    return results
  }

  /**
   * Retry failed syncs
   */
  static async retryFailedSyncs() {
    await prisma.syncQueue.updateMany({
      where: {
        status: SyncStatus.FAILED,
        retryCount: { lt: 5 },
      },
      data: {
        status: SyncStatus.PENDING,
      },
    })
  }

  /**
   * Get sync queue status
   */
  static async getSyncQueueStatus() {
    const [pending, processing, failed] = await Promise.all([
      prisma.syncQueue.count({ where: { status: SyncStatus.PENDING } }),
      prisma.syncQueue.count({ where: { status: SyncStatus.PROCESSING } }),
      prisma.syncQueue.count({ where: { status: SyncStatus.FAILED } }),
    ])

    return { pending, processing, failed }
  }

  /**
   * Clear completed sync jobs (cleanup)
   */
  static async clearCompletedJobs(olderThanDays = 7) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

    return await prisma.syncQueue.deleteMany({
      where: {
        status: SyncStatus.COMPLETED,
        processedAt: {
          lt: cutoffDate,
        },
      },
    })
  }
}
