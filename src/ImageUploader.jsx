import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ImageUploader.css';

const ImageUploader = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const [accessToken, setAccessToken] = useState(null);
  const [userProfile, setUserProfile] = useState(null); 

  const handleLogin = async () => {
    try {
      const response = await axios.post(
        'http://localhost:8000/auth/login',
        {
          email: "paebi",
          password: "Azerty78",
        }
      );
      const token = response.data.accessToken;
      setAccessToken(token);
      console.log('login successful', token);

      const profileResponse = await axios.get('http://localhost:8000/users/profile/paebi', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUserProfile(profileResponse.data);
    } catch (error) {
      console.log('login failed', error);
    }
  };

    const handleButtonClick = async () => {
    if (!selectedImage) {
      setUploadError('Please select an image first.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(
        'http://localhost:8000/uploads/url',
        { quantity: 1, type: 'dp' },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      const signedUrl = response.data.urls[0]

      const file = selectedImage;
      const formData = new FormData();
      formData.append('file', file);

      try {
        console.log('image url', signedUrl)
        const uploadResponse = await axios.put(signedUrl, file, {
          headers: {
            'Content-Type': file.type,
          },
        });
  
        if (uploadResponse.status === 200) {
          console.log('Image uploaded successfully!');
          setSelectedImage(signedUrl.split('?')[0]);
        } else {
          throw new Error('Upload failed with status code: ' + uploadResponse.status);
        }
      } catch (error) {
        console.error('Error uploading to s3', error);
      }

      
    } catch (error) {
      console.error('Error fetching URL', error);
      setUploadError('Failed to upload image. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (event) => {
    if (event.target && event.target.files) {
      const files = event.target.files;
      if (files && files[0]) {
        setSelectedImage(files[0]);
      }
    }
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (accessToken) {
        try {
          const response = await axios.get('http://localhost:8000/users/profile/paebi', {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });
          console.log('profile', response.data.user)
          setUserProfile(response.data.user);
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
    };
    fetchUserProfile();
  }, [accessToken]);

  return (
    <div className="app-container">
      <TopBar userProfile={userProfile} onLogin={handleLogin} /> {/* Top Bar component */}
      <div className="image-uploader-container">
      <div className="image-uploader-card">
        {selectedImage && (
          <img src={selectedImage} alt="Selected Image" /> 
        )}
        {uploadError && <p className="error">{uploadError}</p>}
      </div>
      <div className="image-uploader-button-card">
        <input type="file" onChange={handleImageChange} />
        <button onClick={handleButtonClick} >
          {isLoading ? 'Processing...' : 'Upload Image'}
        </button>
      </div>
      </div>
    </div>
  );
};

const TopBar = ({ userProfile, onLogin }) => {
  return (
    <header className="top-bar">
      <div className="top-bar-content">
        {userProfile ? (
          <>
            <img src={userProfile.avatar} alt="User Avatar" className="avatar" />
            <span className="user-info">
              {userProfile.firstName} {userProfile.lastName} (@{userProfile.username})
            </span>
          </>
        ) : (
          <button onClick={onLogin} className="login-button">Login</button> 
        )}
      </div>
    </header>
  );
};

export default ImageUploader;
