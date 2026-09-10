/**
 * Seeds programme content: tenders, facilities, partner discounts and news.
 * Every record carries both English and Arabic text.
 *
 * Run via `npm run seed` (the main seed script calls this) or directly.
 */
const { Tender, Facility, Discount, NewsPost } = require('./models/Content');

// Relative dates so seeded tenders never look already-expired when the
// project is opened weeks after the data was written.
const daysFromNow = (n) => new Date(Date.now() + n * 864e5);
const daysAgo = (n) => new Date(Date.now() - n * 864e5);

const tenders = [
  {
    refNo: 12, category: 'maintenance', status: 'open', documentsRequired: false,
    title: 'Maintenance and upgrade of technical systems for a small enterprise',
    titleAr: 'أعمال صيانة وتحديث أنظمة تقنية لمؤسسة صغيرة',
    orgName: 'Istedama Partnerships Foundation', orgNameAr: 'مؤسسة استدامة الشراكات',
    location: 'Muscat', locationAr: 'مسقط',
    description: 'Scope covers server maintenance, network hardening and a twelve-month support agreement.',
    descriptionAr: 'يشمل النطاق صيانة الخوادم وتأمين الشبكة واتفاقية دعم فني لمدة اثني عشر شهراً.',
    closingDate: new Date('2026-09-14')
  },
  {
    refNo: 13, category: 'supply', status: 'open', documentsRequired: true,
    title: 'Supply of office equipment for the new business centre',
    titleAr: 'توريد أجهزة مكتبية لمركز الأعمال الجديد',
    orgName: 'Istedama Business Centre', orgNameAr: 'مركز الأعمال - استدامة',
    location: 'Sohar', locationAr: 'صحار',
    description: 'Supply and installation of workstations, meeting-room displays and networked printers.',
    descriptionAr: 'توريد وتركيب محطات العمل وشاشات قاعات الاجتماعات والطابعات الشبكية.',
    closingDate: new Date('2026-09-19')
  },
  {
    refNo: 14, category: 'consulting', status: 'open', documentsRequired: false,
    title: 'Advisory sessions for newly enrolled enterprises',
    titleAr: 'تقديم جلسات استشارية للمؤسسات الجديدة المنضمّة',
    orgName: 'Istedama Enterprise Programme', orgNameAr: 'برنامج استدامة مؤسستي',
    location: 'Remote', locationAr: 'عن بُعد',
    description: 'Twelve advisory sessions covering ICV improvement, Omanization planning and financial reporting.',
    descriptionAr: 'اثنتا عشرة جلسة استشارية تغطي تحسين القيمة المحلية وتخطيط التعمين وإعداد التقارير المالية.',
    closingDate: new Date('2026-09-22')
  },
  {
    refNo: 15, category: 'construction', status: 'evaluating', documentsRequired: true,
    title: 'Fit-out of a training hall in the Dhofar branch',
    titleAr: 'تجهيز قاعة تدريب في فرع ظفار',
    orgName: 'Istedama Regional Office', orgNameAr: 'المكتب الإقليمي - استدامة',
    location: 'Salalah', locationAr: 'صلالة',
    description: 'Interior fit-out for a 40-seat training hall including acoustic treatment.',
    descriptionAr: 'تجهيز داخلي لقاعة تدريب بسعة ٤٠ مقعداً يشمل المعالجة الصوتية.',
    closingDate: new Date('2026-08-30')
  },
  {
    refNo: 16, category: 'technology', status: 'open', documentsRequired: false,
    title: 'Development of an interactive enterprise mapping tool',
    titleAr: 'تطوير أداة خرائط تفاعلية للمنشآت',
    orgName: 'Istedama Digital Unit', orgNameAr: 'وحدة التحول الرقمي - استدامة',
    location: 'Muscat', locationAr: 'مسقط',
    description: 'Build an interactive map classifying enterprises across commercial zones.',
    descriptionAr: 'بناء خريطة تفاعلية لتصنيف المنشآت ضمن المناطق التجارية.',
    closingDate: new Date('2026-10-05')
  },
  {
    refNo: 17, category: 'supply', status: 'open', documentsRequired: true,
    title: 'Supply of solar panels for a agritech greenhouse project',
    titleAr: 'توريد ألواح شمسية لمشروع بيوت محمية زراعية',
    orgName: 'Nabta Green Agritech LLC', orgNameAr: 'شركة نبتة الخضراء للتقنيات الزراعية ش.م.م',
    location: 'Nizwa', locationAr: 'نزوى',
    description: 'Supply and commissioning of 320 photovoltaic panels with inverters and mounting structures.',
    descriptionAr: 'توريد وتشغيل ٣٢٠ لوحاً كهروضوئياً مع العواكس وهياكل التثبيت.',
    closingDate: daysFromNow(18)
  },
  {
    refNo: 18, category: 'consulting', status: 'open', documentsRequired: false,
    title: 'Omanization planning advisory for maritime services',
    titleAr: 'استشارات تخطيط التعمين لقطاع الخدمات البحرية',
    orgName: 'Al Bahja Marine Services SAOC', orgNameAr: 'شركة البهجة للخدمات البحرية ش.م.ع.م',
    location: 'Muscat', locationAr: 'مسقط',
    description: 'Design a three-year Omanization roadmap covering recruitment, training and retention targets.',
    descriptionAr: 'تصميم خارطة طريق للتعمين لثلاث سنوات تشمل التوظيف والتدريب وأهداف الاستبقاء.',
    closingDate: daysFromNow(26)
  },
  {
    refNo: 19, category: 'maintenance', status: 'open', documentsRequired: false,
    title: 'Annual maintenance of cold storage units',
    titleAr: 'الصيانة السنوية لوحدات التخزين المبرّد',
    orgName: 'Dhofar Frankincense Cooperative', orgNameAr: 'تعاونية ظفار للبخور واللبان',
    location: 'Salalah', locationAr: 'صلالة',
    description: 'Preventive maintenance contract covering six cold storage units and their control systems.',
    descriptionAr: 'عقد صيانة وقائية يغطي ست وحدات تخزين مبرّد وأنظمة التحكم الخاصة بها.',
    closingDate: daysFromNow(11)
  },
  {
    refNo: 20, category: 'technology', status: 'evaluating', documentsRequired: true,
    title: 'Booking and payments module for the business centre',
    titleAr: 'وحدة الحجز والمدفوعات لمركز الأعمال',
    orgName: 'Istedama Digital Office', orgNameAr: 'المكتب الرقمي لاستدامة',
    location: 'Muscat', locationAr: 'مسقط',
    description: 'Deliver an online booking and payment module integrated with the existing facilities service.',
    descriptionAr: 'تسليم وحدة حجز ودفع إلكتروني متكاملة مع خدمة المرافق الحالية.',
    closingDate: daysFromNow(5)
  },
  {
    refNo: 21, category: 'construction', status: 'open', documentsRequired: true,
    title: 'Expansion of the Sohar workshop facility',
    titleAr: 'توسعة منشأة الورشة في صحار',
    orgName: 'Batinah Solar Solutions LLC', orgNameAr: 'شركة الباطنة لحلول الطاقة الشمسية ش.م.م',
    location: 'Sohar', locationAr: 'صحار',
    description: 'Construction of an additional 600 square metre assembly bay including electrical fit-out.',
    descriptionAr: 'إنشاء صالة تجميع إضافية بمساحة ٦٠٠ متر مربع تشمل التمديدات الكهربائية.',
    closingDate: daysFromNow(33)
  },
  {
    refNo: 22, category: 'supply', status: 'closed', documentsRequired: false,
    title: 'Supply of safety equipment for adventure tourism operations',
    titleAr: 'توريد معدات السلامة لعمليات سياحة المغامرات',
    orgName: 'Musandam Adventure Tourism Est.', orgNameAr: 'مؤسسة مسندم لسياحة المغامرات',
    location: 'Khasab', locationAr: 'خصب',
    description: 'Supply of certified marine safety equipment including life jackets and emergency beacons.',
    descriptionAr: 'توريد معدات سلامة بحرية معتمدة تشمل سترات النجاة وأجهزة الاستغاثة.',
    closingDate: daysAgo(12)
  },
];

