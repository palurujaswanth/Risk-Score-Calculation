import { FileSearch } from "lucide-react";
export default function EmptyState({ title = "No information available", description = "Information will appear here when it is available in your connected health records.", compact = false }) {
  return <div className={`empty-state ${compact ? "empty-compact" : ""}`}>
    <div className="empty-icon"><FileSearch size={22} strokeWidth={1.6} /></div>
    <strong>{title}</strong><p>{description}</p>
  </div>;
}