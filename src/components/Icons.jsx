function Icon({ children, ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="var(--icon-size)"
      height="var(--icon-size)"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function UsersIcon() {
  return (
    <Icon>
      <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="10" cy="7" r="4" />
      <path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </Icon>
  );
}

export function ClipboardCheckIcon() {
  return (
    <Icon>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4.5h6a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1ZM8.5 13l2.2 2.2 4.8-5" />
    </Icon>
  );
}

export function FolderCheckIcon() {
  return (
    <Icon>
      <path d="M3 6a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v2H3Z" />
      <path d="M3 10h18l-2 9H5l-2-9Z" />
      <path d="m9 14 2 2 4-4" />
    </Icon>
  );
}

export function LightbulbIcon() {
  return (
    <Icon>
      <path d="M9 18h6m-5 3h4m-2-20a7 7 0 0 0-4 12.75c.6.4 1 1 1 1.75h6c0-.75.4-1.35 1-1.75A7 7 0 0 0 12 1Z" />
    </Icon>
  );
}

export function ArrowDownIcon() {
  return (
    <Icon>
      <path d="M12 4v16m-7-7 7 7 7-7" />
    </Icon>
  );
}

export function UserIcon() {
  return (
    <Icon>
      <circle cx="12" cy="8" r="4" />
      <path d="M5 21a7 7 0 0 1 14 0" />
    </Icon>
  );
}

export function CompassIcon() {
  return (
    <Icon>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2.3 4.7-4.7 2.3 2.3-4.7 4.7-2.3Z" />
    </Icon>
  );
}

export function LayersIcon() {
  return (
    <Icon>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 12 9 5 9-5M3 16l9 5 9-5" />
    </Icon>
  );
}

export function SlidersIcon() {
  return (
    <Icon>
      <path d="M4 7h9m4 0h3M4 17h3m4 0h9" />
      <circle cx="15" cy="7" r="2" />
      <circle cx="9" cy="17" r="2" />
    </Icon>
  );
}

export function ShieldCheckIcon() {
  return (
    <Icon>
      <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
      <path d="m9 12 2 2 4-4" />
    </Icon>
  );
}

export function PaperclipIcon() {
  return (
    <Icon>
      <path d="m21.4 11.1-8.5 8.5a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5" />
    </Icon>
  );
}

export function ArrowUpRightIcon() {
  return (
    <Icon>
      <path d="M7 17 17 7M7 7h10v10" />
    </Icon>
  );
}

export function HeartPulseIcon() {
  return (
    <Icon>
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
      <path d="M3 12h4l2-3 3 6 2-3h7" />
    </Icon>
  );
}

export function BellIcon() {
  return (
    <Icon>
      <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
    </Icon>
  );
}
