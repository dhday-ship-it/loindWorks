const ICONS = {
  chart: (
    <>
      <path d="M4 19V10" />
      <path d="M10 19V5" />
      <path d="M16 19V13" />
      <path d="M4 19h16" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3 2.5-5 6-5s6 2 6 5" />
      <path d="M16 4.5c1.7.3 3 1.8 3 3.5s-1.3 3.2-3 3.5" />
      <path d="M21 20c0-2.5-1.7-4.4-4-4.9" />
    </>
  ),
  building: (
    <>
      <rect x="4" y="3" width="11" height="18" rx="1" />
      <path d="M9 21v-3" />
      <path d="M7.5 7h2M7.5 10.5h2M7.5 14h2" />
      <path d="M15 9h5v12h-5" />
      <path d="M17.5 12.5v.01M17.5 16v.01" />
    </>
  ),
  folder: (
    <path d="M3.5 6.5a1 1 0 0 1 1-1H9l1.6 2H19a1 1 0 0 1 1 1V18a1 1 0 0 1-1 1H4.5a1 1 0 0 1-1-1V6.5Z" />
  ),
  receipt: (
    <>
      <path d="M6 3h12v18l-2.5-1.6L13 21l-1.5-1.6L10 21l-1.5-1.6L6 21V3Z" />
      <path d="M8.5 8h7M8.5 11.5h7M8.5 15h4" />
    </>
  ),
  wallet: (
    <>
      <path d="M3.5 7.5a2 2 0 0 1 2-2h11a1 1 0 0 1 1 1V9" />
      <rect x="3.5" y="7.5" width="17" height="12.5" rx="2" />
      <path d="M15.5 13.2a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6Z" />
    </>
  ),
  landmark: (
    <>
      <path d="M4 10.5 12 5l8 5.5" />
      <path d="M5 10.5V19M9.3 10.5V19M14.7 10.5V19M19 10.5V19" />
      <path d="M3.5 19h17" />
      <path d="M3.5 21.5h17" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 9.5h17" />
      <path d="M8 3v4M16 3v4" />
      <path d="M7.5 13h2M11 13h2M14.5 13h2M7.5 16.5h2M11 16.5h2" />
    </>
  ),
  chevronLeft: <path d="M14.5 5 8 12l6.5 7" />,
  chevronRight: <path d="M9.5 5 16 12l-6.5 7" />,
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  );
}
