import { BaseChannelAdapter } from './base-adapter'
import { ShopifyAdapter } from './shopify-adapter'
import { MercadoLibreAdapter } from './mercadolibre-adapter'
import { AmazonAdapter } from './amazon-adapter'
import { SheinAdapter } from './shein-adapter'

/**
 * Factory function to get the appropriate channel adapter
 */
export function getChannelAdapter(channelName: string, credentials?: any): BaseChannelAdapter {
  switch (channelName.toLowerCase()) {
    case 'shopify':
      return new ShopifyAdapter(channelName, credentials)
    case 'mercadolibre':
      return new MercadoLibreAdapter(channelName, credentials)
    case 'amazon':
      return new AmazonAdapter(channelName, credentials)
    case 'shein':
      return new SheinAdapter(channelName, credentials)
    default:
      throw new Error(`Unsupported channel: ${channelName}`)
  }
}

/**
 * Get all available channel adapters
 */
export function getAllChannelAdapters(): string[] {
  return ['shopify', 'mercadolibre', 'amazon', 'shein']
}

/**
 * Validate if a channel is supported
 */
export function isChannelSupported(channelName: string): boolean {
  return getAllChannelAdapters().includes(channelName.toLowerCase())
}
