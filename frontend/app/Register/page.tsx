import type { Metadata } from "next";
import { UnifiedRegisterForm } from "./UnifiedRegisterForm";

export const metadata: Metadata = {
  title: "Create Account | TechGarments (GarmentLink AI)",
  description: "Register as a Brand or Factory to access the TechGarments intelligent manufacturing marketplace.",
};

export default function RegisterPage() {
  return <UnifiedRegisterForm defaultRole="BUYER" />;
}
