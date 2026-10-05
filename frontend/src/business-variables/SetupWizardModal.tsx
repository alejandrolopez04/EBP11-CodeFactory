import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useBusinessVariables } from "./BusinessVariablesContext";
import DemandForm from "./forms/DemandForm";
import AvailabilityForm from "./forms/AvailabilityForm";
import ScheduleForm from "./forms/ScheduleForm";
import {
  DEFAULT_BUSINESS_VARIABLES,
  availabilityDraftToValues,
  demandDraftToValues,
  scheduleDraftToValues,
  toAvailabilityDraft,
  toDemandDraft,
  toScheduleDraft,
} from "./types";
import {
  validateAvailabilityValues,
  validateDemandValues,
  validateScheduleValues,
} from "./validators";

const API_URL = "http://localhost:8080/api/variables"

export default function SetupWizardModal() {
  const { variables, save } = useBusinessVariables();
  const [step, setStep] = useState(1);

  const [demandValues, setDemandValues] = useState(toDemandDraft(DEFAULT_BUSINESS_VARIABLES.demand));
  const [availabilityValues, setAvailabilityValues] = useState(toAvailabilityDraft(DEFAULT_BUSINESS_VARIABLES.availability));
  const [scheduleValues, setScheduleValues] = useState(toScheduleDraft(DEFAULT_BUSINESS_VARIABLES.schedule));
  const [highSeasonMonths, setHighSeasonMonths] = useState<string[]>(DEFAULT_BUSINESS_VARIABLES.highSeasonMonths);

  const dialogRef = useRef<HTMLDivElement | null>(null);

  const demandErrors = validateDemandValues(demandValues);
  const availabilityErrors = validateAvailabilityValues(availabilityValues);
  const scheduleErrors = validateScheduleValues(scheduleValues, highSeasonMonths);

  const currentStepHasErrors = useMemo(() => {
    if (step === 1) return Object.keys(demandErrors).length > 0;
    if (step === 2) return Object.keys(availabilityErrors).length > 0;
    return Object.keys(scheduleErrors).length > 0;
  }, [availabilityErrors, demandErrors, scheduleErrors, step]);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(
      "input, select, button:not([disabled])",
    );

    firstFocusable?.focus();
  }, [step]);

  if (variables !== null) {
    return null;
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const focusableElements = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        "button:not([disabled]), input:not([disabled]), select:not([disabled])",
      ) ?? [],
    );

    if (focusableElements.length === 0) {
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    }

    if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  const handleNext = () => {
    if (currentStepHasErrors) return;
    setStep((current) => Math.min(current + 1, 3));
  };

  const handleBack = () => {
    setStep((current) => Math.max(current - 1, 1));
  };

  const handleFinish = async () => {
    if (currentStepHasErrors || isSaving) return;

    const businessVariables = {
      demand: demandDraftToValues(demandValues),
      availability: availabilityDraftToValues(availabilityValues),
      schedule: scheduleDraftToValues(scheduleValues),
      highSeasonMonths,
    };

    // Una variable por tipo, como las guarda el backend (una fila por variableType)
    const payload = [
      { variableType: "DEMANDA", ...businessVariables.demand },
      { variableType: "DISPONIBILIDAD", ...businessVariables.availability },
      {
        variableType: "TEMPORAL",
        ...businessVariables.schedule,
        highSeasonMonths: businessVariables.highSeasonMonths,
      },
    ];

    setIsSaving(true);
    setSaveError(null);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`El servidor respondió con el código ${response.status}`);
      }

      // Solo si el backend guardó bien, actualizamos el contexto (esto cierra el modal)
      save(businessVariables);
    } catch (error) {
      setSaveError(
          error instanceof Error
              ? error.message
              : "No se pudo guardar la configuración. Intenta de nuevo.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="setup-wizard-title"
        onKeyDown={handleKeyDown}
        className="bg-white border border-[#e2e6ed] rounded-[8px] w-full max-w-xl shadow-xl p-5"
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 id="setup-wizard-title" className="text-[18px] font-bold text-[#0f1117] font-display mb-1">
              Configuración inicial
            </h2>
            <p className="text-[13px] text-[#6b7280]">
              Define las variables que el motor usará para evaluar las reglas de pricing.
            </p>
          </div>
          <span className="px-2 py-0.5 bg-[#e8ecf2] text-[#374151] text-[11px] font-medium rounded-full">
            Paso {step} de 3
          </span>
        </div>
        <div className="pt-3 border-t border-[#f1f3f7]">
          {step === 1 && (
            <div>
              <h3 className="text-[14px] font-semibold text-[#0f1117] font-display">Demanda</h3>
              <p className="text-[12px] text-[#6b7280] mt-0.5 mb-3">
                Define niveles de demanda y sus rangos numéricos de referencia.
              </p>
              <DemandForm
                values={demandValues}
                errors={demandErrors}
                onChange={setDemandValues}
                autoFocus
              />
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 className="text-[14px] font-semibold text-[#0f1117] font-display">Disponibilidad</h3>
              <p className="text-[12px] text-[#6b7280] mt-0.5 mb-3">
                Define umbrales de stock para activar reglas de pricing.
              </p>
              <AvailabilityForm
                values={availabilityValues}
                errors={availabilityErrors}
                onChange={setAvailabilityValues}
                autoFocus
              />
            </div>
          )}

          {step === 3 && (
            <div>
              <h3 className="text-[14px] font-semibold text-[#0f1117] font-display">Horario / Temporada</h3>
              <p className="text-[12px] text-[#6b7280] mt-0.5 mb-3">
                Define franjas horarias y temporadas que condicionan los precios.
              </p>
              <ScheduleForm
                values={scheduleValues}
                highSeasonMonths={highSeasonMonths}
                errors={scheduleErrors}
                onScheduleChange={setScheduleValues}
                onMonthsChange={setHighSeasonMonths}
                autoFocus
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-[#f1f3f7]">
          {step > 1 && (
            <button
              type="button"
              onClick={handleBack}
              disabled={isSaving}
              className="px-3 py-1.5 text-[12px] font-semibold text-[#374151] border border-[#e2e6ed] rounded-[6px] hover:bg-[#f1f3f7] transition-colors"
            >
              Atrás
            </button>
          )}

          {step < 3 && (
            <button
              type="button"
              onClick={handleNext}
              disabled={currentStepHasErrors}
              className={`px-3 py-1.5 text-[12px] font-semibold rounded-[6px] transition-colors ${
                currentStepHasErrors
                  ? "bg-[#9ca3af] text-white cursor-not-allowed"
                  : "bg-[#1a56db] text-white hover:bg-[#1648c0]"
              }`}
            >
              Siguiente
            </button>
          )}

          {step === 3 && (
              <button
                  type="button"
                  onClick={handleFinish}
                  disabled={currentStepHasErrors || isSaving}
                  className={`px-3 py-1.5 text-[12px] font-semibold rounded-[6px] transition-colors ${
                      currentStepHasErrors || isSaving
                          ? "bg-[#9ca3af] text-white cursor-not-allowed"
                          : "bg-[#1a56db] text-white hover:bg-[#1648c0]"
                  }`}
              >
                {isSaving ? "Guardando..." : "Finalizar"}
              </button>
          )}
        </div>
      </div>
    </div>
  );
}
