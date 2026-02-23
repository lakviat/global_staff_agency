const WHATSAPP_NUMBER = "996227773787";

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

const jobForm = document.getElementById("job-application");
if (jobForm) {
  jobForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(jobForm);
    const message = buildMessage("Job Application", {
      "Full Name": formData.get("full_name"),
      Phone: formData.get("phone"),
      Citizenship: formData.get("citizenship"),
      Location: formData.get("location"),
      Category: formData.get("category"),
      Description: formData.get("description"),
    });
    openWhatsApp(message);
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
