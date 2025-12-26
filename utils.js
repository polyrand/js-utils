/**
 * Debounce an action for up to 'ms' milliseconds.
 *
 * @type{function(number): function(function(any): void)}
 */
export function debounce(ms) {
  let debounceTimer = null;
  return (f) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(f, ms);
  };
}

// const debouncedAction = d(500);
// debouncedAction(() => console.log("Action executed 1"));
// debouncedAction(() => console.log("Action executed 2"));
// debouncedAction(() => console.log("Action executed 3"));
// Outputs: "Action executed 3" (after 500 milliseconds, only the last call is executed)

/**
 * Returns a debounced version of a function. The debounced function delays invoking the original
 * function until `ms` milliseconds have passed since the last time the debounced function was invoked.
 *
 * This version is designed to work with both synchronous and asynchronous functions and correctly
 * handles promises. For every call within a debounce window, it returns the same promise. This promise
 * resolves with the result of the single, debounced invocation.
 *
 * @template {(...args: any[]) => any} F The type of the function to debounce.
 * @param {F} func The function to debounce. Can be synchronous or asynchronous.
 * @param {number} ms The number of milliseconds to delay.
 * @returns {(...args: Parameters<F>) => Promise<Awaited<ReturnType<F>>>} A new debounced function
 *   that returns a promise. The promise resolves with the result of the last successful invocation.
 *
 * @example
 * // Debouncing an async function
 * const expensiveAsyncCall = async (query) => {
 *   console.log('Fetching:', query);
 *   // imagine a real API call here
 *   return `Result for ${query}`;
 * };
 *
 * const debouncedFetch = debounce2(expensiveAsyncCall, 300);
 *
 * debouncedFetch('first').then(console.log);
 * debouncedFetch('second').then(console.log);
 * // After 300ms, only 'Fetching: second' is logged.
 * // Then, both promises resolve with 'Result for second'.
 */
export function debounce2(func, ms) {
  let timerId = null;
  /** @type {Promise<Awaited<ReturnType<F>>> | null} */
  let inflightPromise = null;
  /** @type {((value: Awaited<ReturnType<F>>) => void) | null} */
  let inflightResolver = null;

  return function (...args) {
    clearTimeout(timerId);

    if (!inflightPromise) {
      inflightPromise = new Promise((resolve) => {
        inflightResolver = resolve;
      });
    }

    timerId = setTimeout(() => {
      const resolver = inflightResolver;
      // Reset before calling func. This ensures that if the debounced function
      // is called again, it will get a new promise.
      inflightPromise = null;
      inflightResolver = null;

      if (resolver) {
        Promise.resolve(func.apply(this, args)).then(resolver);
      }
    }, ms);

    return inflightPromise;
  };
}

/**
 * Generates a URL-safe unique ID string of specified length.
 * Uses a custom alphabet for better readability and uniqueness.
 *
 * @param {number} [e=21] - Length of the ID to generate
 * @returns {string} A random ID string of the specified length
 */
export function nanoid(e = 21) {
  const alphabet =
    "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
  let result = "";
  let rndm = crypto.getRandomValues(new Uint8Array(e));
  for (let n = 0; n < e; n++) result += alphabet[63 & rndm[n]];
  return result;
}

/**
 * Retries an async action with exponential backoff, max retries, and jitter.
 *
 * @param {function(): Promise<any>} action - The async function to retry.
 * @param {object} [options] - Configuration options.
 * @param {number} [options.maxRetries=3] - Maximum number of retries.
 * @param {number} [options.initialDelay=100] - Initial delay in milliseconds.
 * @param {number} [options.maxDelay=10000] - Maximum delay in milliseconds.
 * @param {number} [options.jitterFactor=0.3] - Factor for randomizing delay (0 to 1).
 * @returns {Promise<any>} The result of the action if successful.
 * @throws {Error} The last error encountered after exhausting retries.
 */
