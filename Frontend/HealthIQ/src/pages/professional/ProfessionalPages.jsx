import { useState } from "react";
import { useParams } from "react-router-dom";
import { Activity, Users, HeartPulse, FileText, Database, UploadCloud, Download, Search, Filter, ChevronRight, CalendarDays, ArrowUpRight, ShieldCheck, SlidersHorizontal, Microscope, UserPlus, RefreshCw } from "lucide-react";
import PageHeader from "../../components/PageHeader";
import MetricCard from "../../components/MetricCard";
import SectionCard from "../../components/SectionCard";
import EmptyState from "../../components/EmptyState";
import { api } from "../../services/api";

function WorkspaceNotice({ children = "Connect your clinical data service to populate this workspace." }) {
  return <div className="inline-notice"><Activity size={16} />{children}</div>;
}

export function CommandCenter() {
  return <>
    <PageHeader eyebrow="CLINICAL WORKSPACE" title="Command Center" description="A consolidated view of hospital activity and clinical intelligence." action={<button className="secondary-button"><CalendarDays size={16} /> Date range</button>} />
    <div className="metric-grid four">
      <MetricCard label="Registered patients" icon={Users} />
      <MetricCard label="Patients requiring review" icon={HeartPulse} />
      <MetricCard label="Assessments completed" icon={Activity} />
      <MetricCard label="Reports available" icon={FileText} />
    </div>
    <div className="content-grid two-one">
      <SectionCard title="Clinical activity" subtitle="Recent activity from connected hospital systems"><EmptyState title="No clinical activity yet" description="Activity will appear when your backend connects hospital records and events." /></SectionCard>
      <SectionCard title="System status" subtitle="Connected data services"><div className="status-list"><div><span className="status-dot muted" /> Clinical records <b>Not connected</b></div><div><span className="status-dot muted" /> Risk engine <b>Not connected</b></div><div><span className="status-dot muted" /> Reporting service <b>Not connected</b></div></div></SectionCard>
    </div>
    <WorkspaceNotice />
  </>;
}

export function PatientExplorer() {
  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  async function loadPatients() {
    setLoading(true); setSearched(true);
    try {
      const result = await api.get(`/patients?search=${encodeURIComponent(query)}`);
      setPatients(result.items || result.patients || []);
    } catch { setPatients([]); }
    finally { setLoading(false); }
  }
  return <>
    <PageHeader eyebrow="PATIENT DIRECTORY" title="Patient Explorer" description="Search and review patient records available within your hospital." />
    <SectionCard title="Patient directory" subtitle="Doctor access includes all patients registered within the hospital.">
      <div className="table-toolbar">
        <div className="table-search"><Search size={16} /><input placeholder="Search by patient name or ID" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && loadPatients()} /></div>
        <button className="secondary-button" onClick={loadPatients} disabled={loading}><Filter size={15} /> {loading ? "Searching…" : "Search patients"}</button>
      </div>
      {patients.length ? <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Patient</th><th>Patient ID</th><th>Age</th><th>Last updated</th><th /></tr></thead><tbody>{patients.map((p) => <tr key={p.id}><td>{p.name || "—"}</td><td>{p.patientId || p.id}</td><td>{p.age ?? "—"}</td><td>{p.updatedAt || "—"}</td><td><a className="table-link" href={`/patients/${p.id}`}>View record <ChevronRight size={14} /></a></td></tr>)}</tbody></table></div> : <EmptyState title={searched ? "No matching patient records" : "Patient records are not connected"} description={searched ? "No records were returned. Check your search or connected patient service." : "Use the search field after connecting your patient records API. No patient information is stored in this interface."} />}
    </SectionCard>
  </>;
}

