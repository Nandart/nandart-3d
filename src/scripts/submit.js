document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("submit-form");
  const statusEl = document.getElementById("status");
  const tokenParam = new URLSearchParams(window.location.search).get("token");

  if (tokenParam === "nandartpower") {
    const adminButton = document.getElementById("admin-button");
    if (adminButton) adminButton.style.display = "inline-block";
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    statusEl.textContent = "Submitting...";
    statusEl.style.color = "white";

    const formData = new FormData(form);
    const imageFile = formData.get("image");

    const requiredFields = [
      "title", "artist", "year", "description", "location", "style",
      "technique", "dimensions", "materials"
    ];

    for (const field of requiredFields) {
      if (!formData.get(field) || formData.get(field).trim() === "") {
        statusEl.textContent = `Please fill in the "${field}" field.`;
        statusEl.style.color = "orange";
        return;
      }
    }

    if (!imageFile || imageFile.size === 0) {
      statusEl.textContent = "Please upload an image.";
      statusEl.style.color = "orange";
      return;
    }

    try {
      const cloudinaryData = new FormData();
      cloudinaryData.append("file", imageFile);
      cloudinaryData.append("upload_preset", "nandart_public");

      const cloudinaryRes = await fetch("https://api.cloudinary.com/v1_1/dld2sejas/image/upload", {
        method: "POST",
        body: cloudinaryData
      });

      const cloudinaryJson = await cloudinaryRes.json();

      if (!cloudinaryJson.secure_url) {
        throw new Error("Image upload failed.");
      }

      const submissionPayload = {
        title: formData.get("title"),
        artist: formData.get("artist"),
        year: formData.get("year"),
        description: formData.get("description"),
        location: formData.get("location"),
        style: formData.get("style"),
        technique: formData.get("technique"),
        dimensions: formData.get("dimensions"),
        materials: formData.get("materials"),
        imageUrl: cloudinaryJson.secure_url
      };

      const apiRes = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionPayload)
      });

      if (!apiRes.ok) {
        throw new Error("Failed to submit artwork.");
      }

      statusEl.textContent = "Artwork submitted successfully!";
      statusEl.style.color = "lightgreen";
      form.reset();

      if (tokenParam === "nandartpower") {
        const adminButton = document.getElementById("admin-button");
        if (adminButton) adminButton.style.display = "inline-block";
      }

    } catch (err) {
      console.error(err);
      statusEl.textContent = "An error occurred during submission.";
      statusEl.style.color = "red";
    }
  });
});
