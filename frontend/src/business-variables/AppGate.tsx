import type { ReactNode } from "react";
import { useBusinessVariables } from "./BusinessVariablesContext";
import SetupWizardModal from "./SetupWizardModal";
import { useProfile } from "../auth/ProfileContext";
import LoadingScreen from "../components/LoadingScreen";

export default function AppGate({ children }: { children: ReactNode }) {
  const { variables, status, isLoaded } = useBusinessVariables();
  const { canModify } = useProfile();

  if (!isLoaded) {
    return <LoadingScreen label="Cargando variables…" />;
  }

  return (
    <>
      {children}
      {status === "ready" && variables === null &&
        (canModify ? (
          <SetupWizardModal />
        ) : (
          <div className="fixed bottom-4 right-4 bg-white border border-[#e2e6ed] rounded-[6px] px-4 py-3 text-[12px] text-[#374151] shadow">
            Las variables de negocio aún no están configuradas. Cambia al perfil Administrador para configurarlas.
          </div>
        ))}
    </>
  );
}
