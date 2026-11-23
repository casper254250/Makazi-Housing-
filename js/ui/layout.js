(function (root) {
  'use strict';

  var Makazi = root.Makazi;
  var esc = Makazi.core.escape;

  var NAV_ITEMS = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'properties', label: 'Properties' },
    { id: 'units', label: 'Units' },
    { id: 'tenants', label: 'Tenants' },
    { id: 'leases', label: 'Leases' },
    { id: 'rent', label: 'Rent Records' },
    { id: 'water', label: 'Water & Meters' },
    { id: 'maintenance', label: 'Maintenance' },
    { id: 'reports', label: 'Reports' },
    { id: 'data', label: 'Data & Limitations' }
  ];

  var refs = {
    titleEl: null,
    subtitleEl: null,
    actionsEl: null,
    contentEl: null,
    navEl: null,
    menuBtn: null
  };

  function mount(rootEl) {
    var navLinksHtml = NAV_ITEMS.map(function (item) {
      return (
        '<a href="#' + esc.attr(item.id) + '" class="nav-link" data-route="' + esc.attr(item.id) + '">' +
          esc.html(item.label) +
        '</a>'
      );
    }).join('');

    rootEl.innerHTML =
      '<a href="#main-content" class="skip-link">Skip to content</a>' +
      '<div class="app-shell">' +
        '<aside class="app-sidebar" aria-label="Primary navigation">' +
          '<div class="sidebar-header">' +
            '<a href="#dashboard" class="brand-mark" aria-label="Makazi home">' +
              '<span class="brand-logo" aria-hidden="true">M</span>' +
              '<span>Makazi</span>' +
            '</a>' +
            '<button type="button" class="mobile-menu-btn" id="mobile-menu-toggle" aria-expanded="false" aria-controls="sidebar-nav">Menu</button>' +
          '</div>' +
          '<nav id="sidebar-nav" class="sidebar-nav">' +
            navLinksHtml +
          '</nav>' +
          '<div class="sidebar-footer">' +
            'Murang\'a Town · Kihara<br>All names and figures are sample data.' +
          '</div>' +
        '</aside>' +
        '<main class="app-main" id="main-content" tabindex="-1">' +
          '<header class="page-header">' +
            '<div class="page-header-inner">' +
              '<div class="page-title-group">' +
                '<h1 id="page-title">Dashboard</h1>' +
                '<p id="page-subtitle" class="page-subtitle"></p>' +
              '</div>' +
              '<div id="page-actions" class="page-actions"></div>' +
            '</div>' +
          '</header>' +
          '<div id="page-content" class="page-content"></div>' +
        '</main>' +
      '</div>';

    refs.titleEl = document.getElementById('page-title');
    refs.subtitleEl = document.getElementById('page-subtitle');
    refs.actionsEl = document.getElementById('page-actions');
    refs.contentEl = document.getElementById('page-content');
    refs.navEl = document.getElementById('sidebar-nav');
    refs.menuBtn = document.getElementById('mobile-menu-toggle');

    refs.menuBtn.addEventListener('click', function () {
      var open = refs.navEl.classList.toggle('is-open');
      refs.menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    return refs;
  }

  function setHeader(options) {
    var opts = options || {};
    if (refs.titleEl) refs.titleEl.textContent = opts.title || '';
    if (refs.subtitleEl) refs.subtitleEl.textContent = opts.subtitle || '';
    if (refs.actionsEl) refs.actionsEl.innerHTML = opts.actionsHtml || '';
  }

  function setActiveNav(routeId) {
    if (!refs.navEl) return;
    var links = refs.navEl.querySelectorAll('[data-route]');
    for (var i = 0; i < links.length; i++) {
      var isCurrent = links[i].getAttribute('data-route') === routeId;
      links[i].classList.toggle('is-active', isCurrent);
      if (isCurrent) {
        links[i].setAttribute('aria-current', 'page');
      } else {
        links[i].removeAttribute('aria-current');
      }
    }
    if (refs.navEl.classList.contains('is-open')) {
      refs.navEl.classList.remove('is-open');
      if (refs.menuBtn) refs.menuBtn.setAttribute('aria-expanded', 'false');
    }
  }

  function getContentContainer() {
    return refs.contentEl;
  }

  Makazi.ui.layout = {
    mount: mount,
    setHeader: setHeader,
    setActiveNav: setActiveNav,
    getContentContainer: getContentContainer
  };
})(window);
