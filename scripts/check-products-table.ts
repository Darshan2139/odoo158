import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function checkProductsTable() {
  console.log('🔍 Checking products table structure...');

  try {
    // Check the table structure
    const result = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'products'
      ORDER BY ordinal_position;
    `);
    
    console.log('✅ Products table structure:');
    result.rows.forEach((row: any) => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Check if there are any products
    const productCount = await db.execute(sql`
      SELECT COUNT(*) as count FROM products;
    `);
    
    console.log(`\n📊 Total products in database: ${productCount.rows[0]?.count}`);
    
    // Check sample product data
    const sampleProduct = await db.execute(sql`
      SELECT id, name, status FROM products LIMIT 1;
    `);
    
    if (sampleProduct.rows.length > 0) {
      console.log('\n📋 Sample product:');
      console.log(`  - ID: ${sampleProduct.rows[0].id}`);
      console.log(`  - Name: ${sampleProduct.rows[0].name}`);
      console.log(`  - Status: ${sampleProduct.rows[0].status}`);
    }
    
  } catch (error: any) {
    console.error('❌ Error checking products table:', error.message);
  }
}

checkProductsTable()
  .then(() => {
    console.log('✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
