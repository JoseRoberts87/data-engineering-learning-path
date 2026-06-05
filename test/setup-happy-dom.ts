// Bun test preload — registers the happy-dom globals (window, document,
// HTMLElement, etc.) on the global scope so React Testing Library works.
// Loaded via bunfig.toml's [test] preload setting.

import { GlobalRegistrator } from "@happy-dom/global-registrator";

GlobalRegistrator.register();
