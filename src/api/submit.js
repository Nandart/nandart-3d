export async function handleSubmission(formData, isInternal = false) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

  // Validação básica dos campos obrigatórios
  const requiredFields = ["titulo", "artista", "imagem"];
  for (const field of requiredFields) {
    if (!formData.get(field)) {
      throw new Error(`O campo ${field} é obrigatório.`);
    }
  }

  // Upload para o Cloudinary
  const imageFile = formData.get("imagem");
  const cloudinaryData = new FormData();
  cloudinaryData.append("file", imageFile);
  cloudinaryData.append("upload_preset", uploadPreset);

  let uploadedImage;
  try {
    const cloudinaryResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: cloudinaryData,
    });

    if (!cloudinaryResponse.ok) {
      const errorDetails = await cloudinaryResponse.json();
      throw new Error(`Erro no upload: ${errorDetails.error.message}`);
    }

    uploadedImage = await cloudinaryResponse.json();
  } catch (error) {
    console.error("Erro no Cloudinary:", error);
    throw new Error("Erro ao fazer upload da imagem. Tente novamente.");
  }

  // Envio dos dados para o backend
  const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";
  const submission = {
    titulo: formData.get("titulo"),
    artista: formData.get("artista"),
    estilo: formData.get("estilo"),
    tecnica: formData.get("tecnica"),
    ano: formData.get("ano"),
    local: formData.get("local"),
    materiais: formData.get("materiais"),
    dimensoes: formData.get("dimensoes"),
    descricao: formData.get("descricao"),
    imagem: uploadedImage.secure_url,
    tipo: isInternal ? "colecao" : "normal",
  };

  try {
    const response = await fetch(`${backendUrl}/api/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(submission),
    });

    if (!response.ok) {
      const errorDetails = await response.text();
      throw new Error("Erro ao submeter obra: " + errorDetails);
    }

    return await response.json();
  } catch (error) {
    console.error("Erro ao enviar submissão:", error);
    throw new Error("Erro ao submeter os dados. Tente novamente.");
  }
}
