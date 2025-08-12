import { db } from '../server/db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function createAdminUser() {
  console.log('🚀 Creating admin user...');

  try {
    // Check if admin user already exists
    const existingAdmin = await db.select().from(users).where(eq(users.role, 'admin')).limit(1);
    
    if (existingAdmin.length > 0) {
      console.log('✅ Admin user already exists:', existingAdmin[0]);
      return existingAdmin[0];
    }

    // Create an admin user
    const [adminUser] = await db.insert(users).values({
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

    console.log('✅ Admin user created successfully:', adminUser);
    console.log('📧 Email: admin@rentpro.com');
    console.log('🔑 Password: admin123');
    console.log('👤 Role: admin');
    return adminUser;
  } catch (error: any) {
    console.error('❌ Error creating admin user:', error.message);
    
    // If the error is about missing columns, try with basic fields only
    if (error.message.includes('column') || error.message.includes('does not exist')) {
      try {
        const [basicAdmin] = await db.insert(users).values({
          username: 'admin',
          email: 'admin@rentpro.com',
          password: 'admin123',
          firstName: 'Admin',
          lastName: 'User',
          phone: '+91 9876543210',
          address: 'Admin Office',
          role: 'admin'
        }).returning();
        
        console.log('✅ Basic admin user created:', basicAdmin);
        console.log('📧 Email: admin@rentpro.com');
        console.log('🔑 Password: admin123');
        console.log('👤 Role: admin');
        return basicAdmin;
      } catch (basicError: any) {
        console.error('❌ Error creating basic admin user:', basicError.message);
      }
    }
  }
}

createAdminUser()
  .then(() => {
    console.log('✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
