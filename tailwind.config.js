/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'selector',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,vue}",
    "./dev/align/*.{js,ts,jsx,tsx,vue}",
    '!./**/node_modules', // src/pali-converter has node_modules - get a warning without this.
  ],
  theme: {
    extend: {
      fontSize: {
        'base': 'calc(1rem * var(--font-scale) * var(--script-scale))',   // default is 16px * scale
        'lg': 'calc(1.125rem * var(--font-scale) * var(--script-scale))', // default is 18px * scale
        'xl': 'calc(1.25rem * var(--font-scale) * var(--script-scale))',  // default is 20px * scale
        '2xl': 'calc(1.5rem * var(--font-scale) * var(--script-scale))',  // default is 20px * scale
        '3xl': 'calc(1.875rem * var(--font-scale) * var(--script-scale))',  
        '4xl': 'calc(2.25rem * var(--font-scale) * var(--script-scale))',
        // Define additional sizes as needed
      },
    },
  },
  plugins: [],
}

