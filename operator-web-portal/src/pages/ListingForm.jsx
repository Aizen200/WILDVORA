import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { hostAPI } from '../api/hostAPI';
import Layout from '../components/Layout';

const CATEGORIES  = ['Camping', 'Trekking', 'Water Sports', 'Jungle', 'Cycling', 'Climbing', 'Safari', 'Skiing'];
const DIFFICULTIES= ['Easy', 'Moderate', 'Hard', 'Expert'];

export default function ListingForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(isEdit);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  const [formData, setFormData] = useState({
    title: '', description: '', category: 'Camping', city: '', country: 'India',
    price: '', duration: '', difficulty: 'Moderate', maxGroupSize: 12,
    images: '', includes: '', exclusions: '',
    cancellationPolicy: 'Flexible: Cancel up to 24 hours in advance for a full refund.',
    availableDates: '', status: 'pending',
  });

  useEffect(() => {
    if (isEdit) {
      hostAPI.getListing(id)
        .then(res => {
          const exp = res.data.experience;
          setFormData({
            title: exp.title || '', description: exp.description || '',
            category: exp.category || 'Camping', city: exp.location?.city || '',
            country: exp.location?.country || 'India', price: exp.price || '',
            duration: exp.duration || '', difficulty: exp.difficulty || 'Moderate',
            maxGroupSize: exp.maxGroupSize || 12,
            images: exp.images?.join(', ') || '', includes: exp.includes?.join(', ') || '',
            exclusions: exp.exclusions?.join(', ') || '',
            cancellationPolicy: exp.cancellationPolicy || '',
            availableDates: exp.availableDates?.join(', ') || '',
            status: exp.status || 'pending',
          });
        })
        .catch(err => setError(err.response?.data?.message || 'Failed to load experience details'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    const payload = {
      title: formData.title, description: formData.description, category: formData.category,
      location: { city: formData.city, country: formData.country },
      price: Number(formData.price), duration: formData.duration,
      difficulty: formData.difficulty, maxGroupSize: Number(formData.maxGroupSize),
      images: formData.images.split(',').map(s => s.trim()).filter(Boolean),
      includes: formData.includes.split(',').map(s => s.trim()).filter(Boolean),
      exclusions: formData.exclusions.split(',').map(s => s.trim()).filter(Boolean),
      cancellationPolicy: formData.cancellationPolicy,
      availableDates: formData.availableDates.split(',').map(s => s.trim()).filter(Boolean),
      status: formData.status,
    };
    try {
      if (isEdit) { await hostAPI.editListing(id, payload); }
      else        { await hostAPI.createListing(payload); }
      navigate('/listings');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save experience listing');
      setSaving(false);
    }
  };

  const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 outline-none focus:ring-1 focus:ring-[#1A5F45] focus:border-[#1A5F45] transition placeholder-gray-400";

  return (
    <Layout>
      <div className="max-w-3xl mx-auto pb-12">

        {/* Breadcrumb */}
        <nav className="text-xs text-gray-400 mb-3 flex items-center gap-1">
          <span className="cursor-pointer hover:text-gray-600" onClick={() => navigate('/listings')}>Listings</span>
          <span>›</span>
          <span className="text-[#1A5F45] font-medium">{isEdit ? 'Edit Listing' : 'Create New Listing'}</span>
        </nav>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Experience Listing' : 'Create New Experience'}</h1>
          <p className="text-xs text-gray-400 mt-1">Provide detailed information to explorers about your outdoor adventure.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>
        )}

        {loading ? (
          <div className="p-8 text-center text-gray-500 font-semibold">Loading listing details...</div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 space-y-6">

            {/* Basic Info */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-[#1A5F45] uppercase tracking-wider border-b pb-2 border-gray-100">Basic Information</h2>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Title</label>
                <input type="text" name="title" required value={formData.title} onChange={handleChange}
                  placeholder="e.g. Alpine Glacier Trek & Lake Camping" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Description</label>
                <textarea name="description" required rows={4} value={formData.description} onChange={handleChange}
                  placeholder="Tell adventurers what makes this experience special..."
                  className={`${inputCls} resize-none`} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Category</label>
                  <select name="category" value={formData.category} onChange={handleChange} className={inputCls}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Difficulty Level</label>
                  <select name="difficulty" value={formData.difficulty} onChange={handleChange} className={inputCls}>
                    {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-[#1A5F45] uppercase tracking-wider border-b pb-2 border-gray-100">Location &amp; Group Limits</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">City / Region</label>
                  <input type="text" name="city" required value={formData.city} onChange={handleChange}
                    placeholder="e.g. Manali" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Country</label>
                  <input type="text" name="country" required value={formData.country} onChange={handleChange} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Price (₹)</label>
                  <input type="number" name="price" required value={formData.price} onChange={handleChange}
                    placeholder="250" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Duration</label>
                  <input type="text" name="duration" required value={formData.duration} onChange={handleChange}
                    placeholder="3 days / 2 nights" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Max Group Size</label>
                  <input type="number" name="maxGroupSize" required value={formData.maxGroupSize} onChange={handleChange} className={inputCls} />
                </div>
              </div>
            </div>

            {/* Logistics */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-[#1A5F45] uppercase tracking-wider border-b pb-2 border-gray-100">Logistics &amp; Dates</h2>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Images (Comma-separated URLs)</label>
                <input type="text" name="images" value={formData.images} onChange={handleChange}
                  placeholder="https://example.com/img1.jpg, https://example.com/img2.jpg" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Inclusions (comma-separated)</label>
                  <textarea name="includes" rows={2} value={formData.includes} onChange={handleChange}
                    placeholder="Camping gear, Professional Guide, Food"
                    className={`${inputCls} resize-none`} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Exclusions (comma-separated)</label>
                  <textarea name="exclusions" rows={2} value={formData.exclusions} onChange={handleChange}
                    placeholder="Travel insurance, Personal expenses"
                    className={`${inputCls} resize-none`} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Cancellation Policy</label>
                <input type="text" name="cancellationPolicy" value={formData.cancellationPolicy} onChange={handleChange} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Available Dates (YYYY-MM-DD, comma-separated)</label>
                <input type="text" name="availableDates" value={formData.availableDates} onChange={handleChange}
                  placeholder="2026-06-05, 2026-06-10, 2026-06-15" className={inputCls} />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button type="button" onClick={() => navigate('/listings')}
                className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-xl transition">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="px-6 py-2.5 text-sm font-bold text-white bg-[#1A5F45] hover:bg-[#145038] rounded-xl shadow-sm transition disabled:opacity-60">
                {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Experience'}
              </button>
            </div>
          </form>
        )}
      </div>
    </Layout>
  );
}