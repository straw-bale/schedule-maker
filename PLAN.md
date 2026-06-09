# R3A Dynamic Project Schedule — HTML Mockup Plan

## Context
R3A Architecture needs a dynamic, browser-based project schedule tool to replace static InDesign/PowerPoint timelines. The existing standard is a landscape Gantt chart with phase bars, milestone circles, deliverable badges, and a legend footer. The goal is a single-file HTML mockup that matches R3A's visual standard and brand, is interactive (editable dates, draggable bars), and is simpler/more beautiful than MS Project.

---

## Output
One file: `f:\R3A Solutions\Studio OS\experiments\Schedule Maker\index.html`

No build step, no dependencies beyond Google Fonts (Barlow + Barlow Condensed).

---

## Brand Tokens (from brand.html)
```css
--r3a-black:  #282829
--r3a-blue:   #20ABE2
--r3a-mag:    #D83968
--r3a-lime:   #00914D
--r3a-berry:  #6D245D
--off-white:  #F4F4F4
--light-gray: #E6E6E6
```
Fonts: `Barlow Condensed` (headers, labels, badges) + `Barlow` (body). Loaded from Google Fonts.

---

## Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│ HEADER: PROJECT TIMELINE title + project meta (top-right)   │
├──────────────┬──────────────────────────────────────────────┤
│ Task panel   │  Year / Month header row                     │
│ (fixed 240px)│  ─────────────────────────────────────────── │
│              │  Alternating column bands (month columns)    │
│  Task names  │  Today line (vertical)                       │
│  (editable)  │  Gantt bars (positioned absolutely)          │
│              │  Milestone circles                           │
├──────────────┴──────────────────────────────────────────────┤
│ LEGEND FOOTER: 5 columns (Deliverables / Milestones /       │
│ Estimates / City Approvals / Meetings & Notes)              │
└─────────────────────────────────────────────────────────────┘
```

---

## Task & Bar Types

| Type | Color | Visual |
|---|---|---|
| `submission` | `#7A9040` (olive green) | Solid bar, scaled by phase (50%=lighter, 95%=mid, 100%=dark) |
| `review` | `#90D5F1` (blue 50% tint) | Solid bar, optionally dashed border = "Hold" |
| `documents` | `#282829` (R3A Black) | Solid bar |
| `construction` | `#3B8FA0` (teal) | Solid bar with arrow tip at end (SVG) |
| `milestone` | transparent | Circle marker only (open = simple, filled = numbered deliverable) |

Deliverable badges: orange filled circles with white number (`#D4804A`).
Milestone badges: colored filled circles with phase % (`#20ABE2` for submissions, `#00914D` for estimates).

---

## Data Model (JS object, editable in-page)

```js
const state = {
  project: { date, number, client, projectName },
  viewStart: Date,   // left edge of the Gantt
  viewEnd: Date,     // right edge of the Gantt
  tasks: [
    {
      id, name,
      type: 'submission' | 'review' | 'documents' | 'construction' | 'milestone',
      start: Date, end: Date,   // null for milestone
      date: Date,               // milestone only
      color: hex,               // optional override
      hold: bool,               // dashed border overlay
      isEstimate: bool,         // arrow tip
      deliverableRef: number,   // links to deliverables legend
      milestoneRef: string,     // '50' | '95' | '100'
      label: string,            // text inside bar (e.g. "Hold", "Scheduling")
    }
  ],
  legend: {
    deliverables: [{ num, text, date }],
    milestones:   [{ code, text }],
    estimates:    [{ code, text }],
    approvals:    [{ text }],
    notes:        [{ text }],
  }
}
```

---

## Gantt Rendering

