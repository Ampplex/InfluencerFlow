import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import supabase from '../utils/supabase';

function CreateBrandProf() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = location.state || {};

  const [brandName, setBrandName] = useState('');
  const [brandDescription, setBrandDescription] = useState('');
  const [brandLocation, setBrandLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  console.log('CreateBrandProf location state:', location.state);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.from('brands').insert([
      {
        brand_id: id,
        brand_name: brandName,
        brand_description: brandDescription,
        location: brandLocation,
        created_at: new Date().toISOString(),
      }
    ]);
    // set brand name and description to local storage
    localStorage.setItem('brand_name', brandName);
    localStorage.setItem('brand_description', brandDescription);
    localStorage.setItem('brand_location', brandLocation);
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      // Navigate to dashboard or wherever you want
      navigate('/');
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-12 p-8 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Create Brand Profile</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium mb-1">Brand Name</label>
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={brandName}
            onChange={e => setBrandName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Brand Description</label>
          <textarea
            className="w-full border rounded px-3 py-2"
            value={brandDescription}
            onChange={e => setBrandDescription(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Location</label>
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={brandLocation}
            onChange={e => setBrandLocation(e.target.value)}
            required
          />
        </div>
        {error && <div className="text-red-600">{error}</div>}
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 rounded font-semibold"
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Profile'}
        </button>
      </form>
    </div>
  );
}

export default CreateBrandProf;