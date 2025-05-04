// src/scripts/submit.js

export async function handleSubmission(formData, isInternal = false) {
  const cloudName = "dld2sejas";
  const uploadPreset = "nandart_public";

  const imageFile = formData.get("imagem");

  // 1. Upload para o Cloudinary
  const cloudinaryData = new FormData();
  cloudinaryData.append("file", imageFile);
  cloudinaryData.append("upload_preset", uploadPreset);

  const cloudinaryResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: cloudinaryData,
  });

  if (!cloudinaryResponse.ok) {
    throw new Error("Erro ao fazer upload da imagem para o Cloudinary.");
  }

  const uploadedImage = await cloudinaryResponse.json();

  // 2. Envio dos dados para o backend (/api/submit)
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

  const response = await fetch("/api/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(submission),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error("Erro ao submeter obra: " + error);
  }

  return await response.json();
}
🔁 Caminho onde o ficheiro deve estar:
css
Copiar
Editar
nandart-3d/
└── src/
    └── scripts/
        └── submit.js
