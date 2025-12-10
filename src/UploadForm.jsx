import { useState } from 'react';

// Replace with your RENDER URL
const API_URL = "https://my-music-api.onrender.com/upload"; 

function UploadForm({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !title || !artist) return alert("Please fill all fields");

    setUploading(true);
    const formData = new FormData();
    formData.append('audioFile', file); // Must match backend 'upload.single'
    formData.append('title', title);
    formData.append('artist', artist);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        alert("Upload Successful!");
        setTitle('');
        setArtist('');
        setFile(null);
        if (onUploadSuccess) onUploadSuccess(); // Refresh the list
      } else {
        alert("Upload Failed");
      }
    } catch (error) {
      console.error(error);
      alert("Error uploading file");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ background: '#222', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
      <h3>Upload New Song</h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input 
          type="text" 
          placeholder="Song Title" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          required
          style={{ padding: '8px' }}
        />
        <input 
          type="text" 
          placeholder="Artist Name" 
          value={artist} 
          onChange={(e) => setArtist(e.target.value)} 
          required
          style={{ padding: '8px' }}
        />
        <input 
          type="file" 
          accept="audio/*" 
          onChange={(e) => setFile(e.target.files[0])} 
          required
        />
        <button type="submit" disabled={uploading} style={{ padding: '10px', background: '#1db954', border: 'none', color: 'white', cursor: 'pointer' }}>
          {uploading ? 'Uploading...' : 'Upload Song'}
        </button>
      </form>
    </div>
  );
}

export default UploadForm;