const serviceStatus = {
  updated: "Expected until 14:00",

  overall: "major",

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
    },

    {
      id: "tpe",
      label: "Disruption possible",
      status: "minor",
      icon: "bi-exclamation-triangle-fill",
      title: "TPE (Redcar Central ↔ Manchester) via York and Leeds",
      short: "TPE towards Manchester: Disruption possible — check before travelling",
      impact: "Services may be subject to delays or alterations.",
      advice: "Check before travelling.",
      issue: "Longer-distance services can be more variable."
    },

    {
      id: "ecml",
      label: "Major disruption",
      status: "major",
      icon: "bi-exclamation-octagon-fill",
      title: "East Coast Main Line: Doncaster ↔ Newark Northgate",
      short: "ECML: Major disruption between Doncaster and Newark Northgate — check before travelling",
      issue: "Emergency services are dealing with an incident between Doncaster and Newark Northgate. All lines are currently closed.",
      impact: "Trains running through this section may be cancelled, delayed by up to 30 minutes or revised. This may affect journeys to and from London, York, Darlington, Teesside and the wider North East.",
      advice: "Passengers should check before travelling using National Rail Enquiries or their train operator. Allow extra time and consider alternative routes where available."
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
