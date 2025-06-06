const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { Octokit } = require('@octokit/rest');

const router = express.Router();
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

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
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validation
    if (!artistName?.trim() || !artTitle?.trim() || !artYear || !artPrice || !highlight) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const termsAccepted = true;
    const termsAcceptedAt = new Date().toISOString();

    // GitHub Issue creation
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

    // Save JSON locally
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
    const jsonFolder = path.join(__dirname, '../../submissoes-json');

    if (!fs.existsSync(jsonFolder)) {
      fs.mkdirSync(jsonFolder, { recursive: true });
    }

    const filePath = path.join(jsonFolder, fileName);
    fs.writeFileSync(filePath, JSON.stringify(submissionData, null, 2), 'utf-8');
    fs.unlinkSync(file.path);

    return res.status(200).json({ message: 'Submission received successfully' });
  } catch (error) {
    console.error('Submission error:', error);
    res.header('Access-Control-Allow-Origin', 'https://nandartart.art');
    return res.status(500).json({ 
      error: 'An error occurred while processing the submission',
      details: error.message 
    });
  }
});

module.exports = router;
