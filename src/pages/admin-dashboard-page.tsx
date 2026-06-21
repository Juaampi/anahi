import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Copy, Menu, Package, Settings, Shapes, ShoppingCart, TicketPercent, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useSEO } from '../hooks/use-seo'
import { api } from '../lib/api'
import { brandConfigs, storeSites } from '../lib/constants'
import { cn, formatCurrency, normalizeCouponCode, slugify } from '../lib/utils'
import type {
  Category,
  DiscountCoupon,
  Product,
  ProductBadge,
  ProductVariant,
  StoreSettings,
  StoreSite,
} from '../types'

type AdminTab = 'products' | 'categories' | 'orders' | 'coupons' | 'settings'

const panelClass =
  'rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface-card)] shadow-[0_18px_40px_rgba(17,24,39,0.08)]'
const inputClass =
  'w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] outline-none'
const outlineButtonClass =
  'rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm font-semibold text-[var(--color-text)]'

const adminTabs: Array<{
  key: AdminTab
  label: string
  description: string
  icon: typeof Package
}> = [
  { key: 'products', label: 'Productos', description: 'Listado, edición y stock', icon: Package },
  { key: 'categories', label: 'Categorias', description: 'Ordená la tienda', icon: Shapes },
  { key: 'orders', label: 'Pedidos', description: 'Seguimiento comercial', icon: ShoppingCart },
  { key: 'coupons', label: 'Cupones', description: 'Promos y descuentos', icon: TicketPercent },
  { key: 'settings', label: 'Configuracion', description: 'Envios y checkout', icon: Settings },
]

const emptyProductForm = (): Partial<Product> => ({
  name: '',
  slug: '',
  sku: '',
  shortDescription: '',
  description: '',
  price: 0,
  compareAtPrice: 0,
  stock: 0,
  imageUrls: [''],
  badges: [],
  featured: false,
  categoryId: '',
  site: 'anahinails',
  subcategory: '',
  variants: [],
})

const emptyCategoryForm: Partial<Category> = {
  name: '',
  description: '',
  slug: '',
  site: 'anahinails',
  imageUrl: '',
  subcategories: [],
}

const emptyCouponForm: Partial<DiscountCoupon> = {
  code: '',
  description: '',
  type: 'percentage',
  value: 0,
  minSubtotal: null,
  active: true,
  startsAt: '',
  endsAt: '',
  usageLimit: null,
}

const defaultSettingsForm: StoreSettings = {
  id: 'main',
  standardShippingLabel: 'Envío a domicilio',
  standardShippingCost: 0,
  branchShippingEnabled: true,
  branchShippingLabel: 'Envío a sucursal',
  branchShippingCost: 0,
  freeShippingEnabled: true,
  freeShippingThreshold: 250000,
}

const badgeOptions: Array<{ value: ProductBadge; label: string }> = [
  { value: 'new', label: 'Nuevo' },
  { value: 'sale', label: 'Oferta' },
  { value: 'best-seller', label: 'Mas vendido' },
]

function emptyVariant(): ProductVariant {
  return { id: '', name: '', color: '', imageUrl: '', stock: 0 }
}

