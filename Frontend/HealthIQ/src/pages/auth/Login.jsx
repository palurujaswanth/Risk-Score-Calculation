import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LockKeyhole, Mail, ArrowRight, ShieldCheck } from "lucide-react";
import Brand from "../../components/Brand";
import { useAuth } from "../../context/AuthContext";
import { landingPath } from "../../utils/rolePermissions";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const user = await signIn(email.trim(), password);
      navigate(landingPath(String(user.role).toLowerCase()), { replace: true });
    } catch (err) {
      setError(err.message || "Unable to sign in. Check your credentials and try again.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="login-page">
    <div className="login-aside">
      <div className="login-brand"><Brand /></div>
      <div className="login-message">
        <div className="login-kicker"><span /> CONNECTED CARE INTELLIGENCE</div>
        <h1>Better insight.<br />More informed care.</h1>
        <p>A unified view of health information, clinical context, and intelligent decision support.</p>
        <div className="login-assurance"><ShieldCheck size={17} /><span>Secure access based on your account permissions</span></div>
      </div>
      <div className="login-aside-footer">HEALTHIQ · HEALTHCARE INTELLIGENCE</div>
    </div>

    <div className="login-main">
      <div className="login-form-wrap">
        <div className="mobile-login-brand"><Brand /></div>
        <div className="login-form-heading">
          <div className="eyebrow">ACCOUNT ACCESS</div>
          <h2>Welcome back</h2>
          <p>Sign in with your registered account to continue.</p>
        </div>
        <form onSubmit={submit} className="login-form">
          <label htmlFor="email">Email address</label>
          <div className="field-with-icon"><Mail size={17} /><input id="email" type="email" autoComplete="username" required placeholder="name@hospital.com" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <label htmlFor="password">Password</label>
          <div className="field-with-icon"><LockKeyhole size={17} /><input id="password" type="password" autoComplete="current-password" required placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <div className="login-forgot-row"><Link to="/forgot-password">Forgot password?</Link></div>
          {error && <div className="form-error" role="alert">{error}</div>}
          <button className="primary-button login-submit" type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"} <ArrowRight size={17} /></button>
        </form>
        <div className="register-prompt">New patient? <Link to="/register">Create a patient account</Link></div>
        <div className="login-security"><ShieldCheck size={16} /><span>Your workspace is determined by your authenticated account. Patient accounts can only access their own records.</span></div>
        <div className="login-help">Doctors receive access through an administrator invitation. Administrator accounts are provisioned by an authorized super-administrator.</div>
      </div>
      <div className="login-bottom">© {new Date().getFullYear()} HealthIQ <span>·</span> All rights reserved</div>
    </div>
  </div>;
}