/*
 * Rates, capacities, names and descriptions are transcribed from the
 * programme's own facilities page rather than invented here: 25 / 45 / 35 / 80
 * rials an hour, for 32 / 64 / 45 / 150 people. Three of these previously
 * disagreed with that page — the training hall was listed at 18 rials for 24
 * people and the conference hall at 70 for 140 — which meant the price a
 * visitor was quoted depended on which page they happened to read.
 */
const facilities = [
  {
    name: 'Meeting Hall — First Floor', nameAr: 'قاعة الاجتماعات – الطابق الأول',
    type: 'meeting', pricePerHour: 25, capacity: 32,
    image: '/facilities/room1.jpg',
    description: 'A modern meeting room with a display screen, video-conferencing and internet.',
    descriptionAr: 'قاعة اجتماعات حديثة مجهزة بشاشة عرض ونظام اتصال مرئي وخدمة إنترنت.',
    features: ['Display screen', 'Internet', 'Whiteboard'],
    featuresAr: ['شاشة عرض', 'إنترنت', 'سبورة'],
    available: true
  },
  {
    name: 'Delegation Hall — Second Floor', nameAr: 'قاعة الوفود – الطابق الثاني',
    type: 'delegation', pricePerHour: 45, capacity: 64,
    image: '/facilities/room2.jpg',
    description: 'For official meetings and receiving delegations, with full presentation equipment.',
    descriptionAr: 'قاعة مخصصة للاجتماعات الرسمية واستقبال الوفود مع تجهيزات عرض متكاملة.',
    features: ['Main screen', 'Sound system', 'Translation booth'],
    featuresAr: ['شاشة رئيسية', 'نظام صوتي', 'كابينة ترجمة'],
    available: true
  },
  {
    name: 'Training and Qualification Hall', nameAr: 'قاعة التدريب والتأهيل',
    type: 'training', pricePerHour: 35, capacity: 45,
    image: '/facilities/room3.jpg',
    description: 'Suited to courses and workshops, with seating, tables and projection equipment.',
    descriptionAr: 'قاعة مناسبة للدورات وورش العمل، مجهزة بالمقاعد والطاولات وأجهزة العرض.',
    features: ['Projector', 'Internet', 'Training layout'],
    featuresAr: ['جهاز عرض', 'إنترنت', 'تجهيز تدريبي'],
    available: true
  },
  {
    name: 'Grand Conference Hall', nameAr: 'قاعة المؤتمرات الكبرى',
    type: 'conference', pricePerHour: 80, capacity: 150,
    image: '/facilities/room4.jpg',
    description: 'A large hall for conferences, seminars and official or commercial events.',
    descriptionAr: 'قاعة واسعة لإقامة المؤتمرات والندوات والفعاليات الرسمية والتجارية.',
    features: ['Stage', 'Sound system', 'Main screen'],
    featuresAr: ['منصة', 'نظام صوتي', 'شاشة رئيسية'],
    available: true
  },
  {
    name: 'Business Centre Workspace', nameAr: 'مساحة عمل مركز الأعمال',
    type: 'business_centre', pricePerHour: 8, capacity: 12,
    description: 'Shared workspace for enterprise teams, bookable by the hour.',
    descriptionAr: 'مساحة عمل مشتركة لفرق المؤسسات، يمكن حجزها بالساعة.',
    features: ['Internet', 'Printing', 'Refreshments'],
    featuresAr: ['إنترنت', 'طباعة', 'ضيافة'],
    available: false
  }
];

