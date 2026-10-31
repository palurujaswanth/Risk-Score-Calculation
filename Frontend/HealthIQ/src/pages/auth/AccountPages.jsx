import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, KeyRound, LockKeyhole, Mail, ShieldCheck, UserRound, Phone, CalendarDays, IdCard } from "lucide-react";
import Brand from "../../components/Brand";
import { api } from "../../services/api";

function AuthShell({ eyebrow, title, description, children, footer }) {
  return <div className="auth-page">
    <div className="auth-top"><Link to="/login" className="auth-brand"><Brand /></Link><Link to="/login" className="back-login"><ArrowLeft size={15} /> Back to sign in</Link></div>
    <main className="auth-card">
      <div className="auth-card-heading"><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>
      {children}
      {footer && <div className="auth-card-footer">{footer}</div>}
    </main>
    <div className="auth-page-footer"><ShieldCheck size={14} /> Secure account access · HealthIQ</div>
  </div>;
}

function PasswordField({ label, value, onChange, id }) {
  return <label className="auth-field" htmlFor={id}>{label}<div className="field-with-icon"><LockKeyhole size={16} /><input id={id} type="password" value={value} onChange={onChange} required minLength={8} autoComplete="new-password" placeholder="At least 8 characters" /></div></label>;
}

function passwordError(password, confirmation) {
  if (password.length < 8) return "Use a password with at least 8 characters.";
  if (password !== confirmation) return "The passwords do not match.";
  return "";
}

export function PatientRegistration() {
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", dateOfBirth: "", patientId: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const update = (key) => (event) => setForm((old) => ({ ...old, [key]: event.target.value }));

  async function submit(event) {
    event.preventDefault();
    setError("");
    const validation = passwordError(form.password, form.confirmPassword);
    if (validation) return setError(validation);
    setBusy(true);
    try {
      const { confirmPassword, ...payload } = form;
      const result = await api.post("/auth/register/patient", payload);
      if (result.challengeId) {
        const query = new URLSearchParams({ challengeId: result.challengeId, email: form.email });
        navigate(`/verify-email?${query.toString()}`);
      } else if (result.verificationRequired === false) {
        navigate("/login", { state: { notice: "Your account has been created. Sign in to continue." } });
      } else {
        setError("The registration service response is incomplete. Please contact your administrator.");
      }
    } catch (err) {
      setError(err.message || "Unable to create your account. Please check your details and try again.");
    } finally {
      setBusy(false);
    }
  }

  return <AuthShell eyebrow="PATIENT ACCOUNT" title="Create your account" description="Register to securely access the health information associated with your hospital record." footer={<>Already registered? <Link to="/login">Sign in</Link></>}>
    <form className="auth-form" onSubmit={submit}>
      <div className="auth-form-grid">
        <label className="auth-field span-two" htmlFor="fullName">Full name<div className="field-with-icon"><UserRound size={16} /><input id="fullName" required autoComplete="name" value={form.fullName} onChange={update("fullName")} placeholder="Enter your full name" /></div></label>
        <label className="auth-field" htmlFor="regEmail">Email address<div className="field-with-icon"><Mail size={16} /><input id="regEmail" type="email" required autoComplete="email" value={form.email} onChange={update("email")} placeholder="you@example.com" /></div></label>
        <label className="auth-field" htmlFor="phone">Mobile number<div className="field-with-icon"><Phone size={16} /><input id="phone" type="tel" required autoComplete="tel" value={form.phone} onChange={update("phone")} placeholder="Enter mobile number" /></div></label>
        <label className="auth-field" htmlFor="dob">Date of birth<div className="field-with-icon"><CalendarDays size={16} /><input id="dob" type="date" required value={form.dateOfBirth} onChange={update("dateOfBirth")} /></div></label>
        <label className="auth-field" htmlFor="patientId">Hospital Patient ID <span className="optional-label">Optional if not available</span><div className="field-with-icon"><IdCard size={16} /><input id="patientId" value={form.patientId} onChange={update("patientId")} placeholder="Enter your patient ID" /></div></label>
        <div className="auth-field"><PasswordField label="Password" id="regPassword" value={form.password} onChange={update("password")} /></div>
        <div className="auth-field"><PasswordField label="Confirm password" id="confirmPassword" value={form.confirmPassword} onChange={update("confirmPassword")} /></div>
      </div>
      <div className="auth-info"><ShieldCheck size={16} /><span>Your account will be assigned the patient role. Your hospital record must be verified and linked by the registration service before personal health information is shown.</span></div>
      {error && <div className="form-error" role="alert">{error}</div>}
      <button className="primary-button auth-submit" type="submit" disabled={busy}>{busy ? "Creating account…" : "Create patient account"} <ArrowRight size={16} /></button>
    </form>
  </AuthShell>;
}

