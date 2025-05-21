const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { Octokit } = require('@octokit/rest');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// GitHub config
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});
const owner = 'Nandart';
const repo = 'nandart-3d';

router.post('/submit-artwork', upload.single('artImage'), async (req, res) => {
  try {
    const {
      artistName,
      artTitle,
      artYear,
      artPrice,
      highlight
    } = req.body;

    const file = req.file;
    const termsAccepted = true;
    const termsAcceptedAt = new Date().toISOString();

    if (!artistName || !artTitle || !artYear || !artPrice || !file || !highlight) {
      return res.status(400).send('Missing required fields.');
    }

    // Preparar Issue GitHub
    const issueTitle = `New Submission: ${artTitle} by ${artistName}`;
    const issueBody = `
**Artist Name:** ${artistName}
**Title:** ${artTitle}
**Year:** ${artYear}
**Price (ETH):** ${artPrice}
**Display Preference:** ${highlight}
**Terms Accepted:** ${termsAccepted}
**Terms Accepted At:** ${termsAcceptedAt}
**Submitted At:** ${new Date().toISOString()}
`;

    await octokit.rest.issues.create({
      owner,
      repo,
      title: issueTitle,
      body: issueBody,
      labels: ['submission', highlight === 'premium' ? 'premium' : 'standard'],
    });

    // Guardar JSON local
    const submissionData = {
      artistName,
      artTitle,
      artYear,
      artPrice,
      highlight,
      termsAccepted,
      termsAcceptedAt,
      submittedAt: new Date().toISOString()
    };

    const sanitize = (str) => str.trim().replace(/[^\w\-]/g, '_');
    const fileName = `${termsAcceptedAt.replace(/[-:]/g, '').replace('T', '_').slice(0, 15)}_${sanitize(artTitle)}_${sanitize(artistName)}.json`;
    const jsonFolder = path.join(__dirname, '../submissoes-json');

    if (!fs.existsSync(jsonFolder)) {
      fs.mkdirSync(jsonFolder);
    }

    const filePath = path.join(jsonFolder, fileName);
    fs.writeFileSync(filePath, JSON.stringify(submissionData, null, 2), 'utf-8');

    // Limpar imagem temporária
    fs.unlinkSync(file.path);

    return res.status(200).send('Submission received successfully.');
  } catch (error) {
    console.error('Error during submission:', error);
    return res.status(500).send('An error occurred while processing the submission.');
  }
});

module.exports = router;
