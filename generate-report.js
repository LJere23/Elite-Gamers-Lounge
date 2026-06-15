const fs = require("fs");
const {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
} = require("docx");

// -----------------------------
// DATA
// -----------------------------

const setupCosts = [
  ["3x Console setups", "$2100–$4500"],
  ["Racing simulator rig", "$1500–$2000"],
  ["Chess boards", "$20–$40"],
  ["Dartboards", "$60–$120"],
  ["Pool/snooker table", "$300–$500"],
  ["Drinks fridge", "$300"],
  ["Furniture", "$300–$600"],
  ["Generator", "$332"],
  ["Router + ISP setup", "$150–$350"],
  ["Initial snack stock", "$200–$400"],
  ["Branding + signage", "$200–$500"],
  ["Contingency", "$546–$964"],
];

const fixedCosts = [
  ["Full-time staff", "$175"],
  ["Part-time staff", "$80"],
  ["Rent", "$250"],
  ["Internet", "$80"],
  ["Generator fuel", "$40"],
  ["Electricity", "$60"],
  ["Maintenance", "$50"],
  ["Miscellaneous", "$40"],
];

const scenarios = [
  ["Conservative", "$2065", "$1290"],
  ["Moderate", "$4404", "$3629"],
  ["Target", "$7445", "$6670"],
];

// -----------------------------
// HELPERS
// -----------------------------

function heading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({
    text,
    heading: level,
    spacing: { after: 200 },
  });
}

function text(text) {
  return new Paragraph({
    children: [new TextRun(text)],
    spacing: { after: 120 },
  });
}

function makeTable(rows) {
  return new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    rows: rows.map(
      (r) =>
        new TableRow({
          children: r.map(
            (c) =>
              new TableCell({
                children: [new Paragraph(String(c))],
              })
          ),
        })
    ),
  });
}

// -----------------------------
// DOCUMENT
// -----------------------------

const doc = new Document({
  sections: [
    {
      children: [

        heading("Gaming Lounge Financial Feasibility Report"),

        text(
          "This report evaluates the startup costs, operating costs, revenue potential, break-even point, and 12-month profitability projections for a hybrid gaming lounge business."
        ),

        heading("1. Executive Summary"),

        text(
          "The business model combines console gaming, racing simulators, Wi-Fi access, social games, memberships, snacks, and tournaments into a diversified entertainment venue."
        ),

        text(
          "Projected break-even is approximately 13 customers per day with monthly fixed costs estimated at $775."
        ),

        heading("2. Startup Costs"),

        makeTable([
          ["Item", "Estimated Cost"],
          ...setupCosts,
          ["TOTAL", "$6008–$10606"],
        ]),

        heading("3. Monthly Fixed Costs"),

        makeTable([
          ["Expense", "Monthly Cost"],
          ...fixedCosts,
          ["TOTAL FIXED COSTS", "$775"],
        ]),

        heading("4. Membership Analysis"),

        text(
          "The analysis identified the Pro and Champion memberships as significantly underpriced relative to their retail value."
        ),

        text(
          "Recommendation: Limit racing simulator access within memberships or increase membership pricing to protect profitability."
        ),

        heading("5. Revenue Scenarios"),

        makeTable([
          ["Scenario", "Monthly Revenue", "Estimated Profit"],
          ...scenarios,
        ]),

        heading("6. Break-Even Analysis"),

        text("Daily fixed cost burden: $29.81"),
        text("Average revenue per casual customer: $2.30"),
        text("Break-even customers/day: 13"),

        heading("7. Capital Requirements"),

        text("Estimated startup capital: $6008–$10606"),
        text("Recommended capital with 3-month runway: $8333–$12931"),

        heading("8. Strategic Observations"),

        text(
          "The racing simulator is the strongest premium attraction and should be positioned as a high-value experience rather than unlimited-access entertainment."
        ),

        text(
          "Snack sales, memberships, and tournaments materially improve profitability and reduce reliance on walk-in gaming traffic."
        ),

        heading("9. Conclusion"),

        text(
          "The financial model suggests that the gaming lounge is commercially viable with relatively low operating costs and strong scaling potential if memberships are structured carefully."
        ),
      ],
    },
  ],
});

// -----------------------------
// EXPORT
// -----------------------------

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync("Gaming_Lounge_Financial_Report.docx", buffer);
  console.log("Document created successfully.");
});