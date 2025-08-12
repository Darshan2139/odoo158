import { db } from '../server/db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function fixAdminPassword() {
  console.log('🔧 Fixing admin user password...');

  try {
    // Find the admin user
    const adminUser = await db.select().from(users).where(eq(users.email, 'admin@rentalpro.com')).limit(1);
    
    if (adminUser.length === 0) {
      console.log('❌ No admin user found with email admin@rentalpro.com');
      return;
    }

    const user = adminUser[0];
    console.log('✅ Admin user found:', {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role
    });

    // Update the password to a simple one for testing
    console.log('🔄 Updating password to "admin123"...');
    
    const [updatedUser] = await db.update(users)
      .set({ password: 'admin123' })
      .where(eq(users.id, user.id))
      .returning();
    
    console.log('✅ Password updated successfully');
    console.log('📧 Email: admin@rentalpro.com');
    console.log('🔑 Password: admin123');
    console.log('👤 Role: admin');

    // Also create a backup admin user with different credentials
    console.log('🔄 Creating backup admin user...');
    
    try {
      const [backupAdmin] = await db.insert(users).values({
        username: 'admin2',
        email: 'admin@rentpro.com',
        password: 'admin123',
        firstName: 'Admin',
        lastName: 'User',
        phone: '+91 9876543210',
        address: 'Admin Office',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        role: 'admin',
        membershipLevel: 'Platinum',
        totalOrders: 0,
        totalSpent: '0.00'
      }).returning();

      console.log('✅ Backup admin user created:', {
        id: backupAdmin.id,
        email: backupAdmin.email,
        role: backupAdmin.role
      });
      console.log('📧 Email: admin@rentpro.com');
      console.log('🔑 Password: admin123');
    } catch (error: any) {
      if (error.message.includes('duplicate key')) {
        console.log('ℹ️ Backup admin user already exists');
      } else {
        console.error('❌ Error creating backup admin:', error.message);
      }
    }

  } catch (error: any) {
    console.error('❌ Error fixing admin password:', error.message);
  }
}

fixAdminPassword()
  .then(() => {
    console.log('✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
