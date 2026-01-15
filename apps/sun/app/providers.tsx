'use client'

import { ChakraProvider } from '@chakra-ui/react'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { system } from './theme'

type ColorMode = 'light' | 'dark'

type ColorModeContextValue = {
  colorMode: ColorMode
  toggleColorMode: () => void
  setColorMode: (mode: ColorMode) => void
}

const ColorModeContext = createContext<ColorModeContextValue | null>(null)

type ProvidersProps = {
  children: React.ReactNode
  initialColorMode?: ColorMode
}

const COLOR_MODE_COOKIE = 'chakra-ui-color-mode'

export function Providers({ children, initialColorMode = 'light' }: ProvidersProps) {
  const [colorMode, setColorMode] = useState<ColorMode>(initialColorMode)

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(colorMode)
    root.style.colorScheme = colorMode
    document.cookie = `${COLOR_MODE_COOKIE}=${colorMode}; path=/; max-age=31536000`
  }, [colorMode])

  const toggleColorMode = useCallback(() => {
    setColorMode((prev) => (prev === 'light' ? 'dark' : 'light'))
  }, [])

  const value = useMemo(
    () => ({
      colorMode,
      toggleColorMode,
      setColorMode,
    }),
    [colorMode, toggleColorMode]
  )

  return (
    <ChakraProvider value={system}>
      <ColorModeContext.Provider value={value}>{children}</ColorModeContext.Provider>
    </ChakraProvider>
  )
}

export function useColorMode() {
  const context = useContext(ColorModeContext)
  if (!context) {
    throw new Error('useColorMode must be used within Providers')
  }
  return context
}

