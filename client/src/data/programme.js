/**
 * Programme content that appears on more than one page.
 *
 * These three blocks come from the printed programme material: the chairman's
 * message, the four benefits of "استدامة مؤسستي", and the GCC chamber network.
 * They are content, not layout, so they live here rather than inside the
 * components that render them — the same benefit list is referenced from both
 * the About page and the home page summary.
 */

/**
 * The chairman's message.
 *
 * `portrait` points at a file the site owner supplies. It is intentionally not
 * a bundled asset: an official portrait is the organisation's to provide, and
 * shipping a stand-in that looks like a real person would be worse than an
 * honest empty frame. The component falls back to the wordmark when the file
 * is absent, so the section never renders a broken image.
 */
export const CHAIRMAN = {
  portrait: '/chairman.jpg',
  name: {
    ar: 'سعادة الشيخ فيصل بن عبدالله الرواس',
    en: 'H.E. Sheikh Faisal bin Abdullah Al Rawas'
  },
  role: {
    ar: 'رئيس مجلس إدارة غرفة تجارة وصناعة عُمان',
    en: 'Chairman, Oman Chamber of Commerce & Industry'
  },
  body: {
    ar: 'سعت غرفة تجارة وصناعة عُمان على تنمية المؤسسات الصغيرة والمتوسطة من خلال خلق بيئة محفّزة وجاذبة، تأكيداً لرؤية عُمان 2040، وبالتعاون مع الشركاء في القطاعين العام والخاص لإسهامهم في النمو الاقتصادي المستدام.',
    en: 'The Oman Chamber of Commerce & Industry has worked to grow the small and medium enterprise sector by creating a supportive, attractive environment — in line with Oman Vision 2040, and in partnership with public and private sector partners contributing to sustainable economic growth.'
  }
};

/**
 * Benefits of the "استدامة مؤسستي" programme.
 *
 * Numbered because the source material numbers them; the order carries no
 * ranking. Each `icon` is a lucide-react export name, resolved by the
 * component — storing the component itself here would tie this data file to
 * the rendering library.
 */
export const PROGRAMME_BENEFITS = [
  {
    id: 'profitability',
    number: '01',
    icon: 'HandCoins',
    title: { ar: 'تحقيق الربحية المستدامة', en: 'Sustainable profitability' },
    body: {
      ar: 'تطوير مشاريع وأعمال وشراكات تسهم في تعزيز دخل المؤسسة بشكل مستمر عبر شركاء البرنامج، مع الاستفادة من التخفيضات والحوافز التي تقدمها الجهات الحكومية والخاصة.',
      en: 'Projects and partnerships that raise enterprise income on an ongoing basis through programme partners, alongside the discounts and incentives offered by public and private bodies.'
    }
  },
  {
    id: 'adaptability',
    number: '02',
    icon: 'Split',
    title: { ar: 'التكيف مع تقلبات السوق', en: 'Adapting to market shifts' },
    body: {
      ar: 'القدرة على مواكبة التغيّرات والتقلبات في السوق من خلال توفير استشارات وخدمات قانونية ومحاسبية وتقنية وإعلامية وتسويقية يقدمها شركاء البرنامج.',
      en: 'Keeping pace with market change through legal, accounting, technical, media and marketing advice supplied by programme partners.'
    }
  },
  {
    id: 'local-value',
    number: '03',
    icon: 'Handshake',
    title: { ar: 'تعزيز القيمة المحلية المضافة', en: 'Raising in-country value' },
    body: {
      ar: 'تقديم منتجات وخدمات تلبي احتياجات المجتمع المحلي وتسهم في تطويره، بما يعزز مكانة المؤسسة في السوق المحلي عبر شراكات مع المؤسسات القائمة أو شركات جديدة.',
      en: 'Products and services that meet local needs and strengthen the enterprise’s standing in the domestic market, through partnerships with established or newly formed companies.'
    }
  },
  {
    id: 'network',
    number: '04',
    icon: 'Network',
    title: { ar: 'التوسع وبناء العلاقات', en: 'Growth and relationships' },
    body: {
      ar: 'ضمان توسيع قاعدة العملاء وتعزيز العلاقات المحلية، بما يساعد على بناء شبكة قوية تسهم في استمرارية المؤسسة عبر الشركاء الإعلاميين والتسويقيين المرتبطين بالبرنامج محلياً وخارجياً.',
      en: 'A wider customer base and stronger local relationships, building a network that supports continuity through the programme’s media and marketing partners at home and abroad.'
    }
  }
];