export function VerifyEmail() {
  const [params] = useSearchParams();
  const challengeId = params.get("challengeId") || "";
  const email = params.get("email") || "";
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  async function verify(event) {
    event.preventDefault(); setError(""); setBusy(true);
    try {
      await api.post("/auth/verify-email", { challengeId, email, code });
      setSuccess(true);
    } catch (err) {
      setError(err.message || "The verification code could not be confirmed.");
    } finally { setBusy(false); }
  }
  async function resend() {
    setError("");
    try { await api.post("/auth/resend-verification", { challengeId, email }); setError("A new verification code has been sent."); }
    catch (err) { setError(err.message || "Unable to resend the verification code."); }
  }

  return <AuthShell eyebrow="EMAIL VERIFICATION" title={success ? "Email verified" : "Check your email"} description={success ? "Your email address has been verified. You can now sign in after your patient account is activated." : <>Enter the verification code sent to <strong>{email || "your email address"}</strong>.</>} footer={<Link to="/login">Return to sign in</Link>}>
    {success ? <div className="auth-success"><CheckCircle2 size={34} /><strong>Verification completed</strong><p>Continue to sign in. Your patient information will be available after your hospital record is linked and approved, where required.</p><Link className="primary-button auth-submit link-button" to="/login">Go to sign in <ArrowRight size={16} /></Link></div> :
      <form className="auth-form" onSubmit={verify}>
        <label className="auth-field" htmlFor="verificationCode">Verification code<div className="field-with-icon"><KeyRound size={16} /><input id="verificationCode" inputMode="numeric" autoComplete="one-time-code" required value={code} onChange={(e) => setCode(e.target.value)} placeholder="Enter the code from your email" /></div></label>
        {error && <div className="form-error" role="alert">{error}</div>}
        <button className="primary-button auth-submit" type="submit" disabled={busy || !challengeId}>{busy ? "Verifying…" : "Verify email"} <ArrowRight size={16} /></button>
        <button className="text-button" type="button" onClick={resend} disabled={!challengeId}>Resend verification code</button>
      </form>}
  </AuthShell>;
}

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function submit(event) {
    event.preventDefault(); setError(""); setBusy(true);
    try {
      await api.post("/auth/forgot-password", { email });
      navigate(`/reset-password?${new URLSearchParams({ email }).toString()}`);
    } catch (err) {
      setError(err.message || "Unable to process the request. Please try again.");
    } finally { setBusy(false); }
  }

  return <AuthShell eyebrow="ACCOUNT RECOVERY" title="Reset your password" description="Enter the email address associated with your account. If it is registered, the password reset instructions will be sent to it." footer={<Link to="/login">Return to sign in</Link>}>
    <form className="auth-form" onSubmit={submit}>
      <label className="auth-field" htmlFor="forgotEmail">Email address<div className="field-with-icon"><Mail size={16} /><input id="forgotEmail" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></div></label>
      {error && <div className="form-error" role="alert">{error}</div>}
      <button className="primary-button auth-submit" type="submit" disabled={busy}>{busy ? "Sending instructions…" : "Continue"} <ArrowRight size={16} /></button>
    </form>
  </AuthShell>;
}

export function ResetPassword() {
  const [params] = useSearchParams();
  const email = params.get("email") || "";
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault(); setError("");
    const validation = passwordError(password, confirmPassword);
    if (validation) return setError(validation);
    setBusy(true);
    try {
      await api.post("/auth/reset-password", { email, code, password });
      setDone(true);
    } catch (err) {
      setError(err.message || "Unable to reset your password. Check the code and try again.");
    } finally { setBusy(false); }
  }

  return <AuthShell eyebrow="ACCOUNT RECOVERY" title={done ? "Password updated" : "Choose a new password"} description={done ? "Your password has been changed. Use your new password the next time you sign in." : `Enter the reset code sent to ${email || "your registered email"} and choose a new password.`} footer={<Link to="/login">Return to sign in</Link>}>
    {done ? <div className="auth-success"><CheckCircle2 size={34} /><strong>Password changed successfully</strong><Link className="primary-button auth-submit link-button" to="/login">Go to sign in <ArrowRight size={16} /></Link></div> :
      <form className="auth-form" onSubmit={submit}>
        <label className="auth-field" htmlFor="resetCode">Password reset code<div className="field-with-icon"><KeyRound size={16} /><input id="resetCode" required value={code} onChange={(e) => setCode(e.target.value)} placeholder="Enter reset code" /></div></label>
        <PasswordField label="New password" id="newPassword" value={password} onChange={(e) => setPassword(e.target.value)} />
        <PasswordField label="Confirm new password" id="confirmNewPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        {error && <div className="form-error" role="alert">{error}</div>}
        <button className="primary-button auth-submit" type="submit" disabled={busy}>{busy ? "Updating password…" : "Update password"} <ArrowRight size={16} /></button>
      </form>}
  </AuthShell>;
}

export function AcceptInvitation() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault(); setError("");
    const validation = passwordError(password, confirmPassword);
    if (validation) return setError(validation);
    if (!token) return setError("This invitation link is missing its security token. Request a new invitation from your administrator.");
    setBusy(true);
    try {
      await api.post("/auth/accept-invitation", { token, password });
      setDone(true);
    } catch (err) {
      setError(err.message || "This invitation could not be accepted. It may have expired.");
    } finally { setBusy(false); }
  }

  return <AuthShell eyebrow="DOCTOR ACCOUNT INVITATION" title={done ? "Account activated" : "Set up your account"} description={done ? "Your invited account has been activated. You can now sign in using your invited email address." : "Create a password to activate the account invitation sent by your hospital administrator."} footer={<Link to="/login">Return to sign in</Link>}>
    {done ? <div className="auth-success"><CheckCircle2 size={34} /><strong>Your account is ready</strong><p>Your role and hospital access are managed by your administrator.</p><Link className="primary-button auth-submit link-button" to="/login">Go to sign in <ArrowRight size={16} /></Link></div> :
      <form className="auth-form" onSubmit={submit}>
        <div className="auth-info"><ShieldCheck size={16} /><span>This invitation establishes the role assigned by your administrator. You cannot select or change your own role here.</span></div>
        <PasswordField label="Create password" id="invitePassword" value={password} onChange={(e) => setPassword(e.target.value)} />
        <PasswordField label="Confirm password" id="inviteConfirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        {error && <div className="form-error" role="alert">{error}</div>}
        <button className="primary-button auth-submit" type="submit" disabled={busy || !token}>{busy ? "Activating account…" : "Activate account"} <ArrowRight size={16} /></button>
      </form>}
  </AuthShell>;
}