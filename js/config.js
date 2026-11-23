/**
 * ============================================================
 * ⚙️ WEBSITE CONFIGURATION & SETTINGS
 * ============================================================
 * Yahan aap apna Brand Name, API Key, UPI ID aur Products change kar sakte hain.
 */

window.APP_CONFIG = {
  // Brand details
  brand: {
    name: "FireTopUp",
    tagline: "Instant Top Up Center",
    logo: "assets/icons/logo.svg",
    copyright: "All rights reserved."
  },

  // Currency
  currency: "₹",

  // Top-Up API Configuration
  api: {
    // Agar true karenge toh testing bina real API ke hogi (sample data ke sath)
    useMock: false,

    // Real API URL - {UID} automatically replace ho jayega entered UID se
    // Aur agar aapki API key header ya param mein chahiye toh yahan set karein
    endpoint: "api/verify?uid={UID}",
    apiKey: "YOUR_TOPUP_API_KEY_HERE",
    
    // Headers agar aapki API mangti hai (jaise Authorization: Bearer ...)
    headers: {
      // "Authorization": "Bearer YOUR_TOPUP_API_KEY_HERE"
    }
  },

  // Payment Configuration (Secure Server-side ZexiPay Integration)
  payment: {
    gateway: "ZexiPay",
    merchantName: "FireTopUp",
    currency: "INR",
    supportDeepLinks: true,
    qrExpireMinutes: 6
  },

  // Store Products Catalogue
  catalog: [
    {
      slug: "diamonds",
      name: "Diamonds",
      icon: "💎",
      image: "assets/categories/categories_20260618131908_8da0ba.png",
      items: [
        {
          id: "p2",
          name: "310 Diamonds",
          amount: "310",
          sub: "+31 bonus",
          price: 89,
          oldPrice: 260,
          tag: "⚡ LIMITED",
          stock: 144,
          inStock: true,
          image: "assets/products/products_20260618130432_e4e517.png"
        },
        {
          id: "p3",
          name: "520 Diamonds",
          amount: "520",
          sub: "+52 bonus",
          price: 120,
          oldPrice: 440,
          tag: null,
          stock: 18,
          inStock: true,
          image: "assets/products/products_20260618130756_687fd4.png"
        },
        {
          id: "p4",
          name: "1060 Diamonds",
          amount: "1060",
          sub: "+106 bonus",
          price: 151,
          oldPrice: 860,
          tag: null,
          stock: 398,
          inStock: true,
          image: "assets/products/products_20260618131428_da9e7d.png"
        },
        {
          id: "p5",
          name: "2180 Diamonds",
          amount: "2180",
          sub: "+218 bonus",
          price: 251,
          oldPrice: 1700,
          tag: null,
          stock: 345,
          inStock: true,
          image: "assets/products/products_20260618131446_ae70d5.png"
        },
        {
          id: "p6",
          name: "5600 Diamonds",
          amount: "5600",
          sub: "+560 bonus",
          price: 601,
          oldPrice: 4300,
          tag: "NEW",
          stock: 131,
          inStock: true,
          image: "assets/products/products_20260618131503_e48bb6.png"
        },
        {
          id: "p9",
          name: "11200 Diamonds",
          amount: "11200",
          sub: "+1120 bonus",
          price: 1001,
          oldPrice: 8600,
          tag: "👑 MEGA PACK",
          stock: 65,
          inStock: true,
          image: "assets/products/products_20260618131503_e48bb6.png"
        }
      ]
    },
    {
      slug: "passes",
      name: "Passes & Access",
      icon: "🎟️",
      image: "assets/categories/categories_20260618132038_c0a216.png",
      items: [
        {
          id: "p16",
          name: "Weekly Pass",
          amount: "Weekly",
          sub: "15-day rewards track",
          price: 101,
          oldPrice: 159,
          tag: "⚡ LIMITED",
          stock: 225,
          inStock: true,
          image: "assets/products/products_20260618133127_78497d.png"
        },
        {
          id: "p17",
          name: "Monthly Pass",
          amount: "Monthly",
          sub: "30-day rewards track",
          price: 301,
          oldPrice: 799,
          tag: "🔥 HOT",
          stock: 285,
          inStock: true,
          image: "assets/products/products_20260618144016_48b5e4.png"
        },
        {
          id: "p18",
          name: "30 D EVO ACCESS",
          amount: "30 D Evo Pass",
          sub: "30 DAYS ACCESS",
          price: 261,
          oldPrice: 599,
          tag: "NEW",
          stock: 124,
          inStock: true,
          image: "assets/products/products_20260618144137_8f687e.png"
        },
        {
          id: "p7",
          name: "Booyah Pass",
          amount: "Booyah",
          sub: "Current season — premium",
          price: 151,
          oldPrice: 499,
          tag: "HOT",
          stock: 217,
          inStock: true,
          image: "assets/products/products_20260618132321_6d00cf.png"
        },
        {
          id: "p8",
          name: "Booyah Pass Plus",
          amount: "Booyah+",
          sub: "Premium + 30 level jump",
          price: 301,
          oldPrice: 999,
          tag: "BEST VALUE",
          stock: 133,
          inStock: true,
          image: "assets/products/products_20260618132415_969094.png"
        },
        {
          id: "p19",
          name: "All Passes Super Bundle",
          amount: "VIP All-Pass",
          sub: "Weekly + Monthly + Evo + Booyah",
          price: 501,
          oldPrice: 1499,
          tag: "👑 ULTIMATE",
          stock: 88,
          inStock: true,
          image: "assets/products/products_20260618132415_969094.png"
        }
      ]
    }
  ]
};

var APP_CONFIG = window.APP_CONFIG;
