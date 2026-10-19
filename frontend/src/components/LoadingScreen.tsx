interface LoadingScreenProps {
  label: string;
  error?: string;
}

export default function LoadingScreen({ label, error }: LoadingScreenProps) {
  return (
    <div
      className="flex min-h-full flex-col items-center justify-center px-8 py-12 text-center"
      role={error ? "alert" : "status"}
      aria-live={error ? "assertive" : "polite"}
    >
      <div className={`screen-loader-mark mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${error ? "bg-[#fef2f2] text-[#dc2626]" : "bg-[#eef4ff] text-[#1a56db]"}`}>
        {error ? (
          <img
            src="/cara_x.svg"
            alt=""
            aria-hidden="true"
            className="screen-loader-error-icon h-9 w-8 object-contain"
          />
        ) : (
          <svg width="25" height="25" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M4 16.5 9 11l3.5 3.5L20 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M15 7h5v5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      {!error && (
        <div className="mb-2 h-1 w-20 overflow-hidden rounded-full bg-[#e2e6ed]">
          <div className="screen-loader-progress h-full rounded-full bg-[#1a56db]" />
        </div>
      )}
      <p className="text-[13px] font-medium text-[#6b7280]">{label}</p>
      {error && <p className="mt-1 max-w-sm text-[12px] text-[#9ca3af]">{error}</p>}
    </div>
  );
}
