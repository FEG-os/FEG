import Link from "next/link";

const values = [
  {
    title: "Well-maintained homes",
    body: "Every property is inspected and maintenance-ready before a resident moves in — and kept that way with a responsive repair process afterward.",
  },
  {
    title: "A fair, transparent process",
    body: "Applications are reviewed on the whole picture, not a single number. You'll always know where your application stands.",
  },
  {
    title: "Rooted in Kansas",
    body: "We're a local owner-operator, not a call center. When you reach out, you're talking to the people who actually manage the property.",
  },
];

const steps = [
  { n: "01", title: "Reach out", body: "Ask about a property and set up a time to see it in person." },
  { n: "02", title: "Tour the home", body: "See the property and get your questions answered on site." },
  { n: "03", title: "Apply online", body: "We'll send you a secure application link — no paperwork to mail." },
  { n: "04", title: "Sign & move in", body: "Lease signed electronically, keys handed over." },
];

const sellPoints = [
  "No realtor fees or commissions",
  "Sold as-is — no repairs, no cleaning, no showings",
  "A fair cash offer, no financing contingencies",
  "Close on your timeline, not a buyer's",
];

export default function MarketingHome() {
  return (
    <main className="flex-1">
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-14 sm:pt-24 sm:pb-20">
        <p className="brand-eyebrow mb-4">Flores Equity Group</p>
        <h1 className="font-display text-4xl sm:text-5xl text-ink max-w-2xl text-balance">
          Quality rental homes, managed the right way.
        </h1>
        <p className="mt-5 text-ink-soft max-w-xl text-base sm:text-lg">
          We own and manage a growing portfolio of rental homes with one goal: make renting
          straightforward, for you and for us.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <a
            href="mailto:mylegacypros@gmail.com?subject=Rental%20Inquiry"
            className="rounded bg-accent px-5 py-2.5 text-sm font-medium text-accent-ink hover:bg-accent-strong transition-colors"
          >
            Ask About a Property
          </a>
          <a
            href="#how-to-apply"
            className="rounded border border-line-strong px-5 py-2.5 text-sm font-medium text-ink hover:border-accent hover:text-accent transition-colors"
          >
            How It Works
          </a>
        </div>
      </section>

      <section className="border-t border-line bg-surface">
        <div className="max-w-5xl mx-auto px-6 py-14 sm:py-20">
          <h2 className="font-display text-2xl text-ink mb-10">Why residents choose us</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {values.map((v) => (
              <div key={v.title}>
                <h3 className="text-sm font-semibold text-accent mb-2">{v.title}</h3>
                <p className="text-sm text-ink-soft leading-relaxed">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-to-apply" className="max-w-5xl mx-auto px-6 py-14 sm:py-20 scroll-mt-20">
        <h2 className="font-display text-2xl text-ink mb-10">How to apply</h2>
        <div className="grid sm:grid-cols-4 gap-8">
          {steps.map((s) => (
            <div key={s.n}>
              <p className="font-display text-2xl text-accent mb-2">{s.n}</p>
              <h3 className="text-sm font-semibold text-ink mb-1">{s.title}</h3>
              <p className="text-sm text-ink-soft leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="sell" className="border-t border-line bg-accent-tint scroll-mt-20">
        <div className="max-w-5xl mx-auto px-6 py-14 sm:py-20 grid sm:grid-cols-2 gap-10 sm:gap-16 items-start">
          <div>
            <p className="brand-eyebrow mb-4">Also Buying</p>
            <h2 className="font-display text-2xl sm:text-3xl text-ink mb-4 text-balance">
              Selling a house? We'll buy it for cash.
            </h2>
            <p className="text-sm text-ink-soft leading-relaxed max-w-md">
              We buy houses directly, as-is, for cash — no realtor, no repairs, no waiting on a
              buyer's financing to fall through.
            </p>
            <a
              href="mailto:mylegacypros@gmail.com?subject=Sell%20My%20House"
              className="mt-6 inline-block rounded bg-accent px-5 py-2.5 text-sm font-medium text-accent-ink hover:bg-accent-strong transition-colors"
            >
              Get a Cash Offer
            </a>
          </div>
          <ul className="flex flex-col gap-4">
            {sellPoints.map((p) => (
              <li key={p} className="flex items-start gap-3 text-sm text-ink">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                {p}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-14 sm:py-20">
        <div className="max-w-2xl">
          <p className="brand-eyebrow mb-4">Who We Are</p>
          <h2 className="font-display text-2xl sm:text-3xl text-ink mb-4 text-balance">
            A family business, not a franchise.
          </h2>
          <p className="text-sm sm:text-base text-ink-soft leading-relaxed">
            Flores Equity Group is family-owned and operated — run day to day by a husband-and-wife
            team, not a call center or a national property manager. We're raising our own kids in
            this community, and we treat every home and every resident the way we'd want to be
            treated ourselves.
          </p>
        </div>
      </section>

      <section className="border-t border-line bg-surface">
        <div className="max-w-5xl mx-auto px-6 py-14 sm:py-20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <h2 className="font-display text-2xl text-ink mb-2">Already a resident?</h2>
            <p className="text-sm text-ink-soft">
              Manage your account, payments, and requests through the resident portal.
            </p>
          </div>
          <Link
            href="https://app.floresequity.com/login"
            className="shrink-0 rounded border border-line-strong px-5 py-2.5 text-sm font-medium text-ink hover:border-accent hover:text-accent transition-colors"
          >
            Resident Login →
          </Link>
        </div>
      </section>
    </main>
  );
}
