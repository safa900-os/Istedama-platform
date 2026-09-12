/**
 * The terms a bidder prices against, for the sample tenders.
 *
 * Kept apart from the tender headlines in seedContent.js so each file reads as
 * one thing: that one says what is being bought and by whom, this one says on
 * what terms. Keyed by reference number, which is the tender's stable identity
 * across re-seeds.
 *
 * Every scoring scheme adds up to 100 — the model refuses one that does not —
 * and every tender carries at least one local-content condition, because that
 * is what this programme is for.
 */

const TERMS = {
  // ------------------------------------------------------------------ 14
  14: {
    durationDays: 180,
    evaluationCriteria: [
      { label: 'Adviser experience', labelAr: 'خبرة المستشارين', weight: 40 },
      { label: 'Session plan', labelAr: 'خطة الجلسات', weight: 25 },
      { label: 'Price', labelAr: 'السعر', weight: 25 },
      { label: 'Local content', labelAr: 'المحتوى المحلي', weight: 10 }
    ],
    phases: [
      { name: 'Needs assessment', nameAr: 'تقييم الاحتياجات', durationDays: 30 },
      { name: 'Advisory sessions', nameAr: 'الجلسات الاستشارية', durationDays: 120 },
      { name: 'Close-out report', nameAr: 'التقرير الختامي', durationDays: 30 }
    ],
    requirements: [
      { kind: 'local_content', text: 'Lead advisers to be Omani nationals or Oman-resident.', textAr: 'أن يكون المستشارون الرئيسيون عُمانيين أو مقيمين في سلطنة عُمان.' },
      { kind: 'technical', text: 'Sessions delivered in Arabic, with English material on request.', textAr: 'تقديم الجلسات باللغة العربية مع توفير مواد بالإنجليزية عند الطلب.' },
      { kind: 'sustainability', text: 'At least one session per enterprise on resource efficiency.', textAr: 'جلسة واحدة على الأقل لكل مؤسسة حول كفاءة استخدام الموارد.' }
    ],
    scopeItems: [
      { description: 'One-to-one advisory session (2 hours)', descriptionAr: 'جلسة استشارية فردية (ساعتان)', unit: 'session', quantity: 60 },
      { description: 'Group workshop (half day)', descriptionAr: 'ورشة عمل جماعية (نصف يوم)', unit: 'workshop', quantity: 6 },
      { description: 'Enterprise diagnostic report', descriptionAr: 'تقرير تشخيصي للمؤسسة', unit: 'report', quantity: 20 }
    ]
  },

  // ------------------------------------------------------------------ 15
  15: {
    durationDays: 120,
    evaluationCriteria: [
      { label: 'Price', labelAr: 'السعر', weight: 45 },
      { label: 'Programme and method', labelAr: 'البرنامج ومنهجية التنفيذ', weight: 25 },
      { label: 'Similar completed works', labelAr: 'أعمال مماثلة منفّذة', weight: 20 },
      { label: 'Local content', labelAr: 'المحتوى المحلي', weight: 10 }
    ],
    phases: [
      { name: 'Design approval', nameAr: 'اعتماد التصاميم', durationDays: 20 },
      { name: 'Fit-out works', nameAr: 'أعمال التجهيز', durationDays: 80 },
      { name: 'Snagging and handover', nameAr: 'المعالجة النهائية والتسليم', durationDays: 20 }
    ],
    requirements: [
      { kind: 'local_content', text: 'Contractor registered in Oman with a valid Grade 3 or higher classification.', textAr: 'أن يكون المقاول مسجلاً في سلطنة عُمان بتصنيف الدرجة الثالثة أو أعلى.' },
      { kind: 'sustainability', text: 'LED lighting throughout, and low-VOC paints and adhesives.', textAr: 'إضاءة LED في كامل القاعة، ودهانات ولواصق منخفضة المركبات العضوية المتطايرة.' },
      { kind: 'technical', text: 'Works to be carried out outside training hours.', textAr: 'تنفيذ الأعمال خارج أوقات التدريب.' }
    ],
    scopeItems: [
      { description: 'Acoustic ceiling panels', descriptionAr: 'ألواح سقف عازلة للصوت', unit: 'm2', quantity: 180 },
      { description: 'Vinyl flooring', descriptionAr: 'أرضيات فينيل', unit: 'm2', quantity: 180 },
      { description: 'LED light fitting', descriptionAr: 'وحدة إضاءة LED', unit: 'unit', quantity: 42 },
      { description: 'Split air-conditioning unit, 2 tonne', descriptionAr: 'وحدة تكييف منفصلة ٢ طن', unit: 'unit', quantity: 4 },
      { description: 'Electrical and data points', descriptionAr: 'نقاط كهرباء وبيانات', unit: 'point', quantity: 36 }
    ]
  },

  // ------------------------------------------------------------------ 16
  16: {
    durationDays: 150,
    evaluationCriteria: [
      { label: 'Technical solution', labelAr: 'الحل التقني', weight: 40 },
      { label: 'Price', labelAr: 'السعر', weight: 30 },
      { label: 'Team and experience', labelAr: 'الفريق والخبرة', weight: 20 },
      { label: 'Local content', labelAr: 'المحتوى المحلي', weight: 10 }
    ],
    phases: [
      { name: 'Discovery and design', nameAr: 'الاستكشاف والتصميم', durationDays: 30 },
      { name: 'Build', nameAr: 'التطوير', durationDays: 90 },
      { name: 'Launch and training', nameAr: 'الإطلاق والتدريب', durationDays: 30 }
    ],
    requirements: [
      { kind: 'technical', text: 'Full Arabic and English interface, right-to-left aware.', textAr: 'واجهة كاملة بالعربية والإنجليزية تدعم الكتابة من اليمين إلى اليسار.' },
      { kind: 'technical', text: 'Data hosted within the Sultanate of Oman.', textAr: 'استضافة البيانات داخل سلطنة عُمان.' },
      { kind: 'local_content', text: 'At least half the development team based in Oman.', textAr: 'أن يكون نصف فريق التطوير على الأقل مقيماً في سلطنة عُمان.' }
    ],
    scopeItems: [
      { description: 'Interactive map with enterprise layers', descriptionAr: 'خريطة تفاعلية بطبقات المؤسسات', unit: 'lot', quantity: 1 },
      { description: 'Administration panel', descriptionAr: 'لوحة الإدارة', unit: 'lot', quantity: 1 },
      { description: 'Staff training session', descriptionAr: 'جلسة تدريب للموظفين', unit: 'session', quantity: 4 },
      { description: 'Support after launch', descriptionAr: 'الدعم الفني بعد الإطلاق', unit: 'month', quantity: 6 }
    ]
  },

  // ------------------------------------------------------------------ 17
  17: {
    durationDays: 75,
    evaluationCriteria: [
      { label: 'Price', labelAr: 'السعر', weight: 45 },
      { label: 'Panel efficiency and warranty', labelAr: 'كفاءة الألواح والضمان', weight: 30 },
      { label: 'Delivery schedule', labelAr: 'الجدول الزمني للتوريد', weight: 15 },
      { label: 'Local content', labelAr: 'المحتوى المحلي', weight: 10 }
    ],
    phases: [
      { name: 'Supply', nameAr: 'التوريد', durationDays: 40 },
      { name: 'Installation and commissioning', nameAr: 'التركيب والتشغيل', durationDays: 35 }
    ],
    requirements: [
      { kind: 'technical', text: 'Panels rated at 400 W or above with a 25-year performance warranty.', textAr: 'ألواح بقدرة ٤٠٠ واط أو أكثر مع ضمان أداء لمدة ٢٥ عاماً.' },
      { kind: 'sustainability', text: 'Supplier to take back and recycle packaging and any failed panels.', textAr: 'يلتزم المورّد باسترجاع مواد التغليف وأي ألواح معطوبة وإعادة تدويرها.' },
      { kind: 'local_content', text: 'Installation by an Oman-registered electrical contractor.', textAr: 'أن يتم التركيب عبر مقاول كهرباء مسجّل في سلطنة عُمان.' }
    ],
    scopeItems: [
      { description: 'Photovoltaic panel, 400 W minimum', descriptionAr: 'لوح كهروضوئي بقدرة ٤٠٠ واط كحد أدنى', unit: 'unit', quantity: 320 },
      { description: 'Grid-tied inverter, 50 kW', descriptionAr: 'عاكس مرتبط بالشبكة ٥٠ كيلوواط', unit: 'unit', quantity: 3 },
      { description: 'Ground mounting structure', descriptionAr: 'هيكل تثبيت أرضي', unit: 'set', quantity: 16 },
      { description: 'Installation and commissioning', descriptionAr: 'التركيب والتشغيل', unit: 'lot', quantity: 1 }
    ]
  },

  // ------------------------------------------------------------------ 18
  18: {
    durationDays: 90,
    evaluationCriteria: [
      { label: 'Understanding of the maritime sector', labelAr: 'فهم قطاع الخدمات البحرية', weight: 35 },
      { label: 'Methodology', labelAr: 'المنهجية', weight: 30 },
      { label: 'Price', labelAr: 'السعر', weight: 25 },
      { label: 'Local content', labelAr: 'المحتوى المحلي', weight: 10 }
    ],
    phases: [
      { name: 'Workforce baseline', nameAr: 'دراسة الوضع الحالي للقوى العاملة', durationDays: 30 },
      { name: 'Roadmap drafting', nameAr: 'إعداد خارطة الطريق', durationDays: 45 },
      { name: 'Board presentation', nameAr: 'العرض على مجلس الإدارة', durationDays: 15 }
    ],
    requirements: [
      { kind: 'local_content', text: 'Targets to follow the Ministry of Labour Omanisation rates for the sector.', textAr: 'أن تتبع الأهداف نسب التعمين المعتمدة من وزارة العمل للقطاع.' },
      { kind: 'technical', text: 'Roadmap to cover recruitment, training and retention separately.', textAr: 'أن تغطي خارطة الطريق التوظيف والتدريب والاستبقاء كلاً على حدة.' }
    ],
    scopeItems: [
      { description: 'Workforce baseline study', descriptionAr: 'دراسة الوضع الحالي للقوى العاملة', unit: 'report', quantity: 1 },
      { description: 'Three-year Omanisation roadmap', descriptionAr: 'خارطة طريق للتعمين لثلاث سنوات', unit: 'report', quantity: 1 },
      { description: 'Management workshop', descriptionAr: 'ورشة عمل للإدارة', unit: 'workshop', quantity: 3 }
    ]
  },

  // ------------------------------------------------------------------ 19
  19: {
    durationDays: 365,
    evaluationCriteria: [
      { label: 'Price', labelAr: 'السعر', weight: 40 },
      { label: 'Response time', labelAr: 'زمن الاستجابة', weight: 30 },
      { label: 'Refrigeration certification', labelAr: 'شهادات التبريد المعتمدة', weight: 20 },
      { label: 'Local content', labelAr: 'المحتوى المحلي', weight: 10 }
    ],
    phases: [
      { name: 'Condition survey', nameAr: 'مسح حالة الوحدات', durationDays: 15 },
      { name: 'Preventive maintenance year', nameAr: 'سنة الصيانة الوقائية', durationDays: 350 }
    ],
    requirements: [
      { kind: 'technical', text: 'Response within six hours for a unit that has lost temperature.', textAr: 'الاستجابة خلال ست ساعات لأي وحدة تفقد درجة التبريد.' },
      { kind: 'sustainability', text: 'Refrigerant recovered and handled by a licensed party — never vented.', textAr: 'استرجاع غاز التبريد ومعالجته عبر جهة مرخّصة، ومنع تسريبه نهائياً.' },
      { kind: 'local_content', text: 'Technicians based in Dhofar Governorate.', textAr: 'أن يكون الفنيون مقيمين في محافظة ظفار.' }
    ],
    scopeItems: [
      { description: 'Quarterly preventive visit, per unit', descriptionAr: 'زيارة صيانة وقائية ربع سنوية لكل وحدة', unit: 'visit', quantity: 24 },
      { description: 'Emergency call-out', descriptionAr: 'استدعاء طارئ', unit: 'call-out', quantity: 12 },
      { description: 'Control system calibration', descriptionAr: 'معايرة نظام التحكم', unit: 'unit', quantity: 6 }
    ]
  },

  // ------------------------------------------------------------------ 20
  20: {
    durationDays: 120,
    evaluationCriteria: [
      { label: 'Technical solution', labelAr: 'الحل التقني', weight: 40 },
      { label: 'Security and data protection', labelAr: 'الأمن وحماية البيانات', weight: 25 },
      { label: 'Price', labelAr: 'السعر', weight: 25 },
      { label: 'Local content', labelAr: 'المحتوى المحلي', weight: 10 }
    ],
    phases: [
      { name: 'Specification', nameAr: 'إعداد المواصفات', durationDays: 20 },
      { name: 'Build and integration', nameAr: 'التطوير والربط', durationDays: 80 },
      { name: 'Acceptance testing', nameAr: 'اختبارات القبول', durationDays: 20 }
    ],
    requirements: [
      { kind: 'technical', text: 'Payments through a gateway licensed by the Central Bank of Oman.', textAr: 'تتم المدفوعات عبر بوابة دفع مرخّصة من البنك المركزي العُماني.' },
      { kind: 'technical', text: 'No card data stored on the platform.', textAr: 'عدم تخزين بيانات البطاقات على المنصة.' },
      { kind: 'local_content', text: 'Support provided from within Oman during business hours.', textAr: 'تقديم الدعم الفني من داخل سلطنة عُمان خلال ساعات العمل.' }
    ],
    scopeItems: [
      { description: 'Booking module', descriptionAr: 'وحدة الحجز', unit: 'lot', quantity: 1 },
      { description: 'Payment gateway integration', descriptionAr: 'الربط مع بوابة الدفع', unit: 'lot', quantity: 1 },
      { description: 'Reporting dashboard', descriptionAr: 'لوحة التقارير', unit: 'lot', quantity: 1 },
      { description: 'Support after go-live', descriptionAr: 'الدعم الفني بعد التشغيل', unit: 'month', quantity: 6 }
    ]
  },

  // ------------------------------------------------------------------ 21
  21: {
    durationDays: 240,
    evaluationCriteria: [
      { label: 'Price', labelAr: 'السعر', weight: 40 },
      { label: 'Programme and method', labelAr: 'البرنامج ومنهجية التنفيذ', weight: 25 },
      { label: 'Health and safety record', labelAr: 'سجل الصحة والسلامة', weight: 20 },
      { label: 'Local content', labelAr: 'المحتوى المحلي', weight: 15 }
    ],
    phases: [
      { name: 'Site preparation', nameAr: 'تجهيز الموقع', durationDays: 30 },
      { name: 'Structure', nameAr: 'الأعمال الإنشائية', durationDays: 120 },
      { name: 'Services and finishes', nameAr: 'الخدمات والتشطيبات', durationDays: 70 },
      { name: 'Handover', nameAr: 'التسليم', durationDays: 20 }
    ],
    requirements: [
      { kind: 'local_content', text: 'At least 30% of materials by value sourced from Omani manufacturers.', textAr: 'ألا تقل نسبة المواد المورّدة من مصانع عُمانية عن ٣٠٪ من القيمة.' },
      { kind: 'local_content', text: 'At least 40% of site workforce to be Omani nationals.', textAr: 'ألا تقل نسبة العُمانيين في القوى العاملة بالموقع عن ٤٠٪.' },
      { kind: 'sustainability', text: 'Construction waste segregated on site and sent for recycling where possible.', textAr: 'فرز مخلفات البناء في الموقع وإرسالها لإعادة التدوير قدر الإمكان.' },
      { kind: 'technical', text: 'Steel structure designed for a 10-tonne overhead crane.', textAr: 'تصميم الهيكل الحديدي لتحمّل رافعة علوية بقدرة ١٠ أطنان.' }
    ],
    scopeItems: [
      { description: 'Excavation and levelling', descriptionAr: 'الحفر والتسوية', unit: 'm3', quantity: 850 },
      { description: 'Reinforced concrete foundations', descriptionAr: 'أساسات خرسانية مسلّحة', unit: 'm3', quantity: 140 },
      { description: 'Steel portal frame', descriptionAr: 'هيكل حديدي إطاري', unit: 'tonne', quantity: 62 },
      { description: 'Insulated roof and wall cladding', descriptionAr: 'تكسية معزولة للسقف والجدران', unit: 'm2', quantity: 1400 },
      { description: 'Electrical installation', descriptionAr: 'التمديدات الكهربائية', unit: 'lot', quantity: 1 }
    ]
  },

  // ------------------------------------------------------------------ 22
  22: {
    durationDays: 45,
    evaluationCriteria: [
      { label: 'Price', labelAr: 'السعر', weight: 40 },
      { label: 'Certified equipment', labelAr: 'المعدات المعتمدة', weight: 40 },
      { label: 'Delivery schedule', labelAr: 'الجدول الزمني للتوريد', weight: 10 },
      { label: 'Local content', labelAr: 'المحتوى المحلي', weight: 10 }
    ],
    phases: [{ name: 'Supply and delivery to Khasab', nameAr: 'التوريد والتسليم إلى خصب', durationDays: 45 }],
    requirements: [
      { kind: 'technical', text: 'Life jackets and harnesses to carry a recognised safety certification.', textAr: 'أن تحمل سترات النجاة وأحزمة الأمان شهادة سلامة معتمدة.' },
      { kind: 'local_content', text: 'Delivered by an Oman-registered supplier.', textAr: 'أن يتم التوريد عبر مورّد مسجّل في سلطنة عُمان.' }
    ],
    scopeItems: [
      { description: 'Certified life jacket', descriptionAr: 'سترة نجاة معتمدة', unit: 'unit', quantity: 120 },
      { description: 'Climbing harness', descriptionAr: 'حزام تسلق', unit: 'unit', quantity: 40 },
      { description: 'First aid kit, marine grade', descriptionAr: 'حقيبة إسعافات أولية بحرية', unit: 'unit', quantity: 15 },
      { description: 'Marine VHF radio', descriptionAr: 'جهاز لاسلكي بحري VHF', unit: 'unit', quantity: 10 }
    ]
  }
};

/** Merges a tender headline with its terms, if it has any. */
const withTerms = (tender) => ({ ...tender, ...(TERMS[tender.refNo] || {}) });

module.exports = { TERMS, withTerms };
