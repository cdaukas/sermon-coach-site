(function () {
  function showMessage(el, text, kind) {
    if (!el) return;
    el.textContent = text;
    el.hidden = false;
    el.classList.remove(
      "newsletter-signup-message--error",
      "newsletter-signup-message--success",
    );
    el.classList.add(
      kind === "success"
        ? "newsletter-signup-message--success"
        : "newsletter-signup-message--error",
    );
  }

  function initForm(root) {
    var form = root.querySelector(".newsletter-signup-form");
    if (!form) return;

    var message = root.querySelector(".newsletter-signup-message");
    var source = root.getAttribute("data-newsletter-source") || "unknown";
    var input = form.querySelector('input[type="email"]');
    var btn = form.querySelector('button[type="submit"]');

    if (!input || !btn) return;

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var email = input.value.trim();
      if (!email) {
        showMessage(message, "Please enter your email.", "error");
        return;
      }

      btn.disabled = true;

      fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, source: source }),
      })
        .then(function (response) {
          return response
            .json()
            .then(function (data) {
              return { ok: response.ok, data: data };
            })
            .catch(function () {
              return { ok: false, data: {} };
            });
        })
        .then(function (result) {
          if (result.ok && result.data && result.data.ok) {
            form.hidden = true;
            showMessage(
              message,
              "You're on the list — next post lands Friday.",
              "success",
            );
            return;
          }

          showMessage(
            message,
            "Something went wrong. Try again or email chris@sermoncoach.online.",
            "error",
          );
          btn.disabled = false;
        })
        .catch(function () {
          showMessage(
            message,
            "Something went wrong. Try again or email chris@sermoncoach.online.",
            "error",
          );
          btn.disabled = false;
        });
    });
  }

  document.querySelectorAll(".newsletter-signup").forEach(initForm);
})();
