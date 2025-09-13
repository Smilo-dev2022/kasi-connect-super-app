import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

const resources = {
  en: {
    translation: {
      app: {
        name: "KasiLink",
      },
      nav: {
        chats: "Chats",
        wallet: "Wallet",
        rooms: "Rooms",
        safety: "Safety",
        events: "Events",
        business: "Business",
      },
      home: {
        hello: "Sawubona, {{name}}! 👋",
        communityActive: "Your community is active today",
        balance: "Balance",
        quickActions: "Quick Actions",
        recentUpdates: "Recent Updates",
        yourCommunity: "Your Community",
        activeGroups: "Active Groups",
        stokvels: "Stokvels",
        localShops: "Local Shops",
      },
      features: {
        heading: "Everything Your Community Needs",
        subheading: "iKasiLink brings together all the tools townships need to thrive - from daily conversations to financial empowerment, all in one secure platform.",
        ctaHeading: "Ready to Transform Your Community?",
        ctaCopy: "Join thousands of South Africans already using iKasiLink to build stronger, more connected communities across the country.",
        getEarlyAccess: "Get Early Access",
        startCommunity: "Start Your Community",
        list: {
          chatTitle: "Safe Community Chat",
          chatDesc: "Verified neighborhood groups with safety alerts and community updates. Connect with your neighbors in a trusted space.",
          stokvelTitle: "Stokvel Management",
          stokvelDesc: "Digital stokvels made simple. Track contributions, manage payouts, and grow your savings together with transparency.",
          businessTitle: "Local Business Hub",
          businessDesc: "Order from spaza shops, support local vendors, and discover township entrepreneurs right in your area.",
          safetyTitle: "Community Safety",
          safetyDesc: "Real-time safety alerts, emergency contacts, and neighborhood watch coordination to keep everyone protected.",
          eventsTitle: "Event Coordination",
          eventsDesc: "Organize community events, church gatherings, and celebrations. Never miss what's happening in your kasi.",
          financeTitle: "Financial Growth",
          financeDesc: "Savings circles, investment groups, and financial literacy resources to build wealth together as a community.",
        },
      },
    },
  },
  zu: {
    translation: {
      app: {
        name: "iKasiLink",
      },
      nav: {
        chats: "Ingxoxo",
        wallet: "Iphakethe",
        rooms: "Amagumbi",
        safety: "Ezokuphepha",
        events: "Imicimbi",
        business: "Ibhizinisi",
      },
      home: {
        hello: "Sawubona, {{name}}! 👋",
        communityActive: "Umphakathi wakho uyasebenza namuhla",
        balance: "Ibhalansi",
        quickActions: "Izenzo Ezisheshayo",
        recentUpdates: "Izibuyekezo Zakamuva",
        yourCommunity: "Umphakathi Wakho",
        activeGroups: "Amaqembu Asebenzayo",
        stokvels: "Izitokofela",
        localShops: "Izitolo Zendawo",
      },
      features: {
        heading: "Konke Okudingwa Umphakathi Wakho",
        subheading: "I-iKasiLink ihlanganisa wonke amathuluzi adingwa yimiphakathi ukuze ichume - kusukela ezingxoxweni zansuku zonke kuya ekunothisweni kwezezimali, konke kuphephile endaweni eyodwa.",
        ctaHeading: "Ukulungele Ukuguqula Umphakathi Wakho?",
        ctaCopy: "Joyina izinkulungwane zabantu baseNingizimu Afrika abasebenzisa i-iKasiLink ukwakha imiphakathi eqinile futhi exhumekile ezweni lonke.",
        getEarlyAccess: "Thola Ukufinyelela Kwakuqala",
        startCommunity: "Qala Umphakathi Wakho",
        list: {
          chatTitle: "Ingxoxo Yomphakathi Ephephile",
          chatDesc: "Amaqembu omakhelwane aqinisekisiwe anezexwayiso zokuphepha nezibuyekezo zomphakathi. Xhumana nomakhelwane bakho endaweni ethembekile.",
          stokvelTitle: "Ukuphathwa kweStokvel",
          stokvelDesc: "Izitokofela zedijithali ezenziwe lula. Landela iminikelo, phatha izinkokhelo, futhi nikhulise imali yenu ngokubambisana ngokusobala.",
          businessTitle: "Isikhungo Sezebhizinisi Zendawo",
          businessDesc: "Oda ezitolo zesipaza, usekele abathengisi bendawo, futhi uthole osomabhizinisi basemalokishini endaweni yakho.",
          safetyTitle: "Ezokuphepha Zomphakathi",
          safetyDesc: "Izexwayiso zesikhathi sangempela zokuphepha, oxhumana nabo eziphuthumayo, nokuhleleka kwe-neighborhood watch ukuze wonke umuntu avikelwe.",
          eventsTitle: "Ukuhlelwa Kwemicimbi",
          eventsDesc: "Hlela imicimbi yomphakathi, imihlangano yesonto, nemigubho. Ungaphuthelwa wukuthi kwenzekani eKasi lakho.",
          financeTitle: "Ukukhula Kwezezimali",
          financeDesc: "Izindilinga zokulondoloza, amaqembu okutshalwa kwezimali, nezinsiza zolwazi lwezimali ukwakha ingcebo ngokuhlanganyela njengomphakathi.",
        },
      },
    },
  },
} as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    supportedLngs: ["en", "zu"],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["querystring", "localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

export default i18n;

