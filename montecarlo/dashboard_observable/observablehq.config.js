export default {
  title: "Monte Carlo Simulation Dashboard",  // Appears in browser title and header
  root: "src",  // Tells Observable where source files are located
  pages: [  // Navigation menu configuration
    {name: "Overview", path: "/index"},
    {name: "Cash Flow Risk", path: "/cashflow-risk"},
    {name: "Sensitivity Analysis", path: "/sensitivity"}
  ],
  footer: "Built with Observable Framework"  // Text displayed at bottom of pages
};
