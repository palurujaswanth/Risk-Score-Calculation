export default function SectionCard({ title, subtitle, action, children, className = "" }) {
  return <section className={`section-card ${className}`}>
    {(title || action) && <div className="section-card-header"><div>{title && <h2>{title}</h2>}{subtitle && <p>{subtitle}</p>}</div>{action}</div>}
    {children}
  </section>;
}