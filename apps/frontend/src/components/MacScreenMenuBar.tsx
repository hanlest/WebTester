export function MacScreenMenuBar() {
  return (
    <header className="mac-screen-menu-bar" role="presentation">
      <span className="mac-menu-apple" aria-hidden="true" />
      <nav className="mac-menu-items" aria-label="Menú del sistema">
        <span>File</span>
        <span>Edit</span>
        <span>View</span>
        <span>Special</span>
      </nav>
    </header>
  );
}
