/**
 * Seed script — tạo dữ liệu demo đầy đủ cho môi trường dev/staging.
 * Chạy: pnpm db:seed  (hoặc: pnpm --filter @fuviai/db seed)
 *
 * Dữ liệu tạo ra:
 *  - 1 Organization (FuviDemo)
 *  - 2 Users (Owner + Member)
 *  - 5 Tags
 *  - 1 Pipeline với 4 stages
 *  - 20 Contacts (mix status)
 *  - 12 Deals (10 OPEN + 1 WON + 1 LOST)
 *  - 10 Activities (mix type + status)
 */
import {
  PrismaClient, Plan, UserRole,
  ContactStatus, DealStatus, ActivityType, ActivityStatus,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const randomDate = (daysAgo: number, daysAhead = 0): Date => {
  const now = Date.now();
  const from = now - daysAgo * 86_400_000;
  const to   = now + daysAhead * 86_400_000;
  return new Date(from + Math.random() * (to - from));
};

async function main() {
  console.log('🌱 Seeding database...\n');

  // --------------------------------
  // 1. Organization
  // --------------------------------
  const org = await prisma.organization.upsert({
    where: { slug: 'fuvidemo' },
    update: {},
    create: {
      name: 'Công ty TNHH FuviDemo',
      slug: 'fuvidemo',
      plan: Plan.PRO,
      phone: '+84 28 1234 5678',
      website: 'https://fuvidemo.vn',
      address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
    },
  });
  console.log(`✅ Organization: ${org.name} (${org.id})`);

  // --------------------------------
  // 2. Users
  // --------------------------------
  const hash12 = (pw: string) => bcrypt.hash(pw, 12);

  const owner = await prisma.user.upsert({
    where: { organizationId_email: { organizationId: org.id, email: 'admin@demo.com' } },
    update: {},
    create: {
      organizationId: org.id,
      email: 'admin@demo.com',
      passwordHash: await hash12('Admin@123456'),
      firstName: 'Nguyễn',
      lastName: 'Thành Chủ',
      role: UserRole.OWNER,
      status: 'ACTIVE',
    },
  });

  const member = await prisma.user.upsert({
    where: { organizationId_email: { organizationId: org.id, email: 'sale@demo.com' } },
    update: {},
    create: {
      organizationId: org.id,
      email: 'sale@demo.com',
      passwordHash: await hash12('Sale@123456'),
      firstName: 'Trần',
      lastName: 'Thị Sale',
      role: UserRole.MEMBER,
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Users: ${owner.email} (Owner), ${member.email} (Member)`);

  // --------------------------------
  // 3. Tags
  // --------------------------------
  const tagNames = ['VIP', 'Tiềm năng', 'Mới', 'Cần follow-up', 'Giới thiệu'];
  const tags = await Promise.all(
    tagNames.map((name) =>
      prisma.tag.upsert({
        where: { organizationId_name: { organizationId: org.id, name } },
        update: {},
        create: { organizationId: org.id, name, createdById: owner.id },
      }),
    ),
  );
  console.log(`✅ Tags: ${tags.map((t) => t.name).join(', ')}`);

  // --------------------------------
  // 4. Pipeline + Stages
  // --------------------------------
  const pipeline = await prisma.pipeline.upsert({
    where: { id: 'seed-pipeline-main' },
    update: {},
    create: {
      id: 'seed-pipeline-main',
      organizationId: org.id,
      name: 'Quy trình bán hàng chính',
      isDefault: true,
      createdById: owner.id,
      stages: {
        create: [
          { name: 'Tiếp cận',    color: '#3B82F6', probability: 10, order: 0 },
          { name: 'Đề xuất',     color: '#8B5CF6', probability: 30, order: 1 },
          { name: 'Demo',        color: '#F59E0B', probability: 60, order: 2 },
          { name: 'Thương lượng', color: '#10B981', probability: 80, order: 3 },
        ],
      },
    },
    include: { stages: { orderBy: { order: 'asc' } } },
  });
  const [s0, s1, s2, s3] = pipeline.stages;
  console.log(`✅ Pipeline: "${pipeline.name}" — ${pipeline.stages.length} stages`);

  // --------------------------------
  // 5. Contacts
  // --------------------------------
  const contactData = [
    { fn: 'Phạm',   ln: 'Minh Tuấn',   email: 'tuan.pm@gmail.com',     company: 'Công ty ABC',     status: ContactStatus.CUSTOMER,  score: 85 },
    { fn: 'Lê',     ln: 'Thị Hoa',      email: 'hoa.lt@yahoo.com',       company: 'Tập đoàn XYZ',    status: ContactStatus.PROSPECT,  score: 72 },
    { fn: 'Nguyễn', ln: 'Văn Bình',     email: 'binh.nv@outlook.com',    company: 'Startup DEF',     status: ContactStatus.LEAD,      score: 45 },
    { fn: 'Trịnh',  ln: 'Thành Long',   email: 'long.tt@company.vn',     company: 'CT TNHH GHI',     status: ContactStatus.PROSPECT,  score: 60 },
    { fn: 'Đỗ',     ln: 'Thị Mai',      email: 'mai.dt@mail.com',         company: 'Nhà máy JKL',     status: ContactStatus.CUSTOMER,  score: 91 },
    { fn: 'Bùi',    ln: 'Quang Huy',    email: 'huy.bq@enterprise.vn',   company: 'Tập đoàn MNO',    status: ContactStatus.LEAD,      score: 38 },
    { fn: 'Vũ',     ln: 'Thị Lan',      email: 'lan.vt@startup.io',       company: 'Công ty PQR',     status: ContactStatus.PROSPECT,  score: 67 },
    { fn: 'Hoàng',  ln: 'Minh Đức',     email: 'duc.hm@corp.com',         company: 'CT Cổ phần STU',  status: ContactStatus.LEAD,      score: 29 },
    { fn: 'Đinh',   ln: 'Thị Thu',      email: 'thu.dt@business.vn',      company: 'Công ty VWX',     status: ContactStatus.CUSTOMER,  score: 88 },
    { fn: 'Cao',    ln: 'Quốc Khánh',   email: 'khanh.cq@tech.vn',        company: 'Tech VN YZ',      status: ContactStatus.PROSPECT,  score: 55 },
    { fn: 'Lương',  ln: 'Thị Nhung',    email: 'nhung.lt@retail.vn',      company: 'Siêu thị Alpha',  status: ContactStatus.LEAD,      score: 42 },
    { fn: 'Tống',   ln: 'Văn Nam',      email: 'nam.tv@factory.vn',       company: 'Nhà máy Beta',    status: ContactStatus.CUSTOMER,  score: 79 },
    { fn: 'Mai',    ln: 'Thị Huyền',    email: 'huyen.mt@service.com',    company: 'Dịch vụ Gamma',   status: ContactStatus.PROSPECT,  score: 63 },
    { fn: 'Phan',   ln: 'Đức Toàn',     email: 'toan.pd@invest.vn',       company: 'Đầu tư Delta',    status: ContactStatus.LEAD,      score: 33 },
    { fn: 'Dương',  ln: 'Thị Kiều',     email: 'kieu.dt@consulting.vn',   company: 'Tư vấn Epsilon',  status: ContactStatus.PROSPECT,  score: 58 },
    { fn: 'Nghiêm', ln: 'Văn Tùng',     email: 'tung.nv@hospital.vn',     company: 'BV Zeta',         status: ContactStatus.CUSTOMER,  score: 82 },
    { fn: 'Từ',     ln: 'Thị Oanh',     email: 'oanh.tt@school.edu.vn',   company: 'Trường Eta',      status: ContactStatus.LEAD,      score: 21 },
    { fn: 'Quách',  ln: 'Minh Thắng',   email: 'thang.qm@realty.vn',      company: 'BĐS Theta',       status: ContactStatus.PROSPECT,  score: 70 },
    { fn: 'Lâm',    ln: 'Thị Linh',     email: 'linh.lt@hotel.vn',        company: 'KS Iota',         status: ContactStatus.CUSTOMER,  score: 94 },
    { fn: 'Khổng',  ln: 'Anh Tuấn',     email: 'tuan.ka@restaurant.vn',   company: 'Nhà hàng Kappa',  status: ContactStatus.LEAD,      score: 16 },
  ];

  const contacts = await Promise.all(
    contactData.map((c, i) =>
      prisma.contact.upsert({
        where: { organizationId_email: { organizationId: org.id, email: c.email } },
        update: {},
        create: {
          organizationId: org.id,
          firstName: c.fn,
          lastName: c.ln,
          email: c.email,
          company: c.company,
          phone: `+849${String(10000000 + i * 7919).padStart(8, '0')}`,
          status: c.status,
          aiScore: c.score,
          createdById: i % 2 === 0 ? owner.id : member.id,
          createdAt: randomDate(90, 0),
        },
      }),
    ),
  );
  console.log(`✅ Contacts: ${contacts.length}`);

  // Gắn tags
  await prisma.contactTag.createMany({
    data: [
      { contactId: contacts[0].id,  tagId: tags[0].id },
      { contactId: contacts[0].id,  tagId: tags[1].id },
      { contactId: contacts[1].id,  tagId: tags[2].id },
      { contactId: contacts[4].id,  tagId: tags[0].id },
      { contactId: contacts[8].id,  tagId: tags[3].id },
      { contactId: contacts[11].id, tagId: tags[4].id },
      { contactId: contacts[18].id, tagId: tags[0].id },
    ],
    skipDuplicates: true,
  });

  // --------------------------------
  // 6. Deals
  // --------------------------------
  const dealData = [
    { title: 'Giải pháp CRM toàn diện',     value: 150_000_000, contact: contacts[0],  stage: s3 },
    { title: 'Phần mềm quản lý kho',         value: 80_000_000,  contact: contacts[1],  stage: s2 },
    { title: 'Hệ thống POS nhà hàng',        value: 45_000_000,  contact: contacts[4],  stage: s1 },
    { title: 'Tư vấn chuyển đổi số',         value: 200_000_000, contact: contacts[8],  stage: s3 },
    { title: 'Module HRM',                   value: 60_000_000,  contact: contacts[2],  stage: s0 },
    { title: 'Phần mềm kế toán',             value: 35_000_000,  contact: contacts[11], stage: s2 },
    { title: 'Ứng dụng mobile bán hàng',     value: 90_000_000,  contact: contacts[6],  stage: s1 },
    { title: 'Tích hợp Zalo Business',       value: 25_000_000,  contact: contacts[3],  stage: s0 },
    { title: 'Dashboard BI & Analytics',     value: 120_000_000, contact: contacts[18], stage: s3 },
    { title: 'Nâng cấp hệ thống email cũ',  value: 55_000_000,  contact: contacts[9],  stage: s1 },
  ];

  const deals = await Promise.all(
    dealData.map((d, i) =>
      prisma.deal.create({
        data: {
          organizationId: org.id,
          pipelineId: pipeline.id,
          stageId: d.stage.id,
          contactId: d.contact.id,
          title: d.title,
          value: d.value,
          currency: 'VND',
          probability: d.stage.probability,
          status: DealStatus.OPEN,
          expectedCloseDate: randomDate(-7, 90),
          assignedToId: i % 2 === 0 ? owner.id : member.id,
          createdById: owner.id,
          createdAt: randomDate(60, 0),
        },
      }),
    ),
  );

  // 1 WON deal
  await prisma.deal.create({
    data: {
      organizationId: org.id,
      pipelineId: pipeline.id,
      stageId: s3.id,
      contactId: contacts[5].id,
      title: 'ERP System Q1 2026',
      value: 500_000_000,
      currency: 'VND',
      probability: 100,
      status: DealStatus.WON,
      closedAt: new Date('2026-02-15'),
      createdById: owner.id,
      createdAt: new Date('2026-01-10'),
    },
  });

  // 1 LOST deal
  await prisma.deal.create({
    data: {
      organizationId: org.id,
      pipelineId: pipeline.id,
      stageId: s0.id,
      contactId: contacts[13].id,
      title: 'Pilot Project (lost)',
      value: 30_000_000,
      currency: 'VND',
      probability: 0,
      status: DealStatus.LOST,
      lostReason: 'Khách chọn đối thủ cạnh tranh',
      closedAt: new Date('2026-02-20'),
      createdById: member.id,
      createdAt: new Date('2026-01-20'),
    },
  });
  console.log(`✅ Deals: ${deals.length} OPEN + 1 WON + 1 LOST`);

  // --------------------------------
  // 7. Activities
  // --------------------------------
  const actData = [
    { type: ActivityType.CALL,    title: 'Gọi điện tư vấn sản phẩm',   ci: 0,  di: 0, done: true,  daysAgo: 2  },
    { type: ActivityType.EMAIL,   title: 'Gửi báo giá chi tiết',        ci: 1,  di: 1, done: true,  daysAgo: 1  },
    { type: ActivityType.MEETING, title: 'Meeting demo sản phẩm',       ci: 4,  di: 2, done: false, ahead: 3    },
    { type: ActivityType.TASK,    title: 'Chuẩn bị hợp đồng',           ci: 8,  di: 3, done: false, ahead: 5    },
    { type: ActivityType.CALL,    title: 'Follow-up sau demo',           ci: 2,  di: 4, done: true,  daysAgo: 3  },
    { type: ActivityType.EMAIL,   title: 'Gửi tài liệu kỹ thuật',       ci: 11, di: 5, done: false, ahead: 2    },
    { type: ActivityType.MEETING, title: 'Họp kỹ thuật với team IT',    ci: 6,  di: 6, done: false, ahead: 7    },
    { type: ActivityType.TASK,    title: 'Research đối thủ cạnh tranh', ci: 3,  di: 7, done: false, ahead: 1    },
    { type: ActivityType.CALL,    title: 'Gọi chốt hợp đồng',          ci: 18, di: 8, done: false, ahead: 10   },
    { type: ActivityType.EMAIL,   title: 'Email cảm ơn sau cuộc họp',   ci: 9,  di: 9, done: true,  daysAgo: 1  },
  ];

  await Promise.all(
    actData.map((a) =>
      prisma.activity.create({
        data: {
          organizationId: org.id,
          type: a.type,
          title: a.title,
          status: a.done ? ActivityStatus.DONE : ActivityStatus.PENDING,
          dueDate: a.done
            ? randomDate(a.daysAgo!, 0)
            : randomDate(0, a.ahead!),
          contactId: contacts[a.ci].id,
          dealId: deals[a.di].id,
          assignedToId: owner.id,
          createdById: owner.id,
        },
      }),
    ),
  );
  console.log(`✅ Activities: ${actData.length}`);

  // --------------------------------
  // Summary
  // --------------------------------
  console.log('\n🎉 Seed hoàn thành!');
  console.log('\n📝 Thông tin đăng nhập:');
  console.log('   Owner:  admin@demo.com  / Admin@123456');
  console.log('   Member: sale@demo.com   / Sale@123456');
  console.log('\n🌐 App URL: http://localhost:3000');
  console.log('📚 API Docs: http://localhost:4000/api/docs');
}

main()
  .catch((e) => {
    console.error('❌ Seed thất bại:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
