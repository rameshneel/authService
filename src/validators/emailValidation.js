import { promises as dns } from "dns";
import disposable from "disposable-email";

export async function verifyEmail(email) {
  const result = {
    email,
    valid: false,
    disposable: false,
    trusted: "low",
  };

  // 1. Syntax validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return result;

  const domain = email.split("@")[1].toLowerCase();

  // 2. MX record check
  try {
    const mxRecords = await dns.resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) return result;
    result.valid = true;
  } catch {
    return result;
  }

  // 3. Disposable check
  const isDisposable = disposable.validate(domain);
  result.disposable = isDisposable;
  result.trusted = isDisposable ? "medium" : "high";

  return result;
}

// ✅ Example usage:
const testEmail = "wikepov630@daupload.com";
verifyEmail(testEmail).then(console.log);
