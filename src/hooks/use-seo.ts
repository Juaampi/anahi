import { useEffect } from 'react'
import { siteConfig } from '../lib/constants'

interface SEOInput {
  title: string
  description?: string
  image?: string
}

export function useSEO({ title, description, image }: SEOInput) {
  useEffect(() => {
    const finalTitle = `${title} | ${siteConfig.name}`
    const finalDescription = description || siteConfig.description
    const finalImage = image || `${siteConfig.siteUrl}/og-cover.svg`

    document.title = finalTitle

    const setMeta = (property: string, content: string, isName = false) => {
      const selector = isName ? `meta[name="${property}"]` : `meta[property="${property}"]`
      let tag = document.head.querySelector(selector) as HTMLMetaElement | null
      if (!tag) {
        tag = document.createElement('meta')
        if (isName) {
          tag.name = property
        } else {
          tag.setAttribute('property', property)
        }
        document.head.appendChild(tag)
      }
      tag.content = content
    }

    setMeta('description', finalDescription, true)
    setMeta('og:title', finalTitle)
    setMeta('og:description', finalDescription)
    setMeta('og:image', finalImage)
    setMeta('og:type', 'website')
  }, [description, image, title])
}
