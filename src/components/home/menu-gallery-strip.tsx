export function MenuGalleryStrip() {
  return (
    <section className="px-4 pt-4 sm:px-6 sm:pt-5">
      <div className="mx-auto max-w-[620px] overflow-hidden rounded-[30px] border border-[var(--color-border)] bg-[var(--color-surface-card)] shadow-[0_18px_40px_rgba(17,24,39,0.12)]">
        <div className="relative aspect-[4/5] min-h-[420px] sm:min-h-[520px]">
          <img
            src="/menu-gallery-strip.webp"
            alt="Galeria visual Anahi Nails Diamond"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
      </div>
    </section>
  )
}
