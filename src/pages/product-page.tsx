import { useQuery } from '@tanstack/react-query'
import { Minus, Plus, ShoppingBag } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Navigation, Pagination, Thumbs } from 'swiper/modules'
import type { Swiper as SwiperType } from 'swiper'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import 'swiper/css/thumbs'
import { ProductCard } from '../components/catalog/product-card'
import { PaymentSimulator } from '../components/product/payment-simulator'
import { SmartImage } from '../components/ui/smart-image'
import { useSEO } from '../hooks/use-seo'
import { api } from '../lib/api'
import { getProductFallbackImage } from '../lib/constants'
import { buildStorePath, buildWhatsAppLink, cn, formatCurrency } from '../lib/utils'
import { useCartStore } from '../store/cart-store'
import type { StoreSite } from '../types'

function getVariantSwatchColor(color: string) {
  const normalized = color.trim().toLowerCase()
  if (normalized.includes('negro')) return '#111111'
  if (normalized.includes('blanco')) return '#f6f4ef'
  if (normalized.includes('nude')) return '#d3a48f'
  if (normalized.includes('pink') || normalized.includes('rosa')) return '#d98ba4'
  if (normalized.includes('beige') || normalized.includes('arena') || normalized.includes('stone')) return '#c8b39a'
  if (normalized.includes('bord') || normalized.includes('cherry')) return '#8a284f'
  return '#9bbec8'
}

function getStockMessage(stock: number) {
  if (stock <= 0) return 'Sin stock'
  if (stock <= 4) return `Ultimas ${stock} unidades`
  return 'Disponible para entrega'
}

