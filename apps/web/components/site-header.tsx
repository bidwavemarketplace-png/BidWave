const links = [
  { href: "/", label: "Overview" },
  { href: "/shows", label: "Shows" },
  { href: "/orders", label: "Orders" },
  { href: "/spec", label: "Spec" },
  { href: "/seller/apply", label: "Seller apply" },
  { href: "/seller/dashboard", label: "Dashboard" },
  { href: "/shows/new", label: "Create show" }
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <a className="brand" href="/">
        BidWave
      </a>

      <nav className="nav">
        {links.map((link) => (
          <a key={link.href} className="nav-link" href={link.href}>
            {link.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
