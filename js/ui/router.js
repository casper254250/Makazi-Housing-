(function (root) {
  'use strict';

  var Makazi = root.Makazi;
  var layout = Makazi.ui.layout;
  var currentRoute = 'dashboard';

  function getRoutes() {
    var v = Makazi.ui.views;
    return {
      dashboard: v.dashboardView,
      properties: v.propertiesView,
      units: v.unitsView,
      tenants: v.tenantsView,
      leases: v.leasesView,
      rent: v.rentView,
      water: v.waterView,
      maintenance: v.maintenanceView,
      reports: v.reportsView,
      data: v.dataLimitsView
    };
  }

  function parseHash() {
    var raw = (window.location.hash || '').replace(/^#\/?/, '').trim();
    var routes = getRoutes();
    return Object.prototype.hasOwnProperty.call(routes, raw) ? raw : 'dashboard';
  }

  function renderCurrent() {
    var routes = getRoutes();
    currentRoute = parseHash();
    layout.setActiveNav(currentRoute);

    var container = layout.getContentContainer();
    var view = routes[currentRoute] || routes.dashboard;
    if (view && typeof view.render === 'function') {
      view.render({
        route: currentRoute,
        container: container,
        setHeader: layout.setHeader
      });
    }
  }

  function navigate(routeId) {
    var target = '#' + routeId;
    if (window.location.hash === target) {
      renderCurrent();
    } else {
      window.location.hash = target;
    }
  }

  function start() {
    window.addEventListener('hashchange', renderCurrent);
    renderCurrent();
  }

  Makazi.ui.router = {
    start: start,
    navigate: navigate,
    renderCurrent: renderCurrent,
    getCurrentRoute: function () { return currentRoute; }
  };
})(window);
