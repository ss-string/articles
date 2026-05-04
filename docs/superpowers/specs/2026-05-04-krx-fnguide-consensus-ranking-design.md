# KRX FnGuide Consensus Ranking Design

## Goal

Build a Supabase-backed page that ranks stocks by the gap between current price and consensus fair price. The primary scan path is from the largest gap to the smallest gap. Each stock appears as a compact row, and selecting a row expands an inline detail panel with price comparison and consensus price trend.

## Data Source

The page reads from the `krx_fnguide_consensus` table through Supabase.

Supabase credentials are provided by GitHub variables and exposed to Vite as:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

The frontend will create a Supabase client with these variables. The publishable key is acceptable for browser use as long as table access is controlled by Supabase policies.

The implementation should normalize the table rows into this logical shape:

- stock name
- stock code, if available
- current price
- fair price or target consensus price
- consensus price from 1 month ago
- consensus price from 3 months ago
- consensus price from 6 months ago

Fields not present in the table must not be invented. In particular, daily price movement such as `전일 +1.2%`, market filters, manual sort controls, and refresh controls are out of scope for this page.

## Ranking And Calculations

Rows are sorted descending by fair-price gap percentage:

```text
gapPercent = ((fairPrice - currentPrice) / currentPrice) * 100
```

The row also shows the absolute gap:

```text
gapAmount = fairPrice - currentPrice
```

Consensus change is shown as `지난 1개월 대비 컨센서스 증가`:

```text
oneMonthConsensusChangePercent =
  ((fairPrice - consensusPrice1MonthAgo) / consensusPrice1MonthAgo) * 100
```

The expanded panel can additionally show 3-month and 6-month changes using the same formula against the 3-month and 6-month consensus prices.

Rows with missing current price, fair price, or invalid denominator values should be excluded from the ranking list. Missing 1/3/6-month consensus checkpoints should render as unavailable in the expanded panel rather than producing misleading zeros.

## Layout

The first screen contains:

- Dark header with the page title `컨센서스 괴리율 랭킹`
- Compact summary cards for maximum gap, average gap, 1-month upward consensus count, and displayed stock count
- A ranking table ordered by gap percentage

The table columns are:

- stock name and optional code
- current price
- fair price with absolute gap amount
- gap percentage
- `지난 1개월 대비 컨센서스 증가`
- expand control

The page does not include the removed control row: market, sort, consensus-period selector, or refresh button.

## Expanded Row

Selecting a row opens an inline detail panel under that row. Multiple rows may remain open if the native `details` pattern is used, but the implementation can choose single-open behavior if it improves usability.

The expanded panel has two main sections:

- Price comparison: current price, fair price, visual gap bar, and absolute price gap
- Consensus price trend: a line chart with checkpoints for 6 months ago, 3 months ago, 1 month ago, and current consensus

Each line-chart checkpoint must show the corresponding consensus price. The chart also includes a compact checkpoint strip below the graph with:

- period label
- consensus price
- change percentage to the current fair price

The row-level consensus badge uses the 1-month change because it is the primary comparison requested for the ranking view.

## Visual Direction

Use a restrained financial dashboard style:

- Light workspace background
- Dark header band
- White table and detail panels
- Red/orange accent for positive price gap
- Blue line for consensus price trend
- Green badge for positive 1-month consensus increase
- Card and panel radius no larger than 8px

The design should be dense enough for repeated scanning while keeping expanded details readable.

## Responsive Behavior

Desktop keeps the full table structure. Mobile hides the table header and turns each row into a two-column summary block with the consensus badge and expand control still visible. Expanded detail sections stack vertically on narrow screens.

Text must not overlap or rely on viewport-scaled font sizes. Long stock names should wrap within their cell.

## Loading, Empty, And Error States

The page should render:

- loading state while querying Supabase
- empty state when no valid ranking rows are available
- error state when environment variables are missing or the Supabase query fails

The error state should be visible and concise, without exposing secrets.

## Testing

Focused test coverage should verify:

- Supabase row normalization and gap calculations
- ranking order from highest gap to lowest gap
- rows with invalid price denominators are excluded
- main table renders stock name, current price, fair price, gap percentage, and 1-month consensus change
- expanding a row reveals the line chart checkpoint prices for 1/3/6-month consensus data
- loading, empty, and error states render

## Acceptance Criteria

- The page reads `krx_fnguide_consensus` through Supabase using Vite environment variables.
- Stocks are sorted by current-price-to-fair-price gap from largest to smallest.
- The row surface shows stock name, current price, fair price, gap percentage, and 1-month consensus increase.
- Selecting a row expands inline details.
- Expanded details show price comparison and a line chart with checkpoint prices.
- UI does not show data that is not available from the table.
- Tests and production build pass.
