(function (root) {
  const MESSAGES = {
    en: {
      copy: "Copy",
      copied: "Copied",
      invalidCharacters: "Use only numbers, spaces, +, -, dots, or brackets.",
      invalidPlus: "The + sign can only appear once at the beginning.",
      invalidBrackets: "Check the brackets in the phone number.",
      emptyNumber: "Enter a valid phone number with country code.",
      localNumber: "Use the country code, not a local number starting with 0.",
      tooShort: "The number is too short. Use an international number with country code.",
      tooLong: "The number is too long. WhatsApp numbers use up to 15 digits.",
      repeatedDigits: "The number format looks incorrect.",
    },
    ar: {
      copy: "نسخ",
      copied: "تم النسخ",
      invalidCharacters: "استخدم الأرقام والمسافات وعلامات + و- والنقاط والأقواس فقط.",
      invalidPlus: "يمكن استخدام علامة + مرة واحدة فقط في بداية الرقم.",
      invalidBrackets: "تحقق من الأقواس في رقم الهاتف.",
      emptyNumber: "أدخل رقم هاتف صالحا مع رمز الدولة.",
      localNumber: "استخدم رمز الدولة، وليس رقما محليا يبدأ بصفر.",
      tooShort: "الرقم قصير جدا. استخدم رقما دوليا مع رمز الدولة.",
      tooLong: "الرقم طويل جدا. تستخدم أرقام واتساب حتى 15 رقما.",
      repeatedDigits: "تنسيق الرقم يبدو غير صحيح.",
    },
  };

  function getLocale(locale) {
    return String(locale || "en").toLowerCase().startsWith("ar") ? "ar" : "en";
  }

  function getMessages(locale) {
    return MESSAGES[getLocale(locale)];
  }

  function normalizePhoneNumber(value) {
    let cleaned = value.trim();

    if (cleaned.startsWith("+")) {
      cleaned = cleaned.slice(1);
    }

    cleaned = cleaned.replace(/^00\s*/, "");

    return cleaned.replace(/\D/g, "");
  }

  function validatePhoneNumber(value, locale) {
    const raw = value.trim();
    const messages = getMessages(locale);

    if (!raw) {
      return { number: "", error: "" };
    }

    if (!/^[\d\s()+.\-]+$/.test(raw)) {
      return {
        number: "",
        error: messages.invalidCharacters,
      };
    }

    if ((raw.match(/\+/g) || []).length > 1 || (raw.includes("+") && !raw.startsWith("+"))) {
      return {
        number: "",
        error: messages.invalidPlus,
      };
    }

    if ((raw.match(/\(/g) || []).length !== (raw.match(/\)/g) || []).length) {
      return {
        number: "",
        error: messages.invalidBrackets,
      };
    }

    const number = normalizePhoneNumber(raw);

    if (!number) {
      return {
        number: "",
        error: messages.emptyNumber,
      };
    }

    if (/^0/.test(number)) {
      return {
        number,
        error: messages.localNumber,
      };
    }

    if (number.length < 7) {
      return {
        number,
        error: messages.tooShort,
      };
    }

    if (number.length > 15) {
      return {
        number,
        error: messages.tooLong,
      };
    }

    if (/^(\d)\1+$/.test(number)) {
      return {
        number,
        error: messages.repeatedDigits,
      };
    }

    return { number, error: "" };
  }

  function buildLinks(phoneNumber, message) {
    const encodedMessage = encodeURIComponent(message.trim());
    const messageParam = encodedMessage ? `?text=${encodedMessage}` : "";

    return {
      web: `https://wa.me/${phoneNumber}${messageParam}`,
      app: `whatsapp://send?phone=${phoneNumber}${encodedMessage ? `&text=${encodedMessage}` : ""}`,
    };
  }

  function initApp() {
    const locale = getLocale(document.documentElement.lang);
    const messages = getMessages(locale);
    const form = document.querySelector("#linkForm");
    const phoneInput = document.querySelector("#phoneInput");
    const messageInput = document.querySelector("#messageInput");
    const errorBox = document.querySelector("#errorBox");
    const linkOutput = document.querySelector("#linkOutput");
    const copyButton = document.querySelector("#copyButton");
    const openWebLink = document.querySelector("#openWebLink");
    const openAppLink = document.querySelector("#openAppLink");

    if (!form || !phoneInput || !messageInput || !errorBox || !linkOutput || !copyButton || !openWebLink || !openAppLink) {
      return;
    }

    function showError(message) {
      errorBox.textContent = message;
      errorBox.classList.remove("hidden");
    }

    function hideError() {
      errorBox.textContent = "";
      errorBox.classList.add("hidden");
    }

    function setLinksEnabled(enabled) {
      copyButton.disabled = !enabled;
      openWebLink.classList.toggle("is-disabled", !enabled);
      openAppLink.classList.toggle("is-disabled", !enabled);
    }

    function clearResult() {
      hideError();
      linkOutput.value = "";
      openWebLink.href = "#";
      openAppLink.href = "#";
      copyButton.textContent = messages.copy;
      setLinksEnabled(false);
    }

    function resetFields() {
      form.reset();
      phoneInput.value = "";
      messageInput.value = "";
      clearResult();
    }

    function showInvalidResult(message) {
      showError(message);
      linkOutput.value = "";
      openWebLink.href = "#";
      openAppLink.href = "#";
      copyButton.textContent = messages.copy;
      setLinksEnabled(false);
    }

    function updateResult() {
      const validation = validatePhoneNumber(phoneInput.value, locale);
      const number = validation.number;

      if (!number && !validation.error) {
        clearResult();
        return;
      }

      if (validation.error) {
        showInvalidResult(validation.error);
        return;
      }

      const links = buildLinks(number, messageInput.value);

      hideError();
      linkOutput.value = links.web;
      openWebLink.href = links.web;
      openAppLink.href = links.app;
      copyButton.textContent = messages.copy;
      setLinksEnabled(true);
    }

    form.addEventListener("submit", (event) => event.preventDefault());
    phoneInput.addEventListener("input", updateResult);
    messageInput.addEventListener("input", updateResult);
    resetFields();
    window.setTimeout(resetFields, 0);
    window.addEventListener("pageshow", resetFields);

    copyButton.addEventListener("click", async () => {
      if (!linkOutput.value) {
        return;
      }

      try {
        await navigator.clipboard.writeText(linkOutput.value);
        copyButton.textContent = messages.copied;
      } catch {
        linkOutput.select();
        document.execCommand("copy");
        copyButton.textContent = messages.copied;
      }
    });
  }

  function registerServiceWorker() {
    const isSupported = "serviceWorker" in navigator;
    const isValidOrigin = location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1";

    if (!isSupported || !isValidOrigin) {
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }

  const api = {
    buildLinks,
    getLocale,
    getMessages,
    initApp,
    normalizePhoneNumber,
    registerServiceWorker,
    validatePhoneNumber,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.WhatsAppLinkGenerator = api;
    document.addEventListener("DOMContentLoaded", () => {
      initApp();
      registerServiceWorker();
    });
  }
})(typeof window !== "undefined" ? window : globalThis);