const discounts = [
  {
    partnerName: 'Bank Muscat', partnerNameAr: 'بنك مسقط', category: 'financial', percentage: 20,
    description: 'Discount on administrative fees for enterprise accounts.',
    descriptionAr: 'خصم على الرسوم الإدارية لحسابات المؤسسات.', code: 'IST-BM20'
  },
  {
    partnerName: 'Badr Hospital', partnerNameAr: 'مستشفى بدر', category: 'health', percentage: 30,
    description: 'Discount on medical check-ups for enterprise staff.',
    descriptionAr: 'خصم على الفحوصات الطبية لموظفي المؤسسات.', code: 'IST-BDR30'
  },
  {
    partnerName: 'Al Muhami Law Office', partnerNameAr: 'مكتب المحامي للاستشارات', category: 'legal', percentage: 15,
    description: 'Discount on legal consultations and contract drafting.',
    descriptionAr: 'خصم على الاستشارات القانونية وصياغة العقود.', code: 'IST-LAW15'
  },
  {
    partnerName: 'Bedots Technologies', partnerNameAr: 'بيدوتس للتقنية', category: 'technology', percentage: 30,
    description: 'Discount on website and digital platform development.',
    descriptionAr: 'خصم على تطوير المواقع والمنصات الرقمية.', code: 'IST-BDT30'
  },
  {
    partnerName: 'Oman Insurance Services', partnerNameAr: 'الخدمات العُمانية للتأمين', category: 'insurance', percentage: 18,
    description: 'Discount on commercial and staff insurance policies.',
    descriptionAr: 'خصم على وثائق التأمين التجاري وتأمين الموظفين.', code: 'IST-INS18'
  },
  {
    partnerName: 'Sohar International', partnerNameAr: 'صحار الدولي', category: 'financial', percentage: 25,
    description: 'Preferential rates on SME financing products.',
    descriptionAr: 'أسعار تفضيلية على منتجات تمويل المؤسسات الصغيرة والمتوسطة.', code: 'IST-SI25'
  }
];

