import { useState } from "react";
import { Activity, HeartPulse, FileText, ShieldCheck, Download, SlidersHorizontal, ArrowUpRight, Info } from "lucide-react";
import PageHeader from "../../components/PageHeader";
import MetricCard from "../../components/MetricCard";
import SectionCard from "../../components/SectionCard";
import EmptyState from "../../components/EmptyState";

function PersonalNotice() {
  return <div className="personal-notice"><ShieldCheck size={17} /><span>This workspace displays information associated with your authenticated patient account.</span></div>;
}
export function PatientOverview() {
  return <>
    <PageHeader eyebrow="YOUR HEALTH" title="Your health overview" description="A personal view of your health information, assessments, and available reports." />
    <div className="metric-grid three"><MetricCard label="Health profile" icon={Activity} note="Your latest profile status" /><MetricCard label="Risk assessment" icon={HeartPulse} note="Your latest assessment" /><MetricCard label="Available reports" icon={FileText} note="Reports linked to your account" /></div>
    <div className="content-grid two">
      <SectionCard title="My health summary" subtitle="Information from your connected health records"><EmptyState title="Your health summary is not available yet" description="Your information will appear here when your healthcare provider connects your records." /></SectionCard>
      <SectionCard title="Recent updates" subtitle="Updates associated with your account"><EmptyState title="No recent updates" description="New reports and updates will appear here when available." /></SectionCard>
    </div>
    <PersonalNotice />
  </>;
}
export function MyHealthProfile() {
  return <>
    <PageHeader eyebrow="PERSONAL RECORD" title="My Health Profile" description="Review the personal and clinical information associated with your account." />
    <div className="content-grid two">
      <SectionCard title="Personal information"><EmptyState title="Profile information not available" description="Your verified profile information will load from your health record." /></SectionCard>
      <SectionCard title="Medical history"><EmptyState title="Medical history not available" description="Only your own authorized medical history will be shown here." /></SectionCard>
      <SectionCard title="Medications and allergies"><EmptyState title="No information loaded" /></SectionCard>
      <SectionCard title="Clinical measurements"><EmptyState title="No measurements loaded" /></SectionCard>
    </div>
    <PersonalNotice />
  </>;
}
function PersonalFeature({ title, eyebrow, description, sections }) {
  return <>
    <PageHeader eyebrow={eyebrow} title={title} description={description} />
    <div className="metric-grid three">{sections.map((label) => <MetricCard key={label} label={label} note="Your personal information" />)}</div>
    <SectionCard title="Your results" subtitle="Information is retrieved only for your authenticated patient account"><EmptyState title="No results available" description="Your results will appear here when your healthcare provider makes them available." /></SectionCard>
    <PersonalNotice />
  </>;
}
export function MyRiskAssessment() { return <PersonalFeature eyebrow="YOUR HEALTH" title="My Risk Assessment" description="Review risk information associated with your own health record." sections={["Current assessment", "Assessment date", "Follow-up status"]} />; }
export function MyExplainability() { return <PersonalFeature eyebrow="UNDERSTANDING YOUR RESULTS" title="Understanding My Results" description="View clear explanations of the factors contributing to your personal results." sections={["Your result", "Key contributing factors", "Model information"]} />; }
export function MyReports() { return <>
  <PageHeader eyebrow="YOUR DOCUMENTS" title="My Reports" description="Access reports and recommendations made available to your account." />
  <SectionCard title="Available reports" subtitle="Only reports belonging to your patient account are displayed"><EmptyState title="No reports available" description="Your healthcare provider’s reports will appear here when published to your account." /></SectionCard>
  <PersonalNotice />
</>; }
export function MySimulator() {
  const [inputs, setInputs] = useState({ activity: "current", nutrition: "current", medication: "unchanged" });
  return <>
    <PageHeader eyebrow="PERSONAL DECISION SUPPORT" title="What-If Simulator" description="Explore possible scenarios using your own health information when your care team enables this feature." />
    <div className="content-grid two">
      <SectionCard title="Scenario settings" subtitle="Choose changes to explore">
        <div className="form-field"><label>Physical activity</label><select value={inputs.activity} onChange={(e) => setInputs({ ...inputs, activity: e.target.value })}><option value="current">Current level</option><option value="increase">Increase activity</option><option value="decrease">Decrease activity</option></select></div>
        <div className="form-field"><label>Nutrition pattern</label><select value={inputs.nutrition} onChange={(e) => setInputs({ ...inputs, nutrition: e.target.value })}><option value="current">Current pattern</option><option value="balanced">More balanced pattern</option></select></div>
        <div className="form-field"><label>Medication plan</label><select value={inputs.medication} onChange={(e) => setInputs({ ...inputs, medication: e.target.value })}><option value="unchanged">No change</option><option value="clinician">Discuss with care team</option></select></div>
        <button className="primary-button" onClick={() => window.dispatchEvent(new CustomEvent("healthiq-personal-simulation", { detail: inputs }))}>Explore scenario <ArrowUpRight size={16} /></button>
      </SectionCard>
      <SectionCard title="Possible impact" subtitle="Personalized model response"><EmptyState title="Scenario results are not available" description="Your care team must enable the simulator and connect the personal prediction service before results can be shown." /></SectionCard>
    </div>
    <div className="inline-notice"><Info size={16} />Simulation outputs are estimates, not medical advice. Do not change treatment without consulting your clinician.</div>
    <PersonalNotice />
  </>;
}