// 📁 File: routes/profile.js
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

const supabase = createClient(
  'https://gyxakkxotjkdsjvbufiv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5eGFra3hvdGprZHNqdmJ1Zml2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxMjc1MTMsImV4cCI6MjA2NzcwMzUxM30.RT0VJKgdYSUJXzA34diTOpCvenMT6qjMfHaLmCAvEpk'
);

const upload = multer({ dest: 'temp_uploads/' });

router.post('/upload-avatar', upload.single('avatar'), async (req, res) => {
  const file = req.file;
  const { uid } = req.body;

  if (!file || !uid) {
    return res.status(400).json({ error: 'Missing avatar file or uid' });
  }

  const fileExt = path.extname(file.originalname);
  const fileName = `${uid}${fileExt}`;
  const filePath = `avatars/${fileName}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, fs.createReadStream(file.path), {
      upsert: true,
      contentType: file.mimetype,
    });

  fs.unlinkSync(file.path); // clean up temp file

  if (uploadError) {
    return res.status(500).json({ error: 'Failed to upload to Supabase' });
  }

  // Get public URL
  const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
  const avatarUrl = data.publicUrl;

  // Save to database
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar: avatarUrl })
    .eq('id', uid);

  if (updateError) {
    return res.status(500).json({ error: 'Failed to update avatar in profile' });
  }

  res.json({ message: 'Avatar uploaded successfully', avatarUrl });
});

module.exports = router; 