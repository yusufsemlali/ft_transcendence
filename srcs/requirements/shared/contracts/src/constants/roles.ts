// The "as const" freezes this array into a strict tuple of literal values
export const ORG_ROLES = ["owner", "admin", "referee", "member"] as const;

// Extract the TypeScript type from the array ("owner" | "admin" | "referee" | "member")
export type OrgRole = typeof ORG_ROLES[number];
