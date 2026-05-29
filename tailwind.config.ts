import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        surface: "#f7f7f4",
        ink: "#202124",
        muted: "#6f716c",
        line: "#deded7",
        accent: "#16745f",
        amazon: "#4d77a3",
        rakuten: "#b44a58"
      },
      boxShadow: {
        soft: "0 10px 30px rgba(32, 33, 36, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
