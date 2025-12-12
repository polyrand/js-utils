# js-utils

A collection of lightweight, zero-dependency JavaScript utilities for web development. These are some functions that I always end up using in my projects, so I decided to bundle them together for easy reuse.

## Available Utilities

- `debounce()` - Debounce an action for up to ms milliseconds
- `debounce2()` - Advanced debounced function with promise support
- `nanoid()` - Generate URL-safe unique IDs
- `retryWithBackoff()` - Retry async actions with exponential backoff
- `storage` - Simplified localStorage with automatic JSON serialization
- `afterLoad()` - Execute callback when DOM content is loaded
- `safe()` - Mark HTML strings as safe (no escaping)
- `htl` - Template literals for safe HTML rendering
- `dAlert()` - Custom alert dialog
- `dConfirm()` - Custom confirm dialog
- `dPrompt()` - Custom prompt dialog
- `withSpinner()` - Execute function with loading spinner overlay

## Quick Links

- [Installation](#installation)
- [Custom Dialogs](#custom-dialogs)
- [Spinner Overlay](#spinner-overlay)
- [Debouncing](#debouncing)
- [Retry with Backoff](#retry-with-backoff)
- [Local Storage Helper](#local-storage-helper)
- [HTML Template Literals](#html-template-literals)
- [Complete Example](#complete-example)

## Installation

### Via CDN (jsDelivr)

```html
<script type="module">
  import {
    dAlert,
    withSpinner,
    debounce2,
  } from "https://cdn.jsdelivr.net/gh/polyrand/js-utils@main/utils.js";

  // Use the functions
  await dAlert({ message: "Hello!" });
</script>
```

### Local Installation

```bash
# Clone the repository
git clone https://github.com/polyrand/js-utils.git

# Or download utils.js directly
curl -O https://raw.githubusercontent.com/polyrand/js-utils/main/utils.js
```

## Usage Examples

### Custom Dialogs

```javascript
import {
  dAlert,
  dConfirm,
  dPrompt,
} from "https://cdn.jsdelivr.net/gh/polyrand/js-utils@main/utils.js";

// Alert dialog
await dAlert({ message: "Operation completed!" });

// Confirm dialog
const confirmed = await dConfirm({ message: "Are you sure?" });
if (confirmed) {
  console.log("User confirmed");
}

// Prompt dialog
const name = await dPrompt({ message: "Enter your name:", type: "text" });
if (name) {
  console.log(`Hello, ${name}!`);
}
```

### Spinner Overlay

```javascript
import { withSpinner } from "https://cdn.jsdelivr.net/gh/polyrand/js-utils@main/utils.js";

await withSpinner(async () => {
  // Perform async operation
  const response = await fetch("/api/data");
  const data = await response.json();
  return data;
});
```

### Debouncing

```javascript
import { debounce2 } from "https://cdn.jsdelivr.net/gh/polyrand/js-utils@main/utils.js";

const search = debounce2(async (query) => {
  const results = await fetch(`/api/search?q=${query}`);
  return results.json();
}, 300);

// Only the last call within 300ms will execute
search("hello").then(console.log);
```

### Retry with Backoff

```javascript
import { retryWithBackoff } from "https://cdn.jsdelivr.net/gh/polyrand/js-utils@main/utils.js";

const data = await retryWithBackoff(
  async () => {
    const response = await fetch("/api/unreliable-endpoint");
    if (!response.ok) throw new Error("Request failed");
    return response.json();
  },
  {
    maxRetries: 5,
    initialDelay: 100,
    maxDelay: 10000,
    jitterFactor: 0.3,
  }
);
```

### Local Storage Helper

```javascript
import { storage } from "https://cdn.jsdelivr.net/gh/polyrand/js-utils@main/utils.js";

// Automatically handles JSON serialization
storage.set("user", { name: "John", age: 30 });
const user = storage.get("user"); // Returns parsed object

storage.set("count", 42);
const count = storage.get("count"); // Returns number

storage.remove("user");
```

### HTML Template Literals

```javascript
import {
  htl,
  safe,
} from "https://cdn.jsdelivr.net/gh/polyrand/js-utils@main/utils.js";

const userInput = '<script>alert("xss")</script>';
const trustedHTML = "<strong>Bold</strong>";

const element = htl`
  <div>
    <p>${userInput}</p>  <!-- Automatically escaped -->
    <p>${safe(trustedHTML)}</p>  <!-- Not escaped -->
  </div>
`;

document.body.appendChild(element);
```

## Complete Example

See [index.html](index.html) for a working demo.

## API Reference

All functions are fully documented with JSDoc comments in [utils.js](utils.js). See the source code for detailed parameter types and usage information.

## License

MIT
