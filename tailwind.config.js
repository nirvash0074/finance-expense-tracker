/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./pages/**/*.{js,ts,tsx}", "./components/**/*.{js,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#06b6d4",
      },
    },
  },
  plugins: [],
};
