import type { ReactNode } from "react";
import { useBusinessVariables } from "./BusinessVariablesContext";
import SetupWizardModal from "./SetupWizardModal";

export default function AppGate({ children }: { children: ReactNode }) {
  const { variables, isLoaded } = useBusinessVariables();

  if (!isLoaded) {
    return null;
  }

  return (
    <>
      {children}
      {variables === null && <SetupWizardModal />}
    </>
  );
}
