const { recognize } = require("tesseract.js");

const compact = (value = "") => String(value).toUpperCase().replace(/[^A-Z0-9]/g, "");

// This checks that the submitted identity image contains the registrant's
// visible name or entered document number. It is not government KYC.
async function verifyIdentityDocument(filePath, identityType, identityNumber, name) {
  const { data } = await recognize(filePath, "eng");
  const text = data.text || "";
  const normalizedText = compact(text);
  const expected = compact(identityNumber);
  const nameWords = String(name || "")
    .split(/\s+/)
    .map(compact)
    .filter((word) => word.length >= 3);

  if (identityType === "aadhaar") {
    const nameIsVisible = nameWords.some((word) => normalizedText.includes(word));
    const numberIsVisible = normalizedText.includes(expected);
    if (!nameIsVisible && !numberIsVisible)
      return { valid: false, message: "Upload a clearer Aadhaar photo with your name visible." };
    return { valid: true };
  }

  if (!normalizedText.includes(expected)) {
    return { valid: false, message: "The uploaded vehicle registration image does not contain the registration ID you entered." };
  }

  return { valid: true };
}

module.exports = { verifyIdentityDocument };
