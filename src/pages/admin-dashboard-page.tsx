import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Menu, Package, Shapes, ShoppingCart, TicketPercent } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { api } from '../lib/api'
import { formatCurrency, normalizeCouponCode, slugify } from '../lib/utils'
import { useSEO } from '../hooks/use-seo'
import { cn } from '../lib/utils'
import type { Category, DiscountCoupon, Product } from '../types'

type AdminTab = 'products' | 'categories' | 'orders' | 'coupons'

const emptyProductForm: Partial<Product> = {
  name: '',
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
}

const emptyCategoryForm: Partial<Category> = {
  name: '',
  description: '',
  slug: '',
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

const adminTabs: Array<{
  key: AdminTab
  label: string
  description: string
  icon: typeof Package
}> = [
  { key: 'products', label: 'Productos', description: 'Catalogo y stock', icon: Package },
  { key: 'categories', label: 'Categorias', description: 'Estructura de tienda', icon: Shapes },
  { key: 'orders', label: 'Pedidos', description: 'Seguimiento comercial', icon: ShoppingCart },
  { key: 'coupons', label: 'Cupones', description: 'Promos y descuentos', icon: TicketPercent },
]

const panelClass =
  'rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface-card)] shadow-[0_18px_40px_rgba(17,24,39,0.08)]'
const inputClass =
  'w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] outline-none'
const outlineButtonClass =
  'rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm font-semibold text-[var(--color-text)]'

export function AdminDashboardPage() {
  useSEO({ title: 'Dashboard admin' })
  const queryClient = useQueryClient()
  const [token] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('admin-token') || '' : '',
  )
  const [activeTab, setActiveTab] = useState<AdminTab>('products')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [form, setForm] = useState<Partial<Product>>(emptyProductForm)
  const [categoryForm, setCategoryForm] = useState<Partial<Category>>(emptyCategoryForm)
  const [couponForm, setCouponForm] = useState<Partial<DiscountCoupon>>(emptyCouponForm)

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

  const productMutation = useMutation({
    mutationFn: () => (form.id ? api.updateProduct(token, form.id, form) : api.saveProduct(token, form)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['storefront'] })
      setForm(emptyProductForm)
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

  const couponMutation = useMutation({
    mutationFn: () =>
      couponForm.id ? api.updateCoupon(token, couponForm.id, couponForm) : api.saveCoupon(token, couponForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] })
      setCouponForm(emptyCouponForm)
    },
  })

  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => api.deleteProduct(token, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => api.deleteCategory(token, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-categories'] }),
  })
  const deleteCouponMutation = useMutation({
    mutationFn: (id: string) => api.deleteCoupon(token, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-coupons'] }),
  })
  const orderStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.updateOrderStatus(token, id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-orders'] }),
  })

  async function uploadImage(file: File) {
    setUploadingImage(true)
    try {
      const signature = await api.signCloudinaryUpload(token, 'anahi-nails-diamond/products')
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
      const result = (await response.json()) as { secure_url?: string }
      if (result.secure_url) {
        setForm((current) => ({ ...current, imageUrls: [result.secure_url!] }))
      }
    } finally {
      setUploadingImage(false)
    }
  }

  const categoryOptions = useMemo(() => categoriesQuery.data || [], [categoriesQuery.data])
  const currentTab = adminTabs.find((item) => item.key === activeTab) || adminTabs[0]

  if (!token) {
    return <Navigate to="/admin" replace />
  }

  function renderSidebar() {
    return (
      <aside className={cn(panelClass, 'flex h-full flex-col p-5')}>
        <div className="border-b border-[var(--color-border)] pb-5">
          <p className="text-xs uppercase tracking-[0.34em] text-[var(--color-muted)]">Administrador</p>
          <h1 className="mt-3 font-display text-2xl font-black tracking-[-0.04em] text-[var(--color-text)]">
            Anahi Nails Diamond
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
            Gestión rápida de productos, categorías, pedidos y cupones.
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
                  activeTab === tab.key
                    ? 'btn-primary shadow-[0_14px_30px_rgba(17,24,39,0.12)]'
                    : 'bg-[var(--color-surface)] text-[var(--color-text)] hover:border-[var(--color-border)]',
                )}
              >
                <span
                  className={cn(
                    'inline-flex h-11 w-11 items-center justify-center rounded-2xl border',
                    activeTab === tab.key
                      ? 'border-black/10 bg-black/10'
                      : 'border-[var(--color-border)] bg-[var(--color-surface-card)]',
                  )}
                >
                  <Icon size={18} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{tab.label}</span>
                  <span
                    className={cn(
                      'block text-xs',
                      activeTab === tab.key ? 'text-current/80' : 'text-[var(--color-muted)]',
                    )}
                  >
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

  return (
    <section className="bg-[var(--color-surface)] py-6 text-[var(--color-text)] sm:py-8">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[280px,minmax(0,1fr)]">
          <div className="hidden lg:block">{renderSidebar()}</div>

          {sidebarOpen ? (
            <div className="fixed inset-0 z-50 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)}>
              <div
                className="h-full w-[86%] max-w-[320px] p-4"
                onClick={(event) => event.stopPropagation()}
              >
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
                    className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] lg:hidden"
                    aria-label="Abrir menú"
                  >
                    <Menu size={20} />
                  </button>
                  <div>
                    <p className="text-xs uppercase tracking-[0.32em] text-[var(--color-muted)]">Panel admin</p>
                    <h2 className="mt-2 font-display text-3xl font-black tracking-[-0.04em] text-[var(--color-text)]">
                      {currentTab.label}
                    </h2>
                    <p className="mt-2 text-sm text-[var(--color-muted)]">{currentTab.description}</p>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-muted)]">
                  {activeTab === 'products' ? `${productsQuery.data?.length || 0} productos cargados` : null}
                  {activeTab === 'categories' ? `${categoriesQuery.data?.length || 0} categorías activas` : null}
                  {activeTab === 'orders' ? `${ordersQuery.data?.length || 0} pedidos registrados` : null}
                  {activeTab === 'coupons' ? `${couponsQuery.data?.length || 0} cupones creados` : null}
                </div>
              </div>
            </div>

            {activeTab === 'products' ? (
              <div className="grid gap-6 2xl:grid-cols-[420px,minmax(0,1fr)]">
                <form
                  className={cn(panelClass, 'p-6')}
                  onSubmit={(event) => {
                    event.preventDefault()
                    productMutation.mutate()
                  }}
                >
                  <h3 className="font-display text-2xl font-bold text-[var(--color-text)]">
                    {form.id ? 'Editar producto' : 'Nuevo producto'}
                  </h3>
                  <div className="mt-5 grid gap-4">
                    {[
                      ['name', 'Nombre'],
                      ['sku', 'SKU'],
                      ['shortDescription', 'Descripción corta'],
                    ].map(([key, label]) => (
                      <label key={key}>
                        <span className="mb-2 block text-sm font-medium text-[var(--color-muted)]">{label}</span>
                        <input
                          value={(form[key as keyof Product] as string) || ''}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              [key]: event.target.value,
                              slug: key === 'name' ? slugify(event.target.value) : current.slug,
                            }))
                          }
                          className={inputClass}
                        />
                      </label>
                    ))}
                    <label>
                      <span className="mb-2 block text-sm font-medium text-[var(--color-muted)]">Descripción</span>
                      <textarea
                        value={form.description || ''}
                        onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                        className={cn(inputClass, 'min-h-28')}
                      />
                    </label>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {[
                        ['price', 'Precio'],
                        ['compareAtPrice', 'Precio anterior'],
                        ['stock', 'Stock'],
                      ].map(([key, label]) => (
                        <label key={key}>
                          <span className="mb-2 block text-sm font-medium text-[var(--color-muted)]">{label}</span>
                          <input
                            type="number"
                            value={(form[key as keyof Product] as number) || 0}
                            onChange={(event) => setForm((current) => ({ ...current, [key]: Number(event.target.value) }))}
                            className={inputClass}
                          />
                        </label>
                      ))}
                    </div>
                    <label>
                      <span className="mb-2 block text-sm font-medium text-[var(--color-muted)]">Categoría</span>
                      <select
                        value={form.categoryId || ''}
                        onChange={(event) => setForm((current) => ({ ...current, categoryId: event.target.value }))}
                        className={inputClass}
                      >
                        <option value="">Seleccionar</option>
                        {categoryOptions.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span className="mb-2 block text-sm font-medium text-[var(--color-muted)]">Imagen principal URL</span>
                      <input
                        value={form.imageUrls?.[0] || ''}
                        onChange={(event) => setForm((current) => ({ ...current, imageUrls: [event.target.value] }))}
                        className={inputClass}
                      />
                    </label>
                    <label className="block rounded-[1.5rem] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4 text-sm text-[var(--color-muted)]">
                      <span className="mb-2 block font-medium text-[var(--color-text)]">Subir imagen a Cloudinary</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => {
                          const file = event.target.files?.[0]
                          if (file) uploadImage(file)
                        }}
                        className="block w-full text-sm"
                      />
                      <span className="mt-2 block text-xs">
                        {uploadingImage ? 'Subiendo imagen...' : 'Usa las credenciales definidas en el entorno.'}
                      </span>
                    </label>
                    <div className="grid gap-3 text-sm text-[var(--color-text)]">
                      {[
                        ['featured', 'Destacado'],
                        ['new', 'Nuevo'],
                        ['sale', 'Oferta'],
                        ['best-seller', 'Más vendido'],
                      ].map(([key, label]) => (
                        <label key={key} className="flex items-center gap-3 rounded-2xl bg-[var(--color-surface)] px-4 py-3">
                          <input
                            type="checkbox"
                            checked={key === 'featured' ? Boolean(form.featured) : Boolean(form.badges?.includes(key as never))}
                            onChange={(event) =>
                              setForm((current) => ({
                                ...current,
                                featured: key === 'featured' ? event.target.checked : current.featured,
                                badges:
                                  key === 'featured'
                                    ? current.badges || []
                                    : event.target.checked
                                      ? [...(current.badges || []), key as never]
                                      : (current.badges || []).filter((badge) => badge !== key),
                              }))
                            }
                            className="h-4 w-4 accent-[var(--color-accent)]"
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                    <button className="btn-primary rounded-full px-5 py-4 text-sm font-semibold">
                      {productMutation.isPending ? 'Guardando...' : 'Guardar producto'}
                    </button>
                  </div>
                </form>

                <div className={cn(panelClass, 'overflow-hidden')}>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-[var(--color-surface)] text-[var(--color-muted)]">
                        <tr>
                          <th className="px-5 py-4">Producto</th>
                          <th className="px-5 py-4">Categoría</th>
                          <th className="px-5 py-4">Precio</th>
                          <th className="px-5 py-4">Stock</th>
                          <th className="px-5 py-4">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {productsQuery.data?.map((product) => (
                          <tr key={product.id} className="border-t border-[var(--color-border)]">
                            <td className="px-5 py-4 font-medium text-[var(--color-text)]">{product.name}</td>
                            <td className="px-5 py-4 text-[var(--color-muted)]">{product.categoryName}</td>
                            <td className="px-5 py-4 text-[var(--color-muted)]">{formatCurrency(product.price)}</td>
                            <td className="px-5 py-4 text-[var(--color-muted)]">{product.stock}</td>
                            <td className="px-5 py-4">
                              <div className="flex gap-3">
                                <button type="button" onClick={() => setForm(product)} className="text-sm font-semibold text-[var(--color-text)]">
                                  Editar
                                </button>
                                <button type="button" onClick={() => deleteProductMutation.mutate(product.id)} className="text-sm font-semibold text-rose-500">
                                  Eliminar
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
                    <button className="btn-primary rounded-full px-5 py-4 text-sm font-semibold">
                      Guardar categoría
                    </button>
                  </div>
                </form>

                <div className="grid gap-4">
                  {categoriesQuery.data?.map((category) => (
                    <article key={category.id} className={cn(panelClass, 'flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between')}>
                      <div>
                        <h3 className="text-lg font-semibold text-[var(--color-text)]">{category.name}</h3>
                        <p className="text-sm text-[var(--color-muted)]">{category.description}</p>
                      </div>
                      <div className="flex gap-3">
                        <button type="button" onClick={() => setCategoryForm(category)} className={outlineButtonClass}>
                          Editar
                        </button>
                        <button type="button" onClick={() => deleteCategoryMutation.mutate(category.id)} className="rounded-full border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600">
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
                        {order.couponCode ? (
                          <p className="mt-2 text-sm text-emerald-600">
                            Cupón {order.couponCode} · descuento {formatCurrency(order.discountAmount)}
                          </p>
                        ) : null}
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
                    <label>
                      <span className="mb-2 block text-sm font-medium text-[var(--color-muted)]">Código</span>
                      <input
                        value={couponForm.code || ''}
                        onChange={(event) => setCouponForm((current) => ({ ...current, code: normalizeCouponCode(event.target.value) }))}
                        className={cn(inputClass, 'uppercase')}
                      />
                    </label>
                    <label>
                      <span className="mb-2 block text-sm font-medium text-[var(--color-muted)]">Descripción</span>
                      <input
                        value={couponForm.description || ''}
                        onChange={(event) => setCouponForm((current) => ({ ...current, description: event.target.value }))}
                        className={inputClass}
                      />
                    </label>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label>
                        <span className="mb-2 block text-sm font-medium text-[var(--color-muted)]">Tipo</span>
                        <select
                          value={couponForm.type || 'percentage'}
                          onChange={(event) => setCouponForm((current) => ({ ...current, type: event.target.value as DiscountCoupon['type'] }))}
                          className={inputClass}
                        >
                          <option value="percentage">Porcentaje</option>
                          <option value="fixed">Monto fijo</option>
                        </select>
                      </label>
                      <label>
                        <span className="mb-2 block text-sm font-medium text-[var(--color-muted)]">Valor</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={couponForm.value || 0}
                          onChange={(event) => setCouponForm((current) => ({ ...current, value: Number(event.target.value) }))}
                          className={inputClass}
                        />
                      </label>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label>
                        <span className="mb-2 block text-sm font-medium text-[var(--color-muted)]">Compra mínima</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={couponForm.minSubtotal ?? ''}
                          onChange={(event) =>
                            setCouponForm((current) => ({
                              ...current,
                              minSubtotal: event.target.value ? Number(event.target.value) : null,
                            }))
                          }
                          className={inputClass}
                        />
                      </label>
                      <label>
                        <span className="mb-2 block text-sm font-medium text-[var(--color-muted)]">Límite de usos</span>
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
                          className={inputClass}
                        />
                      </label>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label>
                        <span className="mb-2 block text-sm font-medium text-[var(--color-muted)]">Inicio</span>
                        <input
                          type="datetime-local"
                          value={couponForm.startsAt || ''}
                          onChange={(event) => setCouponForm((current) => ({ ...current, startsAt: event.target.value }))}
                          className={inputClass}
                        />
                      </label>
                      <label>
                        <span className="mb-2 block text-sm font-medium text-[var(--color-muted)]">Fin</span>
                        <input
                          type="datetime-local"
                          value={couponForm.endsAt || ''}
                          onChange={(event) => setCouponForm((current) => ({ ...current, endsAt: event.target.value }))}
                          className={inputClass}
                        />
                      </label>
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
                    <div className="flex gap-3">
                      <button className="btn-primary flex-1 rounded-full px-5 py-4 text-sm font-semibold">
                        {couponMutation.isPending ? 'Guardando...' : 'Guardar cupón'}
                      </button>
                      {couponForm.id ? (
                        <button type="button" onClick={() => setCouponForm(emptyCouponForm)} className={outlineButtonClass}>
                          Limpiar
                        </button>
                      ) : null}
                    </div>
                  </div>
                </form>

                <div className="grid gap-4">
                  {couponsQuery.data?.map((coupon) => (
                    <article key={coupon.id} className={cn(panelClass, 'p-5')}>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold text-[var(--color-text)]">{coupon.code}</h3>
                            <span
                              className={cn(
                                'rounded-full px-3 py-1 text-xs font-semibold',
                                coupon.active
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-[var(--color-surface)] text-[var(--color-muted)]',
                              )}
                            >
                              {coupon.active ? 'Activo' : 'Inactivo'}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-[var(--color-muted)]">{coupon.description || 'Sin descripción.'}</p>
                          <div className="mt-3 flex flex-wrap gap-3 text-sm text-[var(--color-muted)]">
                            <span>{coupon.type === 'percentage' ? `${coupon.value}% off` : formatCurrency(coupon.value)}</span>
                            <span>Usos: {coupon.usageCount}{coupon.usageLimit ? ` / ${coupon.usageLimit}` : ''}</span>
                            {coupon.minSubtotal ? <span>Mínimo: {formatCurrency(coupon.minSubtotal)}</span> : null}
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => setCouponForm({ ...coupon, startsAt: coupon.startsAt || '', endsAt: coupon.endsAt || '' })}
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
          </div>
        </div>
      </div>
    </section>
  )
}
