import { lazy, Suspense, ComponentType, ReactNode, useState, useEffect } from 'react'
import { motion } from 'framer-motion'

// Generic lazy loading wrapper
interface LazyWrapperProps {
  children: ReactNode
  fallback?: ReactNode
  className?: string
}

export function LazyWrapper({ 
  children, 
  fallback = <LoadingSkeleton />, 
  className 
}: LazyWrapperProps) {
  return (
    <Suspense fallback={fallback}>
      <div className={className}>
        {children}
      </div>
    </Suspense>
  )
}

// Loading skeleton component
export function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse ${className || ''}`}>
      <div className="bg-gray-200 rounded h-4 mb-2"></div>
      <div className="bg-gray-200 rounded h-4 mb-2 w-3/4"></div>
      <div className="bg-gray-200 rounded h-4 w-1/2"></div>
    </div>
  )
}

// Card skeleton for loading states
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={`border rounded-lg p-6 animate-pulse ${className || ''}`}>
      <div className="flex items-center space-x-4 mb-4">
        <div className="bg-gray-200 rounded-full h-12 w-12"></div>
        <div className="flex-1">
          <div className="bg-gray-200 rounded h-4 mb-2"></div>
          <div className="bg-gray-200 rounded h-3 w-2/3"></div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="bg-gray-200 rounded h-3"></div>
        <div className="bg-gray-200 rounded h-3 w-4/5"></div>
        <div className="bg-gray-200 rounded h-3 w-3/5"></div>
      </div>
    </div>
  )
}

// Intersection Observer based lazy loading
interface IntersectionLazyProps {
  children: ReactNode
  threshold?: number
  rootMargin?: string
  className?: string
  fallback?: ReactNode
}

export function IntersectionLazy({
  children,
  threshold = 0.1,
  rootMargin = '50px',
  className,
  fallback = <LoadingSkeleton />
}: IntersectionLazyProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [ref, inView] = useIntersectionObserver({
    threshold,
    rootMargin,
    triggerOnce: true
  })

  useEffect(() => {
    if (inView) {
      setIsVisible(true)
    }
  }, [inView])

  return (
    <div ref={ref} className={className}>
      {isVisible ? children : fallback}
    </div>
  )
}

// Hook for intersection observer
function useIntersectionObserver({
  threshold = 0,
  rootMargin = '0px',
  triggerOnce = false
}) {
  const [ref, setRef] = useState<Element | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    if (!ref) {return}

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          if (triggerOnce) {
            observer.unobserve(ref)
          }
        } else if (!triggerOnce) {
          setInView(false)
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(ref)

    return () => {
      observer.disconnect()
    }
  }, [ref, threshold, rootMargin, triggerOnce])

  return [setRef, inView] as const
}

// Lazy load components with motion
export function MotionLazy({
  children,
  delay = 0,
  className
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Factory function for creating lazy-loaded components
export function createLazyComponent<T extends (...args: any) => any>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: ReactNode
) {
  const LazyComponent = lazy(importFunc)
  
  return function LazyLoadedComponent(props: Parameters<T>[0]) {
    return (
      <Suspense fallback={fallback || <LoadingSkeleton />}>
        <LazyComponent {...props} />
      </Suspense>
    )
  }
}

// Preloader for critical components
export function preloadComponent(importFunc: () => Promise<any>) {
  // Preload the component
  importFunc()
}

// Common lazy-loaded components
export const LazyChart = createLazyComponent(
  () => import('../charts/Chart'),
  <div className="h-64 bg-gray-100 animate-pulse rounded"></div>
)

export const LazyMap = createLazyComponent(
  () => import('../maps/Map'),
  <div className="h-96 bg-gray-100 animate-pulse rounded"></div>
)

export const LazyCalendar = createLazyComponent(
  () => import('../calendar/Calendar'),
  <div className="h-96 bg-gray-100 animate-pulse rounded"></div>
)