/**
 * Steps to obtain the Istedama certificate.
 *
 * Six stages, from signing in with a one-time code through to issuance.
 */
export const CERTIFICATE_STEPS = [
  { id: 'otp', number: '01', icon: 'KeyRound', label: { ar: 'الدخول باستخدام OTP', en: 'Sign in with OTP' } },
  { id: 'retrieve', number: '02', icon: 'Info', label: { ar: 'استرجاع المعلومات', en: 'Retrieve your data' } },
  { id: 'profile', number: '03', icon: 'FileSearch', label: { ar: 'تحديث الملف الشخصي', en: 'Update the profile' } },
  { id: 'visits', number: '04', icon: 'Users', label: { ar: 'الزيارات', en: 'Assessment visits' } },
  { id: 'approval', number: '05', icon: 'FileCheck2', label: { ar: 'الحصول على الموافقة', en: 'Approval' } },
  { id: 'issue', number: '06', icon: 'Award', label: { ar: 'إصدار الشهادة', en: 'Certificate issued' } }
];

/**
 * Chambers of commerce across the GCC.
 *
 * `lat`/`lng` are the chamber headquarters, projected onto the peninsula map
 * the same way the Oman partner map projects its pins. `flag` is the ISO 3166
 * alpha-2 code, rendered as a regional-indicator emoji pair rather than six
 * separate flag images.
 */
export const GCC_CHAMBERS = [
  {
    id: 'oman',
    code: 'OM',
    lat: 23.588,
    lng: 58.383,
    country: { ar: 'عُمان', en: 'Oman' },
    chamber: { ar: 'غرفة تجارة وصناعة عُمان', en: 'Oman Chamber of Commerce & Industry' },
    url: 'https://chamberoman.om',
    home: true
  },
  {
    id: 'saudi',
    code: 'SA',
    lat: 24.7136,
    lng: 46.6753,
    country: { ar: 'السعودية', en: 'Saudi Arabia' },
    chamber: { ar: 'اتحاد الغرف السعودية', en: 'Federation of Saudi Chambers' },
    url: 'https://www.fsc.org.sa'
  },
  {
    id: 'uae',
    code: 'AE',
    lat: 25.2048,
    lng: 55.2708,
    country: { ar: 'الإمارات', en: 'United Arab Emirates' },
    chamber: { ar: 'اتحاد غرف الإمارات', en: 'UAE Chambers Federation' },
    url: 'https://www.uaechambers.ae'
  },
  {
    id: 'qatar',
    code: 'QA',
    lat: 25.2854,
    lng: 51.531,
    country: { ar: 'قطر', en: 'Qatar' },
    chamber: { ar: 'غرفة قطر', en: 'Qatar Chamber' },
    url: 'https://www.qatarchamber.com'
  },
  {
    id: 'bahrain',
    code: 'BH',
    lat: 26.2285,
    lng: 50.586,
    country: { ar: 'البحرين', en: 'Bahrain' },
    chamber: { ar: 'غرفة تجارة وصناعة البحرين', en: 'Bahrain Chamber of Commerce & Industry' },
    url: 'https://www.bcci.bh'
  },
  {
    id: 'kuwait',
    code: 'KW',
    lat: 29.3759,
    lng: 47.9774,
    country: { ar: 'الكويت', en: 'Kuwait' },
    chamber: { ar: 'غرفة تجارة وصناعة الكويت', en: 'Kuwait Chamber of Commerce & Industry' },
    url: 'https://www.kuwaitchamber.org.kw'
  }
];

/* ------------------------------------------------------------------ 2040 */

/**
 * The Oman Vision 2040 block.
 *
 * IMPORTANT: every figure below is transcribed from the programme's own
 * printed material. They are published claims, not live measurements — the
 * platform's real counts come from `/api/companies/stats/overview`, and where
 * a figure here overlaps with one the API can answer, the API wins. They are
 * kept together and labelled so nobody mistakes them for computed values.
 */
