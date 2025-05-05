import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const githubToken = process.env.GITHUB_TOKEN;
  const repo = "nandart-3d";
  const owner = "Nandart";

  const octokit = new Octokit({ auth: githubToken });

  try {
    const { data: issues } = await octokit.issues.listForRepo({
      owner,
      repo,
      state: "open",
      labels: "submission,pending review"
    });

    const obras = issues.map((issue) => {
      const extractField = (label, content) => {
       const { data: issues } = await octokit.paginate(octokit.issues.listForRepo, {
  owner,
  repo,
  state: "open",
  labels: "submission,pending review"
});
        const match = content.match(regex);
        return match ? match[1].trim() : "";
      };

      const body = issue.body || "";

      return {
        issueNumber: issue.number,
        titulo: extractField("🖌️ Title", body),
        artista: extractField("🧑‍🎨 Artist", body),
        estilo: extractField("🎨 Style", body),
        tecnica: extractField("🧪 Technique", body),
        ano: extractField("🗓️ Year", body),
        dimensoes: extractField("📐 Dimensions", body),
        materiais: extractField("🧱 Materials", body),
        local: extractField("🏞️ Place of Creation", body),
        descricao: extractField("📝 Description", body),
        imagem: extractField("🌐 Image", body).replace(/!\[.*?\]\((.*?)\)/, "$1")
      };
    }).filter(obra =>
      obra.titulo && obra.artista && obra.ano && obra.descricao && obra.local && obra.imagem
    );

    res.status(200).json(obras);
  } catch (error) {
    console.error("Erro ao listar submissões:", error);
    res.status(500).json({ message: "Erro ao obter submissões", error: error.message });
  }
}
