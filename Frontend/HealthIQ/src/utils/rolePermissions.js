export const roleHome = {
  patient: "/patient/overview",
  doctor: "/overview",
  admin: "/overview",
};

export const rolePermissions = {
  patient: [
    "patient.overview", "patient.profile", "patient.risk",
    "patient.explainability", "patient.simulator", "patient.reports",
  ],
  doctor: [
    "professional.overview", "patients.read", "patient360.read",
    "risk.read", "explainability.read", "simulator.use", "reports.read",
  ],
  admin: [
    "professional.overview", "patients.read", "patient360.read",
    "risk.read", "explainability.read", "simulator.use", "reports.read",
    "data.manage", "users.manage",
  ],
};

export function canAccess(role, permission) {
  return Boolean(rolePermissions[role]?.includes(permission));
}

export function landingPath(role) {
  return roleHome[role] || "/login";
}