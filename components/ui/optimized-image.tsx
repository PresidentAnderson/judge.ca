import Image, { ImageProps } from 'next/image'
import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad' | 'onError'> {
  fallbackSrc?: string
  loadingClassName?: string
  errorClassName?: string
  containerClassName?: string
  priority?: boolean
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
}

export function OptimizedImage({
  src,
  alt,
  fallbackSrc = '/images/placeholder.jpg',
  loadingClassName = 'animate-pulse bg-gray-200',
  errorClassName = 'bg-gray-100 flex items-center justify-center text-gray-400',
  containerClassName,
  className,
  priority = false,
  placeholder = 'empty',
  blurDataURL,
  ...props
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState(src)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleLoad = useCallback(() => {
    setIsLoading(false)
    setHasError(false)
  }, [])

  const handleError = useCallback(() => {
    setIsLoading(false)
    setHasError(true)
    if (fallbackSrc && imageSrc !== fallbackSrc) {
      setImageSrc(fallbackSrc)
    }
  }, [fallbackSrc, imageSrc])

  if (hasError && imageSrc === fallbackSrc) {
    return (
      <div 
        className={cn(
          errorClassName,
          className,
          containerClassName
        )}
        {...(props.width && props.height ? {
          style: { width: props.width, height: props.height }
        } : {})}
      >
        <span className="text-sm">Image not available</span>
      </div>
    )
  }

  return (
    <div className={cn('relative overflow-hidden', containerClassName)}>
      {isLoading && (
        <div 
          className={cn(
            'absolute inset-0 z-10',
            loadingClassName
          )}
        />
      )}
      <Image
        src={imageSrc}
        alt={alt}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          className
        )}
        onLoad={handleLoad}
        onError={handleError}
        priority={priority}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        quality={85}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        {...props}
      />
    </div>
  )
}

// Pre-configured variants for common use cases
export function HeroImage(props: OptimizedImageProps) {
  return (
    <OptimizedImage
      priority
      quality={90}
      sizes="100vw"
      placeholder="blur"
      {...props}
    />
  )
}

export function ThumbnailImage(props: OptimizedImageProps) {
  return (
    <OptimizedImage
      quality={75}
      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 200px"
      {...props}
    />
  )
}

export function ProfileImage(props: OptimizedImageProps) {
  return (
    <OptimizedImage
      quality={80}
      sizes="(max-width: 640px) 100px, 150px"
      className="rounded-full"
      {...props}
    />
  )
}