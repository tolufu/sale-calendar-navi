import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // 薄青の補助背景・面
        surface: "#eef4ff",
        surfaceMuted: "#f5f8ff",
        ink: "#0f172a",
        muted: "#5b6472",
        line: "#dbe4f3",
        // メインカラー（青）
        accent: "#2563eb",
        accentDark: "#1d4ed8",
        accentSoft: "#eff6ff",
        // 主要CTA（オレンジ）
        cta: "#f97316",
        ctaDark: "#ea580c",
        ctaSoft: "#fff4ec",
        // 状態色
        success: "#16a34a",
        // EC識別色（公式ロゴは使わずテキストバッジ＋配色で表現）
        amazon: "#146eb4",
        rakuten: "#bf0000",
        yahoo: "#6d28d9"
      },
      borderRadius: {
        card: "1.125rem",
        btn: "0.875rem"
      },
      boxShadow: {
        soft: "0 10px 30px rgba(15, 23, 42, 0.08)",
        card: "0 6px 20px rgba(15, 23, 42, 0.06)"
      }
    }
  },
  plugins: []
};

export default config;
