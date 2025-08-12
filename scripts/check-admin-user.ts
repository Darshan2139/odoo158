import { db } from '../server/db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function checkAdminUser() {
  console.log('🔍 Checking admin user details...');

  try {
    // Check if admin user exists
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
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      password: user.password ? `${user.password.substring(0, 20)}...` : 'null'
    });

    // Check if role is set to admin
    if (user.role !== 'admin') {
      console.log('⚠️ User role is not set to admin. Current role:', user.role);
      console.log('🔄 Updating role to admin...');
      
      const [updatedUser] = await db.update(users)
        .set({ role: 'admin' })
        .where(eq(users.id, user.id))
        .returning();
      
      console.log('✅ Role updated successfully. New role:', updatedUser.role);
    } else {
      console.log('✅ User role is correctly set to admin');
    }

    // Check if we need to create a new admin user with the correct credentials
    if (user.role !== 'admin') {
      console.log('🔄 Creating new admin user with correct credentials...');
      
      const [newAdmin] = await db.insert(users).values({
        username: 'admin',
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

      console.log('✅ New admin user created:', {
        id: newAdmin.id,
        email: newAdmin.email,
        role: newAdmin.role
      });
      console.log('📧 Email: admin@rentpro.com');
      console.log('🔑 Password: admin123');
    }

  } catch (error: any) {
    console.error('❌ Error checking admin user:', error.message);
  }
}

checkAdminUser()
  .then(() => {
    console.log('✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
