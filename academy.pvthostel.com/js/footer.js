// Footer functionality and multi-language support

// Language configurations
const languages = {
  en: {
    guests: {
      title: "🌍 Guests",
      links: {
        portal: "Guest Portal",
        booking: "Book a Stay",
        payment: "Payment Portal",
        shop: "Merchandise",
        rewards: "Rewards Program",
        support: "Support"
      }
    },
    culture: {
      title: "🎒 Culture",
      links: {
        buzz: "Buzz & Reviews",
        tribe: "Traveler Stories",
        studio: "Studio & Media",
        culture: "Culture",
        vision: "Vision"
      }
    },
    language: {
      title: "🌐 Language",
      darkMode: "Toggle Dark Mode"
    }
  },
  zh: {
    guests: {
      title: "🌍 客人",
      links: {
        portal: "客人门户",
        booking: "预订住宿",
        payment: "支付门户",
        shop: "商品",
        rewards: "奖励计划",
        support: "支持"
      }
    },
    culture: {
      title: "🎒 文化",
      links: {
        buzz: "评论与口碑",
        tribe: "旅行者故事",
        studio: "工作室与媒体",
        culture: "文化",
        vision: "愿景"
      }
    },
    language: {
      title: "🌐 语言",
      darkMode: "切换暗黑模式"
    }
  },
  es: {
    guests: {
      title: "🌍 Huéspedes",
      links: {
        portal: "Portal de Huéspedes",
        booking: "Reservar Estadía",
        payment: "Portal de Pagos",
        shop: "Mercancía",
        rewards: "Programa de Recompensas",
        support: "Soporte"
      }
    },
    culture: {
      title: "🎒 Cultura",
      links: {
        buzz: "Comentarios y Reseñas",
        tribe: "Historias de Viajeros",
        studio: "Estudio y Medios",
        culture: "Cultura",
        vision: "Visión"
      }
    },
    language: {
      title: "🌐 Idioma",
      darkMode: "Alternar Modo Oscuro"
    }
  },
  fr: {
    guests: {
      title: "🌍 Invités",
      links: {
        portal: "Portail des Invités",
        booking: "Réserver un Séjour",
        payment: "Portail de Paiement",
        shop: "Marchandises",
        rewards: "Programme de Récompenses",
        support: "Support"
      }
    },
    culture: {
      title: "🎒 Culture",
      links: {
        buzz: "Buzz et Avis",
        tribe: "Histoires de Voyageurs",
        studio: "Studio et Médias",
        culture: "Culture",
        vision: "Vision"
      }
    },
    language: {
      title: "🌐 Langue",
      darkMode: "Basculer Mode Sombre"
    }
  },
  ar: {
    guests: {
      title: "🌍 الضيوف",
      links: {
        portal: "بوابة الضيوف",
        booking: "احجز إقامة",
        payment: "بوابة الدفع",
        shop: "البضائع",
        rewards: "برنامج المكافآت",
        support: "الدعم"
      }
    },
    culture: {
      title: "🎒 الثقافة",
      links: {
        buzz: "الضجيج والمراجعات",
        tribe: "قصص المسافرين",
        studio: "الاستوديو والإعلام",
        culture: "الثقافة",
        vision: "الرؤية"
      }
    },
    language: {
      title: "🌐 اللغة",
      darkMode: "تبديل الوضع المظلم"
    }
  },
  hi: {
    guests: {
      title: "🌍 मेहमान",
      links: {
        portal: "अतिथि पोर्टल",
        booking: "ठहरने की बुकिंग",
        payment: "भुगतान पोर्टल",
        shop: "सामान",
        rewards: "पुरस्कार कार्यक्रम",
        support: "सहायता"
      }
    },
    culture: {
      title: "🎒 संस्कृति",
      links: {
        buzz: "चर्चा और समीक्षाएं",
        tribe: "यात्री कहानियां",
        studio: "स्टूडियो और मीडिया",
        culture: "संस्कृति",
        vision: "दृष्टि"
      }
    },
    language: {
      title: "🌐 भाषा",
      darkMode: "डार्क मोड टॉगल करें"
    }
  },
  pt: {
    guests: {
      title: "🌍 Hóspedes",
      links: {
        portal: "Portal de Hóspedes",
        booking: "Reservar Estadia",
        payment: "Portal de Pagamento",
        shop: "Mercadorias",
        rewards: "Programa de Recompensas",
        support: "Suporte"
      }
    },
    culture: {
      title: "🎒 Cultura",
      links: {
        buzz: "Buzz e Avaliações",
        tribe: "Histórias de Viajantes",
        studio: "Estúdio e Mídia",
        culture: "Cultura",
        vision: "Visão"
      }
    },
    language: {
      title: "🌐 Idioma",
      darkMode: "Alternar Modo Escuro"
    }
  },
  ru: {
    guests: {
      title: "🌍 Гости",
      links: {
        portal: "Портал гостей",
        booking: "Забронировать проживание",
        payment: "Портал оплаты",
        shop: "Товары",
        rewards: "Программа лояльности",
        support: "Поддержка"
      }
    },
    culture: {
      title: "🎒 Культура",
      links: {
        buzz: "Отзывы и обзоры",
        tribe: "Истории путешественников",
        studio: "Студия и медиа",
        culture: "Культура",
        vision: "Видение"
      }
    },
    language: {
      title: "🌐 Язык",
      darkMode: "Переключить темную тему"
    }
  },
  de: {
    guests: {
      title: "🌍 Gäste",
      links: {
        portal: "Gästeportal",
        booking: "Aufenthalt buchen",
        payment: "Zahlungsportal",
        shop: "Waren",
        rewards: "Belohnungsprogramm",
        support: "Support"
      }
    },
    culture: {
      title: "🎒 Kultur",
      links: {
        buzz: "Buzz & Bewertungen",
        tribe: "Reisende Geschichten",
        studio: "Studio & Medien",
        culture: "Kultur",
        vision: "Vision"
      }
    },
    language: {
      title: "🌐 Sprache",
      darkMode: "Dark Mode umschalten"
    }
  },
  ja: {
    guests: {
      title: "🌍 ゲスト",
      links: {
        portal: "ゲストポータル",
        booking: "宿泊予約",
        payment: "支払いポータル",
        shop: "商品",
        rewards: "リワードプログラム",
        support: "サポート"
      }
    },
    culture: {
      title: "🎒 文化",
      links: {
        buzz: "話題とレビュー",
        tribe: "旅行者の物語",
        studio: "スタジオとメディア",
        culture: "文化",
        vision: "ビジョン"
      }
    },
    language: {
      title: "🌐 言語",
      darkMode: "ダークモード切り替え"
    }
  }
};

