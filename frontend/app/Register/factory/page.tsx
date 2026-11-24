import type { Metadata } from "next";
import { UnifiedRegisterForm } from "../UnifiedRegisterForm";

export const metadata: Metadata = {
  title: "Register Factory | TechGarments",
  description: "Create your garment factory account on TechGarments.",
};

export default function FactoryRegistrationPage() {
  return <UnifiedRegisterForm defaultRole="FACTORY" />;
}
