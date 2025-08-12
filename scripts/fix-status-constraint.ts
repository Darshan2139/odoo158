import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function fixStatusConstraint() {
  console.log('🔧 Fixing products status check constraint...');

  try {
    // Drop the existing constraint
    console.log('🔄 Dropping existing status check constraint...');
    await db.execute(sql`
      ALTER TABLE products DROP CONSTRAINT IF EXISTS products_status_check;
    `);
    
    // Create new constraint with "deleted" status
    console.log('🔄 Creating new status check constraint with "deleted" status...');
    await db.execute(sql`
      ALTER TABLE products ADD CONSTRAINT products_status_check 
      CHECK (status = ANY(ARRAY['available', 'rented', 'maintenance', 'reserved', 'deleted']));
    `);
    
    console.log('✅ Status check constraint updated successfully');
    console.log('📋 Allowed statuses: available, rented, maintenance, reserved, deleted');
    
  } catch (error: any) {
    console.error('❌ Error fixing status constraint:', error.message);
  }
}

fixStatusConstraint()
  .then(() => {
    console.log('✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
