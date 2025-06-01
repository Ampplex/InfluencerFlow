import { Navbar } from './components/layout/Navbar'
import { Hero } from './components/sections/Hero'
import { About } from './components/sections/About'
import { Features } from './components/sections/Features'
import { Benefits } from './components/sections/Benefits'
import { Pricing } from './components/sections/Pricing'
import { FAQ } from './components/sections/FAQ'
import { Footer } from './components/sections/Footer'
import { ParticleBackground } from './components/effects/ParticleBackground'

function App() {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-50 via-white to-cyber-50 overflow-x-hidden">
      <ParticleBackground className="opacity-40" />
      
      <div className="relative z-10">
        <Navbar />
        
        <main>
          <Hero />
          <About />
          <Features />
          <Benefits />
          <Pricing />
          <FAQ />
        </main>
        
        <Footer />
      </div>
    </div>
  )
}

export default App