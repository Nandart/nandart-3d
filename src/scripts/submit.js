const form = document.getElementById('submissionForm');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(form);
  const imageFile = formData.get('image');

  if (!imageFile || !imageFile.name) {
    alert('Please upload a valid image.');
    return;
  }

  try {
    // Upload da imagem para IPFS via NFT.Storage
    const imageCID = await uploadToIPFS(imageFile);
    const imageURL = `https://ipfs.io/ipfs/${imageCID}`;

    // Construir os dados da obra
    const submission = {
      artist: formData.get('artist'),
      title: formData.get('title'),
      description: formData.get('description'),
      year: formData.get('year'),
      style: formData.get('style'),
      technique: formData.get('technique'),
      dimensions: formData.get('dimensions'),
      materials: formData.get('materials'),
      location: formData.get('location'),
      image: imageURL
    };

    // Criar issue no GitHub
    const response = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission)
    });

    if (response.ok) {
      alert('Artwork submitted successfully!');
      form.reset();
    } else {
      throw new Error('Failed to submit artwork.');
    }
  } catch (err) {
    console.error(err);
    alert('There was an error submitting your artwork.');
  }
});

// Função para carregar para NFT.Storage
async function uploadToIPFS(file) {
  const apiKey = import.meta.env.VITE_NFT_STORAGE_API_KEY;

  const data = new FormData();
  data.append('file', file);

  const response = await fetch('https://api.nft.storage/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`
    },
    body: data
  });

  if (!response.ok) throw new Error('Failed to upload to NFT.Storage');

  const result = await response.json();
  return result.value.cid;
}
