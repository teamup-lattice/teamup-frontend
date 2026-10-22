import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import Logo from "../components/Logo";
import styles from "./AppLayout.module.css";

const navItems = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Discover Projects", to: "/discover" },
  { label: "Find Collaborators", to: "/collaborators" },
  { label: "My Projects", to: "/projects" },
  { label: "Profile", to: "/profile" },
];

function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <NavLink to="/dashboard" className={styles.logo}>
          <Logo />
        </NavLink>
        <button
          type="button"
          className={styles.menuButton}
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="app-nav"
        >
          {menuOpen ? "Close" : "Menu"}
        </button>
      </header>

      <div className={styles.body}>
        <nav
          id="app-nav"
          aria-label="Main"
          className={`${styles.nav} ${menuOpen ? styles.navOpen : ""}`}
        >
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `${styles.link} ${isActive ? styles.active : ""}`
              }
              onClick={() => setMenuOpen(false)}
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
