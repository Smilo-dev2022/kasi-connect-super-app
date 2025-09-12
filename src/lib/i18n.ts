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
        subheading: "KasiLink brings together all the tools townships need to thrive - from daily conversations to financial empowerment, all in one secure platform.",
        ctaHeading: "Ready to Transform Your Community?",
        ctaCopy: "Join thousands of South Africans already using KasiLink to build stronger, more connected communities across the country.",
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
        name: "KasiLink",
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
        subheading: "I-KasiLink ihlanganisa wonke amathuluzi adingwa yimiphakathi ukuze ichume - kusukela ezingxoxweni zansuku zonke kuya ekunothisweni kwezezimali, konke kuphephile endaweni eyodwa.",
        ctaHeading: "Ukulungele Ukuguqula Umphakathi Wakho?",
        ctaCopy: "Joyina izinkulungwane zabantu baseNingizimu Afrika abasebenzisa i-KasiLink ukwakha imiphakathi eqinile futhi exhumekile ezweni lonke.",
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
  st: {
    translation: {
      app: { name: "KasiLink" },
      nav: {
        chats: "Puisano",
        wallet: "Walleto",
        rooms: "Likamore",
        safety: "Polokeho",
        events: "Liketsahalo",
        business: "Khoebo",
      },
      home: {
        hello: "Lumelang, {{name}}! 👋",
        communityActive: "Sechaba sa hao sea sebetsa kajeno",
        balance: "Chelete",
        quickActions: "Liketso ka Potlako",
        recentUpdates: "Lintlafatso tsa morao tjena",
        yourCommunity: "Sechaba sa Hau",
        activeGroups: "Lihlopha tse sebetsang",
        stokvels: "Stokvel",
        localShops: "Lebenkele la lehae",
      },
      features: {
        heading: "Tsohle tseo Sechaba sa Hao se li Hlokang",
        subheading: "KasiLink e kopanya lisebelisoa tsohle tseo metse e li hlokang hore e atlehe - ho tloha lipuisanong tsa letsatsi le letsatsi ho isa matlafatsong a lichelete, kaofela sethaleng se le seng se sireletsehileng.",
        ctaHeading: "U se U Itokiselitse ho Fetola Sechaba sa Hao?",
        ctaCopy: "Kena le likete tsa Maafrika Borwa a sebelisang KasiLink ho haha metse e matla le e hokahaneng naheng ka bophara.",
        getEarlyAccess: "Fumana Phihlello ea Pele",
        startCommunity: "Qala Sechaba sa Hao",
        list: {
          chatTitle: "Puisano ea Sechaba e Sireletsehileng",
          chatDesc: "Lihlopha tsa boahelani tse netefalitsoeng ka litemoso tsa polokeho le lintlafatso tsa sechaba. Hokahana le boahelani ba hao sebakeng se tšepahalang.",
          stokvelTitle: "Taolo ea Stokvel",
          stokvelDesc: "Stokvel tsa dijithale tse nolofalitsoeng. Latedisa menehelo, laola litefo, 'me le hōlise chelete hammoho ka pepeneneng.",
          businessTitle: "Setsi sa Khoebo ea Lehae",
          businessDesc: "Laela ho tsoa lisepazeng, tšehetsa barekisi ba lehae, 'me u fumane borakhoebo ba malokong sebakeng sa heno.",
          safetyTitle: "Polokeho ea Sechaba",
          safetyDesc: "Litemoso tsa nako ea nnete tsa polokeho, mabitso a tšohanyetso, le ho hlophisa balebeli ba boahelani ho sireletsa bohle.",
          eventsTitle: "Tlhophiso ea Liketsahalo",
          eventsDesc: "Hlophisa liketsahalo tsa sechaba, liboka tsa kereke, le mekete. Se ke oa hloloheloa se etsahalang kasing ea heno.",
          financeTitle: "Kholiso ea Lichelete",
          financeDesc: "Litsebeletso tsa ho boloka chelete, lihlopha tsa matsete, le lisebelisoa tsa thuto ea lichelete ho haha leruo 'moho e le sechaba.",
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
    supportedLngs: ["en", "zu", "st"],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["querystring", "localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

export default i18n;

