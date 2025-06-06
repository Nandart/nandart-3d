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
    // Set CORS headers
    res.header('Access-Control-Allow-Origin', 'https://nandartart.art');
    
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

    // GitHub Issue creation
    const issueTitle = `New Submission: ${artTitle} by ${artistName}`;
    const issueBody = `...`; // your existing issue body

    await octokit.rest.issues.create({
      owner,
      repo,
      title: issueTitle,
      body: issueBody,
      labels: ['submission', highlight === 'premium' ? 'premium' : 'standard'],
    });

    // Save JSON locally
    const submissionData = { ... }; // your existing data
    const filePath = path.join(__dirname, '../../submissoes-json', fileName);
    
    // Ensure directory exists
    if (!fs.existsSync(path.dirname(filePath))) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
    }

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

