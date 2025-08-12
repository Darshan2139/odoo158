import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function checkProductStatus() {
  console.log('🔍 Checking current product status enum values...');

  try {
    // Check if the enum exists and what values it has
    const result = await db.execute(sql`
      SELECT unnest(enum_range(NULL::product_status)) as status;
    `);
    
    console.log('✅ Product status enum found with values:');
    result.rows.forEach((row: any) => {
      console.log(`  - ${row.status}`);
    });
    
  } catch (error: any) {
    console.error('❌ Error checking product status enum:', error.message);
    
    // Try to check if the table exists
    try {
      const tableCheck = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'products'
        );
      `);
      
      if (tableCheck.rows[0]?.exists) {
        console.log('ℹ️ Products table exists, but product_status enum may not be created yet');
      } else {
        console.log('ℹ️ Products table does not exist');
      }
    } catch (tableError: any) {
      console.error('❌ Error checking table existence:', tableError.message);
    }
  }
}

checkProductStatus()
  .then(() => {
    console.log('✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
