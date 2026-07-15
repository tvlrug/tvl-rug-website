window.serviceStatus = {
  updated: "25 Apr 2026, 23:30",

  overall: "minor",

  routes: [
    {
      id: "tvl",
      label: "Good service",
      status: "good",
      icon: "bi-check-circle-fill",
      title: "Northern Service N3 (Saltburn ↔ Darlington)",
      short: "Tees Valley Line: Good service",
      issue: "No reported issues.",
      impact: "Services are operating normally across all stations.",
      advice: "No action required."

      // Incident example:
      // incidentUrl: "incident-example.html"
    },

    {
      id: "tpe",
      label: "Disruption possible",
      status: "minor",
      icon: "bi-exclamation-triangle-fill",
      title: "TransPennine Express (Redcar Central ↔ Manchester via York and Leeds)",
      short: "TPE towards Manchester: Disruption possible — check before travelling",
      issue: "Longer-distance services can be more variable.",
      impact: "Services may be subject to delays or alterations.",
      advice: "Check before travelling."

      // Incident example:
      // incidentUrl: "incident-example.html"
    }
  ],

  engineeringWorks: [
    {
      startDate: "2026-05-02",
      endDate: "2026-05-04",
      date: "2–4 May 2026",
      route: "York ↔ Darlington / Redcar Central",
      title: "Rail replacement buses due to engineering improvement works",
      impact:
        "Buses will replace trains between York and Darlington or Redcar Central. TransPennine Express and LNER services to and from Newcastle will start and terminate at Northallerton. Northern will continue to operate trains between Darlington and Saltburn.",
      advice:
        "Check before travelling and allow extra time. Customers for Thirsk and stations towards Redcar Central should change at Northallerton where advised. Other passengers may need to change at Darlington for buses towards York."
    },

    {
      startDate: "2026-05-23",
      endDate: "2026-05-25",
      date: "23–25 May 2026",
      route: "York ↔ Darlington / Redcar Central",
      title: "Rail replacement buses due to engineering improvement works",
      impact:
        "Buses will replace trains between York and Darlington or Redcar Central. TransPennine Express and LNER services to and from Newcastle will start and terminate at Northallerton. Northern will continue to operate trains between Darlington and Saltburn.",
      advice:
        "Check before travelling and allow extra time. Customers for Thirsk and stations towards Redcar Central should change at Northallerton where advised. Other passengers may need to change at Darlington for buses towards York."
    }
  ]
};
