import { NextResponse } from 'next/server'
import { InventoryService } from '@/services/inventory-service'

export async function GET() {
  try {
    const inventory = await InventoryService.getAllInventory()
    return NextResponse.json({ success: true, inventory })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    )
  }
}