export function Patient360() {
  const { id } = useParams();
  return <>
    <PageHeader eyebrow="PATIENT RECORD" title="Patient 360°" description={`Patient reference: ${id}`} action={<button className="secondary-button"><Download size={15} /> Export record</button>} />
    <div className="metric-grid four"><MetricCard label="Demographics" /><MetricCard label="Active conditions" /><MetricCard label="Current medications" /><MetricCard label="Recent assessments" /></div>
    <div className="content-grid two">
      <SectionCard title="Patient information"><EmptyState title="Record details unavailable" description="The authorized patient profile will load from your backend." /></SectionCard>
      <SectionCard title="Clinical history"><EmptyState title="No history loaded" description="Longitudinal clinical history will appear here when available." /></SectionCard>
      <SectionCard title="Risk and assessments"><EmptyState title="No assessment data" /></SectionCard>
      <SectionCard title="Reports and recommendations"><EmptyState title="No reports available" /></SectionCard>
    </div>
  </>;
}

export function DataManagement() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function upload() {
    if (!file) return;
    setBusy(true); setMessage("");
    const body = new FormData(); body.append("file", file);
    try { const result = await api.upload("/admin/data/import", body); setMessage(result.message || "File submitted to the data service."); }
    catch (err) { setMessage(err.message || "Unable to upload file. Check the data service connection."); }
    finally { setBusy(false); }
  }
  return <>
    <PageHeader eyebrow="PLATFORM ADMINISTRATION" title="Data Management" description="Manage secure data ingestion and monitor connected source systems." />
    <div className="content-grid two">
      <SectionCard title="Import health data" subtitle="Select a file and submit it to your configured backend ingestion endpoint.">
        <div className="upload-panel"><div className="upload-icon"><UploadCloud size={25} /></div><strong>Choose a data file</strong><p>CSV, XLSX, or other formats supported by your ingestion service.</p><label className="secondary-button file-select">Browse files<input type="file" onChange={(e) => { setFile(e.target.files?.[0] || null); setMessage(""); }} /></label>{file && <div className="selected-file"><FileText size={15} />{file.name}</div>}<button className="primary-button" disabled={!file || busy} onClick={upload}>{busy ? "Submitting…" : "Upload to data service"} <ArrowUpRight size={16} /></button>{message && <p className="upload-message">{message}</p>}</div>
      </SectionCard>
      <SectionCard title="Connected sources" subtitle="Connection status reported by your backend"><div className="source-list"><div><Database size={18} /><span><b>Electronic health records</b><small>Clinical record integration</small></span><em>Not connected</em></div><div><Database size={18} /><span><b>Laboratory information system</b><small>Laboratory results integration</small></span><em>Not connected</em></div><div><Database size={18} /><span><b>Imaging information system</b><small>Imaging and diagnostic integration</small></span><em>Not connected</em></div></div></SectionCard>
    </div>
    <SectionCard title="Ingestion history" subtitle="Import jobs and validation results"><EmptyState title="No ingestion activity" description="Import history will be displayed after your backend reports ingestion jobs." /></SectionCard>
  </>;
}