function toLocalDateTime(value?: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

function parseSubcategories(value: string) {
  return Array.from(
    new Set(
      value
        .split(/\r?\n|,/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  )
}

function buildDuplicateSlug(slug?: string, name?: string) {
  const base = slugify(slug || name || 'producto')
  return `${base || 'producto'}-${Date.now().toString().slice(-6)}`
}

function normalizeInlineNumber(value: string) {
  if (!value.trim()) return 0
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function ProductEditorModal({
  open,
  form,
  categories,
  uploadingImage,
  onClose,
  onChange,
  onSubmit,
  onUpload,
  pending,
}: {
  open: boolean
  form: Partial<Product>
  categories: Category[]
  uploadingImage: boolean
  onClose: () => void
  onChange: (updater: (current: Partial<Product>) => Partial<Product>) => void
  onSubmit: () => void
  onUpload: (files: FileList | File[]) => void
  pending: boolean
}) {
  if (!open) return null

  const selectedCategory = categories.find((category) => category.id === form.categoryId)
  const availableSubcategories = selectedCategory?.subcategories || []

  return (
    <div className="fixed inset-0 z-50 bg-black/50 p-3 sm:p-6" onClick={onClose}>
      <div
        className="mx-auto h-full max-w-4xl overflow-y-auto rounded-[2rem] bg-[var(--color-surface-card)] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-muted)]">Editor de producto</p>
            <h3 className="mt-2 font-display text-3xl font-black tracking-[-0.04em] text-[var(--color-text)]">
              {form.id ? 'Editar producto' : 'Nuevo producto'}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-[var(--color-border)] p-3">
            <X size={18} />
          </button>
        </div>

        <form
          className="mt-6 grid gap-5"
          onSubmit={(event) => {
            event.preventDefault()
            onSubmit()
          }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="mb-2 block text-sm font-medium text-[var(--color-muted)]">Nombre</span>
              <input
                value={form.name || ''}
                onChange={(event) =>
                  onChange((current) => ({
                    ...current,
                    name: event.target.value,
                    slug: current.id ? current.slug : slugify(event.target.value),
                  }))
                }
                className={inputClass}
              />
            </label>
            <label>
              <span className="mb-2 block text-sm font-medium text-[var(--color-muted)]">SKU</span>
              <input
                value={form.sku || ''}
                onChange={(event) => onChange((current) => ({ ...current, sku: event.target.value }))}
                className={inputClass}
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label>
              <span className="mb-2 block text-sm font-medium text-[var(--color-muted)]">Sitio</span>
              <select
                value={form.site || 'anahinails'}
                onChange={(event) =>
                  onChange((current) => ({
                    ...current,
                    site: event.target.value as StoreSite,
                    categoryId: '',
                  }))
                }
                className={inputClass}
              >
                {storeSites.map((site) => (
                  <option key={site} value={site}>
                    {brandConfigs[site].name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="mb-2 block text-sm font-medium text-[var(--color-muted)]">Categoría</span>
              <select
                value={form.categoryId || ''}
                onChange={(event) =>
                  onChange((current) => ({
                    ...current,
                    categoryId: event.target.value,
                    subcategory: '',
                  }))
                }
                className={inputClass}
              >
                <option value="">Seleccionar</option>
                {categories
                  .filter((category) => category.site === (form.site || 'anahinails'))
                  .map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              <span className="mb-2 block text-sm font-medium text-[var(--color-muted)]">Subcategoría</span>
              {availableSubcategories.length > 0 ? (
                <select
                  value={form.subcategory || ''}
                  onChange={(event) => onChange((current) => ({ ...current, subcategory: event.target.value }))}
                  className={cn(inputClass, 'mb-3')}
                >
                  <option value="">Seleccionar subcategoría</option>
                  {availableSubcategories.map((subcategory) => (
                    <option key={subcategory} value={subcategory}>
                      {subcategory}
                    </option>
                  ))}
                </select>
              ) : null}
              <input
                value={form.subcategory || ''}
                onChange={(event) => onChange((current) => ({ ...current, subcategory: event.target.value }))}
                placeholder={availableSubcategories.length > 0 ? 'O escribir una nueva subcategoría' : 'Subcategoría'}
                className={inputClass}
              />
            </label>
          </div>

          <label>
            <span className="mb-2 block text-sm font-medium text-[var(--color-muted)]">Descripción corta</span>
            <input
              value={form.shortDescription || ''}
              onChange={(event) => onChange((current) => ({ ...current, shortDescription: event.target.value }))}
              className={inputClass}
            />
          </label>

          <label>
            <span className="mb-2 block text-sm font-medium text-[var(--color-muted)]">Descripción</span>
            <textarea
              value={form.description || ''}
              onChange={(event) => onChange((current) => ({ ...current, description: event.target.value }))}
              className={cn(inputClass, 'min-h-32')}
            />
          </label>

          <div className="grid gap-4 md:grid-cols-4">
            <label>
              <span className="mb-2 block text-sm font-medium text-[var(--color-muted)]">Precio</span>
              <input
                type="number"
                min="0"
                value={form.price || 0}
                onChange={(event) => onChange((current) => ({ ...current, price: Number(event.target.value) }))}
                className={inputClass}
              />
            </label>
            <label>
              <span className="mb-2 block text-sm font-medium text-[var(--color-muted)]">Precio anterior</span>
              <input
                type="number"
                min="0"
                value={form.compareAtPrice || 0}
                onChange={(event) =>
                  onChange((current) => ({ ...current, compareAtPrice: Number(event.target.value) || null }))
                }
                className={inputClass}
              />
            </label>
            <label>
              <span className="mb-2 block text-sm font-medium text-[var(--color-muted)]">Stock</span>
              <input
                type="number"
                min="0"
                value={form.stock || 0}
                onChange={(event) => onChange((current) => ({ ...current, stock: Number(event.target.value) }))}
                className={inputClass}
              />
            </label>
            <label className="flex items-end">
              <span className="flex w-full items-center gap-3 rounded-2xl bg-[var(--color-surface)] px-4 py-3 text-sm font-medium text-[var(--color-text)]">
                <input
                  type="checkbox"
                  checked={Boolean(form.featured)}
                  onChange={(event) => onChange((current) => ({ ...current, featured: event.target.checked }))}
                  className="h-4 w-4 accent-[var(--color-accent)]"
                />
                Producto destacado
              </span>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr),280px]">
            <label>
              <span className="mb-2 block text-sm font-medium text-[var(--color-muted)]">Imagen principal</span>
              <input
                value={form.imageUrls?.[0] || ''}
                onChange={(event) =>
                  onChange((current) => ({
                    ...current,
                    imageUrls: [event.target.value, ...(current.imageUrls || []).slice(1)],
                  }))
                }
                className={inputClass}
              />
            </label>
            <label className="rounded-[1.5rem] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4 text-sm text-[var(--color-muted)]">
              <span className="mb-2 block font-medium text-[var(--color-text)]">Subir imágenes</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => {
                  const files = event.target.files
                  if (files?.length) {
                    onUpload(files)
                    event.target.value = ''
                  }
                }}
                className="block w-full"
              />
              <span className="mt-2 block text-xs">{uploadingImage ? 'Subiendo...' : 'Carga directa a Cloudinary al seleccionar'}</span>
            </label>
          </div>

          <div className={cn(panelClass, 'p-5')}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="font-semibold text-[var(--color-text)]">Galería del producto</h4>
                <p className="text-sm text-[var(--color-muted)]">Podés subir varias imágenes. La primera queda como principal.</p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(form.imageUrls || []).filter(Boolean).map((image, index) => (
                <div key={`${image}-${index}`} className="overflow-hidden rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)]">
                  <div className="aspect-square bg-white">
                    <img src={image} alt={`Imagen ${index + 1}`} className="h-full w-full object-contain p-3" />
                  </div>
                  <div className="flex items-center justify-between gap-3 border-t border-[var(--color-border)] px-3 py-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                      {index === 0 ? 'Principal' : `Imagen ${index + 1}`}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onChange((current) => ({
                          ...current,
                          imageUrls: (current.imageUrls || []).filter((_, itemIndex) => itemIndex !== index),
                        }))
                      }
                      className="inline-flex items-center gap-2 rounded-full border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600"
                    >
                      <Trash2 size={14} />
                      Quitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {badgeOptions.map((badge) => (
              <label
                key={badge.value}
                className="flex items-center gap-3 rounded-2xl bg-[var(--color-surface)] px-4 py-3 text-sm font-medium text-[var(--color-text)]"
              >
                <input
                  type="checkbox"
                  checked={Boolean(form.badges?.includes(badge.value))}
                  onChange={(event) =>
                    onChange((current) => ({
                      ...current,
                      badges: event.target.checked
                        ? [...new Set([...(current.badges || []), badge.value])]
                        : (current.badges || []).filter((item) => item !== badge.value),
                    }))
                  }
                  className="h-4 w-4 accent-[var(--color-accent)]"
                />
                {badge.label}
              </label>
            ))}
          </div>

          <div className={cn(panelClass, 'p-5')}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="font-semibold text-[var(--color-text)]">Variantes</h4>
                <p className="text-sm text-[var(--color-muted)]">Color, nombre, foto y stock por variante.</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  onChange((current) => ({ ...current, variants: [...(current.variants || []), emptyVariant()] }))
                }
                className={outlineButtonClass}
              >
                Agregar variante
              </button>
            </div>

            <div className="mt-4 grid gap-4">
              {(form.variants || []).map((variant, index) => (
                <div key={`${variant.id || 'variant'}-${index}`} className="rounded-[1.5rem] border border-[var(--color-border)] p-4">
                  <div className="grid gap-4 md:grid-cols-4">
                    <input
                      value={variant.name || ''}
                      onChange={(event) =>
                        onChange((current) => ({
                          ...current,
                          variants: (current.variants || []).map((item, itemIndex) =>
                            itemIndex === index ? { ...item, name: event.target.value } : item,
                          ),
                        }))
                      }
                      placeholder="Nombre"
                      className={inputClass}
                    />
                    <input
                      value={variant.color || ''}
                      onChange={(event) =>
                        onChange((current) => ({
                          ...current,
                          variants: (current.variants || []).map((item, itemIndex) =>
                            itemIndex === index ? { ...item, color: event.target.value } : item,
                          ),
                        }))
                      }
                      placeholder="Color"
                      className={inputClass}
                    />
                    <input
                      type="number"
                      min="0"
                      value={variant.stock || 0}
                      onChange={(event) =>
                        onChange((current) => ({
                          ...current,
                          variants: (current.variants || []).map((item, itemIndex) =>
                            itemIndex === index ? { ...item, stock: Number(event.target.value) } : item,
                          ),
                        }))
                      }
                      placeholder="Stock"
                      className={inputClass}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        onChange((current) => ({
                          ...current,
                          variants: (current.variants || []).filter((_, itemIndex) => itemIndex !== index),
                        }))
                      }
                      className="rounded-full border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600"
                    >
                      Eliminar
                    </button>
                  </div>
                  <input
                    value={variant.imageUrl || ''}
                    onChange={(event) =>
                      onChange((current) => ({
                        ...current,
                        variants: (current.variants || []).map((item, itemIndex) =>
                          itemIndex === index ? { ...item, imageUrl: event.target.value } : item,
                        ),
                      }))
                    }
                    placeholder="URL de imagen de la variante"
                    className={cn(inputClass, 'mt-4')}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className={outlineButtonClass}>
              Cancelar
            </button>
            <button className="btn-primary rounded-full px-6 py-4 text-sm font-semibold">
              {pending ? 'Guardando...' : 'Guardar producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function AdminDashboardPage() {
  useSEO({ title: 'Dashboard admin' })
  const queryClient = useQueryClient()
  const [token] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('admin-token') || '' : '',
  )
  const [activeTab, setActiveTab] = useState<AdminTab>('products')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [productEditorOpen, setProductEditorOpen] = useState(false)
  const [productSearch, setProductSearch] = useState('')
  const [productListError, setProductListError] = useState('')
  const [form, setForm] = useState<Partial<Product>>(emptyProductForm())
  const [productDrafts, setProductDrafts] = useState<Record<string, { name: string; price: string; compareAtPrice: string; stock: string }>>({})
  const [categoryForm, setCategoryForm] = useState<Partial<Category>>(emptyCategoryForm)
  const [couponForm, setCouponForm] = useState<Partial<DiscountCoupon>>(emptyCouponForm)
  const [settingsForm, setSettingsForm] = useState<StoreSettings | null>(null)

  const productsQuery = useQuery({
    queryKey: ['admin-products', token],
    queryFn: () => api.adminProducts(token),
    enabled: Boolean(token),
  })
  const categoriesQuery = useQuery({
    queryKey: ['admin-categories', token],
    queryFn: () => api.adminCategories(token),
    enabled: Boolean(token),
  })
  const ordersQuery = useQuery({
    queryKey: ['admin-orders', token],
    queryFn: () => api.adminOrders(token),
    enabled: Boolean(token),
  })
  const couponsQuery = useQuery({
    queryKey: ['admin-coupons', token],
    queryFn: () => api.adminCoupons(token),
    enabled: Boolean(token),
  })
  const settingsQuery = useQuery({
    queryKey: ['admin-settings', token],
    queryFn: () => api.adminSettings(token),
    enabled: Boolean(token),
  })

  const categories = categoriesQuery.data || []
  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase()
    const items = productsQuery.data || []
    if (!query) return items
    return items.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query) ||
        product.categoryName.toLowerCase().includes(query),
    )
  }, [productSearch, productsQuery.data])

  const settingsDraft = settingsForm || settingsQuery.data || defaultSettingsForm

  const refreshProducts = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-products'] })
    queryClient.invalidateQueries({ queryKey: ['products'] })
    queryClient.invalidateQueries({ queryKey: ['product'] })
    queryClient.invalidateQueries({ queryKey: ['storefront'] })
  }

  const productMutation = useMutation({
    mutationFn: () => (form.id ? api.updateProduct(token, form.id, form) : api.saveProduct(token, form)),
    onSuccess: () => {
      refreshProducts()
      setForm(emptyProductForm())
      setUploadError('')
      setProductEditorOpen(false)
    },
  })

  const stockMutation = useMutation({
    mutationFn: ({ product, stock }: { product: Product; stock: number }) =>
      api.updateProduct(token, product.id, { ...product, stock: Math.max(0, stock) }),
    onSuccess: () => {
      setProductListError('')
      refreshProducts()
    },
    onError: (error) => {
      setProductListError(error instanceof Error ? error.message : 'No se pudo actualizar el stock.')
    },
  })

  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => api.deleteProduct(token, id),
    onSuccess: () => {
      setProductListError('')
      refreshProducts()
    },
    onError: (error) => {
      setProductListError(error instanceof Error ? error.message : 'No se pudo eliminar el producto.')
    },
  })

  const quickEditMutation = useMutation({
    mutationFn: (product: Product) => {
      const draft = productDrafts[product.id]
      return api.updateProduct(token, product.id, {
        ...product,
        name: draft?.name ?? product.name,
        price: normalizeInlineNumber(draft?.price ?? String(product.price)),
        compareAtPrice: (draft?.compareAtPrice ?? '').trim()
          ? normalizeInlineNumber(draft?.compareAtPrice ?? '')
          : null,
        stock: Math.max(0, normalizeInlineNumber(draft?.stock ?? String(product.stock))),
      })
    },
    onSuccess: () => {
      setProductListError('')
      refreshProducts()
    },
    onError: (error) => {
      setProductListError(error instanceof Error ? error.message : 'No se pudo guardar la edición rápida.')
    },
  })

  const categoryMutation = useMutation({
    mutationFn: () =>
      categoryForm.id
        ? api.updateCategory(token, categoryForm.id, categoryForm)
        : api.saveCategory(token, categoryForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setCategoryForm(emptyCategoryForm)
    },
  })

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => api.deleteCategory(token, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-categories'] }),
  })

  const couponMutation = useMutation({
    mutationFn: () =>
      couponForm.id ? api.updateCoupon(token, couponForm.id, couponForm) : api.saveCoupon(token, couponForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] })
      setCouponForm(emptyCouponForm)
    },
  })

  const deleteCouponMutation = useMutation({
    mutationFn: (id: string) => api.deleteCoupon(token, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-coupons'] }),
  })

  const orderStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.updateOrderStatus(token, id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-orders'] }),
  })

  const settingsMutation = useMutation({
    mutationFn: () => api.saveSettings(token, settingsDraft),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] })
      queryClient.invalidateQueries({ queryKey: ['store-settings'] })
    },
  })

  async function uploadImage(files: FileList | File[]) {
    setUploadingImage(true)
    setUploadError('')
    try {
      const selectedFiles = Array.from(files)
      if (selectedFiles.length === 0) return
      const signature = await api.signCloudinaryUpload(token, 'anahi-nails-diamond/products')
      const uploadedUrls: string[] = []

      for (const file of selectedFiles) {
        const data = new FormData()
        data.append('file', file)
        data.append('api_key', signature.apiKey)
        data.append('timestamp', String(signature.timestamp))
        data.append('signature', signature.signature)
        data.append('folder', signature.folder)

        const response = await fetch(`https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`, {
          method: 'POST',
          body: data,
        })
        const result = (await response.json()) as { secure_url?: string; error?: { message?: string } }
        if (!response.ok) {
          throw new Error(result.error?.message || `No se pudo subir ${file.name}.`)
        }
        if (!result.secure_url) {
          throw new Error(`Cloudinary no devolvió la URL para ${file.name}.`)
        }
        uploadedUrls.push(result.secure_url)
      }

      setForm((current) => ({
        ...current,
        imageUrls: [...new Set([...(current.imageUrls || []).filter(Boolean), ...uploadedUrls])],
      }))
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'No se pudo subir la imagen.')
    } finally {
      setUploadingImage(false)
    }
  }

  function openNewProduct() {
    setForm(emptyProductForm())
    setUploadError('')
    setProductEditorOpen(true)
  }

  function openEditProduct(product: Product) {
    setForm({
      ...product,
      imageUrls: product.imageUrls?.length ? product.imageUrls : [''],
      variants: product.variants || [],
    })
    setUploadError('')
    setProductEditorOpen(true)
  }

  function openDuplicateProduct(product: Product) {
    setForm({
      ...product,
      id: undefined,
      sku: '',
      slug: buildDuplicateSlug(product.slug, product.name),
      name: `${product.name} copia`,
      imageUrls: product.imageUrls?.length ? [...product.imageUrls] : [''],
      variants: (product.variants || []).map((variant, index) => ({
        ...variant,
        id: `copy-${Date.now()}-${index}`,
      })),
    })
    setUploadError('')
    setProductEditorOpen(true)
  }

  function getProductDraft(product: Product) {
    return (
      productDrafts[product.id] || {
        name: product.name,
        price: String(product.price ?? 0),
        compareAtPrice: product.compareAtPrice ? String(product.compareAtPrice) : '',
        stock: String(product.stock ?? 0),
      }
    )
  }

  function updateProductDraft(product: Product, field: 'name' | 'price' | 'compareAtPrice' | 'stock', value: string) {
    setProductDrafts((current) => ({
      ...current,
      [product.id]: {
        ...getProductDraft(product),
        [field]: value,
      },
    }))
  }

  const categorySubcategoriesValue = (categoryForm.subcategories || []).join('\n')

  function renderSidebar() {
    return (
      <aside className={cn(panelClass, 'flex h-full flex-col p-5')}>
        <div className="border-b border-[var(--color-border)] pb-5">
          <p className="text-xs uppercase tracking-[0.34em] text-[var(--color-muted)]">Administrador</p>
          <h1 className="mt-3 font-display text-2xl font-black tracking-[-0.04em] text-[var(--color-text)]">
            Anahi Nails Diamond
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
            Productos, stock, envíos y checkout en un solo lugar.
          </p>
        </div>

        <nav className="mt-6 grid gap-2">
          {adminTabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setActiveTab(tab.key)
                  setSidebarOpen(false)
                }}
                className={cn(
                  'flex items-center gap-3 rounded-[1.5rem] px-4 py-4 text-left transition',
                  activeTab === tab.key ? 'btn-primary' : 'bg-[var(--color-surface)] text-[var(--color-text)]',
                )}
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-card)]">
                  <Icon size={18} />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{tab.label}</span>
                  <span className={cn('block text-xs', activeTab === tab.key ? 'text-current/80' : 'text-[var(--color-muted)]')}>
                    {tab.description}
                  </span>
                </span>
              </button>
            )
          })}
        </nav>

        <div className="mt-auto pt-6">
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem('admin-token')
              window.location.href = '/admin'
            }}
            className="w-full rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3 text-sm font-semibold text-[var(--color-text)]"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>
    )
  }

  if (!token) return <Navigate to="/admin" replace />

  return (
    <section className="bg-[var(--color-surface)] py-6 text-[var(--color-text)] sm:py-8">
      <ProductEditorModal
        open={productEditorOpen}
        form={form}
        categories={categories}
        uploadingImage={uploadingImage}
        onClose={() => {
          setProductEditorOpen(false)
          productMutation.reset()
          setUploadError('')
        }}
        onChange={(updater) => setForm((current) => updater(current))}
        onSubmit={() => productMutation.mutate()}
        onUpload={uploadImage}
        pending={productMutation.isPending}
      />

      <div className="mx-auto max-w-[1600px] px-4 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[280px,minmax(0,1fr)]">
          <div className="hidden lg:block">{renderSidebar()}</div>

          {sidebarOpen ? (
            <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)}>
              <div className="h-full w-[86%] max-w-[320px] p-4" onClick={(event) => event.stopPropagation()}>
                {renderSidebar()}
              </div>
            </div>
          ) : null}

          <div className="min-w-0">
            <div className={cn(panelClass, 'mb-6 p-5 sm:p-6')}>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(true)}
                    className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] lg:hidden"
                    aria-label="Abrir menú"
                  >
                    <Menu size={20} />
                  </button>
                  <div>
                    <p className="text-xs uppercase tracking-[0.32em] text-[var(--color-muted)]">Panel admin</p>
                    <h2 className="mt-2 font-display text-3xl font-black tracking-[-0.04em] text-[var(--color-text)]">
                      {adminTabs.find((item) => item.key === activeTab)?.label}
                    </h2>
                    <p className="mt-2 text-sm text-[var(--color-muted)]">
                      {adminTabs.find((item) => item.key === activeTab)?.description}
                    </p>
                  </div>
                </div>

                {activeTab === 'products' ? (
                  <button type="button" onClick={openNewProduct} className="btn-primary rounded-full px-5 py-3 text-sm font-semibold">
                    Nuevo producto
                  </button>
                ) : null}
              </div>
            </div>

            {activeTab === 'products' ? (
              <div className="grid gap-6">
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr),220px,220px]">
                  <input
                    value={productSearch}
                    onChange={(event) => setProductSearch(event.target.value)}
                    placeholder="Buscar por nombre, SKU o categoría"
                    className={cn(inputClass, panelClass)}
                  />
                  <div className={cn(panelClass, 'px-5 py-4 text-sm text-[var(--color-muted)]')}>
                    {(productsQuery.data || []).length} productos cargados
                  </div>
                  <div className={cn(panelClass, 'px-5 py-4 text-sm text-[var(--color-muted)]')}>
                    {(productsQuery.data || []).filter((item) => item.stock <= 4).length} con stock bajo
                  </div>
                </div>

                {productMutation.isError ? (
                  <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">
                    {productMutation.error instanceof Error ? productMutation.error.message : 'No se pudo guardar el producto.'}
                  </div>
                ) : null}
                {uploadError ? (
                  <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-700">
                    {uploadError}
                  </div>
                ) : null}
                {productListError ? (
                  <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">
                    {productListError}
                  </div>
                ) : null}

                <div className="grid gap-4">
                  {filteredProducts.map((product) => (
                    <article key={product.id} className={cn(panelClass, 'p-5')}>
                      {(() => {
                        const draft = getProductDraft(product)
                        return (
                      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <input
                              value={draft.name}
                              onChange={(event) => updateProductDraft(product, 'name', event.target.value)}
                              className="min-w-[280px] flex-1 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-lg font-semibold text-[var(--color-text)] outline-none"
                            />
                            <span className="rounded-full bg-[var(--color-surface)] px-3 py-1 text-xs font-semibold text-[var(--color-muted)]">
                              {product.sku || 'Sin SKU'}
                            </span>
                            <span className="rounded-full bg-[var(--color-surface)] px-3 py-1 text-xs font-semibold text-[var(--color-muted)]">
                              {brandConfigs[product.site].shortName}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-[var(--color-muted)]">
                            {product.categoryName}
                            {product.subcategory ? ` · ${product.subcategory}` : ''}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-4">
                            <label className="min-w-[150px]">
                              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">Precio</span>
                              <input
                                type="number"
                                min="0"
                                value={draft.price}
                                onChange={(event) => updateProductDraft(product, 'price', event.target.value)}
                                className={inputClass}
                              />
                            </label>
                            <label className="min-w-[170px]">
                              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">Promocional</span>
                              <input
                                type="number"
                                min="0"
                                value={draft.compareAtPrice}
                                onChange={(event) => updateProductDraft(product, 'compareAtPrice', event.target.value)}
                                className={inputClass}
                              />
                            </label>
                            <label className="min-w-[120px]">
                              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">Stock</span>
                              <input
                                type="number"
                                min="0"
                                value={draft.stock}
                                onChange={(event) => updateProductDraft(product, 'stock', event.target.value)}
                                className={inputClass}
                              />
                            </label>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-3 text-sm text-[var(--color-muted)]">
                            <span>{product.variants.length} variantes</span>
                            {product.featured ? <span>Destacado</span> : null}
                          </div>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                          <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
                            <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">Stock rápido</p>
                            <div className="mt-2 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => stockMutation.mutate({ product, stock: product.stock - 1 })}
                                className={outlineButtonClass}
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="0"
                                defaultValue={product.stock}
                                onBlur={(event) =>
                                  stockMutation.mutate({ product, stock: Number(event.target.value) || 0 })
                                }
                                className="w-24 rounded-full border border-[var(--color-border)] bg-white px-4 py-3 text-center text-sm font-semibold text-[var(--color-text)]"
                              />
                              <button
                                type="button"
                                onClick={() => stockMutation.mutate({ product, stock: product.stock + 1 })}
                                className={outlineButtonClass}
                              >
                                +
                              </button>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => quickEditMutation.mutate(product)}
                            className="btn-primary rounded-full px-4 py-3 text-sm font-semibold"
                          >
                            {quickEditMutation.isPending ? 'Guardando...' : 'Guardar'}
                          </button>
                          <button type="button" onClick={() => openDuplicateProduct(product)} className={outlineButtonClass}>
                            <span className="inline-flex items-center gap-2">
                              <Copy size={16} />
                              Duplicar
                            </span>
                          </button>
                          <button type="button" onClick={() => openEditProduct(product)} className={outlineButtonClass}>
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteProductMutation.mutate(product.id)}
                            className="rounded-full border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                        )
                      })()}
                    </article>
                  ))}
                </div>
              </div>
            ) : null}

            {activeTab === 'categories' ? (
              <div className="grid gap-6 xl:grid-cols-[360px,minmax(0,1fr)]">
                <form
                  className={cn(panelClass, 'p-6')}
                  onSubmit={(event) => {
                    event.preventDefault()
                    categoryMutation.mutate()
                  }}
                >
                  <h3 className="font-display text-2xl font-bold text-[var(--color-text)]">Categoría</h3>
                  <div className="mt-5 grid gap-4">
                    <input
                      value={categoryForm.name || ''}
                      onChange={(event) =>
                        setCategoryForm((current) => ({
                          ...current,
                          name: event.target.value,
                          slug: slugify(event.target.value),
                        }))
                      }
                      placeholder="Nombre"
                      className={inputClass}
                    />
                    <input
                      value={categoryForm.slug || ''}
                      onChange={(event) => setCategoryForm((current) => ({ ...current, slug: event.target.value }))}
                      placeholder="Slug"
                      className={inputClass}
                    />
                    <textarea
                      value={categoryForm.description || ''}
                      onChange={(event) => setCategoryForm((current) => ({ ...current, description: event.target.value }))}
                      placeholder="Descripción"
                      className={cn(inputClass, 'min-h-28')}
                    />
                    <select
                      value={categoryForm.site || 'anahinails'}
                      onChange={(event) => setCategoryForm((current) => ({ ...current, site: event.target.value as StoreSite }))}
                      className={inputClass}
                    >
                      {storeSites.map((site) => (
                        <option key={site} value={site}>
                          {brandConfigs[site].name}
                        </option>
                      ))}
                    </select>
                    <input
                      value={categoryForm.imageUrl || ''}
                      onChange={(event) => setCategoryForm((current) => ({ ...current, imageUrl: event.target.value }))}
                      placeholder="Imagen de categoría"
                      className={inputClass}
                    />
                    <textarea
                      value={categorySubcategoriesValue}
                      onChange={(event) =>
                        setCategoryForm((current) => ({
                          ...current,
                          subcategories: parseSubcategories(event.target.value),
                        }))
                      }
                      placeholder="Subcategorías, una por línea o separadas por coma"
                      className={cn(inputClass, 'min-h-28')}
                    />
                    {categoryMutation.isError ? (
                      <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                        {categoryMutation.error instanceof Error ? categoryMutation.error.message : 'No se pudo guardar la categoría.'}
                      </div>
                    ) : null}
                    <button className="btn-primary rounded-full px-5 py-4 text-sm font-semibold">
                      {categoryMutation.isPending ? 'Guardando...' : 'Guardar categoría'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCategoryForm(emptyCategoryForm)
                        categoryMutation.reset()
                      }}
                      className={outlineButtonClass}
                    >
                      Nueva categoría
                    </button>
                  </div>
                </form>

                <div className="grid gap-4">
                  {categories.map((category) => (
                    <article key={category.id} className={cn(panelClass, 'flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between')}>
                      <div>
                        <h3 className="text-lg font-semibold text-[var(--color-text)]">{category.name}</h3>
                        <p className="text-sm text-[var(--color-muted)]">{category.description}</p>
                        {category.subcategories.length > 0 ? (
                          <p className="mt-2 text-sm text-[var(--color-muted)]">
                            Subcategorías: {category.subcategories.join(', ')}
                          </p>
                        ) : null}
                        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                          {brandConfigs[category.site].shortName}
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setCategoryForm(category)
                            categoryMutation.reset()
                          }}
                          className={outlineButtonClass}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteCategoryMutation.mutate(category.id)}
                          className="rounded-full border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600"
                        >
                          Eliminar
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}

            {activeTab === 'orders' ? (
              <div className="grid gap-4">
                {ordersQuery.data?.map((order) => (
                  <article key={order.id} className={cn(panelClass, 'p-6')}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">{order.orderNumber}</p>
                        <h3 className="mt-2 text-lg font-semibold text-[var(--color-text)]">{order.customerName}</h3>
                        <p className="text-sm text-[var(--color-muted)]">{order.email} · {order.phone}</p>
                        <p className="mt-2 text-sm text-[var(--color-muted)]">
                          {order.shippingLabel || 'Envío'} · {order.shippingCost ? formatCurrency(order.shippingCost) : 'Gratis'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <select
                          value={order.status}
                          onChange={(event) => orderStatusMutation.mutate({ id: order.id, status: event.target.value })}
                          className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm text-[var(--color-text)]"
                        >
                          {['pending', 'paid', 'packing', 'shipped', 'cancelled'].map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                        <span className="text-sm font-semibold text-[var(--color-text)]">{formatCurrency(order.total)}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}

            {activeTab === 'coupons' ? (
              <div className="grid gap-6 2xl:grid-cols-[420px,minmax(0,1fr)]">
                <form
                  className={cn(panelClass, 'p-6')}
                  onSubmit={(event) => {
                    event.preventDefault()
                    setCouponForm((current) => ({ ...current, code: normalizeCouponCode(current.code || '') }))
                    couponMutation.mutate()
                  }}
                >
                  <h3 className="font-display text-2xl font-bold text-[var(--color-text)]">
                    {couponForm.id ? 'Editar cupón' : 'Nuevo cupón'}
                  </h3>
                  <div className="mt-5 grid gap-4">
                    <input
                      value={couponForm.code || ''}
                      onChange={(event) => setCouponForm((current) => ({ ...current, code: normalizeCouponCode(event.target.value) }))}
                      placeholder="Código"
                      className={cn(inputClass, 'uppercase')}
                    />
                    <input
                      value={couponForm.description || ''}
                      onChange={(event) => setCouponForm((current) => ({ ...current, description: event.target.value }))}
                      placeholder="Descripción"
                      className={inputClass}
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <select
                        value={couponForm.type || 'percentage'}
                        onChange={(event) => setCouponForm((current) => ({ ...current, type: event.target.value as DiscountCoupon['type'] }))}
                        className={inputClass}
                      >
                        <option value="percentage">Porcentaje</option>
                        <option value="fixed">Monto fijo</option>
                      </select>
                      <input
                        type="number"
                        min="0"
                        value={couponForm.value || 0}
                        onChange={(event) => setCouponForm((current) => ({ ...current, value: Number(event.target.value) }))}
                        placeholder="Valor"
                        className={inputClass}
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <input
                        type="number"
                        min="0"
                        value={couponForm.minSubtotal ?? ''}
                        onChange={(event) =>
                          setCouponForm((current) => ({
                            ...current,
                            minSubtotal: event.target.value ? Number(event.target.value) : null,
                          }))
                        }
                        placeholder="Compra mínima"
                        className={inputClass}
                      />
                      <input
                        type="number"
                        min="0"
                        value={couponForm.usageLimit ?? ''}
                        onChange={(event) =>
                          setCouponForm((current) => ({
                            ...current,
                            usageLimit: event.target.value ? Number(event.target.value) : null,
                          }))
                        }
                        placeholder="Límite de usos"
                        className={inputClass}
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <input
                        type="datetime-local"
                        value={couponForm.startsAt || ''}
                        onChange={(event) => setCouponForm((current) => ({ ...current, startsAt: event.target.value }))}
                        className={inputClass}
                      />
                      <input
                        type="datetime-local"
                        value={couponForm.endsAt || ''}
                        onChange={(event) => setCouponForm((current) => ({ ...current, endsAt: event.target.value }))}
                        className={inputClass}
                      />
                    </div>
                    <label className="flex items-center gap-3 rounded-2xl bg-[var(--color-surface)] px-4 py-3 text-sm font-medium text-[var(--color-text)]">
                      <input
                        type="checkbox"
                        checked={Boolean(couponForm.active)}
                        onChange={(event) => setCouponForm((current) => ({ ...current, active: event.target.checked }))}
                        className="h-4 w-4 accent-[var(--color-accent)]"
                      />
                      Cupón activo
                    </label>
                    <button className="btn-primary rounded-full px-5 py-4 text-sm font-semibold">
                      {couponMutation.isPending ? 'Guardando...' : 'Guardar cupón'}
                    </button>
                  </div>
                </form>

                <div className="grid gap-4">
                  {couponsQuery.data?.map((coupon) => (
                    <article key={coupon.id} className={cn(panelClass, 'p-5')}>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold text-[var(--color-text)]">{coupon.code}</h3>
                            <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', coupon.active ? 'bg-emerald-100 text-emerald-700' : 'bg-[var(--color-surface)] text-[var(--color-muted)]')}>
                              {coupon.active ? 'Activo' : 'Inactivo'}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-[var(--color-muted)]">{coupon.description || 'Sin descripción.'}</p>
                        </div>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              setCouponForm({
                                ...coupon,
                                startsAt: toLocalDateTime(coupon.startsAt),
                                endsAt: toLocalDateTime(coupon.endsAt),
                              })
                            }
                            className={outlineButtonClass}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteCouponMutation.mutate(coupon.id)}
                            className="rounded-full border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}

            {activeTab === 'settings' ? (
              <form
                className={cn(panelClass, 'max-w-4xl p-6')}
                onSubmit={(event) => {
                  event.preventDefault()
                  settingsMutation.mutate()
                }}
              >
                <h3 className="font-display text-2xl font-bold text-[var(--color-text)]">Envíos y checkout</h3>
                <p className="mt-2 text-sm text-[var(--color-muted)]">
                  Configurá envío a sucursal y envío gratis desde un monto mínimo.
                </p>

                <div className="mt-6 grid gap-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <label>
                      <span className="mb-2 block text-sm font-medium text-[var(--color-muted)]">Nombre del envío a domicilio</span>
                      <input
                        value={settingsDraft.standardShippingLabel}
                        onChange={(event) => setSettingsForm((current) => ({ ...(current || settingsDraft), standardShippingLabel: event.target.value }))}
                        className={inputClass}
                      />
                    </label>
                    <label>
                      <span className="mb-2 block text-sm font-medium text-[var(--color-muted)]">Costo envío a domicilio</span>
                      <input
                        type="number"
                        min="0"
                        value={settingsDraft.standardShippingCost}
                        onChange={(event) => setSettingsForm((current) => ({ ...(current || settingsDraft), standardShippingCost: Number(event.target.value) }))}
                        className={inputClass}
                      />
                    </label>
                  </div>

                  <label className="flex items-center gap-3 rounded-2xl bg-[var(--color-surface)] px-4 py-3 text-sm font-medium text-[var(--color-text)]">
                    <input
                      type="checkbox"
                      checked={settingsDraft.branchShippingEnabled}
                      onChange={(event) => setSettingsForm((current) => ({ ...(current || settingsDraft), branchShippingEnabled: event.target.checked }))}
                      className="h-4 w-4 accent-[var(--color-accent)]"
                    />
                    Habilitar envío a sucursal
                  </label>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label>
                      <span className="mb-2 block text-sm font-medium text-[var(--color-muted)]">Nombre del envío a sucursal</span>
                      <input
                        value={settingsDraft.branchShippingLabel}
                        onChange={(event) => setSettingsForm((current) => ({ ...(current || settingsDraft), branchShippingLabel: event.target.value }))}
                        className={inputClass}
                      />
                    </label>
                    <label>
                      <span className="mb-2 block text-sm font-medium text-[var(--color-muted)]">Costo envío a sucursal</span>
                      <input
                        type="number"
                        min="0"
                        value={settingsDraft.branchShippingCost}
                        onChange={(event) => setSettingsForm((current) => ({ ...(current || settingsDraft), branchShippingCost: Number(event.target.value) }))}
                        className={inputClass}
                      />
                    </label>
                  </div>

                  <label className="flex items-center gap-3 rounded-2xl bg-[var(--color-surface)] px-4 py-3 text-sm font-medium text-[var(--color-text)]">
                    <input
                      type="checkbox"
                      checked={settingsDraft.freeShippingEnabled}
                      onChange={(event) => setSettingsForm((current) => ({ ...(current || settingsDraft), freeShippingEnabled: event.target.checked }))}
                      className="h-4 w-4 accent-[var(--color-accent)]"
                    />
                    Habilitar envío gratis por monto mínimo
                  </label>

                  <label>
                    <span className="mb-2 block text-sm font-medium text-[var(--color-muted)]">Monto mínimo para envío gratis</span>
                    <input
                      type="number"
                      min="0"
                      value={settingsDraft.freeShippingThreshold}
                      onChange={(event) => setSettingsForm((current) => ({ ...(current || settingsDraft), freeShippingThreshold: Number(event.target.value) }))}
                      className={inputClass}
                    />
                  </label>
                </div>

                <div className="mt-6 flex items-center justify-between gap-4 rounded-[1.5rem] bg-[var(--color-surface)] px-4 py-4 text-sm text-[var(--color-muted)]">
                  <span>En checkout se mostrará gratis desde {formatCurrency(settingsDraft.freeShippingThreshold)}.</span>
                  <button className="btn-primary rounded-full px-5 py-3 text-sm font-semibold">
                    {settingsMutation.isPending ? 'Guardando...' : 'Guardar configuración'}
                  </button>
                </div>
              </form>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