- Container is `position: relative`, width = total months × column width (default 80px/month).
- Each task row has a fixed height (36px) with 4px gap.
- Bar `left` and `width` are computed as `(start - viewStart) / totalDays * 100%`.
- Today line: `position: absolute`, `left` computed from today's date.
- Month column bands: alternating `#F4F4F4` / `#EAEAEA` rendered as a CSS `repeating-linear-gradient` or absolutely-positioned divs behind bars.
- Milestone circles: `position: absolute`, centered on the date column.
- Arrow tip (construction): inline SVG clipped to right end of bar.

---

## Interactivity

### Editable project header
Click any header field (title, project number, client, date) → `contenteditable` activates.

### Editable task names
Click task name in left panel → `contenteditable`.

### Drag bars to reschedule
`mousedown` on bar → `mousemove` shifts `start`/`end` by Δpx converted to Δdays → `mouseup` commits. Dates snap to nearest day. Cursor changes to `grab`.

### Drag bar edges to resize duration
Resize handles (4px) on left/right edges of bar → `mousedown` extends/contracts just that edge.

### Click bar → date editor popup
Small floating panel shows `start` + `end` date inputs; update on change.

### Add task button
"+ Add Task" row at bottom of task list → inserts new row with default 2-week duration starting from project midpoint.

### Delete task
Hover row → shows × button on far right.

### Hold toggle
Right-click bar → context menu with "Mark as Hold" → adds dashed border overlay.

### Legend items
Click any legend item to highlight the corresponding bar on the chart.

---

## Sample Data (pre-loaded)
Matches the NLRB example from the standard:
- Project: Sample Project
- Date range: Aug 2022 – Nov 2023
- 12 tasks mirroring the image (Kick-Off through Project Occupancy)
- 4 deliverables, 4 milestones, 2 estimates, 1 approval

---

## Visual Details to Match the Standard

- Header: "PROJECT TIMELINE" in Barlow Condensed 800, ~28px uppercase + subtitle in Condensed 500
- Right-aligned project meta block in Barlow Condensed 400, ~11px
- "R3A" wordmark bottom-right corner in Barlow Condensed 800, ~24px
- Column header label "Milestones, Tasks & Deliverables" in Barlow Condensed 600, 10px uppercase
- Year labels (2022, 2023) bold, month labels regular, both in Barlow Condensed
- Legend footer: dark-background label chips (e.g. "DELIVERABLES" on `#282829` bg), then list items below
- Horizontal row dividers: 1px `#E6E6E6`
- Vertical month dividers: 1px dashed `#CACACA`

---

## AI Chat Sidebar (Placeholder — not wired up)

A collapsed/expandable panel on the right side of the screen. Visually present and styled but non-functional in the mockup.

**UI:**
- Toggle button fixed to bottom-right: "Ask AI" with a sparkle icon, R3A Blue background
- Slide-in panel (320px wide, full height) with:
  - Header: "Schedule Assistant" (Barlow Condensed 700)
  - Sub-label: "Powered by Claude" in small italic gray text
  - Chat history area (empty / one placeholder bubble: *"Try: 'Add a 2-week review in April' or 'Push the 95% submission back by 3 weeks.'"*)
  - Text input at bottom with a send button
  - Input placeholder: "Describe a schedule change…"
- Panel slides in over the Gantt (doesn't reflow layout)
- Clicking send shows a static "Coming soon" response bubble — no API call

**Future integration note (comment in JS):**
```js
// TODO: wire to Anthropic Messages API (claude-sonnet-4-6 or later)
// POST https://api.anthropic.com/v1/messages
// System prompt will include current state JSON; response will return state patch
```

---

## Verification
1. Open `index.html` directly in a browser (no server needed).
2. Confirm all 12 sample tasks render with correct colors and positions.
3. Drag a bar — confirm dates update and bar moves smoothly.
4. Click a task name — confirm it becomes editable.
5. Click project header fields — confirm they're editable.
6. Check that the today line is visible and correctly positioned.
7. Check legend footer renders all 5 columns with correct badge styles.
8. Resize the browser window — confirm the task panel stays fixed and the Gantt scrolls horizontally.
