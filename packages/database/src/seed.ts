// ============================================================
// TaskMaster PEI - Database Seeder
// ============================================================

import { prisma } from './index';
import * as bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Seeding database...\n');

  // Check if users already exist
  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    console.log('⚠️  Database already has data. Skipping seed.\n');
    return;
  }

  const passwordHash = await bcrypt.hash('admin123', 10);

  // Create Direktur
  const direktur = await prisma.user.create({
    data: {
      username: 'direktur',
      fullName: 'Direktur Utama',
      email: 'direktur@taskmaster.com',
      passwordHash,
      role: 'DIREKTUR',
    },
  });
  console.log(`✅ Created Direktur: ${direktur.fullName} (${direktur.username})`);

  // Create Koordinator
  const koordinator = await prisma.user.create({
    data: {
      username: 'koordinator',
      fullName: 'Koordinator Teknisi',
      email: 'koordinator@taskmaster.com',
      passwordHash,
      role: 'KOORDINATOR',
    },
  });
  console.log(`✅ Created Koordinator: ${koordinator.fullName} (${koordinator.username})`);

  // Create Teknisi
  const teknisi = await prisma.user.create({
    data: {
      username: 'teknisi',
      fullName: 'Teknisi Lapangan',
      email: 'teknisi@taskmaster.com',
      passwordHash,
      role: 'TEKNISI',
    },
  });
  console.log(`✅ Created Teknisi: ${teknisi.fullName} (${teknisi.username})`);

  // Create Lead IT
  const leadIT = await prisma.user.create({
    data: {
      username: 'leadit',
      fullName: 'Lead IT Department',
      email: 'leadit@taskmaster.com',
      passwordHash,
      role: 'LEAD_IT',
    },
  });
  console.log(`✅ Created Lead IT: ${leadIT.fullName} (${leadIT.username})`);

  // Create IT Programmer
  const itProgrammer = await prisma.user.create({
    data: {
      username: 'itprog',
      fullName: 'IT Programmer',
      email: 'itprog@taskmaster.com',
      passwordHash,
      role: 'IT_PROGRAMMER',
    },
  });
  console.log(`✅ Created IT Programmer: ${itProgrammer.fullName} (${itProgrammer.username})`);

  // Create Lead AI
  const leadAI = await prisma.user.create({
    data: {
      username: 'leadai',
      fullName: 'Lead AI Department',
      email: 'leadai@taskmaster.com',
      passwordHash,
      role: 'LEAD_AI',
    },
  });
  console.log(`✅ Created Lead AI: ${leadAI.fullName} (${leadAI.username})`);

  // Create AI Engineer
  const aiEngineer = await prisma.user.create({
    data: {
      username: 'aieng',
      fullName: 'AI Engineer',
      email: 'aieng@taskmaster.com',
      passwordHash,
      role: 'AI_ENGINEER',
    },
  });
  console.log(`✅ Created AI Engineer: ${aiEngineer.fullName} (${aiEngineer.username})`);

  // Create sample projects
  const projectIT = await prisma.project.create({
    data: {
      name: 'Pengembangan Sistem Informasi',
      description: 'Proyek pengembangan sistem informasi internal perusahaan',
      leadId: leadIT.id,
      department: 'IT',
    },
  });
  console.log(`✅ Created Project IT: ${projectIT.name}`);

  const projectAI = await prisma.project.create({
    data: {
      name: 'Pengembangan Model AI',
      description: 'Proyek pengembangan dan deployment model AI/ML',
      leadId: leadAI.id,
      department: 'AI',
    },
  });
  console.log(`✅ Created Project AI: ${projectAI.name}`);

  const projectTeknisi = await prisma.project.create({
    data: {
      name: 'Pemeliharaan Infrastruktur',
      description: 'Proyek pemeliharaan dan perbaikan infrastruktur teknis',
      leadId: koordinator.id,
      department: 'TEKNISI',
    },
  });
  console.log(`✅ Created Project Teknisi: ${projectTeknisi.name}`);

  // Create sample tasks
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // IT Tasks
  await prisma.task.create({
    data: {
      title: 'Setup Database Neon.tech',
      description: 'Migrasi database dari Appwrite ke Neon.tech PostgreSQL',
      instructions: '1. Setup Prisma ORM\n2. Migrate schema\n3. Test connection',
      status: 'IN_PROGRESS',
      assignedTo: itProgrammer.id,
      createdBy: leadIT.id,
      projectId: projectIT.id,
      targetDate: tomorrow,
    },
  });
  console.log('✅ Created sample IT task');

  await prisma.task.create({
    data: {
      title: 'Develop API Gateway',
      description: 'Buat API Gateway dengan Fastify untuk microservices',
      instructions: '1. Setup Fastify server\n2. Add rate limiting\n3. Add JWT middleware',
      status: 'PENDING',
      assignedTo: itProgrammer.id,
      createdBy: leadIT.id,
      projectId: projectIT.id,
      targetDate: nextWeek,
    },
  });
  console.log('✅ Created sample IT task 2');

  // AI Tasks
  await prisma.task.create({
    data: {
      title: 'Deploy LLM Model',
      description: 'Deploy model bahasa ke production environment',
      instructions: '1. Containerize model\n2. Setup API endpoint\n3. Test inference',
      status: 'REVIEW',
      assignedTo: aiEngineer.id,
      createdBy: leadAI.id,
      projectId: projectAI.id,
      targetDate: tomorrow,
    },
  });
  console.log('✅ Created sample AI task');

  // Teknisi Tasks
  await prisma.task.create({
    data: {
      title: 'Perbaiki Jaringan Kantor',
      description: 'Perbaikan koneksi jaringan di lantai 3',
      instructions: '1. Cek router utama\n2. Test kabel fiber\n3. Konfigurasi ulang switch',
      status: 'PENDING',
      assignedTo: teknisi.id,
      createdBy: koordinator.id,
      projectId: projectTeknisi.id,
      targetDate: tomorrow,
    },
  });
  console.log('✅ Created sample Teknisi task');

  console.log('\n🎉 Seeding completed successfully!');
  console.log('\n📋 Login Credentials (password: admin123 for all):');
  console.log('   ├─ direktur    → Direktur');
  console.log('   ├─ koordinator → Koordinator');
  console.log('   ├─ teknisi     → Teknisi');
  console.log('   ├─ leadit      → Lead IT');
  console.log('   ├─ itprog      → IT Programmer');
  console.log('   ├─ leadai      → Lead AI');
  console.log('   └─ aieng       → AI Engineer');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
