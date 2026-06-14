const assert = require("node:assert/strict");
const {
  buildLinks,
  getLocale,
  getMessages,
  normalizePhoneNumber,
  validatePhoneNumber,
} = require("../app");

const validCases = [
  ["+971 50 123 4567", "971501234567"],
  ["00971 50 123 4567", "971501234567"],
  ["00971501234567", "971501234567"],
  ["00 971 50 123 4567", "971501234567"],
  ["+1 (415) 555-0100", "14155550100"],
  ["44.20.7946.0958", "442079460958"],
];

for (const [input, expected] of validCases) {
  assert.equal(normalizePhoneNumber(input), expected);
  assert.deepEqual(validatePhoneNumber(input), { number: expected, error: "" });
}

const invalidCases = [
  ["+971A501234567", "Use only numbers, spaces, +, -, dots, or brackets."],
  ["971 +50 123 4567", "The + sign can only appear once at the beginning."],
  ["+971 (50 123 4567", "Check the brackets in the phone number."],
  ["0501234567", "Use the country code, not a local number starting with 0."],
  ["+123", "The number is too short. Use an international number with country code."],
  ["+1234567890123456", "The number is too long. WhatsApp numbers use up to 15 digits."],
  ["+111111111", "The number format looks incorrect."],
];

for (const [input, error] of invalidCases) {
  assert.equal(validatePhoneNumber(input).error, error);
}

assert.equal(getLocale("ar"), "ar");
assert.equal(getLocale("ar-AE"), "ar");
assert.equal(getLocale("en-US"), "en");
assert.equal(validatePhoneNumber("+971A501234567", "ar").error, getMessages("ar").invalidCharacters);

assert.deepEqual(buildLinks("971501234567", "Hi there"), {
  web: "https://wa.me/971501234567?text=Hi%20there",
  app: "whatsapp://send?phone=971501234567&text=Hi%20there",
});

console.log("Phone validation tests passed.");
