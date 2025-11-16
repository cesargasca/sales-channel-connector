export abstract class BaseChannelAdapter {
  protected channelName: string
  protected credentials: any

  constructor(channelName: string, credentials: any) {
    this.channelName = channelName
    this.credentials = credentials
  }

  /**
   * Authenticate with the channel
   */
  abstract authenticate(): Promise<boolean>

  /**
   * Update stock quantity
   */
  abstract updateStock(externalId: string, quantity: number): Promise<void>

  /**
   * Update price
   */
  abstract updatePrice(externalId: string, price: number): Promise<void>

  /**
   * Create a new listing
   */
  abstract createListing(product: any): Promise<string>

  /**
   * Delete a listing
   */
  abstract deleteListing(externalId: string): Promise<void>

  /**
   * Fetch recent orders
   */
  abstract fetchOrders(since: Date): Promise<any[]>

  /**
   * Handle incoming webhook
   */
  abstract handleWebhook(payload: any): Promise<void>

  /**
   * Test connection to the channel
   */
  async testConnection(): Promise<boolean> {
    try {
      return await this.authenticate()
    } catch (error) {
      console.error(`Connection test failed for ${this.channelName}:`, error)
      return false
    }
  }
}
