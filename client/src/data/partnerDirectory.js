/**
 * The published partner roster.
 *
 * Every name, category, mark and contact detail here is transcribed from the
 * programme's own partner listing — not invented, and not regrouped into
 * categories of our own. Where the programme publishes a firm's telephone and
 * governorate they are carried across, so the detail panel has something real
 * to say; where it publishes nothing further, the entry stays a name and a mark.
 *
 * Two things worth knowing before editing:
 *
 * 1. The programme labels its money-exchange group «الشريك المصرفي» (banking)
 *    while its banks sit under «الشركاء الماليون» (financial). Both labels are
 *    reproduced as published rather than corrected: the roster is the
 *    programme's statement about itself, not ours.
 *
 * 2. The roster tile the programme ships for هارون المقيبلي is a blank white
 *    JPEG — one colour, 150×150. The mark used here is the one from that firm's
 *    own detail panel on the same site.
 *
 * Marks live in `public/partners/`, downscaled to 640px — larger than any tile
 * ever renders — so a 2000px bank logo does not ship for a 96px slot.
 */

export const PARTNER_CATEGORIES = [
  {
    id: 'hessati',
    icon: '/partners/cat-hessati.png',
    glyph: 'Handshake',
    name: { ar: 'منصة حصتي للاستثمار الاجتماعي', en: 'Hessati Social Investment Platform' },
    blurb: {
      ar: 'قناة الاستثمار الاجتماعي التي تربط المؤسسات الصغيرة والمتوسطة بمصادر التمويل المجتمعي.',
      en: 'The social-investment channel connecting small and medium enterprises to community funding.'
    },
    members: [
      {
        id: 'hessati',
        logo: '/partners/hessati.jpg',
        name: { ar: 'منصة حصتي للاستثمار الاجتماعي', en: 'Hessati Social Investment Platform' }
      }
    ]
  },

  {
    id: 'legal',
    icon: '/partners/cat-legal.png',
    glyph: 'Scale',
    name: { ar: 'الشريك القانوني', en: 'Legal partners' },
    blurb: {
      ar: 'مكاتب محاماة واستشارات قانونية تخدم المؤسسات المسجّلة في العقود والنزاعات والامتثال.',
      en: 'Law firms and legal consultancies serving registered enterprises on contracts, disputes and compliance.'
    },
    members: [
      {
        id: 'mafarji',
        logo: '/partners/legal-mafarji.jpg',
        name: {
          ar: 'الدكتور أحمد المفرجي للمحاماة والاستشارات القانونية',
          en: 'Dr Ahmed Al Mafarji — Advocacy and Legal Consultancy'
        },
        phone: '99221909',
        address: { ar: 'محافظة مسقط – ولاية السيب – الموالح', en: 'Muscat Governorate – Seeb – Mawaleh' }
      },
      {
        id: 'kaasbi',
        logo: '/partners/legal-kaasbi.jpg',
        name: {
          ar: 'سعيد الكاسبي للمحاماة والاستشارات القانونية',
          en: 'Said Al Kaasbi — Advocacy and Legal Consultancy'
        },
        phone: '94777505',
        address: { ar: 'محافظة مسقط – ولاية بوشر – الخوير', en: 'Muscat Governorate – Bawshar – Al Khuwair' }
      },
      {
        id: 'maslahi',
        logo: '/partners/legal-maslahi.jpg',
        name: {
          ar: 'إبراهيم المصلحي للمحاماة والاستشارات القانونية',
          en: 'Ibrahim Al Maslahi — Advocacy and Legal Consultancy'
        },
        phone: '99310224',
        address: { ar: 'محافظة مسقط – ولاية بوشر – غلا', en: 'Muscat Governorate – Bawshar – Ghala' }
      },
      {
        id: 'siyabi',
        logo: '/partners/legal-siyabi.jpg',
        name: {
          ar: 'مكتب إبراهيم بن مسعود السيابي محامون ومستشارون قانونيون',
          en: 'Ibrahim bin Masoud Al Siyabi — Advocates and Legal Consultants'
        },
        phone: '96334491',
        address: { ar: 'محافظة مسقط – ولاية بوشر – الخوير', en: 'Muscat Governorate – Bawshar – Al Khuwair' }
      },
      {
        id: 'kaf-rawas',
        logo: '/partners/legal-kaf-rawas.jpg',
        name: {
          ar: 'الكاف والرواس للمحاماة والاستشارات القانونية (صلالة)',
          en: 'Al Kaf and Al Rawas — Advocacy and Legal Consultancy (Salalah)'
        },
        phone: '95505447',
        address: { ar: 'محافظة ظفار – ولاية صلالة', en: 'Dhofar Governorate – Salalah' }
      },
      {
        id: 'badi',
        logo: '/partners/legal-badi.jpg',
        name: {
          ar: 'الدكتور علي البادي للمحاماة والاستشارات القانونية (صحار)',
          en: 'Dr Ali Al Badi — Advocacy and Legal Consultancy (Sohar)'
        },
        phone: '99330993',
        address: {
          ar: 'محافظة شمال الباطنة – ولاية صحار · محافظة البريمي – ولاية البريمي',
          en: 'North Batinah – Sohar · Al Buraimi Governorate – Al Buraimi'
        }
      },
      {
        id: 'muqaibli',
        logo: '/partners/legal-muqaibli.png',
        name: {
          ar: 'هارون المقيبلي للمحاماة والاستشارات القانونية',
          en: 'Haroun Al Muqaibli — Advocacy and Legal Consultancy'
        },
        phone: '99285552',
        address: {
          ar: 'شارع 18 نوفمبر – الغبرة – مجمع 236 – مبنى 89',
          en: '18th November Street – Al Ghubrah – Complex 236 – Building 89'
        }
      }
    ]
  },

  {
    id: 'accounting',
    icon: '/partners/cat-accounting.png',
    glyph: 'Calculator',
    name: { ar: 'الشريك المحاسبي', en: 'Accounting partners' },
    blurb: {
      ar: 'مكاتب تدقيق حسابات واستشارات اقتصادية معتمدة لإعداد القوائم المالية ومراجعتها.',
      en: 'Audit and economic-consultancy firms recognised for preparing and reviewing financial statements.'
    },
    members: [
      {
        id: 'fakhama',
        logo: '/partners/acc-fakhama.jpg',
        name: { ar: 'مجموعة الفخامة المهنية', en: 'Grand Professional Group' },
        phone: '91444528',
        address: { ar: 'محافظة مسقط – ولاية السيب – الموالح', en: 'Muscat Governorate – Seeb – Mawaleh' }
      },
      {
        id: 'majan',
        logo: '/partners/acc-majan.jpg',
        name: {
          ar: 'مجان لتدقيق الحسابات والاستشارات الاقتصادية',
          en: 'Majan Auditing and Economic Consultancy'
        },
        phone: '99666728',
        address: { ar: 'محافظة مسقط – ولاية بوشر – الخوير', en: 'Muscat Governorate – Bawshar – Al Khuwair' }
      },
      {
        id: 'rubai',
        logo: '/partners/acc-rubai.jpg',
        name: { ar: 'الرباعي لتدقيق الحسابات', en: 'Al Rubai Auditing' },
        phone: '99477244',
        address: { ar: 'محافظة مسقط – ولاية بوشر – الخوير', en: 'Muscat Governorate – Bawshar – Al Khuwair' }
      },
      {
        id: 'wait',
        logo: '/partners/acc-wait.jpg',
        name: { ar: 'ويت المتحدة لتدقيق الحسابات', en: 'Wait United Auditing' },
        phone: '99561891',
        address: { ar: 'محافظة مسقط – ولاية بوشر – الخوير', en: 'Muscat Governorate – Bawshar – Al Khuwair' }
      },
      {
        id: 'juman',
        logo: '/partners/acc-juman.jpg',
        name: { ar: 'جمان للاستشارات ش.ش.و', en: 'Juman Consultancy SPC' },
        phone: '93690222 · 24565001',
        address: {
          ar: 'الوطية – الشارع العام – بناية بنك ظفار – الطابق الثاني – مكتب 23',
          en: 'Al Wutayyah – Main Street – Bank Dhofar Building – 2nd floor – Office 23'
        }
      }
    ]
  },

  {
    id: 'medical',
    icon: '/partners/cat-medical.png',
    glyph: 'HeartPulse',
    name: { ar: 'الشريك الطبي', en: 'Medical partners' },
    blurb: {
      ar: 'مستشفيات متعاقدة تقدّم خدماتها لمنتسبي المؤسسات المسجّلة في المنصة.',
      en: 'Contracted hospitals serving the staff of enterprises registered on the platform.'
    },
    members: [
      {
        id: 'burjeel',
        logo: '/partners/med-burjeel.jpg',
        name: { ar: 'مستشفى برجيل الطبي', en: 'Burjeel Medical Hospital' }
      },
      {
        id: 'apollo',
        logo: '/partners/med-apollo.jpg',
        name: { ar: 'مستشفى أبولو الطبي', en: 'Apollo Medical Hospital' }
      }
    ]
  },

  {
    id: 'financial',
    icon: '/partners/cat-financial.png',
    glyph: 'Landmark',
    name: { ar: 'الشركاء الماليون', en: 'Financial partners' },
    blurb: {
      ar: 'بنوك وصناديق تمويل تتيح للمؤسسات المسجّلة حلولاً تمويلية وشروطاً تفضيلية.',
      en: 'Banks and funds offering registered enterprises financing solutions and preferential terms.'
    },
    members: [
      {
        id: 'sharakah',
        logo: '/partners/fin-sharakah.jpg',
        name: { ar: 'صندوق مشاريع الشباب «شراكة»', en: 'Sharakah — Youth Enterprise Fund' }
      },
      { id: 'wadiaa', logo: '/partners/fin-wadiaa.jpg', name: { ar: 'شركة وديعة', en: 'Wadiaa' } },
      {
        id: 'bank-muscat',
        logo: '/partners/fin-bank-muscat.jpg',
        name: { ar: 'بنك مسقط', en: 'Bank Muscat' }
      },
      {
        id: 'nbo',
        logo: '/partners/fin-nbo.jpg',
        name: { ar: 'البنك الوطني العُماني', en: 'National Bank of Oman' }
      },
      {
        id: 'bank-dhofar',
        logo: '/partners/fin-bank-dhofar.jpg',
        name: { ar: 'بنك ظفار', en: 'Bank Dhofar' }
      },
      { id: 'alizz', logo: '/partners/fin-alizz.jpg', name: { ar: 'بنك العز الإسلامي', en: 'Alizz Islamic Bank' } },
      { id: 'oab', logo: '/partners/fin-oab.jpg', name: { ar: 'بنك عُمان العربي', en: 'Oman Arab Bank' } },
      { id: 'bank-nizwa', logo: '/partners/fin-bank-nizwa.jpg', name: { ar: 'بنك نزوى', en: 'Bank Nizwa' } },
      { id: 'ahli', logo: '/partners/fin-ahli.jpg', name: { ar: 'البنك الأهلي (عُمان)', en: 'Ahli Bank (Oman)' } },
      { id: 'sohar', logo: '/partners/fin-sohar.jpg', name: { ar: 'بنك صحار الدولي', en: 'Sohar International' } },
      { id: 'beirut', logo: '/partners/fin-beirut.jpg', name: { ar: 'بنك بيروت – عُمان', en: 'Bank of Beirut — Oman' } },
      { id: 'hsbc', logo: '/partners/fin-hsbc.jpg', name: { ar: 'بنك إتش إس بي سي عُمان', en: 'HSBC Bank Oman' } }
    ]
  },

  {
    id: 'exchange',
    icon: '/partners/cat-exchange.png',
    glyph: 'Banknote',
    name: { ar: 'الشريك المصرفي', en: 'Banking partner' },
    blurb: {
      ar: 'خدمات الصرافة والتحويل المالي المتاحة للمؤسسات المسجّلة.',
      en: 'Currency exchange and money-transfer services available to registered enterprises.'
    },
    members: [
      {
        id: 'unimoni',
        logo: '/partners/exc-unimoni.jpg',
        name: { ar: 'شركة يوني موني للصرافة', en: 'Unimoni Exchange' }
      }
    ]
  },

  {
    id: 'technology',
    icon: '/partners/cat-technology.png',
    glyph: 'Cpu',
    name: { ar: 'الشريك التقني والتسويق', en: 'Technology and marketing partners' },
    blurb: {
      ar: 'شركاء التحول الرقمي والإعلام الذين يدعمون حضور المؤسسة وتسويق منتجاتها.',
      en: 'Digital-transformation and media partners supporting an enterprise’s presence and marketing.'
    },
    members: [
      {
        id: 'bedots',
        logo: '/partners/tech-bedots.jpg',
        name: { ar: 'نقاط التحول الرقمية BeDots', en: 'BeDots Digital' }
      },
      { id: 'qabas', logo: '/partners/tech-qabas.jpg', name: { ar: 'جريدة قبس ميديا', en: 'Qabas Media' } }
    ]
  },

  {
    id: 'insurance',
    icon: '/partners/cat-insurance.png',
    glyph: 'ShieldCheck',
    name: { ar: 'شركاء التأمين', en: 'Insurance partners' },
    blurb: {
      ar: 'شركات تأمين تغطي مخاطر التشغيل والممتلكات والمسؤولية للمؤسسات المسجّلة.',
      en: 'Insurers covering operational, property and liability risk for registered enterprises.'
    },
    members: [
      {
        id: 'dhofar-insurance',
        logo: '/partners/ins-dhofar.jpg',
        name: { ar: 'شركة ظفار للتأمين', en: 'Dhofar Insurance Company' }
      },
      {
        id: 'oman-united',
        logo: '/partners/ins-oman-united.jpg',
        name: { ar: 'شركة عُمان المتحدة للتأمين ش.م.ع.ع', en: 'Oman United Insurance Company SAOG' }
      },
      {
        id: 'maysam',
        logo: '/partners/ins-maysam.jpg',
        name: {
          ar: 'الميسم العالمية للتجارة والمقاولات – قسم المشاريع والإنشاءات',
          en: 'Al Maysam International Trading and Contracting — Projects and Construction'
        }
      }
    ]
  }
];

/** Every roster firm, flattened, each carrying the category it came from. */
export const ALL_DIRECTORY_PARTNERS = PARTNER_CATEGORIES.flatMap((c) =>
  c.members.map((m) => ({ ...m, categoryId: c.id, categoryName: c.name }))
);
