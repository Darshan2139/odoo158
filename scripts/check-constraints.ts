import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function checkConstraints() {
  console.log('🔍 Checking constraints on products table...');

  try {
    // Check check constraints
    const checkConstraints = await db.execute(sql`
      SELECT conname, pg_get_constraintdef(oid) as definition
      FROM pg_constraint 
      WHERE conrelid = 'products'::regclass 
      AND contype = 'c';
    `);
    
    if (checkConstraints.rows.length > 0) {
      console.log('✅ Check constraints found:');
      checkConstraints.rows.forEach((row: any) => {
        console.log(`  - ${row.conname}: ${row.definition}`);
      });
    } else {
      console.log('ℹ️ No check constraints found');
    }
    
    // Check foreign key constraints
    const fkConstraints = await db.execute(sql`
      SELECT conname, pg_get_constraintdef(oid) as definition
      FROM pg_constraint 
      WHERE conrelid = 'products'::regclass 
      AND contype = 'f';
    `);
    
    if (fkConstraints.rows.length > 0) {
      console.log('\n🔗 Foreign key constraints found:');
      fkConstraints.rows.forEach((row: any) => {
        console.log(`  - ${row.conname}: ${row.definition}`);
      });
    } else {
      console.log('\nℹ️ No foreign key constraints found');
    }
    
  } catch (error: any) {
    console.error('❌ Error checking constraints:', error.message);
  }
}

checkConstraints()
  .then(() => {
    console.log('✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