export async function retryWithBackoff(
  action,
  {
    maxRetries = 3,
    initialDelay = 100,
    maxDelay = 10000,
    jitterFactor = 0.3,
  } = {}
) {
  let lastError = null;
  for (let attempt = 0, _total = maxRetries + 1; attempt < _total; attempt++) {
    try {
      const result = await action();
      return result;
    } catch (error) {
      lastError = error;
      console.warn(`Attempt ${attempt + 1} failed:`, error.message);

      if (attempt === maxRetries) {
        console.error(`Action failed after ${maxRetries + 1} attempts.`);
        throw lastError; // Re-throw the last error after all retries
      }

      // Calculate delay with exponential backoff
      let delay = Math.min(initialDelay * 2 ** attempt, maxDelay);

      // Calculate jitter (random +/- jitterFactor * delay)
      const jitter = delay * jitterFactor * (Math.random() - 0.5) * 2;

      // Apply jitter and ensure delay is non-negative
      const finalDelay = Math.max(0, delay + jitter);

      console.log(`Retrying in ${finalDelay.toFixed(0)} ms...`);
      await sleep(finalDelay);
    }
  }
  // This part should theoretically not be reached due to the throw in the loop
  throw lastError || new Error("Retry failed without capturing an error.");
}

/**
 * Simplified LocalStorageManager (JSON-serialized values if not a number)
 */
export const storage = {
  set: (key, value) =>
    localStorage.setItem(
      key,
      typeof value === "number" ? String(value) : JSON.stringify(value)
    ),
  get: (key) => {
    const value = localStorage.getItem(key);
    if (value === null) {
      return null; // Key not found
    }
    try {
      // Attempt to parse as JSON first
      return JSON.parse(value);
    } catch (e) {
      // If JSON parsing fails (e.g., it's a plain string or a number stored as a string),
      // return the raw string value retrieved from localStorage.
      return value;
    }
  },
  remove: (key) => localStorage.removeItem(key),
};

/**
 * Sets both the value property and attribute of a DOM element. This ensures
 * the value is updated in both the DOM and JavaScript (each element has its own
 * rules).
 *
 * @param {HTMLElement} element - The DOM element to update
 * @param {string} name - The name of the property/attribute to set
 * @param {string} value - The new value to set
 *
 * @example
 * const input = document.querySelector('input');
 * setVal(input, 'value', 'Hello');
 *
 * @example
 * const button = document.querySelector('button');
 * setVal(button, 'disabled', 'true');
 */
function setVal(element, name, value) {
  element[name] = value;
  element.setAttribute(name, value);
}

/**
 * Takes a callback to run when all DOM content is loaded.
 *
 * Equivalent to `window.addEventListener('DOMContentLoaded', callback)`
 * but will run the callback immediately if the DOM is already loaded.
 *
 * @type{function(function())}
 */

export function afterLoad(callback) {
  if (document.readyState !== "loading") {
    callback();
  } else {
    document.addEventListener("DOMContentLoaded", callback);
  }
}

/**
 * A string wrapper that marks content as safe (pre-escaped) HTML.
 * Used with the `htl` template literal to prevent double-escaping.
 */
class Safe extends String {
  constructor(value) {
    super(value);
  }
}

/**
 * Marks a string as safe HTML that should not be escaped by the `htl` template literal.
 * Use this when you have pre-sanitized HTML that you want to insert as-is.
 *
 * @param {string} value - The HTML string to mark as safe.
 * @returns {Safe} A Safe string instance that `htl` will not escape.
 *
 * @example
 * const userContent = '<script>alert("xss")</script>';
 * const safeContent = '<strong>Bold</strong>';
 *
 * // Without safe(): HTML is escaped
 * htl`<div>${userContent}</div>`; // <div>&#60;script&#62;...
 *
 * // With safe(): HTML is inserted as-is (use only with trusted content)
 * htl`<div>${safe(safeContent)}</div>`; // <div><strong>Bold</strong></div>
 */
export function safe(value) {
  return new Safe(value);
}

/**
 * A tagged template literal for creating DOM elements from HTML strings with
 * automatic XSS protection. Values are HTML-escaped by default unless wrapped
 * with `safe()`.
 *
 * @param {TemplateStringsArray} strings - The template literal strings.
 * @param {...*} values - The interpolated values to escape and insert.
 * @returns {HTMLElement|DocumentFragment|null} The created DOM element(s).
 *
 * @example
 * // Basic usage - values are automatically escaped
 * const username = '<script>alert("xss")</script>';
 * const el = htl`<div class="user">${username}</div>`;
 * // Result: <div class="user">&#60;script&#62;...</div>
 *
 * @example
 * // Arrays are joined automatically
 * const items = ['Apple', 'Banana', 'Cherry'];
 * const list = htl`<ul>${items.map(i => htl`<li>${i}</li>`)}</ul>`;
 *
 * @example
 * // Nested elements work seamlessly
 * const inner = htl`<span>Hello</span>`;
 * const outer = htl`<div>${inner}</div>`;
 *
 * @example
 * // Use safe() for pre-sanitized HTML
 * const trustedHtml = '<strong>Bold</strong>';
 * const el = htl`<div>${safe(trustedHtml)}</div>`;
 */
