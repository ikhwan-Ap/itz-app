/**
 * ITZ-App — Role Permission System
 *
 * Single source of truth untuk semua permission di frontend.
 * Dipakai oleh: DashboardLayout (nav), ProtectedRoute (route guard),
 * CommandPalette (search), dan komponen lain yang butuh role check.
 */

// =========================================================
// ROLE DEFINITIONS
// =========================================================
export const ROLES = {
  SUPERADMIN: "superadmin",
  ADMIN: "admin",
  MARKETING: "marketing",
  USER: "user",
};

// =========================================================
// PERMISSION MAP
// Setiap permission key → array of roles yang boleh
// =========================================================
export const PERMISSIONS = {
  // Dashboard
  VIEW_DASHBOARD: ["user", "admin", "superadmin", "marketing"],
  VIEW_ADMIN_STATS: ["admin", "superadmin"],
  VIEW_MARKETING_STATS: ["marketing", "admin", "superadmin"],
  VIEW_USER_STATS: ["user", "admin", "superadmin"],

  // Training
  VIEW_TRAINING: ["user", "admin", "superadmin"],
  RUN_CALCULATOR: ["user", "admin", "superadmin"],

  // Admin — Users
  VIEW_USERS: ["admin", "superadmin"],
  CREATE_USER: ["admin", "superadmin"],
  UPDATE_USER: ["admin", "superadmin"],
  DELETE_USER: ["superadmin"],

  // Admin — Packages
  VIEW_PACKAGES: ["admin", "superadmin"],
  MANAGE_PACKAGES: ["admin", "superadmin"],

  // Admin — Promos
  VIEW_PROMOS: ["admin", "superadmin", "marketing"],
  MANAGE_PROMOS: ["admin", "superadmin", "marketing"],

  // Admin — Transactions
  VIEW_TRANSACTIONS: ["admin", "superadmin"],
  APPROVE_TRANSACTION: ["admin", "superadmin"],

  // Admin — CMS
  VIEW_CMS: ["admin", "superadmin"],
  MANAGE_CMS: ["admin", "superadmin"],

  // Admin — Payment Config (superadmin only)
  VIEW_PAYMENT_CONFIG: ["admin", "superadmin"],
  MANAGE_PAYMENT_CONFIG: ["superadmin"],

  // Marketing
  VIEW_MARKETING_DASHBOARD: ["marketing", "admin", "superadmin"],

  // Audit Logs (superadmin only)
  VIEW_AUDIT_LOGS: ["superadmin"],
};

// =========================================================
// HELPER FUNCTIONS
// =========================================================

/**
 * Check if a role has a specific permission.
 * @param {string} role - user role
 * @param {string} permission - permission key from PERMISSIONS
 * @returns {boolean}
 */
export function can(role, permission) {
  if (!role || !permission) return false;
  const allowed = PERMISSIONS[permission];
  if (!allowed) return false;
  return allowed.includes(role);
}

/**
 * Check if a role is in a list of allowed roles.
 * @param {string} role
 * @param {string[]} roles
 * @returns {boolean}
 */
export function hasRole(role, roles) {
  if (!role || !roles) return false;
  return roles.includes(role);
}

/**
 * Get the default redirect path after login based on role.
 * Semua role masuk ke /app — dashboard unified menangani tampilan.
 */
export function getDefaultPath(role) {
  // Semua role masuk ke /app — unified dashboard
  return "/app";
}

/**
 * Get dashboard sections visible for a role.
 * Dipakai oleh UnifiedDashboard untuk render section yang tepat.
 */
export function getDashboardSections(role) {
  return {
    showAdminStats: can(role, "VIEW_ADMIN_STATS"),
    showMarketingStats: can(role, "VIEW_MARKETING_STATS"),
    showUserStats: can(role, "VIEW_USER_STATS"),
    showTrainingShortcuts: can(role, "VIEW_TRAINING"),
    showPendingApprovals: can(role, "APPROVE_TRANSACTION"),
    showExpiringUsers: can(role, "VIEW_USERS"),
  };
}
