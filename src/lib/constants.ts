export const siteConfig = {
  name: 'Anahi Nails Diamond',
  description:
    'Tienda profesional de esmaltes, insumos de manicura, nail art y belleza con una experiencia premium, rápida y pensada para vender.',
  siteUrl: import.meta.env.VITE_SITE_URL || 'http://localhost:5173',
  whatsappNumber: import.meta.env.VITE_WHATSAPP_NUMBER || '5490000000000',
  instagramUrl:
    import.meta.env.VITE_INSTAGRAM_URL || 'https://www.instagram.com/',
  cloudinaryCloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '',
  heroImage:
    'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=1600&q=80',
}

export const storeSites = ['anahinails', 'wildspirit'] as const

export const brandConfigs = {
  anahinails: {
    site: 'anahinails',
    name: 'Anahi Nails Diamond',
    shortName: 'Anahi Nails',
    tagline: 'Beauty Supply',
    description:
      'Insumos profesionales de manicuria, nail art y mesa de trabajo con una estetica premium y compra agil.',
    introTitle: 'Anahi Nails Diamond',
    introDescription:
      'Esmaltes, polygel, herramientas y belleza profesional en una tienda visual, clara y lista para vender.',
    heroImage: '/anahi-diamond-logo.png',
    logo: '/anahi-diamond-logo.png',
    accent: '#d96f9a',
    accentSoft: '#fff1f6',
    surface: '#fff8fb',
    productLabel: 'Ver tienda',
  },
  wildspirit: {
    site: 'wildspirit',
    name: 'Wild Spirit Lingerie',
    shortName: 'Wild Spirit',
    tagline: 'Diseño a pedido',
    description:
      'Remeras y buzos hechos a pedido, con diseño propio, esencia personal y una identidad visual mas libre.',
    introTitle: 'Wild Spirit Lingerie',
    introDescription:
      'Vesti tu esencia. No la de todos. Prendas a pedido, sin stock ni reventa, con calidad premium y diseño exclusivo.',
    heroImage: '/wild-spirit-logo.jpeg',
    logo: '/wild-spirit-logo.jpeg',
    accent: '#0d6b7d',
    accentSoft: '#eefcff',
    surface: '#f7fcff',
    productLabel: 'Ver coleccion',
  },
} as const

export function getBrandConfig(site: keyof typeof brandConfigs) {
  return brandConfigs[site]
}

export const categoryImageMap: Record<string, string> = {
  semipermanentes: '/placeholders/semipermanentes.svg',
  polygel: '/placeholders/polygel.svg',
  decoracion: '/placeholders/decoracion.svg',
  'soft-gel': '/placeholders/soft-gel.svg',
  'cabinas-y-herramientas': '/placeholders/herramientas.svg',
  'pinceles-y-accesorios': '/placeholders/pinceles.svg',
}

export const benefitItems = [
  {
    title: 'Envios a todo el pais',
    description: 'Despachos agiles y seguimiento para compras mayoristas y minoristas.',
  },
  {
    title: 'Medios de pago',
    description: 'Transferencia, Mercado Pago y cuotas listas para activar.',
  },
  {
    title: 'Productos profesionales',
    description: 'Seleccion de insumos para manicuristas, salones y revendedoras.',
  },
  {
    title: 'Atencion por WhatsApp',
    description: 'Acompanamiento rapido para consultas, stock y pedidos.',
  },
  {
    title: 'Compra segura',
    description: 'Checkout claro, carrito persistente y flujo optimizado para mobile.',
  },
]

export const brandItems = [
  'City Girl',
  'Easy Gel',
  'Staleks',
  'Vladmiva',
  'Cherimoya',
  'Navi',
  'Silver Star',
  'Nippon',
]

export function getCategoryImage(slug?: string) {
  if (!slug) return categoryImageMap.semipermanentes
  return categoryImageMap[slug] || categoryImageMap.semipermanentes
}

export function getProductFallbackImage(categoryName?: string, productName?: string) {
  const source = `${categoryName || ''} ${productName || ''}`.toLowerCase()

  if (source.includes('cabina') || source.includes('extractor') || source.includes('herramienta')) {
    return categoryImageMap['cabinas-y-herramientas']
  }
  if (source.includes('pincel') || source.includes('accesorio')) {
    return categoryImageMap['pinceles-y-accesorios']
  }
  if (source.includes('soft gel')) {
    return categoryImageMap['soft-gel']
  }
  if (source.includes('polygel')) {
    return categoryImageMap.polygel
  }
  if (source.includes('cat eye') || source.includes('decoracion') || source.includes('nail art')) {
    return categoryImageMap.decoracion
  }
  if (source.includes('semi') || source.includes('esmalte') || source.includes('navi') || source.includes('color')) {
    return categoryImageMap.semipermanentes
  }

  return categoryImageMap.semipermanentes
}
