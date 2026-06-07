import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'hsl(220, 14%, 9%)',
        foreground: 'hsl(0, 0%, 98%)',
        card: 'hsl(220, 13%, 15%)',
        'card-foreground': 'hsl(0, 0%, 98%)',
        primary: 'hsl(220, 90%, 60%)',
        'primary-foreground': 'hsl(220, 14%, 9%)',
        secondary: 'hsl(220, 13%, 20%)',
        'secondary-foreground': 'hsl(0, 0%, 98%)',
        muted: 'hsl(220, 13%, 25%)',
        'muted-foreground': 'hsl(0, 0%, 65%)',
        accent: 'hsl(0, 84%, 60%)',
        'accent-foreground': 'hsl(0, 0%, 98%)',
        border: 'hsl(220, 13%, 20%)',
        ring: 'hsl(220, 90%, 60%)',
        destructive: 'hsl(0, 84%, 60%)',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      borderRadius: {
        lg: 'calc(var(--radius) * 1)',
        md: 'calc(var(--radius) * 0.8)',
        sm: 'calc(var(--radius) * 0.6)',
      },
    },
  },
  plugins: [],
}

export default config
