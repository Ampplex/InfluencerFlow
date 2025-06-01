import React from 'react'
import { motion } from 'framer-motion'

interface FloatingElementsProps {
  children: React.ReactNode
  className?: string
  intensity?: 'light' | 'medium' | 'strong'
  direction?: 'up' | 'down' | 'left' | 'right' | 'circular'
  style?: React.CSSProperties
}

export const FloatingElements: React.FC<FloatingElementsProps> = ({
  children,
  className = '',
  intensity = 'medium',
  direction = 'up'
}) => {
  const getAnimationProps = () => {
    const intensityMap = {
      light: { distance: 10, duration: 8 },
      medium: { distance: 20, duration: 6 },
      strong: { distance: 30, duration: 4 }
    }

    const { distance, duration } = intensityMap[intensity]

    const directionMap = {
      up: { y: [-distance, distance] },
      down: { y: [distance, -distance] },
      left: { x: [-distance, distance] },
      right: { x: [distance, -distance] },
      circular: { 
        x: [-distance, distance, -distance],
        y: [-distance, distance, -distance]
      }
    }

    return {
      animate: directionMap[direction],
      transition: {
        duration,
        repeat: Infinity,
        repeatType: 'reverse' as const,
        ease: 'easeInOut'
      }
    }
  }

  return (
    <motion.div
      className={className}
      {...getAnimationProps()}
    >
      {children}
    </motion.div>
  )
}

export const FloatingGrid: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <FloatingElements
          key={i}
          intensity={Math.random() > 0.5 ? 'light' : 'medium'}
          direction={['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)] as any}
          className="absolute"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
        >
          <div 
            className="w-2 h-2 bg-cyber-400 rounded-full opacity-30"
            style={{
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        </FloatingElements>
      ))}
    </div>
  )
}