export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    titulo,
    artista,
    estilo,
    tecnica,
    ano,
    dimensoes,
    materiais,
    local,
    descricao,
    imagemBase64
  } = req.body;

  if (
    !titulo || !artista || !estilo || !tecnica || !ano ||
    !dimensoes || !materiais || !local || !descricao || !imagemBase64
  ) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Upload da imagem para o Cloudinary
  const uploadResponse = await fetch("https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      file: imagemBase64,
      upload_preset: "YOUR_UPLOAD_PRESET"
    })
  });

  const uploadData = await uploadResponse.json();

  if (!uploadData.secure_url) {
    return res.status(500).json({ error: "Failed to upload image" });
  }

  const imageURL = uploadData.secure_url;

  // Criação da issue no GitHub
  const githubToken = process.env.GITHUB_TOKEN;
  const repo = "Nandart/nandart-3d";

  const issueTitle = `Obra submetida: ${titulo}`;
  const issueBody = `
**Artista:** ${artista}  
**Estilo:** ${estilo}  
**Técnica:** ${tecnica}  
**Ano:** ${ano}  
**Dimensões:** ${dimensoes}  
**Materiais:** ${materiais}  
**Local de criação:** ${local}  
**Descrição:**  
${descricao}  

**Imagem:**  
${imageURL}
  `;

  const githubResponse = await fetch(`https://api.github.com/repos/${repo}/issues`, {
    method: "POST",
    headers: {
      Authorization: `token ${githubToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      title: issueTitle,
      body: issueBody
    })
  });

  if (!githubResponse.ok) {
    const errorText = await githubResponse.text();
    return res.status(500).json({ error: "Failed to create issue", details: errorText });
  }

  return res.status(200).json({ message: "Submission successful" });
