import { cn } from "@/lib/utils";

/**
 * Page — top-level page wrapper.
 *
 * Handles max-width, padding, and fade-in animation.
 * Every route's page component should render exactly ONE Page.
 *
 *   <Page>
 *     <Section ... />
 *     <Section ... />
 *   </Page>
 */
export function Page({
  children,
  title,
  className,
}: {
  children: React.ReactNode;
  title?: string;
  className?: string;
}) {
  return (
    <main className={cn("page animate-fade-in", className)}>
      {title && <h1 className="page-title">{title}</h1>}
      {children}
    </main>
  );
}
