const WHATSAPP_NUMBER = "996227773787";
const WEB3FORMS_ACCESS_KEY = "371dd7f4-0e84-4baa-9d3b-ffda8b2f6660";
const FALLBACK_DIAL_CODES = {
  Kyrgyzstan: "+996",
  Kazakhstan: "+7",
  Uzbekistan: "+998",
  Tajikistan: "+992",
  Turkmenistan: "+993",
  Russia: "+7",
  Ukraine: "+380",
  Turkey: "+90",
  China: "+86",
  India: "+91",
  Pakistan: "+92",
  Bangladesh: "+880",
  "United States": "+1",
  Canada: "+1",
  "United Kingdom": "+44",
  Germany: "+49",
  France: "+33",
  Italy: "+39",
  Spain: "+34",
  "United Arab Emirates": "+971",
  "Saudi Arabia": "+966",
  Qatar: "+974",
  Kuwait: "+965",
  Bahrain: "+973",
  Oman: "+968",
};
const COMMON_DIAL_CODES = [...new Set(Object.values(FALLBACK_DIAL_CODES))].sort((a, b) =>
  a.localeCompare(b, undefined, { numeric: true })
);
const JOB_CATEGORY_PREFILL = {
  "Nannies / Housekeepers": "Domestic Helper",
  HoReCa: "HoReCa",
  "Construction Workers": "Construction",
  "Garment Industry": "Garment industry",
};

const openButtons = document.querySelectorAll("[data-modal-open]");
const closeButtons = document.querySelectorAll("[data-modal-close]");
const modals = document.querySelectorAll(".modal");

openButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const id = button.dataset.modalOpen;
    const modal = document.getElementById(id);
    if (modal) {
      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");
    }
  });
});

closeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const modal = button.closest(".modal");
    if (modal) {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
    }
  });
});

modals.forEach((modal) => {
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
    }
  });
});

const buildMessage = (title, data) => {
  const lines = [title];
  Object.entries(data).forEach(([label, value]) => {
    if (value) {
      lines.push(`${label}: ${value}`);
    }
  });
  return lines.join("\n");
};

const openWhatsApp = (message) => {
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener");
};

const normalizeDialCode = (idd) => {
  if (!idd || !idd.root) return "";
  const suffix = Array.isArray(idd.suffixes) && idd.suffixes.length ? idd.suffixes[0] : "";
  return `${idd.root}${suffix}`;
};

const resolveCountryDialCode = async (country) => {
  const response = await fetch(
    `https://restcountries.com/v3.1/name/${encodeURIComponent(country)}?fullText=true&fields=name,idd`
  );
  if (!response.ok) return "";
  const countries = await response.json();
  if (!Array.isArray(countries) || !countries.length) return "";
  const exact = countries.find((item) => item?.name?.common === country) || countries[0];
  return normalizeDialCode(exact.idd);
};

const jobForm = document.getElementById("job-application");
if (jobForm) {
  const locationField = jobForm.querySelector('select[name="location"]');
  const phoneField = jobForm.querySelector('input[name="phone"]');
  const phoneCodeField = jobForm.querySelector('select[name="phone_code"]');
  const phoneLocalField = jobForm.querySelector('input[name="phone_local"]');
  let requestToken = 0;

  const ensurePhoneCodeOptions = () => {
    if (!phoneCodeField || phoneCodeField.options.length > 1) return;
    COMMON_DIAL_CODES.forEach((dialCode) => {
      const option = document.createElement("option");
      option.value = dialCode;
      option.textContent = dialCode;
      phoneCodeField.append(option);
    });
  };

  const setPhoneCode = (dialCode) => {
    if (!phoneCodeField) return;
    ensurePhoneCodeOptions();
    if (!dialCode) {
      phoneCodeField.value = "";
      return;
    }
    const existing = [...phoneCodeField.options].some((option) => option.value === dialCode);
    if (!existing) {
      const option = document.createElement("option");
      option.value = dialCode;
      option.textContent = dialCode;
      phoneCodeField.append(option);
    }
    phoneCodeField.value = dialCode;
  };

  const updatePhoneCodeByLocation = async () => {
    if (!locationField) return;
    const country = locationField.value;
    if (!country || country === "Other") {
      setPhoneCode("");
      return;
    }

    const currentRequest = ++requestToken;
    const fallbackCode = FALLBACK_DIAL_CODES[country] || "";
    if (fallbackCode) {
      setPhoneCode(fallbackCode);
    }

    try {
      const resolvedCode = await resolveCountryDialCode(country);
      if (currentRequest !== requestToken || !resolvedCode) return;
      setPhoneCode(resolvedCode);
    } catch (error) {
      if (currentRequest !== requestToken) return;
      if (fallbackCode) setPhoneCode(fallbackCode);
    }
  };

  ensurePhoneCodeOptions();

  if (locationField && phoneCodeField) {
    locationField.addEventListener("change", updatePhoneCodeByLocation);
  }

  jobForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (phoneField && phoneCodeField && phoneLocalField) {
      const fullPhone = [phoneCodeField.value.trim(), phoneLocalField.value.trim()]
        .filter(Boolean)
        .join(" ");
      phoneField.value = fullPhone;
    }
    const formData = new FormData(jobForm);

    const submitButton = jobForm.querySelector('button[type="submit"]');
    const originalText = submitButton ? submitButton.textContent : "";
    if (submitButton) {
      submitButton.textContent = "Sending...";
      submitButton.disabled = true;
    }

    try {
      formData.append("access_key", WEB3FORMS_ACCESS_KEY);
      formData.append("subject", "New Job Application");
      formData.append("from_name", "Global Staff Agency Website");
      formData.append("replyto", formData.get("email"));

      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Email provider rejected the request.");
      }

      alert("Your application was sent successfully.");
      jobForm.reset();
      if (phoneField) {
        phoneField.value = "";
      }
      if (phoneCodeField) {
        phoneCodeField.value = "";
      }
    } catch (error) {
      alert("Error: " + (error instanceof Error ? error.message : "Something went wrong. Please try again."));
    } finally {
      if (submitButton) {
        submitButton.textContent = originalText;
        submitButton.disabled = false;
      }
    }
  });
}

const visaForm = document.getElementById("visa-support");
if (visaForm) {
  visaForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(visaForm);
    const message = buildMessage("Visa Support Request", {
      Name: formData.get("name"),
      Citizenship: formData.get("citizenship"),
      Location: formData.get("location"),
      Employer: formData.get("employer"),
      Description: formData.get("description"),
      "Visa Type": formData.get("visa_type"),
      Details: formData.get("details"),
    });
    openWhatsApp(message);
  });
}

const applyButtons = document.querySelectorAll(".job-actions .primary");
applyButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const job = button.dataset.job || "";
    const jobCategoryField = document.querySelector('#job-application select[name="category"]');
    const fullNameField = document.querySelector('#job-application input[name="full_name"]');

    if (jobCategoryField) {
      const mappedCategory = JOB_CATEGORY_PREFILL[job] || "";
      if (mappedCategory) {
        jobCategoryField.value = mappedCategory;
      }
    }

    const formSection = document.getElementById("top");
    if (formSection) {
      formSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    window.setTimeout(() => {
      if (fullNameField) {
        fullNameField.focus();
      }
    }, 350);
  });
});
