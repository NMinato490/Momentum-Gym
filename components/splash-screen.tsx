'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function SplashScreen() {
  const [show, setShow] = useState(true)

  useEffect(() => {
    // Hide splash screen after 2.5 seconds
    const timer = setTimeout(() => {
      setShow(false)
    }, 2500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.7, type: "spring", bounce: 0.4 }}
            className="flex flex-col items-center gap-6"
          >
            <svg viewBox="0 0 2048 2048" className="w-24 h-24 text-foreground" fill="currentColor">
              <path fillRule="evenodd" d="M1207.2,892.8l-175.6-178.3-375.9-2.5s209.8,148.4,222.7,155.1c-150.6,19.2-303.4,36.9-454.7,51.4.3,1.8,431,21,431,21l-16.5,62.2-558.7,39.8,538.8,30-10.9,47.7-474.6,31,455.7,53.1-34,134.2,186.5-2.5,79.2-333.7,132.2,113,106.6-60.2s163.3-91,164.3-91.8c25-19.3,80.4-23.5,80.4-23.5l201.2-.6s63.4-228.3,63.3-230.3M1262.2,1127l227.7.9s-14.6,61.7-16.3,61.5c-7.5,21,11.9,8.9-161.2,15.1-106.7-1.2-156.3,1.8-158.7-2.5-29-23.7-91.5-76.5-91.5-76.5l-15,59s-14.6,52-9.1,78.5c1.5,7.1,5.9,27.3,35.6,50.7,50.8,38.7,77,23.8,289.6,23.8s219.4,20,276.1-145.5,50.7-189.3,50.7-189.3h-241.5"/>
            </svg>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Momentum Gym</h1>
            <div className="flex items-center gap-2 mt-4">
              <motion.div 
                className="w-2.5 h-2.5 rounded-full bg-primary" 
                animate={{ y: [0, -10, 0] }} 
                transition={{ repeat: Infinity, duration: 0.8, delay: 0 }} 
              />
              <motion.div 
                className="w-2.5 h-2.5 rounded-full bg-primary" 
                animate={{ y: [0, -10, 0] }} 
                transition={{ repeat: Infinity, duration: 0.8, delay: 0.15 }} 
              />
              <motion.div 
                className="w-2.5 h-2.5 rounded-full bg-primary" 
                animate={{ y: [0, -10, 0] }} 
                transition={{ repeat: Infinity, duration: 0.8, delay: 0.3 }} 
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
