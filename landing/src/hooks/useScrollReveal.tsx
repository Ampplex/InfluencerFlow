import { useEffect, useRef } from 'react'

export const useScrollReveal = <T extends HTMLElement = HTMLDivElement>(threshold = 0.1) => {
  const ref = useRef<T>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          element.style.opacity = '1'
          element.style.transform = 'translateY(0)'
        }
      },
      { threshold, rootMargin: '0px 0px -50px 0px' }
    )

    element.style.opacity = '0'
    element.style.transform = 'translateY(50px)'
    element.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out'

    observer.observe(element)

    return () => observer.disconnect()
  }, [threshold])

  return ref
}