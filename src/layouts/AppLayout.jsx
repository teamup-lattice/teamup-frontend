import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import Logo from "../components/Logo";
import styles from "./AppLayout.module.css";

function BellIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="var(--icon-size)"
      height="var(--icon-size)"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="var(--icon-size)"
      height="var(--icon-size)"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m19.4 15 .1.1a1.7 1.7 0 0 1-2.4 2.4l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a1.7 1.7 0 0 1-3.4 0v-.2a1.7 1.7 0 0 0-2.9-1.2l-.1.1a1.7 1.7 0 0 1-2.4-2.4l.1-.1a1.7 1.7 0 0 0-1.2-2.9H4a1.7 1.7 0 0 1 0-3.4h.2a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a1.7 1.7 0 0 1 2.4-2.4l.1.1a1.7 1.7 0 0 0 2.9-1.2V2a1.7 1.7 0 0 1 3.4 0v.2a1.7 1.7 0 0 0 2.9 1.2l.1-.1a1.7 1.7 0 0 1 2.4 2.4l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.2a1.7 1.7 0 0 1 0 3.4h-.2a1.7 1.7 0 0 0-1.2 2.9Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10.3" r="3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

const navItems = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Discover Projects", to: "/discover" },
  { label: "Find Collaborators", to: "/collaborators" },
  { label: "My Projects", to: "/projects" },
  { label: "Profile", to: "/profile" },
];

function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    () => !window.matchMedia("(max-width: 599px)").matches,
  );

  const handleSidebarLinkClick = () => {
    if (window.matchMedia("(max-width: 599px)").matches) {
      setIsSidebarOpen(false);
    }
  };

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (
        event.key === "Escape" &&
        window.matchMedia("(max-width: 599px)").matches
      ) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <NavLink to="/dashboard" className={styles.logo}>
          <Logo />
        </NavLink>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.notificationButton}
            aria-label="Notifications"
          >
            <BellIcon />
          </button>
          <span className={styles.notificationCount} aria-hidden="true">
            3
          </span>
          <NavLink
            to="/profile"
            className={styles.settingsLink}
            aria-label="Settings"
          >
            <GearIcon />
            <span className={styles.settingsText}>Settings</span>
          </NavLink>
          <button
            type="button"
            className={styles.menuButton}
            onClick={() => setIsSidebarOpen((open) => !open)}
            aria-expanded={isSidebarOpen}
            aria-controls="app-sidebar"
          >
            {isSidebarOpen ? "Close" : "Menu"}
          </button>
        </div>
      </header>

      <div className={styles.body}>
        {isSidebarOpen && (
          <button
            type="button"
            className={styles.overlay}
            aria-label="Close navigation menu"
            onClick={handleSidebarLinkClick}
          />
        )}
        <nav
          id="app-sidebar"
          aria-label="Main"
          aria-hidden={!isSidebarOpen}
          inert={!isSidebarOpen}
          className={`${styles.nav} ${isSidebarOpen ? styles.navOpen : styles.navClosed}`}
        >
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `${styles.link} ${isActive ? styles.active : ""}`
              }
              onClick={() => setIsSidebarOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
          <p className={styles.tagline}>Make something together.</p>
        </nav>

        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
