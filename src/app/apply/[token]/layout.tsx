export default function ApplyLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-2xl px-4 py-10">{children}</div>
    </div>
  );
}
