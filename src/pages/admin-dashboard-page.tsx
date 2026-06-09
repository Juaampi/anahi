import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { api } from '../lib/api'
import { formatCurrency, slugify } from '../lib/utils'
import { useSEO } from '../hooks/use-seo'
import type { Category, Product } from '../types'

export function AdminDashboardPage() {
  useSEO({ title: 'Dashboard admin' })
  const queryClient = useQueryClient()
  const [token] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('admin-token') || '' : '',
  )
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'orders'>('products')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [form, setForm] = useState<Partial<Product>>({
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
  })
  const [categoryForm, setCategoryForm] = useState<Partial<Category>>({
    name: '',
    description: '',
    slug: '',
  })
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

  const productMutation = useMutation({
    mutationFn: () =>
      form.id ? api.updateProduct(token, form.id, form) : api.saveProduct(token, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['storefront'] })
      setForm({
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
      })
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
      setCategoryForm({ name: '', description: '', slug: '' })
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
    },
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

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`,
        {
          method: 'POST',
          body: data,
        },
      )
      const result = (await response.json()) as { secure_url?: string }
      const secureUrl = result.secure_url
      if (secureUrl) {
        setForm((current) => ({ ...current, imageUrls: [secureUrl] }))
      }
    } finally {
      setUploadingImage(false)
    }
  }

  const categoryOptions = useMemo(() => categoriesQuery.data || [], [categoriesQuery.data])

  if (!token) {
    return <Navigate to="/admin" replace />
  }

  return (
    <section className="bg-[#fcfbfd] py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Administrador</p>
            <h1 className="mt-2 text-4xl font-semibold text-zinc-950">Gestion de tienda</h1>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('admin-token')
              window.location.href = '/admin'
            }}
            className="rounded-full border border-zinc-300 px-5 py-3 text-sm font-semibold text-zinc-900"
          >
            Cerrar sesion
          </button>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          {[
            ['products', 'Productos'],
            ['categories', 'Categorias'],
            ['orders', 'Pedidos'],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as typeof activeTab)}
              className={`rounded-full px-5 py-3 text-sm font-semibold ${activeTab === key ? 'bg-[var(--color-primary)] text-white' : 'border border-zinc-200 bg-white text-zinc-900'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'products' ? (
          <div className="grid gap-6 xl:grid-cols-[380px,1fr]">
            <form
              className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-[0_16px_40px_rgba(18,18,18,0.06)]"
              onSubmit={(event) => {
                event.preventDefault()
                productMutation.mutate()
              }}
            >
              <h2 className="text-xl font-semibold text-zinc-950">{form.id ? 'Editar producto' : 'Nuevo producto'}</h2>
              <div className="mt-5 grid gap-4">
                {[
                  ['name', 'Nombre'],
                  ['sku', 'SKU'],
                  ['shortDescription', 'Descripcion corta'],
                ].map(([key, label]) => (
                  <label key={key}>
                    <span className="mb-2 block text-sm font-medium text-zinc-700">{label}</span>
                    <input
                      value={(form[key as keyof Product] as string) || ''}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          [key]: event.target.value,
                          slug: key === 'name' ? slugify(event.target.value) : current.slug,
                        }))
                      }
                      className="w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm"
                    />
                  </label>
                ))}
                <label>
                  <span className="mb-2 block text-sm font-medium text-zinc-700">Descripcion</span>
                  <textarea
                    value={form.description || ''}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                    className="min-h-28 w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm"
                  />
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    ['price', 'Precio'],
                    ['compareAtPrice', 'Precio anterior'],
                    ['stock', 'Stock'],
                  ].map(([key, label]) => (
                    <label key={key}>
                      <span className="mb-2 block text-sm font-medium text-zinc-700">{label}</span>
                      <input
                        type="number"
                        value={(form[key as keyof Product] as number) || 0}
                        onChange={(event) => setForm((current) => ({ ...current, [key]: Number(event.target.value) }))}
                        className="w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm"
                      />
                    </label>
                  ))}
                </div>
                <label>
                  <span className="mb-2 block text-sm font-medium text-zinc-700">Categoria</span>
                  <select
                    value={form.categoryId || ''}
                    onChange={(event) => setForm((current) => ({ ...current, categoryId: event.target.value }))}
                    className="w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm"
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
                  <span className="mb-2 block text-sm font-medium text-zinc-700">Imagen principal URL o Cloudinary</span>
                  <input
                    value={form.imageUrls?.[0] || ''}
                    onChange={(event) => setForm((current) => ({ ...current, imageUrls: [event.target.value] }))}
                    className="w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm"
                  />
                </label>
                <label className="block rounded-2xl border border-dashed border-zinc-300 px-4 py-4 text-sm text-zinc-600">
                  <span className="mb-2 block font-medium text-zinc-700">Subir imagen a Cloudinary</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (file) uploadImage(file)
                    }}
                    className="block w-full text-sm"
                  />
                  <span className="mt-2 block text-xs text-zinc-500">
                    {uploadingImage ? 'Subiendo imagen...' : 'Usa las credenciales de Cloudinary definidas en entorno.'}
                  </span>
                </label>
                <div className="grid gap-3 text-sm text-zinc-700">
                  {[
                    ['featured', 'Destacado'],
                    ['new', 'Nuevo'],
                    ['sale', 'Oferta'],
                    ['best-seller', 'Mas vendido'],
                  ].map(([key, label]) => (
                    <label key={key} className="flex items-center gap-3">
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
                <button className="rounded-full bg-[var(--color-primary)] px-5 py-4 text-sm font-semibold text-white">
                  {productMutation.isPending ? 'Guardando...' : 'Guardar producto'}
                </button>
              </div>
            </form>
            <div className="overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-[0_16px_40px_rgba(18,18,18,0.06)]">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-zinc-50 text-zinc-500">
                  <tr>
                    <th className="px-5 py-4">Producto</th>
                    <th className="px-5 py-4">Categoria</th>
                    <th className="px-5 py-4">Precio</th>
                    <th className="px-5 py-4">Stock</th>
                    <th className="px-5 py-4">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productsQuery.data?.map((product) => (
                    <tr key={product.id} className="border-t border-zinc-100">
                      <td className="px-5 py-4 font-medium text-zinc-900">{product.name}</td>
                      <td className="px-5 py-4 text-zinc-600">{product.categoryName}</td>
                      <td className="px-5 py-4 text-zinc-600">{formatCurrency(product.price)}</td>
                      <td className="px-5 py-4 text-zinc-600">{product.stock}</td>
                      <td className="px-5 py-4">
                        <div className="flex gap-3">
                          <button onClick={() => setForm(product)} className="font-semibold text-zinc-900">Editar</button>
                          <button onClick={() => deleteProductMutation.mutate(product.id)} className="font-semibold text-rose-600">Eliminar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {activeTab === 'categories' ? (
          <div className="grid gap-6 xl:grid-cols-[340px,1fr]">
            <form
              className="rounded-[2rem] border border-zinc-200 bg-white p-6"
              onSubmit={(event) => {
                event.preventDefault()
                categoryMutation.mutate()
              }}
            >
              <h2 className="text-xl font-semibold text-zinc-950">Categoria</h2>
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
                  className="w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm"
                />
                <input
                  value={categoryForm.slug || ''}
                  onChange={(event) => setCategoryForm((current) => ({ ...current, slug: event.target.value }))}
                  placeholder="Slug"
                  className="w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm"
                />
                <textarea
                  value={categoryForm.description || ''}
                  onChange={(event) => setCategoryForm((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Descripcion"
                  className="min-h-28 w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm"
                />
                <button className="rounded-full bg-[var(--color-primary)] px-5 py-4 text-sm font-semibold text-white">
                  Guardar categoria
                </button>
              </div>
            </form>
            <div className="grid gap-4">
              {categoriesQuery.data?.map((category) => (
                <article key={category.id} className="flex flex-col gap-3 rounded-[2rem] border border-zinc-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-950">{category.name}</h3>
                    <p className="text-sm text-zinc-600">{category.description}</p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setCategoryForm(category)} className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-900">Editar</button>
                    <button onClick={() => deleteCategoryMutation.mutate(category.id)} className="rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600">Eliminar</button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : null}

        {activeTab === 'orders' ? (
          <div className="grid gap-4">
            {ordersQuery.data?.map((order) => (
              <article key={order.id} className="rounded-[2rem] border border-zinc-200 bg-white p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">{order.orderNumber}</p>
                    <h3 className="mt-2 text-lg font-semibold text-zinc-950">{order.customerName}</h3>
                    <p className="text-sm text-zinc-600">{order.email} · {order.phone}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      value={order.status}
                      onChange={(event) => orderStatusMutation.mutate({ id: order.id, status: event.target.value })}
                      className="rounded-full border border-zinc-200 px-4 py-2 text-sm"
                    >
                      {['pending', 'paid', 'packing', 'shipped', 'cancelled'].map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    <span className="text-sm font-semibold text-zinc-900">{formatCurrency(order.total)}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
