import type { Metadata } from "next";
import { UnifiedRegisterForm } from "../UnifiedRegisterForm";

export const metadata: Metadata = {
  title: "Register Brand / Buyer | TechGarments",
  description: "Create your brand or buyer account on TechGarments.",
};

export default function BuyerRegistrationPage() {
  return <UnifiedRegisterForm defaultRole="BUYER" />;
}
