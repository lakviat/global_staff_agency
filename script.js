const WHATSAPP_NUMBER = "996227773787";
const JOB_APPLICATION_EMAIL = "globalstaffagencykg@gmail.com";
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

const readJsonSafe = async (response) => {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
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
  const citizenshipField = jobForm.querySelector('select[name="citizenship"]');
  const phoneField = jobForm.querySelector('input[name="phone"]');
  let requestToken = 0;

  const setPhonePrefix = (dialCode) => {
    if (!phoneField) return;
    const currentValue = phoneField.value.trim();
    const previousAutoPrefix = phoneField.dataset.autoPrefix || "";

    if (!dialCode) {
      if (!currentValue || currentValue === previousAutoPrefix) {
        phoneField.value = "";
      }
      phoneField.dataset.autoPrefix = "";
      return;
    }

    if (!currentValue) {
      phoneField.value = `${dialCode} `;
      phoneField.dataset.autoPrefix = dialCode;
      return;
    }

    if (previousAutoPrefix && currentValue.startsWith(previousAutoPrefix)) {
      phoneField.value = `${dialCode}${currentValue.slice(previousAutoPrefix.length)}`;
      phoneField.dataset.autoPrefix = dialCode;
    }
  };

  const updatePhonePrefixByCitizenship = async () => {
    if (!citizenshipField) return;
    const country = citizenshipField.value;
    if (!country || country === "Other") {
      setPhonePrefix("");
      return;
    }

    const currentRequest = ++requestToken;
    const fallbackCode = FALLBACK_DIAL_CODES[country] || "";
    if (fallbackCode) {
      setPhonePrefix(fallbackCode);
    }

    try {
      const resolvedCode = await resolveCountryDialCode(country);
      if (currentRequest !== requestToken || !resolvedCode) return;
      setPhonePrefix(resolvedCode);
    } catch (error) {
      if (currentRequest !== requestToken) return;
      if (fallbackCode) setPhonePrefix(fallbackCode);
    }
  };

  if (citizenshipField && phoneField) {
    citizenshipField.addEventListener("change", updatePhonePrefixByCitizenship);
  }

  jobForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(jobForm);

    const submitButton = jobForm.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
    }

    try {
      formData.append("_subject", "New Job Application");
      formData.append("_captcha", "false");
      formData.append("_template", "table");

      const response = await fetch(`https://formsubmit.co/ajax/${JOB_APPLICATION_EMAIL}`, {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        body: formData,
      });
      const payload = await readJsonSafe(response);
      const deliveryConfirmed =
        payload && (payload.success === true || payload.success === "true");

      if (!response.ok || !deliveryConfirmed) {
        const providerMessage =
          (payload && (payload.message || payload.error)) ||
          "Email provider rejected the request.";
        throw new Error(providerMessage);
      }

      alert("Your application was sent successfully.");
      jobForm.reset();
      if (phoneField) {
        phoneField.dataset.autoPrefix = "";
      }
    } catch (error) {
      alert("We could not submit your application right now. Please try again in a few minutes.");
    } finally {
      if (submitButton) {
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

const jobButtons = document.querySelectorAll(".job-actions button");
jobButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const job = button.dataset.job || "Job Opportunity";
    const message = buildMessage("Job Interest", { Job: job });
    openWhatsApp(message);
  });
});
