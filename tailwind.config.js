/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111111",
        stone: {
          25: "#fcfcfc",
          950: "#0f0f10"
        }
      },
      boxShadow: {
        panel: "0 8px 30px rgba(15, 15, 16, 0.06)"
      }
    }
  },
  plugins: [],
};
