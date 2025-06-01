export interface Feature {
  id: string
  title: string
  description: string
  icon: string
  benefits: string[]
  color: string
}

export interface PricingPlan {
  id: string
  name: string
  price: string
  description: string
  features: string[]
  isPopular?: boolean
  buttonText: string
  buttonAction: () => void
}

export interface FAQ {
  id: string
  question: string
  answer: string
}

export interface Benefit {
  id: string
  title: string
  description: string
  icon: string
  stat: string
  delay: number
}

export interface NavItem {
  label: string
  href: string
}

export interface SocialLink {
  platform: string
  url: string
  icon: string
}