const news = [
  {
    tag: 'launch', publishedAt: new Date('2026-07-15'), image: '/news/news_6.png',
    title: 'Istedama launches the Business Centre and free investment membership card',
    titleAr: 'استدامة تُطلق مركز الأعمال وبطاقة العضوية الاستثمارية المجانية',
    excerpt: 'The programme opens a shared business centre and introduces a membership card granting access to partner discounts.',
    excerptAr: 'يفتتح البرنامج مركز أعمال مشتركاً ويطرح بطاقة عضوية تتيح الوصول إلى خصومات الشركاء.'
  },
  {
    tag: 'service', publishedAt: new Date('2026-07-08'), image: '/news/news_5.png',
    title: 'A new smart model for advance investor verification cuts procedures to minutes',
    titleAr: 'نموذج ذكي جديد للتحقق المسبق من المستثمر يختصر الإجراءات إلى دقائق',
    excerpt: 'Verification that previously took several working days now completes within the platform in minutes.',
    excerptAr: 'التحقق الذي كان يستغرق أياماً عمل عدة صار يكتمل داخل المنصة خلال دقائق.'
  },
  {
    tag: 'announcement', publishedAt: new Date('2026-06-29'), image: '/news/news_1.png',
    title: 'Launch of the interactive map classifying enterprises within vital commercial zones',
    titleAr: 'إطلاق الخريطة التفاعلية لتصنيف المنشآت ضمن المناطق التجارية الحيوية',
    excerpt: 'Enterprises can now locate themselves within designated commercial zones and view nearby partners.',
    excerptAr: 'تستطيع المؤسسات الآن تحديد موقعها ضمن المناطق التجارية المعتمدة واستعراض الشركاء القريبين.'
  },
  {
    tag: 'partnership', publishedAt: new Date('2026-06-11'),
    title: 'Two banking partners join the programme with preferential financing terms',
    titleAr: 'انضمام شريكين مصرفيين إلى البرنامج بشروط تمويل تفضيلية',
    excerpt: 'Certified enterprises gain access to working-capital facilities at reduced administrative rates.',
    excerptAr: 'تحصل المؤسسات المعتمدة على تسهيلات رأس مال عامل برسوم إدارية مخفّضة.'
  },
  {
    tag: 'announcement', publishedAt: new Date('2026-05-24'),
    title: 'First cohort of certified enterprises receives sustainability certificates',
    titleAr: 'الدفعة الأولى من المؤسسات المعتمدة تتسلّم شهادات الاستدامة',
    excerpt: 'Enterprises crossing the seventy-point threshold were recognised at a ceremony held in Muscat.',
    excerptAr: 'كُرِّمت المؤسسات التي تجاوزت عتبة السبعين درجة في حفل أقيم بمسقط.'
  },
  {
    tag: 'service', publishedAt: new Date('2026-05-02'),
    title: 'Advisory sessions open for enterprises below the certification threshold',
    titleAr: 'فتح الجلسات الاستشارية للمؤسسات دون عتبة الاعتماد',
    excerpt: 'Enterprises scoring under seventy can book structured sessions targeting their weakest indicator.',
    excerptAr: 'يمكن للمؤسسات الحاصلة على أقل من سبعين درجة حجز جلسات منظّمة تستهدف أضعف مؤشراتها.'
  }
];

async function seedContent() {
  await Promise.all([
    Tender.deleteMany(),
    Facility.deleteMany(),
    Discount.deleteMany(),
    NewsPost.deleteMany()
  ]);

  await Tender.insertMany(tenders);
  await Facility.insertMany(facilities);
  await Discount.insertMany(discounts);
  await NewsPost.insertMany(news);

  console.log(`[seed] content -> ${tenders.length} tenders, ${facilities.length} facilities, ${discounts.length} discounts, ${news.length} news posts`);
}

module.exports = { seedContent, tenders, facilities, discounts, news };
