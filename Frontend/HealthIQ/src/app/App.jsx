import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import Login from "../pages/auth/Login";
import {
  PatientRegistration,
  VerifyEmail,
  ForgotPassword,
  ResetPassword,
  AcceptInvitation,
} from "../pages/auth/AccountPages";
import ProfessionalLayout from "../layouts/ProfessionalLayout";
import PatientLayout from "../layouts/PatientLayout";
import {
  CommandCenter, PatientExplorer, Patient360, DataManagement,
  RiskAssessment, Explainability, Simulator, Reports, UserManagement,
} from "../pages/professional/ProfessionalPages";
import {
  PatientOverview, MyHealthProfile, MyRiskAssessment,
  MyExplainability, MySimulator, MyReports,
} from "../pages/patient/PatientPages";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<PatientRegistration />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/accept-invitation" element={<AcceptInvitation />} />

      <Route element={<ProtectedRoute allow={["doctor", "admin"]} />}>
        <Route element={<ProfessionalLayout />}>
          <Route path="/overview" element={<CommandCenter />} />
          <Route path="/patients" element={<PatientExplorer />} />
          <Route path="/patients/:id" element={<Patient360 />} />
          <Route path="/risk-assessment" element={<RiskAssessment />} />
          <Route path="/explainability" element={<Explainability />} />
          <Route path="/simulator" element={<Simulator />} />
          <Route path="/reports" element={<Reports />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allow={["admin"]} />}>
        <Route element={<ProfessionalLayout />}>
          <Route path="/data-management" element={<DataManagement />} />
          <Route path="/admin/users" element={<UserManagement />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allow={["patient"]} />}>
        <Route element={<PatientLayout />}>
          <Route path="/patient/overview" element={<PatientOverview />} />
          <Route path="/patient/profile" element={<MyHealthProfile />} />
          <Route path="/patient/risk" element={<MyRiskAssessment />} />
          <Route path="/patient/explainability" element={<MyExplainability />} />
          <Route path="/patient/simulator" element={<MySimulator />} />
          <Route path="/patient/reports" element={<MyReports />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}