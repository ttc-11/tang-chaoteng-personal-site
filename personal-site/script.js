const themeToggle = document.querySelector("#themeToggle");
const topbar = document.querySelector(".topbar");
const filterButtons = document.querySelectorAll(".filter-chip");
const cards = document.querySelectorAll(".content-card");
const detailButtons = document.querySelectorAll(".detail-toggle");
const counters = document.querySelectorAll("[data-target]");
const contactModal = document.querySelector("#contactModal");
const contactTrigger = document.querySelector("#contactTrigger");
const contactCardTrigger = document.querySelector("#contactCardTrigger");
const contactClose = document.querySelector("#contactClose");
const contactForm = document.querySelector("#contactForm");
const contactToast = document.querySelector("#contactToast");
const contactField = document.querySelector("#contactValue");
const contactLabel = document.querySelector("#contactLabel");
const contactTypeInputs = document.querySelectorAll('input[name="contactType"]');
const contactSubmitButton = document.querySelector(".contact-submit");
const contactCtaButtons = document.querySelectorAll('[data-contact-open="true"]');
const revealBlocks = document.querySelectorAll(".reveal-block");
const magneticButtons = document.querySelectorAll(".magnetic-button");
const loadingVeil = document.querySelector("#loadingVeil");
const spotlightButtons = document.querySelectorAll(".spotlight-button");
const spotlightPanels = document.querySelectorAll(".spotlight-panel");
let toastTimer;
let lastScrollY = 0;

themeToggle?.addEventListener("click", () => {
  const current = document.body.dataset.theme;
  document.body.dataset.theme = current === "night" ? "" : "night";
});

window.addEventListener("load", () => {
  loadingVeil?.classList.add("is-hidden");
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;

    filterButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");

    cards.forEach((card) => {
      const matches = filter === "all" || card.dataset.type === filter;
      card.classList.toggle("is-hidden", !matches);
    });
  });
});

detailButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const card = button.closest(".content-card");
    const expanded = card.classList.toggle("expanded");
    button.textContent = expanded ? "收起" : "展开更多";
  });
});

const contactPlaceholders = {
  微信: { label: "微信号", placeholder: "请输入你的微信号" },
  电话: { label: "手机号", placeholder: "请输入你的手机号" },
  QQ: { label: "QQ 号码", placeholder: "请输入你的 QQ 号码" }
};

const updateContactField = (type) => {
  const config = contactPlaceholders[type];
  if (!config || !contactField || !contactLabel) return;
  contactLabel.textContent = config.label;
  contactField.placeholder = config.placeholder;
};

const openContactModal = () => {
  if (!contactModal) return;
  contactModal.classList.add("is-open");
  contactModal.setAttribute("aria-hidden", "false");
  const checked = document.querySelector('input[name="contactType"]:checked');
  updateContactField(checked?.value || "微信");
  requestAnimationFrame(() => contactField?.focus());
};

const closeContactModal = () => {
  if (!contactModal) return;
  contactModal.classList.remove("is-open");
  contactModal.setAttribute("aria-hidden", "true");
};

const showContactToast = (title, message) => {
  if (!contactToast) return;
  const titleNode = contactToast.querySelector("strong");
  const messageNode = contactToast.querySelector("span");
  if (titleNode) titleNode.textContent = title;
  if (messageNode) messageNode.textContent = message;
  clearTimeout(toastTimer);
  contactToast.classList.add("is-visible");
  toastTimer = setTimeout(() => {
    contactToast.classList.remove("is-visible");
  }, 2800);
};

const sendToFeishu = async (contactType, contactValue) => {
  if (window.location.protocol === "file:") {
    throw new Error("LOCAL_FILE_MODE");
  }

  const response = await fetch("/api/contact", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contactType,
      contactValue,
      submittedAt: new Date().toISOString()
    })
  });

  if (!response.ok) {
    throw new Error(`Webhook request failed: ${response.status}`);
  }

  try {
    const result = await response.json();
    if (result && typeof result === "object" && "ok" in result && !result.ok) {
      throw new Error(result.message || "Proxy request failed");
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      return;
    }
    throw error;
  }
};

