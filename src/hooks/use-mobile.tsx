import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    // Verificar se matchMedia está disponível
    if (typeof window !== 'undefined' && window.matchMedia) {
      try {
        const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
        const onChange = () => {
          setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
        }
        
        // Verificar se addEventListener está disponível (Edge mais novo)
        if (mql.addEventListener) {
          mql.addEventListener("change", onChange)
        } else if (mql.addListener) {
          // Fallback para Edge mais antigo
          mql.addListener(onChange)
        }
        
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
        
        return () => {
          if (mql.removeEventListener) {
            mql.removeEventListener("change", onChange)
          } else if (mql.removeListener) {
            mql.removeListener(onChange)
          }
        }
      } catch (error) {
        console.warn('matchMedia not supported, falling back to window resize')
        // Fallback usando resize event
        const onChange = () => {
          setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
        }
        
        window.addEventListener('resize', onChange)
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
        
        return () => window.removeEventListener('resize', onChange)
      }
    } else {
      // Fallback para quando matchMedia não está disponível
      setIsMobile(false) // Assumir desktop por padrão
    }
  }, [])

  return !!isMobile
}
