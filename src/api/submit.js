export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const {
    artist,
    title,
    description,
    year,
    style,
    technique,
    dimensions,
    materials,
    location,
    image
  } = req.body;

  if (!artist || !title || !description || !year || !image || !location) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  const githubToken = process.env.GITHUB_TOKEN;
  const repoOwner = 'teu-username-ou-organizacao';
  const repoName = 'nandart-3d'; // ou o nome correto do teu repositório
  const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/issues`;

  const issueTitle = `🖼️ Submission: ${title} by ${artist}`;
  const issueBody = `
### 🧑‍🎨 Artist
${artist}

### 🖌️ Title
${title}

### 📜 Description
${description}

### 🗓️ Year
${year}

### 🖼️ Style
${style}

### 🧪 Technique
${technique}

### 📐 Dimensions
${dimensions}

### 🧱 Materials
${materials}

### 📍 Place of Creation
${location}

### 🌐 Image
![Artwork](${image})
`;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: 'application/vnd.github+json'
      },
      body: JSON.stringify({
        title: issueTitle,
        body: issueBody,
        labels: ['submission', 'pending review']
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return res.status(500).json({ message: 'GitHub issue creation failed.', error });
    }

    const result = await response.json();
    return res.status(200).json({ message: 'Submission received.', issueUrl: result.html_url });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
}
