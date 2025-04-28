
let fileList = [];

function previewImages(event) {
  const previewDiv = document.getElementById("image-preview");
  const files = event.target.files;

  for (let file of files) {
    fileList.push(file);

    const image = document.createElement("img");
    image.src = URL.createObjectURL(file);
    image.style.maxWidth = "100px";
    image.style.margin = "6px";
    previewDiv.appendChild(image);
  }
}

function add() {
  const title = document.getElementById("title").value;
  const description = document.getElementById("description").value;
  const price = document.getElementById("price").value;
  const csrfToken = document.querySelector('input[name="csrfmiddlewaretoken"]').value;

  const formData = new FormData();
  formData.append("title", title);
  formData.append("description", description);
  formData.append("price", price);
  formData.append("type", type);
  formData.append("permission", true); // varsayılan olarak aktif ürün

  for (let file of fileList) {
    formData.append("images", file);  // BACKEND İLE UYUMLU: 'images'
  }

  $.ajax({
    url: productCreateUrl,
    type: "POST",
    headers: {
      "X-CSRFToken": csrfToken
    },
    data: formData,
    processData: false,
    contentType: false,
    success: function (data) {
      alert("Ürün başarıyla eklendi.");
      window.location.href = homePageUrl;
    },
    error: function (xhr, status, error) {
      console.error("Hata:", error);
      alert("Bir hata oluştu, lütfen tekrar deneyin.");
    }
  });
}
