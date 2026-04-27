const serviceStatus = {
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
      impact: "Services operating normally across all stations.",
      advice: "No action required.",
      issue: "No reported issues."
    },
    {
      id: "tpe",
      label: "Check before travel",
      status: "minor",
      icon: "bi-exclamation-triangle-fill",
      title: "Northern TPE (Redcar Central ↔ Manchester) (via York and Leeds)",
      short: "TPE towards Manchester: Check before travel",
      impact: "Services may be subject to delays or alterations.",
      advice: "Check before travelling.",
      issue: "Longer-distance services can be more variable."
    }
    engineeringWorks: [
  {
    date: "11 May 2026",
    route: "Saltburn ↔ Darlington",
    title: "Engineering work affecting local services",
    impact: "Replacement buses may operate between Middlesbrough and Saltburn.",
    advice: "Allow extra time and check before travelling."
  },
  {
    date: "18 May 2026",
    route: "Redcar ↔ Manchester",
    title: "Infrastructure upgrades on TransPennine route",
    impact: "Some services may be diverted or start/terminate early.",
    advice: "Check operator updates before travelling."
  }
]
  ]
};