export const VISION_2040 = {
  pillars: [
    {
      id: 'procurement',
      icon: 'Boxes',
      title: { ar: 'منظومة مشتريات شاملة', en: 'An inclusive procurement system' },
      body: {
        ar: 'نماذج تعاقد مستقبلية تربط المشترين الكبار بالمؤسسات المعتمدة لضمان تدفق الطلب والدخل المتوقع.',
        en: 'Forward contracting models linking major buyers to certified enterprises, so demand and expected income are predictable.'
      }
    },
    {
      id: 'accelerators',
      icon: 'Rocket',
      title: { ar: 'مسرعات المعرفة', en: 'Knowledge accelerators' },
      body: {
        ar: 'فرق استشارية قانونية ومالية ورقمية وتسويقية تسد فجوات القدرات خلال أسابيع بدلاً من أشهر.',
        en: 'Legal, financial, digital and marketing advisory teams closing capability gaps in weeks rather than months.'
      }
    },
    {
      id: 'icv-incentives',
      icon: 'Recycle',
      title: { ar: 'حوافز القيمة المحلية', en: 'In-country value incentives' },
      body: {
        ar: 'مكافآت للحلول الدائرية التي ترفع الأثر المجتمعي وتدعم أهداف التنويع الوطني.',
        en: 'Rewards for circular solutions that raise community impact and support national diversification goals.'
      }
    }
  ],

  /** Programme readiness indicators, as published. */
  meters: [
    { id: 'labs', value: 15, label: { ar: 'مختبرات جاهزية المؤسسات', en: 'Enterprise readiness labs' } },
    { id: 'partnerships', value: 65, label: { ar: 'الشراكات التأثيرية المفعلة', en: 'Active impact partnerships' } },
    { id: 'digital', value: 12, label: { ar: 'تغطية الخدمات الرقمية', en: 'Digital service coverage' } }
  ],

  /** 2025 priorities. */
  priorities: {
    uplift: 32,
    items: [
      { ar: 'أتمتة نقاط الاعتماد', en: 'Automated accreditation checkpoints' },
      { ar: 'لوحات استخدام فورية للشركاء', en: 'Real-time partner usage dashboards' },
      { ar: 'حوافز للمناقصين الملتزمين', en: 'Incentives for compliant bidders' }
    ]
  },


  /** How an enterprise moves through the programme. */
  track: [
    {
      number: 1,
      label: {
        ar: 'استقطاب المؤسسات عبر مختبرات الجاهزية',
        en: 'Enterprises recruited through readiness labs'
      }
    },
    {
      number: 2,
      label: {
        ar: 'تصميم عقود مستدامة بالشراكة مع الجهات',
        en: 'Sustainable contracts designed with partner bodies'
      }
    },
    {
      number: 3,
      label: {
        ar: 'مراقبة النتائج وإعادة تدوير الدروس',
        en: 'Outcomes monitored and lessons fed back'
      }
    }
  ]
};

/**
 * Site audience figures.
 *
 * These are analytics numbers taken from the programme's design material, not
 * a live feed — this app has no analytics integration. They are marked as a
 * reporting period so the page never implies they update on their own; wire
 * them to a real provider before treating them as current.
 */
export const VISITOR_STATS = [
  {
    id: 'visitors',
    icon: 'Users',
    value: 15000,
    format: 'number',
    label: { ar: 'إجمالي الزوار', en: 'Total visitors' },
    note: { ar: 'جميع الزوار', en: 'All visitors' }
  },
  {
    id: 'duration',
    icon: 'Clock',
    value: 3.5,
    format: 'minutes',
    label: { ar: 'متوسط مدة الجلسة', en: 'Average session' },
    note: { ar: 'متوسط الوقت على الموقع', en: 'Average time on site' }
  },
  {
    id: 'bounce',
    icon: 'TrendingUp',
    value: 42,
    format: 'percent',
    label: { ar: 'معدل الارتداد', en: 'Bounce rate' },
    note: { ar: 'جلسات صفحة واحدة', en: 'Single-page sessions' }
  }
];

/**
 * The certified-enterprises call to action.
 *
 * `photo` is supplied by the site owner, like the chairman portrait. The
 * component falls back to a drawn panel rather than a broken image.
 */
export const CERTIFIED_DIRECTORY = {
  photo: '/certified-meeting.jpg',
  to: '/companies'
};

/**
 * Turns an ISO 3166 alpha-2 code into its flag emoji.
 *
 * Each letter maps to a regional indicator symbol 127397 code points above the
 * ASCII capital. Six flags cost nothing this way; six PNGs would be six
 * requests and would not scale with the text around them.
 */
export const flagFor = (code) =>
  String.fromCodePoint(...[...code.toUpperCase()].map((c) => 127397 + c.charCodeAt(0)));
