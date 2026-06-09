import { useState } from 'react'

interface SmartImageProps {
  src?: string
  fallbackSrc: string
  alt: string
  className?: string
}

export function SmartImage({ src, fallbackSrc, alt, className }: SmartImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src || fallbackSrc)

  return (
    <img
      src={currentSrc || fallbackSrc}
      alt={alt}
      className={className}
      onError={() => {
        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc)
        }
      }}
    />
  )
}
