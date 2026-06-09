import { useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { Footer } from './components/layout/footer'
import { Header } from './components/layout/header'
import { WhatsAppFab } from './components/layout/whatsapp-fab'
import { HomePage } from './pages/home-page'
import { CatalogPage } from './pages/catalog-page'
import { ProductPage } from './pages/product-page'
import { CartPage } from './pages/cart-page'
import { CheckoutPage } from './pages/checkout-page'
import { StaticPage } from './pages/static-page'
import { AdminLoginPage } from './pages/admin-login-page'
import { AdminDashboardPage } from './pages/admin-dashboard-page'
import { NotFoundPage } from './pages/not-found-page'
import { QueryProvider } from './providers/query-provider'
import { useCartStore } from './store/cart-store'

function ScrollToTop() {
  const { pathname, search } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname, search])

  return null
}

function Shell() {
  const hydrate = useCartStore((state) => state.hydrate)
  useEffect(() => hydrate(), [hydrate])

  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="min-h-screen bg-[var(--color-surface)] text-[var(--color-text)]">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/productos" element={<CatalogPage />} />
            <Route path="/productos/:slug" element={<ProductPage />} />
            <Route path="/carrito" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route
              path="/gracias"
              element={
                <StaticPage
                  eyebrow="Pedido"
                  title="Gracias por tu compra"
                  paragraphs={[
                    'Tu pedido fue registrado correctamente y la tienda queda lista para continuar el seguimiento desde el panel administrador.',
                    'Si activas el contacto por WhatsApp, tambien podes usar ese canal para confirmar detalles de envio, stock o combinaciones.',
                  ]}
                />
              }
            />
            <Route
              path="/sobre-la-marca"
              element={
                <StaticPage
                  eyebrow="Marca"
                  title="Sobre Anahi Nails Diamond"
                  paragraphs={[
                    'La marca esta pensada para acompanar a profesionales y emprendedoras que buscan una tienda con variedad real, imagen cuidada y compra rapida.',
                    'El objetivo del proyecto es combinar una estetica premium con una estructura comercial clara, preparada para crecer con categorias, campañas y nuevos ingresos.',
                  ]}
                />
              }
            />
            <Route
              path="/preguntas-frecuentes"
              element={
                <StaticPage
                  eyebrow="FAQ"
                  title="Preguntas frecuentes"
                  paragraphs={[
                    'Podes comprar desde cualquier dispositivo, sumar productos al carrito y finalizar con Mercado Pago o consulta directa por WhatsApp.',
                    'Los tiempos y costos de envio pueden mostrarse en checkout o resolverse con el equipo segun zona y volumen del pedido.',
                  ]}
                />
              }
            />
            <Route
              path="/medios-de-pago"
              element={
                <StaticPage
                  eyebrow="Pagos"
                  title="Medios de pago"
                  paragraphs={[
                    'La tienda queda preparada para Checkout Pro de Mercado Pago, transferencias y promociones configurables por campaña.',
                    'La experiencia esta pensada para comunicar cuotas, descuentos y beneficios sin depender de una plantilla rigida.',
                  ]}
                />
              }
            />
            <Route
              path="/envios"
              element={
                <StaticPage
                  eyebrow="Envios"
                  title="Envios"
                  paragraphs={[
                    'El sitio esta listo para operar con envios a todo el pais, coordinacion por correo y soporte por WhatsApp cuando haga falta validar stock o tiempos.',
                    'Se puede ampliar facilmente con reglas de envio por provincia, retiro en punto de venta o integraciones logisticas futuras.',
                  ]}
                />
              }
            />
            <Route
              path="/contacto"
              element={
                <StaticPage
                  eyebrow="Contacto"
                  title="Contacto"
                  paragraphs={[
                    'La marca puede centralizar consultas por WhatsApp e Instagram para acelerar conversiones y responder dudas sobre productos profesionales.',
                    'Tambien queda lista la estructura para sumar formularios, mail transaccional o automatizaciones si el negocio lo necesita.',
                  ]}
                />
              }
            />
            <Route path="/admin" element={<AdminLoginPage />} />
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <Footer />
        <WhatsAppFab />
      </div>
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <QueryProvider>
      <Shell />
    </QueryProvider>
  )
}
