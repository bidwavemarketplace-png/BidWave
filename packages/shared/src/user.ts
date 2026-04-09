export type UserRole = "buyer" | "seller" | "admin";

export type UserSummary = {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  countryCode: string;
};
