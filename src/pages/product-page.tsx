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
import { buildWhatsAppLink, formatCurrency } from '../lib/utils'
import { useCartStore } from '../store/cart-store'

export function ProductPage() {
  const { slug = '' } = useParams()
  const { data: product } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => api.productBySlug(slug),
  })
  const { data: related } = useQuery({
    queryKey: ['products', 'related', product?.categoryId],
    queryFn: () => api.products(new URLSearchParams(product ? { category: product.categoryId } : {})),
    enabled: Boolean(product),
  })
  const addItem = useCartStore((state) => state.addItem)
  const [quantity, setQuantity] = useState(1)
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null)

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

  const galleryImages = product.imageUrls.length > 0
    ? product.imageUrls
    : ['/anahi-diamond-logo.png']

  return (
    <section className="bg-transparent py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-5 text-sm text-[var(--color-muted)]">
          <Link to="/productos">Productos</Link> / <span>{product.name}</span>
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
                {galleryImages.map((image) => (
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
              {galleryImages.map((image) => (
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
              <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-muted)]">{product.categoryName}</p>
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
              Stock disponible: {product.stock}
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]">
                <button
                  className="px-4 py-3 text-[var(--color-primary)]"
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                >
                  <Minus size={16} />
                </button>
                <span className="min-w-12 text-center text-sm font-semibold">{quantity}</span>
                <button
                  className="px-4 py-3 text-[var(--color-primary)]"
                  onClick={() => setQuantity((value) => Math.min(product.stock, value + 1))}
                >
                  <Plus size={16} />
                </button>
              </div>
              <button
                onClick={() => addItem(product, quantity)}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] px-6 py-4 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(17,24,39,0.14)]"
              >
                <ShoppingBag size={17} />
                Agregar al carrito
              </button>
              <Link
                to="/checkout"
                onClick={() => addItem(product, quantity)}
                className="inline-flex items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-4 text-sm font-semibold text-[var(--color-primary)]"
              >
                Comprar ahora
              </Link>
            </div>
            <a
              href={buildWhatsAppLink(`Hola! Quiero consultar por ${product.name}.`)}
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
