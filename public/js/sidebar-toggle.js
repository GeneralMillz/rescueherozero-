/**
 * PrepperZero Sidebar Toggle
 * Mobile-first, Pi Zero optimized
 */
document.addEventListener('DOMContentLoaded', () => {
  const sidebar  = document.querySelector('.pz-sidebar');
  const toggle   = document.querySelector('.pz-sidebar-toggle, .sidebar-toggle');
  const main     = document.querySelector('.pz-main');
  const backdrop = document.getElementById('pz-backdrop');

  if (!toggle || !sidebar) return;

  const isMobile = () => window.innerWidth <= 768;

  const openSidebar = () => {
    sidebar.classList.add('open');
    if (backdrop) backdrop.classList.add('visible');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = isMobile() ? 'hidden' : '';
  };

  const closeSidebar = () => {
    sidebar.classList.remove('open');
    if (backdrop) backdrop.classList.remove('visible');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  const toggleSidebar = (e) => {
    e.stopPropagation();
    sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
  };

  // Toggle button
  toggle.addEventListener('click', toggleSidebar);

  // Close on nav item click (mobile only)
  sidebar.querySelectorAll('.pz-nav-item, .nav-link').forEach(item => {
    item.addEventListener('click', () => { if (isMobile()) closeSidebar(); });
  });

  // Close on backdrop tap
  if (backdrop) backdrop.addEventListener('click', closeSidebar);

  // Close on outside click
  if (main) {
    main.addEventListener('click', (e) => {
      if (isMobile() && sidebar.classList.contains('open') && !sidebar.contains(e.target)) {
        closeSidebar();
      }
    });
  }

  // Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSidebar();
  });

  // Close on resize to desktop
  window.addEventListener('resize', () => {
    if (!isMobile()) closeSidebar();
  }, { passive: true });

  toggle.setAttribute('aria-expanded', 'false');
});