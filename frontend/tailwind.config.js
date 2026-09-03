/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Base surfaces — deep blue-black rather than pure #000/#111,
        // to avoid the generic "tinted near-black" AI default while
        // staying close to Telegram's own dark theme.
        base: {
          950: "#0A0D14",
          900: "#0F1420",
          800: "#161C2C",
          700: "#212A3F",
          600: "#33405A",
        },
        // TON's official brand blue, used sparingly as the interactive accent.
        ton: {
          DEFAULT: "#0098EA",
          light: "#3EB8FF",
          dark: "#0072B3",
        },
        // Warm gift-gold — reserved for prices and the "gift" motif,
        // the one bold accent in the palette.
        gift: {
          DEFAULT: "#F2A93B",
          light: "#FFD588",
        },
        success: "#3DD68C",
        danger: "#FF5C5C",
      },
      fontFamily: {
        display: ["'Space Grotesk'", "system-ui", "sans-serif"],
        sans: ["'Inter'", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      boxShadow: {
        card: "0 8px 24px -12px rgba(0,0,0,0.55)",
      },
    },
  },
  plugins: [],
};
