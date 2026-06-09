import { useSEO } from '../hooks/use-seo'

export function StaticPage({
  title,
  eyebrow,
  paragraphs,
}: {
  title: string
  eyebrow: string
  paragraphs: string[]
}) {
  useSEO({ title })
  return (
    <section className="bg-[#fcfbfd] py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">{eyebrow}</p>
        <h1 className="mt-3 text-4xl font-semibold text-zinc-950">{title}</h1>
        <div className="mt-8 space-y-5 rounded-[2rem] border border-zinc-200 bg-white p-8 text-base leading-8 text-zinc-650 shadow-[0_18px_50px_rgba(18,18,18,0.05)]">
          {paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>
    </section>
  )
}
