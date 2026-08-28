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
        brand: {
          blueStart: "#233e95",
          blueEnd: "#0b64b4",
          container: "#003366",
          bgLight: "#f9f9ff",
          surface: "#f9f9ff",
          onSurface: "#111c2d",
          outlineVariant: "#c3c6d1",
          sidebarActive: "#1E40AF",
        },
        primary: {
          DEFAULT: "#003366",
          light: "#0b64b4",
          dark: "#233e95",
        }
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      boxShadow: {
        card: "0 4px 20px rgba(0, 51, 102, 0.08)",
        admin: "0 2px 10px rgba(0, 0, 0, 0.05)",
      }
    },
  },
  plugins: [],
};
export default config;
