import { cn } from "@/lib/utils";

/**
 * Section — a semantic content block with consistent vertical rhythm.
 *
 * Wraps the .section CSS pattern so pages never assemble it manually.
 * The Section owns its own bottom margin. Content inside uses Stack.
 *
 *   <Section icon="trophy" title="tournaments">
 *     <TournamentList />
 *   </Section>
 */
export function Section({
  icon,
  title,
  description,
  note,
  actions,
  children,
  className,
}: {
  icon?: string;
  title: string;
  description?: string;
  note?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("section", className)}>
      <div className="section-header">
        {icon && (
          <span className="material-symbols-outlined section-icon">
            {icon}
          </span>
        )}
        <span className="section-title">{title}</span>
        {actions}
      </div>

      {description && <p className="section-description">{description}</p>}

      {children}

      {note && <p className="section-note">{note}</p>}
    </section>
  );
}
