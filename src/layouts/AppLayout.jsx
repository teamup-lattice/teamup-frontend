import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import Logo from "../components/Logo";
import { getMyProfile } from "../services/dashboardService";
import { getUnreadCount } from "../services/notificationsService";
import styles from "./AppLayout.module.css";

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
  { label: "Notifications", to: "/notifications" },
  { label: "Profile", to: "/profile" },
];

const MOBILE_QUERY = "(max-width: 599px)";

function AppLayout() {
  const { pathname } = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    () => !window.matchMedia(MOBILE_QUERY).matches,
  );

  useEffect(() => {
    let isCurrent = true;
    const loadUser = () => {
      getMyProfile()
        .then((data) => {
          if (isCurrent && data?.user) {
            setCurrentUser({
              name: data.user.name ?? "",
              avatarUrl: data.user.avatarUrl ?? "",
            });
          }
        })
        .catch((error) => {
          console.error("Failed to load user profile in sidebar:", error);
        });
    };

    loadUser();
    window.addEventListener("profile:changed", loadUser);

    return () => {
      isCurrent = false;
      window.removeEventListener("profile:changed", loadUser);
    };
  }, []);

  useEffect(() => {
    let isCurrent = true;
    const loadUnreadCount = () => {
      getUnreadCount()
        .then((count) => {
          if (isCurrent) setUnreadCount(count);
        })
        .catch((error) => {
          console.error("Failed to load unread notification count:", error);
        });
    };

    loadUnreadCount();
    window.addEventListener("notifications:changed", loadUnreadCount);

    return () => {
      isCurrent = false;
      window.removeEventListener("notifications:changed", loadUnreadCount);
    };
  }, [pathname]);

  const handleSidebarLinkClick = () => {
    if (window.matchMedia(MOBILE_QUERY).matches) {
      setIsSidebarOpen(false);
    }
  };

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY);
    const sync = (event) => setIsSidebarOpen(!event.matches);
    mql.addEventListener("change", sync);
    return () => mql.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape" && window.matchMedia(MOBILE_QUERY).matches) {
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
          <span className={styles.notificationWrapper}>
            <NavLink
              to="/notifications"
              className={styles.notificationButton}
              aria-label={`Notifications, ${unreadCount} unread`}
            >
              <BellIcon />
            </NavLink>
            {unreadCount > 0 && (
              <span className={styles.notificationCount} aria-hidden="true">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </span>
          <NavLink
            to="/settings"
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
          inert={!isSidebarOpen}
          className={`${styles.nav} ${isSidebarOpen ? styles.navOpen : styles.navClosed}`}
        >
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `${styles.link} ${
                  isActive ||
                  (item.to === "/projects" &&
                    (pathname.startsWith("/role-requests/") ||
                      pathname.startsWith("/invitations/")))
                    ? styles.active
                    : ""
                }`
              }
              onClick={handleSidebarLinkClick}
            >
              {item.label}
            </NavLink>
          ))}
          <div className={styles.navFooter}>
            <p className={styles.tagline}>Make something together.</p>
            {currentUser && (
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `${styles.userChip} ${isActive ? styles.userChipActive : ""}`
                }
                onClick={handleSidebarLinkClick}
                aria-label={`Profile: ${currentUser.name || "User"}`}
              >
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt=""
                    className={styles.userAvatarImg}
                  />
                ) : (
                  <span className={styles.userAvatarFallback} aria-hidden="true">
                    {(currentUser.name || "U").charAt(0).toUpperCase()}
                  </span>
                )}
                <span className={styles.userName}>
                  {currentUser.name || "Profile"}
                </span>
              </NavLink>
            )}
          </div>
        </nav>

        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
