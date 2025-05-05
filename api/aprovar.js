import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const {
    issueNumber,
    titulo,
    artista,
    descricao,
    imagem,
    ano,
    estilo,
    tecnica,
    dimensoes,
    materiais,
    local
  } = req.body;

  if (
    !issueNumber || !titulo || !artista || !descricao || !imagem ||
    !ano || !estilo || !tecnica || !dimensoes || !materiais || !local
  ) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const token = process.env.GITHUB_TOKEN;
  const repo = "nandart-3d";
  const owner = "Nandart";
  const octokit = new Octokit({ auth: token });

  try {
    const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "");
    const branchName = `obra-${titulo.replace(/\s+/g, "_").toLowerCase()}-${timestamp}`;

    // Obter o SHA da branch principal
    const mainRef = await octokit.git.getRef({
      owner,
      repo,
      ref: "heads/main"
    });

    const mainSha = mainRef.data.object.sha;

    // Criar nova branch
    await octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha: mainSha
    });

    // Criar ficheiro JSON da obra
    const obraData = {
      titulo,
      artista,
      descricao,
      imagem,
      ano,
      estilo,
      tecnica,
      dimensoes,
      materiais,
      local
    };

    const content = Buffer.from(JSON.stringify(obraData, null, 2)).toString("base64");

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: `obras-aprovadas/${titulo.replace(/\s+/g, "_")}.json`,
      message: `Adicionar obra: ${titulo}`,
      content,
      branch: branchName
    });

    // Criar Pull Request
    const pr = await octokit.pulls.create({
      owner,
      repo,
      title: `Aprovar obra: ${titulo}`,
      head: branchName,
      base: "main",
      body: `Esta Pull Request aprova a obra "${titulo}" submetida por ${artista}.`
    });

    res.status(200).json({ message: "Pull Request created", url: pr.data.html_url });
  } catch (error) {
    console.error("Erro ao aprovar obra:", error);
    res.status(500).json({ message: "Erro interno", error: error.message });
  }
}