export function ProductPage({ site }: { site?: StoreSite }) {
  const { slug = '' } = useParams()
  const { data: product } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => api.productBySlug(slug),
  })
  const { data: related } = useQuery({
    queryKey: ['products', 'related', product?.categoryId, site],
    queryFn: () => api.products(new URLSearchParams(product ? { category: product.categoryId, site: site || product.site } : {})),
    enabled: Boolean(product),
  })
  const addItem = useCartStore((state) => state.addItem)
  const [quantity, setQuantity] = useState(1)
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null)
  const [selectedVariantId, setSelectedVariantId] = useState<string>('')

  useSEO({
    title: product?.name || 'Producto',
    description: product?.shortDescription,
    image: product?.imageUrls[0],
  })

  const relatedProducts = useMemo(
    () => (related || []).filter((item) => item.slug !== slug).slice(0, 4),
    [related, slug],
  )

  if (!product) {
    return <section className="px-4 py-20 text-center text-[var(--color-muted)]">Cargando producto...</section>
  }

  if (site && product.site !== site) {
    return <section className="px-4 py-20 text-center text-[var(--color-muted)]">Este producto no pertenece a esta tienda.</section>
  }

  const selectedVariant =
    product.variants.find((variant) => variant.id === selectedVariantId) ||
    product.variants[0] ||
    null
  const variantStock = selectedVariant?.stock ?? product.stock
  const primaryImage = selectedVariant?.imageUrl || product.imageUrls[0]

  const galleryImages = [primaryImage, ...product.imageUrls.filter((image) => image !== primaryImage)]
    .filter(Boolean)
  const finalGalleryImages = galleryImages.length > 0
    ? galleryImages
    : ['/anahi-diamond-logo.png']

  return (
    <section className="bg-transparent py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-5 text-sm text-[var(--color-muted)]">
          <Link to={buildStorePath(product.site, '/productos')}>Productos</Link> / <span>{product.name}</span>
        </div>
        <div className="grid gap-8 rounded-[32px] border border-[var(--color-border)] bg-white p-5 shadow-[0_24px_70px_rgba(17,24,39,0.08)] lg:grid-cols-[0.86fr,1.14fr] lg:p-8">
          <div className="mx-auto w-full max-w-[520px] space-y-4">
            <div className="overflow-hidden rounded-[28px] border border-[var(--color-border)] bg-[#faf7f5]">
              <Swiper
                modules={[Navigation, Pagination, Thumbs]}
                navigation
                pagination={{ clickable: true }}
                thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
                className="product-gallery-main"
              >
                {finalGalleryImages.map((image) => (
                  <SwiperSlide key={image}>
                    <div className="aspect-[4/4.15] w-full bg-[#faf7f5]">
                      <SmartImage
                        src={image}
                        fallbackSrc={getProductFallbackImage(product.categoryName, product.name)}
                        alt={product.name}
                        className="h-full w-full p-4 object-contain sm:p-6"
                      />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>

            <Swiper
              modules={[Thumbs]}
              onSwiper={setThumbsSwiper}
              watchSlidesProgress
              slidesPerView={4}
              spaceBetween={12}
              breakpoints={{
                320: { slidesPerView: 4 },
                768: { slidesPerView: 5 },
              }}
              className="product-gallery-thumbs"
            >
              {finalGalleryImages.map((image) => (
                <SwiperSlide key={`${image}-thumb`}>
                  <button className="overflow-hidden rounded-[18px] border border-[var(--color-border)] bg-white">
                    <SmartImage
                      src={image}
                      fallbackSrc={getProductFallbackImage(product.categoryName, product.name)}
                      alt={product.name}
                      className="aspect-square h-full w-full object-contain p-2"
                    />
                  </button>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          <div className="space-y-6 text-[var(--color-primary)]">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-muted)]">
                {[product.categoryName, product.subcategory, product.brand].filter(Boolean).join(' · ')}
              </p>
              <h1 className="font-display text-4xl font-extrabold tracking-[-0.03em]">{product.name}</h1>
              <p className="max-w-2xl text-base leading-7 text-[var(--color-muted)]">{product.description}</p>
            </div>
            <div className="flex items-end gap-3">
              <span className="font-display text-4xl font-bold text-[var(--color-primary)]">
                {formatCurrency(product.price)}
              </span>
              {product.compareAtPrice ? (
                <span className="pb-1 text-lg text-[var(--color-muted)] line-through">
                  {formatCurrency(product.compareAtPrice)}
                </span>
              ) : null}
            </div>
            <div className="inline-flex rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-primary)]">
              {getStockMessage(variantStock)}
            </div>
            {product.variants.length > 0 ? (
              <div className="space-y-3 rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                <p className="text-sm font-semibold text-[var(--color-primary)]">Elegí una variante</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {product.variants.map((variant) => {
                    const isActive = (selectedVariant?.id || product.variants[0]?.id) === variant.id
                    return (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => {
                          setSelectedVariantId(variant.id)
                          setQuantity(1)
                        }}
                        className={`flex items-center gap-3 rounded-[20px] border px-4 py-3 text-left transition ${
                          isActive
                            ? 'border-[var(--color-primary)] bg-white shadow-[0_12px_24px_rgba(17,24,39,0.08)]'
                            : 'border-[var(--color-border)] bg-white'
                        }`}
                      >
                        <span
                          className="inline-flex h-8 w-8 rounded-full border border-black/10"
                          style={{ backgroundColor: getVariantSwatchColor(variant.color) }}
                        />
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-[var(--color-primary)]">
                            {variant.name || variant.color}
                          </span>
                          <span className="block text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">
                            {variant.color} · {getStockMessage(variant.stock)}
                          </span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : null}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]">
                <button
                  type="button"
                  className="px-4 py-3 text-[var(--color-primary)]"
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                >
                  <Minus size={16} />
                </button>
                <span className="min-w-12 text-center text-sm font-semibold">{quantity}</span>
                <button
                  type="button"
                  className="px-4 py-3 text-[var(--color-primary)]"
                  onClick={() => setQuantity((value) => Math.min(variantStock, value + 1))}
                >
                  <Plus size={16} />
                </button>
              </div>
              <button
                type="button"
                disabled={variantStock <= 0}
                onClick={() => addItem(product, quantity, selectedVariant)}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] px-6 py-4 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(17,24,39,0.14)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ShoppingBag size={17} />
                Agregar al carrito
              </button>
              <Link
                to="/checkout"
                onClick={(event) => {
                  if (variantStock <= 0) {
                    event.preventDefault()
                    return
                  }
                  addItem(product, quantity, selectedVariant)
                }}
                className={cn(
                  'inline-flex items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-4 text-sm font-semibold text-[var(--color-primary)]',
                  variantStock <= 0 ? 'pointer-events-none opacity-50' : '',
                )}
              >
                Comprar ahora
              </Link>
            </div>
            <a
              href={buildWhatsAppLink(`Hola! Quiero consultar por ${product.name}${selectedVariant ? `, variante ${selectedVariant.name || selectedVariant.color}` : ''}.`)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex text-sm font-semibold text-[var(--color-primary)]"
            >
              Consultar este producto por WhatsApp
            </a>
            <PaymentSimulator price={product.price} />
          </div>
        </div>

        {relatedProducts.length > 0 ? (
          <div className="mt-16">
            <h2 className="font-display mb-6 text-3xl font-extrabold tracking-[-0.025em] text-[var(--color-primary)]">
              Productos relacionados
            </h2>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {relatedProducts.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