// Current language state
let currentLanguage = 'en';

// DOM elements
let footer = null;
let languageSelect = null;
let darkModeButton = null;

// Initialize footer functionality
function initializeFooter() {
  footer = document.querySelector('footer');
  languageSelect = document.querySelector('#languageSelect');
  darkModeButton = document.querySelector('#darkModeToggle');
  
  if (languageSelect) {
    languageSelect.addEventListener('change', handleLanguageChange);
  }
  
  if (darkModeButton) {
    darkModeButton.addEventListener('click', toggleDarkMode);
  }
  
  // Load saved language preference
  const savedLanguage = localStorage.getItem('preferredLanguage');
  if (savedLanguage && languages[savedLanguage]) {
    currentLanguage = savedLanguage;
    updateFooterLanguage();
    if (languageSelect) {
      languageSelect.value = currentLanguage;
    }
  }
  
  // Load saved dark mode preference
  const savedDarkMode = localStorage.getItem('darkMode');
  if (savedDarkMode === 'true') {
    document.body.classList.add('dark-mode');
  }
}

// Handle language change
function handleLanguageChange(event) {
  const selectedLanguage = event.target.value;
  if (languages[selectedLanguage]) {
    currentLanguage = selectedLanguage;
    localStorage.setItem('preferredLanguage', selectedLanguage);
    updateFooterLanguage();
    
    // Add animation class
    if (footer) {
      footer.classList.add('language-switch-animation');
      setTimeout(() => {
        footer.classList.remove('language-switch-animation');
      }, 500);
    }
  }
}

// Update footer text based on selected language
function updateFooterLanguage() {
  const lang = languages[currentLanguage];
  
  // Update panel titles
  const guestTitle = document.querySelector('.panel:nth-child(1) h4');
  const cultureTitle = document.querySelector('.panel:nth-child(2) h4');
  const languageTitle = document.querySelector('.panel:nth-child(3) h4');
  
  if (guestTitle) guestTitle.textContent = lang.guests.title;
  if (cultureTitle) cultureTitle.textContent = lang.culture.title;
  if (languageTitle) languageTitle.textContent = lang.language.title;
  
  // Update guest links
  const guestLinks = document.querySelectorAll('.panel:nth-child(1) a');
  if (guestLinks.length >= 6) {
    guestLinks[0].textContent = lang.guests.links.portal;
    guestLinks[1].textContent = lang.guests.links.booking;
    guestLinks[2].textContent = lang.guests.links.payment;
    guestLinks[3].textContent = lang.guests.links.shop;
    guestLinks[4].textContent = lang.guests.links.rewards;
    guestLinks[5].textContent = lang.guests.links.support;
  }
  
  // Update culture links
  const cultureLinks = document.querySelectorAll('.panel:nth-child(2) a');
  if (cultureLinks.length >= 5) {
    cultureLinks[0].textContent = lang.culture.links.buzz;
    cultureLinks[1].textContent = lang.culture.links.tribe;
    cultureLinks[2].textContent = lang.culture.links.studio;
    cultureLinks[3].textContent = lang.culture.links.culture;
    cultureLinks[4].textContent = lang.culture.links.vision;
  }
  
  // Update dark mode button
  if (darkModeButton) {
    darkModeButton.textContent = lang.language.darkMode;
  }
}

// Toggle dark mode
function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  const isDarkMode = document.body.classList.contains('dark-mode');
  localStorage.setItem('darkMode', isDarkMode.toString());
  
  // Update CSS link if needed
  const cssLink = document.getElementById("theme-style");
  if (cssLink) {
    cssLink.href = isDarkMode ? 'css/dark-theme.css' : 'css/footer.css';
  }
}

// Initialize HubSpot form
function initializeHubSpotForm() {
  if (window.hbspt) {
    hbspt.forms.create({
      region: "na1",
      portalId: "43986063",
      formId: "331de0e6-2455-4516-b914-d238435ee0f9",
      target: "#hubspotForm"
    });
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  initializeFooter();
});

// Initialize HubSpot form when page loads
window.addEventListener('load', function() {
  initializeHubSpotForm();
});

// Export functions for global access
window.toggleDarkMode = toggleDarkMode;
window.initializeFooter = initializeFooter;