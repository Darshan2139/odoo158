import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function updateProductStatusEnum() {
  console.log('🔄 Updating product_status enum to include "deleted" status...');

  try {
    // Add the "deleted" status to the product_status enum
    await db.execute(sql`
      ALTER TYPE product_status ADD VALUE IF NOT EXISTS 'deleted';
    `);

    console.log('✅ Product status enum updated successfully');
    console.log('📋 Available product statuses: available, rented, maintenance, reserved, deleted');
    
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      console.log('ℹ️ "deleted" status already exists in product_status enum');
    } else {
      console.error('❌ Error updating product status enum:', error.message);
    }
  }
}

updateProductStatusEnum()
  .then(() => {
    console.log('✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
