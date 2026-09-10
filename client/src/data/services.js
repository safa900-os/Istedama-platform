/**
 * The full service catalogue.
 *
 * Nine categories drawn from the programme's services document. Each entry
 * carries a `status` so the interface is honest about what is actually wired
 * up versus what is announced but not yet built:
 *
 *   live    — the service works today and `to` points at the working route
 *   soon    — planned; the card is shown but not clickable
 *
 * Keeping this in data rather than markup means the Services page, the home
 * page summary and the search index all read from one source.
 */
export const SERVICE_CATEGORIES = [
  {
    id: 'membership',
    icon: 'BadgeCheck',
    accent: 'navy',
    title: { en: 'Membership & investor verification', ar: 'العضوية والمستثمر' },
    blurb: {
      en: 'Registration, membership and verification services.',
      ar: 'خدمات التسجيل والعضوية والتحقق.'
    },
    items: [
      {
        id: 'digital-card', status: 'soon',
        title: { en: 'Digital membership card', ar: 'بطاقة العضوية الرقمية' },
        body: { en: 'Issue and manage the enterprise membership card.', ar: 'إصدار وإدارة بطاقة العضوية الخاصة بالمنشأة.' }
      },
      {
        id: 'verification', status: 'live', to: '/register',
        title: { en: 'Investor & enterprise verification', ar: 'التحقق من المستثمر والمنشأة' },
        body: { en: 'Verify enterprise and investor data to raise trust.', ar: 'التحقق من بيانات المؤسسة والمستثمر لرفع الموثوقية.' }
      },
      {
        id: 'profile', status: 'live', to: '/dashboard',
        title: { en: 'Enterprise profile', ar: 'الملف المؤسسي' },
        body: { en: 'Update core details and official documents.', ar: 'تحديث البيانات الأساسية للمؤسسة ووثائقها الرسمية.' }
      },
      {
        id: 'renewal', status: 'soon',
        title: { en: 'Membership renewal', ar: 'تجديد العضوية' },
        body: { en: 'Track validity and renew electronically.', ar: 'متابعة صلاحية العضوية وتجديدها إلكترونياً.' }
      }
    ]
  },
  {
    id: 'certificates',
    icon: 'FileCheck2',
    accent: 'sky',
    title: { en: 'Certificates & attestations', ar: 'الشهادات والتصاريح' },
    blurb: {
      en: 'Issuing and attesting commercial documents electronically.',
      ar: 'إصدار واعتماد المستندات التجارية إلكترونياً.'
    },
    items: [
      {
        id: 'issue', status: 'live', to: '/companies',
        title: { en: 'Certificate issuance', ar: 'إصدار الشهادات' },
        body: { en: 'Official member certificates issued digitally.', ar: 'إصدار الشهادات الرسمية الخاصة بالأعضاء رقمياً.' }
      },
      {
        id: 'attest', status: 'soon',
        title: { en: 'Document attestation', ar: 'التصديق على المستندات' },
        body: { en: 'Certify commercial and official enterprise documents.', ar: 'اعتماد وتصديق الوثائق التجارية والرسمية للمنشأة.' }
      },
      {
        id: 'verify-doc', status: 'live', to: '/companies',
        title: { en: 'Document verification', ar: 'التحقق من صحة الوثائق' },
        body: { en: 'Confirm a certificate serial is genuine.', ar: 'التأكد من صحة وموثوقية الشهادات والمستندات الصادرة.' }
      },
      {
        id: 'e-copy', status: 'soon',
        title: { en: 'Electronic copies', ar: 'النسخة الإلكترونية' },
        body: { en: 'Download certified electronic copies.', ar: 'تحميل نسخ إلكترونية معتمدة من الشهادات.' }
      }
    ]
  },
  {
    id: 'facilities',
    icon: 'CalendarCheck',
    accent: 'gold',
    title: { en: 'Facilities & bookings', ar: 'المرافق والحجوزات' },
    blurb: { en: 'Booking halls and business spaces.', ar: 'إدارة حجز القاعات والمرافق.' },
    items: [
      {
        id: 'halls', status: 'live', to: '/facilities',
        title: { en: 'Hall booking', ar: 'حجز القاعات' },
        body: { en: 'Choose and book a hall electronically.', ar: 'اختيار القاعة المناسبة وحجزها إلكترونياً.' }
      },
      {
        id: 'meeting', status: 'live', to: '/facilities',
        title: { en: 'Meeting & training rooms', ar: 'قاعات الاجتماعات والتدريب' },
        body: { en: 'Spaces for executive meetings and workshops.', ar: 'مساحات للاجتماعات التنفيذية والدورات وورش العمل.' }
      },
      {
        id: 'conference', status: 'live', to: '/facilities',
        title: { en: 'Conference & event halls', ar: 'قاعات المؤتمرات والفعاليات' },
        body: { en: 'Large equipped spaces for conferences.', ar: 'مساحات واسعة مجهزة لاستضافة المؤتمرات والملتقيات.' }
      },
      {
        id: 'business-centre', status: 'live', to: '/facilities',
        title: { en: 'Business centre', ar: 'مركز الأعمال' },
        body: { en: 'Co-working space and office services.', ar: 'حجز مساحات العمل المشتركة والخدمات المكتبية.' }
      },
      {
        id: 'manage-bookings', status: 'live', to: '/dashboard',
        title: { en: 'Booking management', ar: 'إدارة الحجوزات' },
        body: { en: 'Track, amend or cancel a booking.', ar: 'متابعة حالة الحجز والتعديل والإلغاء.' }
      }
    ]
  },
  {
    id: 'opportunities',
    icon: 'Briefcase',
    accent: 'navy',
    title: { en: 'Business & opportunities', ar: 'الأعمال والفرص' },
    blurb: { en: 'Tenders, investment and partnerships.', ar: 'المناقصات والاستثمار والشراكات.' },
    items: [
      {
        id: 'tenders', status: 'live', to: '/tenders',
        title: { en: 'Tenders & procurement', ar: 'المناقصات والمشتريات' },
        body: { en: 'Browse the latest opportunities and apply.', ar: 'استعراض أحدث الفرص والمناقصات المطروحة.' }
      },
      {
        id: 'investment', status: 'live', to: '/tenders',
        title: { en: 'Investment opportunities', ar: 'الفرص الاستثمارية' },
        body: { en: 'Projects and opportunities open for growth.', ar: 'عرض مشاريع وفرص استثمارية متاحة للتوسع والنمو.' }
      },
      {
        id: 'b2b', status: 'soon',
        title: { en: 'B2B networking', ar: 'التشبيك التجاري' },
        body: { en: 'Connect enterprises with partners and investors.', ar: 'ربط المؤسسات بالشركاء والمستثمرين لبناء شراكات جديدة.' }
      },
      {
        id: 'investment-readiness', status: 'soon',
        title: { en: 'Investment readiness index', ar: 'مؤشر الجاهزية للاستثمار' },
        body: {
          en: 'An automated readiness score drawn from financial data and legal compliance.',
          ar: 'تقييم آلي للجاهزية بناءً على البيانات المالية والامتثال القانوني.'
        }
      },
      {
        id: 'icv', status: 'live', to: '/about',
        title: { en: 'In-Country Value (ICV)', ar: 'القيمة المحلية المضافة' },
        body: { en: 'Opportunities and contracts supporting local content.', ar: 'استعراض الفرص والعقود التي تدعم المحتوى المحلي.' }
      }
    ]
  },
  {
    id: 'knowledge',
    icon: 'GraduationCap',
    accent: 'sky',
    title: { en: 'Knowledge & development', ar: 'المعرفة والتطوير' },
    blurb: { en: 'Reports, advisory and training.', ar: 'التقارير والاستشارات والتدريب.' },
    items: [
      {
        id: 'knowledge-hub', status: 'soon',
        title: { en: 'Knowledge centre', ar: 'مركز المعرفة' },
        body: { en: 'Reports, guides and economic indicators.', ar: 'تقارير وأدلة ومؤشرات اقتصادية لدعم اتخاذ القرار.' }
      },
      {
        id: 'training', status: 'soon',
        title: { en: 'Training & qualification', ar: 'التدريب والتأهيل' },
        body: { en: 'Workshops and courses for enterprise staff.', ar: 'ورش ودورات تدريبية لتطوير مهارات كوادر المؤسسة.' }
      },
      {
        id: 'advisory', status: 'soon',
        title: { en: 'Specialist advisory', ar: 'الاستشارات التخصصية' },
        body: { en: 'Legal, financial and marketing support.', ar: 'دعم استشاري في المجالات القانونية والمالية والتسويقية.' }
      },
      {
        id: 'reports', status: 'live', to: '/dashboard',
        title: { en: 'Reports & indicators', ar: 'التقارير والمؤشرات' },
        body: { en: 'Track performance through visual analytics.', ar: 'متابعة أداء المؤسسة واتجاهات السوق عبر تحليلات بيانية.' }
      }
    ]
  },
  {
    id: 'financial',
    icon: 'Wallet',
    accent: 'gold',
    title: { en: 'Financial & export solutions', ar: 'التسهيلات المالية والتصديرية' },
    blurb: { en: 'Discounts, conformity, export finance.', ar: 'المزايا والخصومات وشهادات المطابقة وتمويل الصادرات.' },
    items: [
      {
        id: 'discounts', status: 'live', to: '/discounts',
        title: { en: 'Exclusive benefits marketplace', ar: 'سوق المزايا والخصومات الحصرية' },
        body: { en: 'Operational discounts in shipping, insurance, software and telecoms.', ar: 'باقات تخفيضية حصرية في الشحن والتأمين والبرمجيات والاتصالات.' }
      },
      {
        id: 'conformity', status: 'soon',
        title: { en: 'Product testing & conformity', ar: 'فحص المنتجات وشهادات المطابقة' },
        body: { en: 'Links to standards bodies and laboratories.', ar: 'الربط مع هيئات المعايير والمختبرات لتسهيل فحص وتصديق المنتجات.' }
      },
      {
        id: 'financial-planning', status: 'soon',
        title: { en: 'Financial planning & business intelligence', ar: 'التخطيط المالي وذكاء الأعمال' },
        body: {
          en: 'Interactive cash-flow calculator, burn-rate tracking and B2B invoicing.',
          ar: 'حاسبة تدفقات نقدية تفاعلية، وتتبّع معدل الحرق، وإدارة الفواتير بين المؤسسات.'
        }
      },
      {
        id: 'export-finance', status: 'soon',
        title: { en: 'Export finance & insurance', ar: 'تمويل وتأمين الصادرات' },
        body: { en: 'Credit risk cover and export-directed finance.', ar: 'حلول تغطية المخاطر الائتمانية والتمويل الموجه للتصدير.' }
      },
      {
        id: 'international', status: 'soon',
        title: { en: 'International expansion support', ar: 'دعم التوسع الدولي' },
        body: { en: 'Customs guidance and links to trade networks abroad.', ar: 'أدوات لفهم اللوائح الجمركية والربط مع شبكات تجارية خارجية.' }
      }
    ]
  },
  {
    id: 'legal',
    icon: 'Scale',
    accent: 'navy',
    title: { en: 'Legal, compliance & protection', ar: 'الحلول القانونية والامتثال' },
    blurb: { en: 'Contracts, compliance and dispute resolution.', ar: 'العقود والامتثال وحل النزاعات.' },
    items: [
      {
        id: 'contract-builder', status: 'soon',
        title: { en: 'Smart contract builder', ar: 'منشئ العقود والاتفاقيات الذكي' },
        body: { en: 'Customisable digital templates for supply and partnership agreements.', ar: 'مكتبة نماذج قانونية رقمية قابلة للتخصيص للتوريد والشراكات.' }
      },
      {
        id: 'compliance-index', status: 'soon',
        title: { en: 'Compliance readiness index', ar: 'مؤشر الامتثال والجاهزية التنظيمية' },
        body: { en: 'Self-assessment against legal and labour requirements.', ar: 'أداة تقييم ذاتي لقياس الالتزام بالاشتراطات القانونية وقوانين العمل.' }
      },
      {
        id: 'mediation', status: 'soon',
        title: { en: 'Mediation & dispute resolution', ar: 'الوساطة وحل النزاعات' },
        body: { en: 'Amicable settlement before litigation.', ar: 'آلية سريعة لتسوية النزاعات التجارية قبل اللجوء للتقاضي.' }
      }
    ]
  },
  {
    id: 'digital',
    icon: 'Cpu',
    accent: 'sky',
    title: { en: 'Digital transformation', ar: 'التحول الرقمي والتقنيات الحديثة' },
    blurb: { en: 'AI advisory, cyber security, franchising.', ar: 'مستشار الذكاء الاصطناعي والأمن السيبراني والامتياز التجاري.' },
    items: [
      {
        id: 'ai-advisor', status: 'live', to: '/',
        title: { en: 'AI business advisor', ar: 'مستشار الذكاء الاصطناعي لتطوير الأعمال' },
        body: { en: 'Interactive assistant for plans, offers and proposals.', ar: 'أداة تفاعلية لتحليل خطط الأعمال وإعداد المقترحات التجارية.' }
      },
      {
        id: 'cyber', status: 'soon',
        title: { en: 'Cyber security packages', ar: 'باقات الأمن السيبراني' },
        body: { en: 'Data and device protection for small enterprises.', ar: 'باقات حماية البيانات والأجهزة للشركات الصغرى.' }
      },
      {
        id: 'franchise', status: 'soon',
        title: { en: 'Franchise hub', ar: 'منصة الامتياز التجاري' },
        body: { en: 'Local brands available for franchising.', ar: 'عرض العلامات التجارية المحلية المتاحة للامتياز.' }
      }
    ]
  },
  {
    id: 'talent',
    icon: 'Users',
    accent: 'gold',
    title: { en: 'Talent & human capital', ar: 'إدارة الكوادر ورأس المال البشري' },
    blurb: { en: 'Connecting enterprises with talent.', ar: 'ربط المؤسسات بالكفاءات.' },
    items: [
      {
        id: 'jobs', status: 'soon',
        title: { en: 'Jobs & training platform', ar: 'منصة فرص التوظيف والتدريب' },
        body: { en: 'Connect small enterprises with jobseekers and trainees.', ar: 'ربط المؤسسات الصغيرة بالكفاءات والباحثين عن عمل.' }
      }
    ]
  }
];

/** Flattened list, handy for counting and searching. */
export const ALL_SERVICES = SERVICE_CATEGORIES.flatMap((c) =>
  c.items.map((i) => ({ ...i, categoryId: c.id }))
);

export const SERVICE_COUNTS = {
  total: ALL_SERVICES.length,
  live: ALL_SERVICES.filter((s) => s.status === 'live').length,
  soon: ALL_SERVICES.filter((s) => s.status === 'soon').length
};
