# 🎮 Top-Up Store Web Template

A modern, fast, responsive gaming top-up store web application with dynamic UID verification, smooth animations, dark/light theme, and direct UPI / QR checkout.

---

## 📁 File Structure

- `index.html` — Landing page with Hero Carousel, Game card, UID Verification card, Store Catalog, How it Works, FAQ, and celebration modal.
- `store.html` — Dedicated Store view with verified player header.
- `css/styles.css` — Modern glassmorphism design, dark/light mode, animated orbs, responsive cards.
- `js/config.js` — **Main settings file**: Brand name, logo, API key, UPI ID, products & discounts.
- `js/app.js` — Interactive logic (UID verification, dynamic checkout, QR code countdown, confetti).
- `api/verify.php` — Backend PHP proxy for Free Fire UID verification API.
- `assets/` — Posters, banners, category and diamond package images.

---

## ⚙️ How to Customize (Apna Brand & API Lagana)

Open `js/config.js` to change:
1. **Brand Name**:
   ```javascript
   brand: {
     name: "AapkaStore",
     tagline: "Instant Top Up Center",
     logo: "assets/icons/logo.svg"
   }
   ```
2. **Real Top-Up API Key & Endpoint**:
   ```javascript
   api: {
     useMock: false,
     endpoint: "api/verify.php?uid={UID}",
     apiKey: "AAPKI_REAL_API_KEY_HERE"
   }
   ```
3. **UPI Payment Details**:
   ```javascript
   payment: {
     upiId: "aapka_upi_id@bank",
     merchantName: "Aapka Store Name"
   }
   ```
4. **Products & Prices**:
   You can easily edit product names, diamond amounts, prices, and discount tags inside `catalog`.

---

## 🚀 How to Run Locally in Termux

Start a local server with:
```bash
python3 -m http.server 8080
```
Then open `http://localhost:8080` in your browser.
