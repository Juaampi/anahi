import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useSEO } from '../hooks/use-seo'
import { BenefitsSection } from '../components/home/benefits-section'
import { BrandsSection } from '../components/home/brands-section'
import { CategoryStrip } from '../components/home/category-strip'
import { ClosingCtaSection } from '../components/home/closing-cta-section'
import { FeaturedGrid } from '../components/home/featured-grid'
import { HeroSection } from '../components/home/hero-section'
import { InfoCardsSection } from '../components/home/info-cards-section'
import { MapSection } from '../components/home/map-section'
import { PromoEditorialSection } from '../components/home/promo-editorial-section'
import { WhySection } from '../components/home/why-section'
import { fallbackStorefront } from '../lib/fallback-data'

export function HomePage() {
  useSEO({ title: 'Home' })
  const { data } = useQuery({
    queryKey: ['storefront'],
    queryFn: api.storefront,
    retry: false,
  })
  const storefront = data || fallbackStorefront

  return (
    <>
      <HeroSection />
      <BenefitsSection />
      <PromoEditorialSection />
      <CategoryStrip categories={storefront.categories} />
      <BrandsSection />
      <FeaturedGrid
        title="Lo mas elegido por profesionales"
        subtitle="Insumos de alta rotacion para tu mesa de trabajo, salon o estudio."
        products={storefront.featuredProducts}
      />
      <WhySection />
      <InfoCardsSection />
      <MapSection />
      <ClosingCtaSection />
    </>
  )
}