export function htl(strings, ...values) {
  function renderHtml(string) {
    const template = document.createElement("template");
    template.innerHTML = string.trim();
    return document.importNode(template.content, true);
  }

  function extractFragment(fragment) {
    if (fragment.firstChild === null) return null;
    if (fragment.firstChild === fragment.lastChild)
      return fragment.removeChild(fragment.firstChild);
    const div = document.createElement("div");
    div.appendChild(fragment);
    return div;
  }

  function escapeHtmlChars(value) {
    if (value instanceof Safe) {
      return value.toString();
    }
    if (value instanceof HTMLElement) {
      return value.outerHTML; // Serialize HTMLElement to its HTML string
    }
    if (value instanceof DocumentFragment) {
      const div = document.createElement("div");
      // Append a clone because appendChild can move nodes from the original fragment if it's live,
      // and we want to serialize its content.
      div.appendChild(value.cloneNode(true));
      return div.innerHTML; // Serialize DocumentFragment's content to an HTML string
    }

    // Handle null or undefined by returning an empty string
    if (value === null || typeof value === "undefined") {
      return "";
    }

    // For all other types (strings, numbers, booleans, other objects),
    // convert to string and then HTML-escape them.
    // This ensures that numbers (e.g., 0) become "0" and strings are safely escaped.
    return String(value).replace(
      /[<>'"]/g,
      (char) => `&#${char.charCodeAt(0)}`
    );
  }

  // Process template values
  let processedValues = [];
  for (let i = 0, total = values.length; i < total; i++) {
    let flattenedValue = [values[i]].flat();
    let escapedParts = [];
    for (let j = 0, totalParts = flattenedValue.length; j < totalParts; j++) {
      escapedParts.push(escapeHtmlChars(flattenedValue[j]));
    }
    processedValues.push(escapedParts.join(""));
  }

  // Combine strings and processed values
  let result = strings[0];
  for (let i = 0, total = processedValues.length; i < total; i++) {
    result += processedValues[i] + strings[i + 1];
  }

  const el = extractFragment(renderHtml(result));
  return el;
}

/**
 *
 * The dAlert, dConfirm, and dPrompt functions were partially inspired by:
 * https://github.com/simonw/prompts-js
 */

/**
 * Creates and injects a style element with dialog CSS into the document head.
 * If styles are already injected, returns the existing style element.
 *
 * @returns {HTMLStyleElement} The created or existing style element.
 */
function injectDialogStyles() {
  const styleId = "dialog-styles-injected";

  // Check if styles already exist
  let existingStyle = document.getElementById(styleId);
  if (existingStyle) {
    return existingStyle;
  }

  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = `
    .myDialogPrompt {
      border: none;
      border-radius: 0.5rem;
      padding: 1.25rem;
      min-width: 300px;
      max-width: 80%;
      box-sizing: border-box;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #ffffff;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      margin: auto;
    }

    .myDialogPrompt::backdrop {
      background-color: rgba(17, 24, 39, 0.7);
    }

    .myDialogPrompt form {
      margin: 0;
    }

    .myDialogPrompt .dialog-message {
      margin-bottom: 1.25rem;
      font-size: 0.875rem;
      color: #111827;
      white-space: pre-wrap;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }

    .myDialogPrompt .dialog-actions {
      text-align: right;
      margin-top: 1.25rem;
    }

    .myDialogPrompt button {
      cursor: pointer;
      border-radius: 0.375rem;
      padding: 0.5rem 0.75rem;
      font-size: 0.875rem;
      font-weight: 600;
      border: none;
    }

    .myDialogPrompt button.primary {
      background-color: #4f46e5;
      color: #ffffff;
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    }

    .myDialogPrompt button.primary:hover {
      background-color: #6366f1;
    }

    .myDialogPrompt button.secondary {
      background-color: #6b7280;
      color: #ffffff;
      margin-right: 0.5rem;
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    }

    .myDialogPrompt button.secondary:hover {
      background-color: #9ca3af;
    }

    .myDialogPrompt input {
      width: 100%;
      box-sizing: border-box;
      padding: 0.375rem 0.75rem;
      font-size: 0.875rem;
      margin-bottom: 1.25rem;
      border-radius: 0.375rem;
      border: 0;
      color: #111827;
      box-shadow: 0 0 0 1px #d1d5db inset;
    }

    .myDialogPrompt input:focus {
      outline: none;
      box-shadow: 0 0 0 2px #4f46e5 inset;
    }
  `;

  document.head.appendChild(style);
  return style;
}

/**
 * Removes the injected dialog styles from the document head.
 * Safe to call even if styles were not previously injected.
 */
function removeDialogStyles() {
  const styleId = "dialog-styles-injected";
  const style = document.getElementById(styleId);
  if (style) {
    style.remove();
  }
}

/**
 * Displays an alert dialog with a custom message.
 * A promise-based replacement for the native `alert()` function with styled UI.
 *
 * @param {Object} options - The options for the alert dialog.
 * @param {string} options.message - The message to display.
 * @returns {Promise<void>} A promise that resolves when the dialog is closed.
 *
 * @example
 * await dAlert({ message: 'Operation completed successfully!' });
 * console.log('User dismissed the alert');
 *
 * @example
 * // With multiline message
 * await dAlert({ message: 'Warning!\nThis action cannot be undone.' });
 */
export async function dAlert({ message }) {
  const className = "myDialogPrompt";
  const style = injectDialogStyles();

  const form = htl`
    <form method="dialog">
      <div class="dialog-message">${message}</div>
      <div class="dialog-actions">
        <button type="submit" value="ok" class="primary">OK</button>
      </div>
    </form>
    `;

  const dialog = htl`
    <dialog class="${className}">
      ${form}
    </dialog>
    `;

  return new Promise((resolve) => {
    dialog.addEventListener("close", () => {
      resolve();
      dialog.remove();
      removeDialogStyles();
    });

    document.body.appendChild(dialog);
    dialog.showModal();
  });
}

/**
 * Displays a confirmation dialog with OK and Cancel buttons.
 * A promise-based replacement for the native `confirm()` function with styled UI.
 *
 * @param {Object} options - The options for the confirm dialog.
 * @param {string} options.message - The message to display.
 * @returns {Promise<boolean>} A promise that resolves to `true` if OK is clicked, `false` if Cancel is clicked.
 *
 * @example
 * const confirmed = await dConfirm({ message: 'Are you sure you want to delete this item?' });
 * if (confirmed) {
 *   deleteItem();
 * }
 *
 * @example
 * // Using with early return pattern
 * if (!await dConfirm({ message: 'Proceed with upload?' })) {
 *   return;
 * }
 * uploadFile();
 */
export async function dConfirm({ message }) {
  const className = "myDialogPrompt";
  const style = injectDialogStyles();

  return new Promise((resolve) => {
    const form = htl`
      <form method="dialog">
        <div class="dialog-message">${message}</div>
        <div class="dialog-actions">
          <button id="dialogCancelBtn" type="button" value="cancel" class="secondary">Cancel</button>
          <button id="ok" type="submit" value="ok" class="primary">OK</button>
        </div>
      </form>
    `;

    // form.querySelector("#ok").addEventListener("click", () => dialog.close("ok"));

    const dialog = htl`
      <dialog class="${className}">
        ${form}
      </dialog>
      `;

    dialog
      .querySelector("#dialogCancelBtn")
      .addEventListener("click", () => dialog.close("cancel"));

    dialog.addEventListener("close", () => {
      resolve(dialog.returnValue === "ok");
      dialog.remove();
      removeDialogStyles();
    });

    document.body.appendChild(dialog);
    dialog.showModal();
  });
}

/**
 * Displays a prompt dialog with a custom message and input type.
 * @param {Object} options - The options for the prompt dialog.
 * @param {string} options.message - The message to display.
 * @param {Object|null} [options.customStyles=null] - Custom styles to apply to the dialog.
 * @param {string} [options.type="text"] - The type of input to display in the dialog.
 * @returns {Promise<string|null>} A promise that resolves to the input value if "OK" is clicked, or null if "Cancel" is clicked.
 */
export async function dPrompt({ message, type = "text" }) {
  const className = "myDialogPrompt";
  const style = injectDialogStyles();

  return new Promise((resolve) => {
    const autoComplete = type === "password" ? "new-password" : "off";

    const form = htl`
      <form method="dialog">
        <div class="dialog-message">${message}</div>
        <input type="${type}" name="promptInput" autocomplete="${autoComplete}">
        <div class="dialog-actions">
          <button id="dialogCancelBtn" type="button" value="cancel" class="secondary">Cancel</button>
          <button id="ok" type="submit" value="ok" class="primary">OK</button>
        </div>
      </form>
    `;

    const dialog = htl`
    <dialog class="${className}">
      ${form}
    </dialog>
  `;

    // add handler on parent because form will be stringified during rendering
    dialog
      .querySelector("#dialogCancelBtn")
      .addEventListener("click", () => dialog.close("cancel"));

    dialog.addEventListener("close", () => {
      const input = dialog.querySelector("input[name='promptInput']");
      const result = dialog.returnValue === "ok" ? input.value : null;
      resolve(result);
      dialog.remove();
      removeDialogStyles();
    });

    document.body.appendChild(dialog);
    dialog.showModal();
    dialog.querySelector("input[name='promptInput']").focus();
  });
}

// others

/**
 * Delegates an event to a child element that matches the selector.
 *
 * @param {HTMLElement} el - The parent element to delegate the event from.
 * @param {string} selector - The selector to match the child elements.
 * @param {string} event - The event type to listen for.
 * @param {function(Event, HTMLElement): void} handler - The event handler function.
 *
 * @example
 * // Handle clicks on any button inside a container
 * const container = document.getElementById('container');
 * delegate(container, 'button', 'click', (e, el) => {
 *   console.log('Button clicked:', e.target.textContent);
 * });
 */
function delegate(el, selector, event, handler) {
  el.addEventListener(event, (e) => {
    if (e.target.matches(selector)) {
      handler(e, el);
    }
  });
}

/**
 * Pauses the execution for a specified amount of time.
 *
 * @param {number} ms - The number of milliseconds to sleep.
 * @param {*} [e] - The value to resolve the promise with after the delay.
 * @returns {Promise<*>} A promise that resolves with the provided value after the specified delay.
 *
 * @example
 * // Wait for 1 second
 * await sleep(1000);
 *
 * @example
 * // Wait and return a value
 * const result = await sleep(500, 'done');
 * console.log(result); // 'done'
 */
async function sleep(ms, e) {
  return await new Promise((resolve) =>
    setTimeout(() => {
      resolve(e);
    }, ms)
  );
}

/**
 * Executes a function while showing a spinner overlay to block the UI.
 * The spinner is always destroyed at the end, regardless of success or failure.
 *
 * @param {Function} fn - The async function to execute.
 * @returns {Promise<*>} The result of the function, or throws the error if it fails.
 *
 * @example
 * // Basic usage
 * const result = await withSpinner(async () => {
 *   const response = await fetch('/api/data');
 *   return response.json();
 * });
 *
 * @example
 * // With error handling
 * try {
 *   await withSpinner(() => submitForm(formData));
 * } catch (error) {
 *   console.error('Submission failed:', error);
 * }
 */
export async function withSpinner(fn) {
  const SPINNER_HTML =
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" fill="white" height="24" viewBox="0 0 24 24"><path d="M12,23a9.63,9.63,0,0,1-8-9.5,9.51,9.51,0,0,1,6.79-9.1A1.66,1.66,0,0,0,12,2.81h0a1.67,1.67,0,0,0-1.94-1.64A11,11,0,0,0,12,23Z"><animateTransform attributeName="transform" type="rotate" dur="0.75s" values="0 12 12;360 12 12" repeatCount="indefinite"/></path></svg>';

  let overlay = null;

  try {
    // Create overlay
    overlay = document.createElement("div");
    overlay.id = "form_submission_spinner_overlay";
    overlay.style.cssText =
      "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;";
    overlay.innerHTML = SPINNER_HTML;

    document.body.appendChild(overlay);

    // Execute the function
    const result = await fn();
    return result;
  } catch (error) {
    throw error;
  } finally {
    // Always remove overlay
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
  }
}
