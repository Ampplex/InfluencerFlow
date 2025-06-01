import React, { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
}

interface ParticleBackgroundProps {
  className?: string
  particleCount?: number
  color?: string
}

export const ParticleBackground: React.FC<ParticleBackgroundProps> = ({
  className = '',
  particleCount = 50,
  color = '125, 211, 252'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const particlesRef = useRef<Particle[]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    const createParticles = () => {
      particlesRef.current = []
      for (let i = 0; i < particleCount; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: Math.random() * 2 + 1,
          opacity: Math.random() * 0.5 + 0.2
        })
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particlesRef.current.forEach((particle, index) => {
        // Update position
        particle.x += particle.vx
        particle.y += particle.vy

        // Bounce off edges
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1

        // Draw particle
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${color}, ${particle.opacity})`
        ctx.fill()

        // Draw connections
        particlesRef.current.slice(index + 1).forEach(otherParticle => {
          const dx = particle.x - otherParticle.x
          const dy = particle.y - otherParticle.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 100) {
            ctx.beginPath()
            ctx.moveTo(particle.x, particle.y)
            ctx.lineTo(otherParticle.x, otherParticle.y)
            ctx.strokeStyle = `rgba(${color}, ${0.1 * (1 - distance / 100)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        })
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    resizeCanvas()
    createParticles()
    animate()

    window.addEventListener('resize', () => {
      resizeCanvas()
      createParticles()
    })

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [particleCount, color])

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-0 ${className}`}
      style={{ background: 'transparent' }}
    />
  )
}