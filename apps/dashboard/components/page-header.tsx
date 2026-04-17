interface PageHeaderProps {
  title: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, children }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 py-3 border-b border-border">
      <h1 className="text-lg font-semibold">{title}</h1>
      {children}
    </div>
  );
}
