import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function checkDeletedProduct() {
  console.log('🔍 Checking if product was successfully soft deleted...');

  try {
    // Check the specific product
    const result = await db.execute(sql`
      SELECT id, name, status, available_quantity, reserved_quantity
      FROM products 
      WHERE id = '9721a96b-f6e3-4a2a-b7a2-680b147212fb';
    `);
    
    if (result.rows.length > 0) {
      const product = result.rows[0];
      console.log('✅ Product found:');
      console.log(`  - ID: ${product.id}`);
      console.log(`  - Name: ${product.name}`);
      console.log(`  - Status: ${product.status}`);
      console.log(`  - Available Quantity: ${product.available_quantity}`);
      console.log(`  - Reserved Quantity: ${product.reserved_quantity}`);
      
      if (product.status === 'deleted') {
        console.log('🎉 SUCCESS: Product was soft deleted!');
      } else {
        console.log('⚠️ Product status was not changed to "deleted"');
      }
    } else {
      console.log('❌ Product not found');
    }
    
    // Also check how many products have "deleted" status
    const deletedCount = await db.execute(sql`
      SELECT COUNT(*) as count FROM products WHERE status = 'deleted';
    `);
    
    console.log(`\n📊 Total products with "deleted" status: ${deletedCount.rows[0]?.count}`);
    
  } catch (error: any) {
    console.error('❌ Error checking deleted product:', error.message);
  }
}

checkDeletedProduct()
  .then(() => {
    console.log('✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
