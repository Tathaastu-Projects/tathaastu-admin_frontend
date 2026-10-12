import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        spiritual: {
          gold: "#D4AF37",
          cream: "#F5F5DC",
          purple: "#9370DB",
          darkPurple: "#663399",
          lightGold: "#F4E4BC",
        },
        brand: {
          maroon: "#7A1F2B",
          deepMaroon: "#5C1520",
          softCream: "#FBF6F0",
          blush: "#F4E7E2",
          gold: "#C9A24A",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;

