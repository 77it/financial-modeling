# Financial Modeling Project Assessment

## How to Use This Document

**Prompt to use in future conversations:**

```
Please assess and memorize the structure and architecture of this financial-modeling project.
Create or update the project assessment document in .claude/project-assessment.md with:
1. Project purpose and overview
2. Codebase structure and key directories
3. Core architectural patterns and design decisions
4. Technology stack and dependencies
5. Test coverage and maturity indicators
6. Known TODOs and incomplete features
7. Strengths and technical concerns
8. Summary assessment

IMPORTANT: Actually read and examine key source files to ensure accuracy. Do NOT rely solely on
automated exploration - verify directory structures and architectural claims by reading real code files.
```

**Note**: This document was initially based on automated exploration which contained inaccuracies
(like hallucinating subdirectories in `/lib` that don't exist). Always verify key architectural
claims by reading actual source files.

---

## Project Assessment Results

### 1. Project Purpose

**Financial Simulation Engine with Daily Modeling Framework**

A JavaScript-based financial simulation framework that orchestrates modular daily financial calculations:
- **Daily simulation loop**: Runs modules day-by-day from a start date to end date
- **Module-driven architecture**: Multiple modules execute custom financial logic each day
- **Double-entry bookkeeping**: Ledger-based transaction recording with BigInt precision
- **Scenario management**: Driver and Settings repositories for scenario-based modeling
- **Transaction-based**: SimObjects represent financial transactions with detailed metadata
- **Task-based execution**: TaskLocks control execution sequence and module initialization

**License**: Polyform Noncommercial 1.0.0 (commercial licenses available)

---

### 2. Codebase Structure

```
financial-modeling/
├── src/
│   ├── config/              Configuration and validation schemas
│   ├── engine/              Core simulation engine (39 files)
│   │   ├── context/         SimulationContext - central facade
│   │   ├── drivers/         Scenario-based input values
│   │   ├── settings/        Immutable/mutable configuration
│   │   ├── ledger/          Double-entry bookkeeping system
│   │   ├── simobject/       Financial simulation objects (BigInt-based)
│   │   ├── tasklocks/       Task execution sequencing
│   │   ├── modules/         Module loading and management
│   │   ├── fml/             Formula support
│   │   └── chartofaccounts/ Chart of accounts
│   ├── lib/                 Utility libraries (flat structure, 27+ files)
│   │   ├── Utility files:
│   │   │   ├── date_utils.js          Date/time utilities
│   │   │   ├── number_utils.js        Number conversion and utilities
│   │   │   ├── obj_utils.js           Object/array manipulation
│   │   │   ├── string_utils.js        String utilities
│   │   │   ├── boolean_utils.js       Boolean utilities
│   │   │   ├── schema.js              Schema definitions
│   │   │   ├── schema_validation_utils.js    Validation logic
│   │   │   ├── schema_sanitization_utils.js  Sanitization logic
│   │   │   ├── json.js                JSON parsing
│   │   │   ├── json_relaxed_utils.js  Relaxed JSON support
│   │   │   ├── result.js              Result/Error handling
│   │   │   ├── drivers_repo.js        Drivers repository
│   │   │   └── global_immutable_value.js  Immutable value utilities
│   │   ├── BigInt Decimal Scaled:
│   │   │   ├── bigint_decimal_scaled.arithmetic.js    Arithmetic operations
│   │   │   ├── bigint_decimal_scaled.finance.js       Finance operations
│   │   │   ├── bigint_decimal_scaled.fluent.js        Fluent API (DSBValue)
│   │   │   └── bigint_decimal_scaled.EXPERIMENTAL_finance.js
│   │   ├── experiments/     Experimental/WIP features
│   │   │   ├── json_relaxed__v1__FAILING_TESTS.js
│   │   │   ├── json_relaxed__v1b__experimental.js
│   │   │   ├── json_relaxed__v2.js
│   │   │   ├── json5_utils__PARSING__OLD.js
│   │   │   └── yaml2__SUPERSEDED.js
│   │   └── unused/          Deprecated/archived utilities
│   │       ├── json5.js
│   │       ├── yaml.js
│   │       └── json5_relaxed_utils.js
│   ├── modules/             Module implementations
│   ├── node/                Node.js specific utilities
│   ├── py/                  Python/Pyodide integration
│   └── bun/                 Bun runtime plugins
├── test/
│   ├── lib_test/            ~50 library tests
│   ├── engine_test/         ~30 engine tests
│   ├── modules_test/        Module tests
│   └── (21 benchmark files)
├── vendor/                  Third-party libraries
│   ├── decimaljs/           High-precision arithmetic
│   ├── formula/             Excel formula evaluation
│   └── Other math/finance utilities
└── .claude/                 Claude documentation (this file)
```

---

### 3. Core Architectural Patterns

**Central Hub Pattern: SimulationContext**
- Acts as facade coordinating all engine components
- Manages Drivers (scenario inputs), Settings (config), TaskLocks (sequencing), Ledger (transactions)
- Located in `src/engine/context/`

**Financial Precision: DSBValue Class**
- Custom BigInt-scaled decimal arithmetic (instead of floating-point)
- Prevents precision loss in financial calculations
- Core class: `DSBValue` with fluent API
- Related: Recent refactor moved from Decimal to DSB for improved handling

**Double-Entry Bookkeeping: Ledger System**
- `src/engine/ledger/` implements accounting ledger
- SimObjects represent ledger entries with BigInt values
- Incomplete: Query methods marked TODO (return by ID, name, unit)

**Scenario Modeling: Driver/Settings Dual Repository**
- **Drivers**: Input scenarios and what-if variables
- **Settings**: Configuration and parameters
- Allows complex scenario analysis

**Module System**
- Dynamic module loading in `src/engine/modules/`
- Partial implementation: Several modules marked TODO
- Examples: ismovements, genericmovements

---

### 4. Technology Stack

**Core:**
- ES Modules (modern JavaScript)
- TypeScript (strict mode, JSDoc annotations)
- BigInt (native JavaScript arbitrary precision)

**Key Libraries:**
- **Decimal.js** - High-precision decimal math
- **Pyodide** - Python runtime (browser/Node.js)
- **XLSX** - Excel file support
- **Formula library** - Excel formula evaluation
- **Luxon** - Date/time utilities

**Runtime Support:**
- Node.js (primary)
- Deno
- Bun
- Browser (via Pyodide)

**Development:**
- Benchmark.js for performance testing
- Custom test framework
- deno.json for TypeScript configuration

---

### 5. Maturity & Test Coverage

**Strengths:**
- 105+ unit/integration tests
- 21 dedicated benchmark files
- Comprehensive schema validation/sanitization system
- Performance monitoring via benchmarks
- Coherent refactoring history (recent active development)
- Type safety considerations throughout

**Indicators:**
- Recent commits show active maintenance
- Git history: One primary developer (suggests focused vision)
- Well-organized code with clear naming conventions

---

### 6. Known TODOs & Incomplete Features

**Engine Components:**
- [ ] Ledger query methods (return by ID, name, unit) - `src/engine/ledger/`
- [ ] Formula object implementation (FmlObj) - `src/engine/fml/`
- [ ] Square transaction balancing - `src/engine/ledger/`

**Modules:**
- [ ] ismovements module
- [ ] genericmovements module
- [ ] Additional module implementations

**Other:**
- [ ] Experimental features in `src/lib/experiments/`
- [ ] Python integration (minimal - only statsmodel forecasting)
- [ ] Unused modules cleanup (json5_relaxed_utils moved to /unused)

---

### 7. Strengths

1. **Financial Accuracy First**: Purpose-built BigInt scaling prevents floating-point errors
2. **Clean Architecture**: Strong separation of concerns (engine, modules, utilities)
3. **Scenario Support**: Powerful what-if analysis via Driver/Settings system
4. **Data Integrity**: Schema-driven validation framework
5. **Performance-Conscious**: Dedicated benchmark suite
6. **Multi-Environment**: Node.js, Deno, Bun, browser support
7. **Active Development**: Recent refactoring shows ongoing improvement

---

### 8. Concerns & Technical Debt

**Blocking Issues:**
- Multiple critical features marked TODO (ledger queries, module implementations)
- Not production-ready until TODOs are addressed

**Architectural/Design:**
- Schema validation uses string-based type checking (could leverage TypeScript generics)
- Limited high-level architectural documentation
- Scattered experimental code not cleaned up
- Code assumes financial domain knowledge

**Team/Sustainability:**
- Single active developer (concentration risk)
- Non-commercial licensing (requires paid license for business use)
- Limited team involvement in recent history

**Integration:**
- Python support minimal (only Pyodide-based forecasting)
- Unused dependencies could be pruned

---

### 9. Summary Assessment

**Status**: Mature but Unfinished

This is a **well-engineered foundation for financial modeling** with excellent attention to precision arithmetic and test coverage. The architecture is clean, modular, and extensible. However, scattered TODOs and incomplete module implementations indicate it's still under active development.

**Readiness**:
- ✅ Suitable as foundation for financial applications
- ✅ Strong precision and validation infrastructure
- ✅ Extensible architecture for custom modules
- ⚠️ Address TODOs before production use
- ⚠️ Review licensing for commercial deployments

**Key Technical Achievements:**
1. Custom BigInt-scaled decimal arithmetic (DSBValue)
2. Double-entry bookkeeping ledger system
3. Scenario-based modeling via Driver/Settings
4. Comprehensive validation/schema framework

---

## How to Update This Document

Run this prompt in future conversations:
```
Update the project assessment document (.claude/project-assessment.md) with any new findings,
completed TODOs, or architectural changes you discover.
```