function FeaturePage({ eyebrow, title, description, sections }) {
  return <>
    <PageHeader eyebrow={eyebrow} title={title} description={description} />
    <div className="metric-grid three">{sections.map((s) => <MetricCard key={s} label={s} />)}</div>
    <SectionCard title="Analysis workspace" subtitle="Results are populated from your connected clinical and analytics services"><EmptyState title="No analysis available" description="Connect the corresponding backend service to view authorized patient results and analysis." /></SectionCard>
    <WorkspaceNotice />
  </>;
}
export function RiskAssessment() { return <FeaturePage eyebrow="CLINICAL INTELLIGENCE" title="Risk Assessment" description="Review patient-level risk outputs generated by your configured clinical models." sections={["Risk assessments", "High-priority reviews", "Model evaluations"]} />; }
export function Explainability() { return <FeaturePage eyebrow="MODEL INTERPRETABILITY" title="Explainable AI" description="Understand the factors and evidence contributing to model-generated outputs." sections={["Explanations available", "Features evaluated", "Model versions"]} />; }
export function Simulator() {
  const [values, setValues] = useState({ age: "", systolic: "", bmi: "" });
  return <>
    <PageHeader eyebrow="DECISION SUPPORT" title="What-If Simulator" description="Explore how changes to selected inputs may affect model outputs. This tool does not replace clinical judgement." />
    <div className="content-grid two">
      <SectionCard title="Scenario inputs" subtitle="Enter values to submit a scenario to your configured model service">
        <div className="form-grid">
          {[["age", "Age (years)"], ["systolic", "Systolic blood pressure"], ["bmi", "BMI"]].map(([key, label]) => <label className="form-field" key={key}>{label}<input type="number" value={values[key]} onChange={(e) => setValues({ ...values, [key]: e.target.value })} placeholder="Enter value" /></label>)}
        </div>
        <button className="primary-button" onClick={() => window.dispatchEvent(new CustomEvent("healthiq-simulation-request", { detail: values }))}>Run scenario <ArrowUpRight size={16} /></button>
      </SectionCard>
      <SectionCard title="Scenario output" subtitle="Model response"><EmptyState title="No scenario run" description="A result will be shown after the simulator API is connected and a scenario is submitted." /></SectionCard>
    </div>
  </>;
}
export function Reports() { return <FeaturePage eyebrow="CLINICAL OUTPUTS" title="Reports & Recommendations" description="Access reports and recommendations generated for authorized hospital patients." sections={["Available reports", "Recommendations", "Recent exports"]} />; }
export function UserManagement() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", professionalId: "", specialty: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function update(key) {
    return (event) => setForm((old) => ({ ...old, [key]: event.target.value }));
  }

  async function invite(event) {
    event.preventDefault();
    setMessage(""); setError(""); setBusy(true);
    try {
      const result = await api.post("/admin/users/invite", form);
      setMessage(result.message || `An invitation has been sent to ${form.email}.`);
      setForm({ fullName: "", email: "", phone: "", professionalId: "", specialty: "" });
      setShowForm(false);
    } catch (err) {
      setError(err.message || "Unable to send the invitation. Check the user administration service.");
    } finally {
      setBusy(false);
    }
  }

  return <>
    <PageHeader eyebrow="ACCESS CONTROL" title="User Management" description="Invite doctors and manage platform access. Administrator permissions are controlled by your identity service." action={<button className="primary-button" onClick={() => { setShowForm(!showForm); setError(""); setMessage(""); }}><UserPlus size={16} /> {showForm ? "Close form" : "Invite doctor"}</button>} />
    {message && <div className="success-banner"><ShieldCheck size={16} />{message}</div>}
    {showForm && <SectionCard title="Invite a doctor" subtitle="The doctor will receive a secure invitation link to verify their email and set a password.">
      <form className="invite-form" onSubmit={invite}>
        <div className="form-grid">
          <label className="form-field">Full name<input required value={form.fullName} onChange={update("fullName")} placeholder="Doctor's full name" /></label>
          <label className="form-field">Work email<input required type="email" value={form.email} onChange={update("email")} placeholder="doctor@hospital.com" /></label>
          <label className="form-field">Mobile number<input type="tel" value={form.phone} onChange={update("phone")} placeholder="Contact number" /></label>
          <label className="form-field">Professional registration ID<input required value={form.professionalId} onChange={update("professionalId")} placeholder="Registration / license ID" /></label>
          <label className="form-field">Specialty<input value={form.specialty} onChange={update("specialty")} placeholder="Department or specialty" /></label>
        </div>
        <div className="auth-info"><ShieldCheck size={16} /><span>The backend assigns the doctor role and associates the invitation with this hospital. The recipient cannot choose their own role.</span></div>
        {error && <div className="form-error" role="alert">{error}</div>}
        <button className="primary-button" type="submit" disabled={busy}>{busy ? "Sending invitation…" : "Send doctor invitation"} <ArrowUpRight size={16} /></button>
      </form>
    </SectionCard>}
    <SectionCard title="Platform users" subtitle="The user directory and account status are supplied by the administration API">
      <EmptyState title="User directory is not connected" description="Connect the user administration API to view accounts, invitations, and access status." />
    </SectionCard>
    <WorkspaceNotice>Role changes and hospital access must be validated and enforced by the backend identity service.</WorkspaceNotice>
  </>;
}
