import { ArrowUpRight } from "lucide-react";
export default function MetricCard({ label, value = "—", note = "Awaiting connected data", icon: Icon }) {
  return <section className="metric-card">
    <div className="metric-top"><span>{label}</span>{Icon && <span className="metric-icon"><Icon size={17} /></span>}</div>
    <div className="metric-value">{value}</div><div className="metric-note">{note}</div>
  </section>;
}