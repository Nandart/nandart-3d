export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
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
    imagem,
    tipo = "normal"
  } = req.body;

  if (!titulo || !artista || !descricao || !ano || !imagem || !local) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  const githubToken = process.env.GITHUB_TOKEN;
  const repo = "nandart-3d";
  const owner = "Nandart";
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/issues`;

  const title = `🖼️ Submission: ${titulo} by ${artista}`;
  const body = `
### 🧑‍🎨 Artist
${artista}

### 🖌️ Title
${titulo}

### 🎨 Style
${estilo}

### 🧪 Technique
${tecnica}

### 🗓️ Year
${ano}

### 📐 Dimensions
${dimensoes}

### 🧱 Materials
${materiais}

### 🏞️ Place of Creation
${local}

### 📝 Description
${descricao}

### 🌐 Image
![Artwork](${imagem})

### 🏷️ Type
${tipo}
`;

  try {
    const githubResponse = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github+json"
      },
      body: JSON.stringify({
        title,
        body,
        labels: ["submission", "pending review"]
      })
    });

    if (!githubResponse.ok) {
      const errorText = await githubResponse.text();
      return res.status(500).json({ message: "GitHub issue creation failed.", error: errorText });
    }

    const result = await githubResponse.json();
    return res.status(200).json({ message: "Submission received.", issueUrl: result.html_url });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ message: "Internal server error.", error: error.message });
  }
}
