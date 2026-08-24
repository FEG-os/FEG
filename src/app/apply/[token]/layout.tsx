import Image from "next/image";

export default function ApplyLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="flex items-center gap-2.5 mb-8">
          <Image src="/brand/feg-circle.png" alt="Flores Equity Group" width={30} height={30} className="rounded-full" />
          <span className="brand-eyebrow">Flores Equity Group</span>
        </div>
        {children}
      </div>
    </div>
  );
}
