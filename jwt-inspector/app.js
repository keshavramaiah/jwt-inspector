const $ = (id) => document.getElementById(id);
const tokenInput = $("tokenInput");
const results = $("results");
const errorBox = $("errorBox");
const tokenStatus = $("tokenStatus");

function decodeBase64Url(segment) {
  if (!segment || !/^[A-Za-z0-9_-]+$/.test(segment)) {
    throw new Error("A JWT segment contains invalid Base64URL characters.");
  }
  let base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
  base64 += "=".repeat((4 - base64.length % 4) % 4);
  let binary;
  try { binary = atob(base64); } catch { throw new Error("Could not decode a token segment. Check that the token is complete."); }
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

function parseSegment(segment, label) {
  let value;
  try { value = JSON.parse(decodeBase64Url(segment)); }
  catch (err) {
    if (err instanceof SyntaxError) throw new Error(`The ${label} is not valid JSON.`);
    throw err;
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`The ${label} must be a JSON object.`);
  }
  return value;
}

function dateFromClaim(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const date = new Date(value * 1000);
  return Number.isNaN(date.getTime()) ? null : date;
}
function formatDate(date) {
  return date ? date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "medium" }) : "Not present";
}
function relativeExpiry(date) {
  if (!date) return "No exp claim found";
  const ms = date.getTime() - Date.now();
  const abs = Math.abs(ms);
  const units = [
    ["day", 86400000], ["hour", 3600000], ["minute", 60000], ["second", 1000]
  ];
  const [unit, size] = units.find(([, size]) => abs >= size) || units[3];
  const count = Math.max(1, Math.floor(abs / size));
  return ms >= 0 ? `Expires in ${count} ${unit}${count === 1 ? "" : "s"}` : `Expired ${count} ${unit}${count === 1 ? "" : "s"} ago`;
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
}
function displayClaim(value) {
  if (value === undefined) return "Not present";
  if (value === null) return "null";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
function setError(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
  results.hidden = true;
  tokenStatus.textContent = "Could not decode token";
  tokenStatus.className = "status bad";
}
function setTab(which) {
  const header = which === "header";
  $("headerTab").classList.toggle("active", header);
  $("payloadTab").classList.toggle("active", !header);
  $("headerTab").setAttribute("aria-selected", String(header));
  $("payloadTab").setAttribute("aria-selected", String(!header));
  $("headerPane").hidden = !header;
  $("payloadPane").hidden = header;
}
function addClaim(container, label, value) {
  const item = document.createElement("div");
  item.className = "claim";
  const name = document.createElement("span");
  name.textContent = label;
  const val = document.createElement("strong");
  val.textContent = value;
  item.append(name, val);
  container.append(item);
}

function decode() {
  errorBox.hidden = true;
  const token = tokenInput.value.trim();
  if (!token) return setError("Paste a JWT to get started.");
  const parts = token.split(".");
  if (parts.length !== 3 || parts.some(part => !part)) {
    return setError("This does not look like a compact JWT. A signed JWT usually has three non-empty parts separated by dots.");
  }
  try {
    const header = parseSegment(parts[0], "header");
    const payload = parseSegment(parts[1], "payload");
    // The signature is intentionally not verified. This is a decoder, not a verifier.
    $("headerOutput").textContent = JSON.stringify(header, null, 2);
    $("payloadOutput").textContent = JSON.stringify(payload, null, 2);
    $("algorithmValue").textContent = displayClaim(header.alg);
    const exp = dateFromClaim(payload.exp);
    const iat = dateFromClaim(payload.iat);
    $("expiryValue").textContent = formatDate(exp);
    $("expiryRelative").textContent = relativeExpiry(exp);
    $("issuedValue").textContent = formatDate(iat);

    const notice = $("expiryNotice");
    if (payload.exp === undefined) {
      notice.className = "notice warning";
      notice.textContent = "No exp claim found. This tool cannot determine the token's expiry.";
    } else if (!exp) {
      notice.className = "notice warning";
      notice.textContent = "The exp claim is present but is not a valid numeric Unix timestamp.";
    } else if (exp.getTime() <= Date.now()) {
      notice.className = "notice expired";
      notice.textContent = "This token appears to be expired based on its exp claim. The signature and other validation rules have not been checked.";
    } else {
      notice.className = "notice valid";
      notice.textContent = "The exp claim is in the future. This does not mean the token is authentic or accepted by an API.";
    }

    const claims = $("claimsList");
    claims.replaceChildren();
    const known = [
      ["iss", "Issuer"], ["sub", "Subject"], ["aud", "Audience"],
      ["exp", "Expires (Unix seconds)"], ["nbf", "Not before (Unix seconds)"],
      ["iat", "Issued at (Unix seconds)"], ["jti", "JWT ID"]
    ];
    for (const [key, label] of known) {
      if (payload[key] !== undefined) addClaim(claims, label, displayClaim(payload[key]));
    }
    if (!claims.children.length) addClaim(claims, "Registered claims", "None found");
    results.hidden = false;
    tokenStatus.textContent = "Token decoded";
    tokenStatus.className = "status good";
    setTab("header");
  } catch (err) {
    setError(err.message || "Unable to decode this token.");
  }
}

$("decodeBtn").addEventListener("click", decode);
$("clearBtn").addEventListener("click", () => {
  tokenInput.value = "";
  results.hidden = true;
  errorBox.hidden = true;
  tokenStatus.textContent = "Waiting for a token";
  tokenStatus.className = "status";
  tokenInput.focus();
});
$("sampleBtn").addEventListener("click", () => {
  // Public, non-sensitive demonstration token. Its signature is deliberately not validated.
  tokenInput.value = "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJkZW1vLXVzZXIiLCJpc3MiOiJqd3QtaW5zcGVjdG9yIiwiYXVkIjoiZXhhbXBsZS1hcGkiLCJpYXQiOjE3NjE5NDA4MDAsImV4cCI6MTc2MTk0NDQwMH0.";
  decode();
});
$("headerTab").addEventListener("click", () => setTab("header"));
$("payloadTab").addEventListener("click", () => setTab("payload"));
document.querySelectorAll(".copy-button").forEach(button => {
  button.addEventListener("click", async () => {
    const text = $(button.dataset.copy).textContent;
    try {
      await navigator.clipboard.writeText(text);
      button.textContent = "Copied";
      setTimeout(() => button.textContent = "Copy", 1200);
    } catch {
      button.textContent = "Copy unavailable";
    }
  });
});
tokenInput.addEventListener("keydown", event => {
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") decode();
});
