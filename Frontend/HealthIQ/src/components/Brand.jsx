import { Activity } from "lucide-react";
export default function Brand({ compact = false }) {
  return <div className={`brand ${compact ? "brand-compact" : ""}`}>
    <span className="brand-mark"><Activity size={19} strokeWidth={2.4} /></span>
    {!compact && <span><strong>HealthIQ</strong><small>Healthcare Intelligence</small></span>}
  </div>;
}