contactTrigger?.addEventListener("click", openContactModal);
contactCardTrigger?.addEventListener("click", openContactModal);
contactCtaButtons.forEach((button) => button.addEventListener("click", openContactModal));
contactClose?.addEventListener("click", closeContactModal);

contactModal?.addEventListener("click", (event) => {
  const target = event.target;
  if (target instanceof HTMLElement && target.dataset.closeModal === "true") {
    closeContactModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeContactModal();
  }
});

contactTypeInputs.forEach((input) => {
  input.addEventListener("change", () => {
    updateContactField(input.value);
  });
});

contactForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const contactValue = contactField?.value.trim();
  const checked = document.querySelector('input[name="contactType"]:checked');
  const contactType = checked instanceof HTMLInputElement ? checked.value : "微信";
  if (!contactValue) return;

  if (contactSubmitButton) {
    contactSubmitButton.disabled = true;
    contactSubmitButton.textContent = "发送中...";
  }

  try {
    await sendToFeishu(contactType, contactValue);
    contactForm.reset();
    const defaultType = document.querySelector('input[name="contactType"][value="微信"]');
    if (defaultType instanceof HTMLInputElement) {
      defaultType.checked = true;
    }
    updateContactField("微信");
    closeContactModal();
    showContactToast("已成功发送通知", "等待帅哥同意");
  } catch (error) {
    console.error(error);
    let message = "请确认 serve.py 正在运行，再重新提交";
    if (error instanceof Error && error.message === "LOCAL_FILE_MODE") {
      message = "请先运行本地服务后再打开页面";
    } else if (error instanceof Error && error.message) {
      message = `发送异常：${error.message}`;
    }
    showContactToast("发送失败", message);
  } finally {
    if (contactSubmitButton) {
      contactSubmitButton.disabled = false;
      contactSubmitButton.textContent = "发送联系方式";
    }
  }
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.18 }
);

revealBlocks.forEach((block) => revealObserver.observe(block));

const updateScrollUI = () => {
  const scrollTop = window.scrollY;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0;
  document.documentElement.style.setProperty("--progress", `${progress}%`);

  if (topbar) {
    const shouldHide = scrollTop > lastScrollY && scrollTop > 120;
    topbar.classList.toggle("is-hidden", shouldHide);
  }

  lastScrollY = scrollTop;
};

window.addEventListener("scroll", updateScrollUI, { passive: true });
updateScrollUI();

magneticButtons.forEach((button) => {
  button.addEventListener("pointermove", (event) => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const rect = button.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    button.style.transform = `translate(${x * 0.08}px, ${y * 0.08}px)`;
  });

  button.addEventListener("pointerleave", () => {
    button.style.transform = "";
  });
});

spotlightButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const target = button.dataset.case;
    spotlightButtons.forEach((item) => item.classList.remove("active"));
    spotlightPanels.forEach((panel) => panel.classList.remove("active"));
    button.classList.add("active");
    document.querySelector(`[data-case-panel="${target}"]`)?.classList.add("active");
  });
});

cards.forEach((card) => {
  card.addEventListener("pointermove", (event) => {
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    card.style.setProperty("--spot-x", `${x}px`);
    card.style.setProperty("--spot-y", `${y}px`);
  });
});

const animateCounter = (entry) => {
  if (!entry.isIntersecting) return;

  const counter = entry.target;
  const target = Number(counter.dataset.target);
  let current = 0;

  const tick = () => {
    current += 1;
    counter.textContent = String(current);
    if (current < target) {
      requestAnimationFrame(tick);
    }
  };

  tick();
  observer.unobserve(counter);
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(animateCounter);
});

counters.forEach((counter) => observer.observe(counter));
