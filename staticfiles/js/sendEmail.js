function aredirect(){    
    const emailInput = document.getElementById("email");
    const email = emailInput ? emailInput.value : '';
    const csrfToken = document.querySelector('input[name="csrfmiddlewaretoken"]').value;

    if (!email) {
        alert("Lütfen geçerli bir e-posta girin.");
        return;
    }

    $.ajax({
        url: "/api/send-email/",
        type: "POST",
        headers: {
            "X-CSRFToken": csrfToken
        },
        data: { email : email },
        success: function(response) {
            if (response.message === 'E-posta gönderildi.') {
                const customMessage = "E-posta başarıyla gönderildi!";
                const redirectUrl = response.redirectUrl;

                const alertContainer = document.createElement("div");
                alertContainer.classList.add("custom-alert");
                alertContainer.innerHTML = `<p>${customMessage}</p>`;

                document.body.appendChild(alertContainer);

                setTimeout(() => {
                    alertContainer.remove();
                    window.location.href = "/";
                }, 3000);
            } else {
                showErrorAlert("Bir hata oluştu: " + (response.message || "Bilinmeyen hata"));
            }
        },
        error: function(xhr, status, error) {
            console.error("AJAX hata:", error);
            showErrorAlert("Sunucuya bağlanırken hata oluştu. Lütfen tekrar deneyin.");
        }
    });
}

function showErrorAlert(message) {
    const errorAlert = document.createElement("div");
    errorAlert.classList.add("custom-alert", "error");
    errorAlert.innerHTML = `<p>${message}</p>`;

    document.body.appendChild(errorAlert);

    setTimeout(() => errorAlert.remove(), 5000);
}