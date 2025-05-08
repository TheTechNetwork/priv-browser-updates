import { useEffect, useState, startTransition } from "react"
import { ThemeProviderContext, type ThemeProviderProps, type Theme } from "./theme-context"

function isValidTheme(value: string | null): value is Theme {
  return value === "light" || value === "dark" || value === "system";
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem(storageKey)
    return isValidTheme(stored) ? stored : defaultTheme
  })

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove("light", "dark")

    if (theme === "system") {
      const mql = window.matchMedia("(prefers-color-scheme: dark)")
      const applySystemTheme = (e?: MediaQueryListEvent | { matches: boolean }) => {
        const systemTheme = (e ? e.matches : mql.matches) ? "dark" : "light"
        root.classList.remove("light", "dark")
        root.classList.add(systemTheme)
      }
      applySystemTheme()
      mql.addEventListener("change", applySystemTheme)
      return () => mql.removeEventListener("change", applySystemTheme)
    }

    root.classList.add(theme)
  }, [theme])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      startTransition(() => {
        setTheme(theme)
      })
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}