const serviceStatus = {
  updated: "25 Apr 2026, 23:30",

  overall: "minor",
// STATUS LEVELS:
// good   = normal service
// minor  = disruption possible
// major  = major disruption (red / critical)
  routes: [
    {
      id: "tvl",
      label: "Good service",
      status: "good",
      icon: "bi-check-circle-fill",
      title: "Northern Service N3 (Saltburn ↔ Darlington)",
      short: "Tees Valley Line: Good service",
      impact: "Services operating normally across all stations.",
      advice: "No action required.",
      issue: "No reported issues."
      // =============================================
// 🔴 EXAMPLE INCIDENT (UNCOMMENT WHEN NEEDED)
// =============================================

// {
//   id: "tpe",
//   label: "Major disruption",
//   status: "major",
//   icon: "bi-exclamation-octagon-fill",
//   title: "Northern TPE (Redcar Central ↔ Manchester) (via York and Leeds)",
//   short: "TPE towards Manchester: Major disruption — check before travelling",

//   issue: "Signalling failure between York and Northallerton",

//   impact: "Services are subject to significant delays and cancellations. Some services are starting and terminating early or not running.",

//   advice: "Passengers should check before travelling. Consider alternative routes where possible and allow extra time for your journey.",

//   incidentUrl: "incident-2026-05-02-york-darlington.html"
// },
    },
    {
      id: "tpe",
      label: "Disruption possible",
      status: "minor",
      icon: "bi-exclamation-triangle-fill",
      title: "Northern TPE (Redcar Central ↔ Manchester) (via York and Leeds)",
      short: "TPE towards Manchester: Disruption possible — check before travelling",
      impact: "Services may be subject to delays or alterations.",
      advice: "Check before travelling.",
      issue: "Longer-distance services can be more variable."
      // =============================================
// 🔴 EXAMPLE INCIDENT (UNCOMMENT WHEN NEEDED)
// =============================================

// {
//   id: "tpe",
//   label: "Major disruption",
//   status: "major",
//   icon: "bi-exclamation-octagon-fill",
//   title: "Northern TPE (Redcar Central ↔ Manchester) (via York and Leeds)",
//   short: "TPE towards Manchester: Major disruption — check before travelling",

//   issue: "Signalling failure between York and Northallerton",

//   impact: "Services are subject to significant delays and cancellations. Some services are starting and terminating early or not running.",

//   advice: "Passengers should check before travelling. Consider alternative routes where possible and allow extra time for your journey.",

//   incidentUrl: "incident-2026-05-02-york-darlington.html"
// },
    }
  ],

  engineeringWorks: [
    {
      startDate: "2026-05-02",
      endDate: "2026-05-04",
      date: "2–4 May 2026",
      route: "York ↔ Darlington / Redcar Central",
      title: "Rail replacement buses due to engineering improvement works",
      impact: "Buses will replace trains between York and Darlington/Redcar Central. TPE and LNER services to and from Newcastle will start and terminate at Northallerton. Northern will continue to operate train services between Darlington and Saltburn.",
      advice: "Customers for Thirsk and stations to Redcar Central should change at Northallerton for buses to Thirsk. Customers for other destinations should change at Darlington for buses to York. Check before travelling and allow extra time."
    },
    {
      startDate: "2026-05-23",
      endDate: "2026-05-25",
      date: "23–25 May 2026",
      route: "York ↔ Darlington / Redcar Central",
      title: "Rail replacement buses due to engineering improvement works",
      impact: "Buses will replace trains between York and Darlington/Redcar Central. TPE and LNER services to and from Newcastle will start and terminate at Northallerton. Northern will continue to operate train services between Darlington and Saltburn.",
      advice: "Customers for Thirsk and stations to Redcar Central should change at Northallerton for buses to Thirsk. Customers for other destinations should change at Darlington for buses to York. Check before travelling and allow extra time."
    }
  ]
};
