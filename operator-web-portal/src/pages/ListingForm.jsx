import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { hostAPI } from '../api/hostAPI';
import Layout from '../components/Layout';

const CATEGORIES   = ['Camping', 'Trekking', 'Water Sports', 'Jungle', 'Cycling', 'Climbing', 'Safari', 'Skiing'];
const DIFFICULTIES = ['Easy', 'Moderate', 'Hard', 'Expert'];

const STATUS_LABEL = {
  live:               { label: 'Approved',       cls: 'bg-green-50 text-green-700 border-green-200' },
  pending:            { label: 'Pending Review',  cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  draft:              { label: 'Draft',           cls: 'bg-gray-100 text-gray-500 border-gray-200' },
  paused:             { label: 'Paused',          cls: 'bg-slate-100 text-slate-600 border-slate-200' },
  rejected:           { label: 'Rejected',        cls: 'bg-red-50 text-red-600 border-red-200' },
  changes_requested:  { label: 'Changes Needed',  cls: 'bg-orange-50 text-orange-600 border-orange-200' },
};

export default function ListingForm() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const isEdit      = !!id;

  const [loading,         setLoading]         = useState(isEdit);
  const [saving,          setSaving]          = useState(false);
  const [error,           setError]           = useState('');
  const [currentStatus,   setCurrentStatus]   = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const [formData, setFormData] = useState({
    title: '', description: '', category: 'Camping', city: '', country: 'India',
    price: '', duration: '', difficulty: 'Moderate', maxGroupSize: 12,
    images: '', includes: '', exclusions: '',
    cancellationPolicy: 'Flexible: Cancel up to 24 hours in advance for a full refund.',
    availableDates: '',
  });

  useEffect(() => {
    if (isEdit) {
      hostAPI.getListing(id)
        .then(res => {
          const exp = res.data.experience;
          setCurrentStatus(exp.status || '');
          setRejectionReason(exp.rejectionReason || '');
          setFormData({
            title:              exp.title              || '',
            description:        exp.description        || '',
            category:           exp.category           || 'Camping',
            city:               exp.location?.city     || '',
            country:            exp.location?.country  || 'India',
            price:              exp.price              || '',
            duration:           exp.duration           || '',
            difficulty:         exp.difficulty         || 'Moderate',
            maxGroupSize:       exp.maxGroupSize       || 12,
            images:             exp.images?.join(', ')         || '',
            includes:           exp.includes?.join(', ')       || '',
            exclusions:         exp.exclusions?.join(', ')     || '',
            cancellationPolicy: exp.cancellationPolicy || '',
            availableDates:     exp.availableDates?.join(', ') || '',
          });
        })
        .catch(err => setError(err.response?.data?.message || 'Failed to load listing details.'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    // Do NOT send status — backend controls status transitions
    const payload = {
      title:              formData.title,
      description:        formData.description,
      category:           formData.category,
      location:           { city: formData.city, country: formData.country },
      price:              Number(formData.price),
      duration:           formData.duration,
      difficulty:         formData.difficulty,
      maxGroupSize:       Number(formData.maxGroupSize),
      images:             formData.images.split(',').map(s => s.trim()).filter(Boolean),
      includes:           formData.includes.split(',').map(s => s.trim()).filter(Boolean),
      exclusions:         formData.exclusions.split(',').map(s => s.trim()).filter(Boolean),
      cancellationPolicy: formData.cancellationPolicy,
      availableDates:     formData.availableDates.split(',').map(s => s.trim()).filter(Boolean),
    };

    try {
      if (isEdit) {
        await hostAPI.editListing(id, payload);
      } else {
        await hostAPI.createListing(payload);
      }
      navigate('/listings');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save listing. Please try again.');
      setSaving(false);
    }
  };

  const isRejected = ['rejected', 'changes_requested'].includes(currentStatus);
  const isPending  = currentStatus === 'pending';

  const submitLabel = saving
    ? 'Submitting...'
    : isRejected
    ? 'Update & Resubmit for Review'
    : isEdit
    ? 'Save & Submit for Review'
    : 'Submit for Review';

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
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? 'Edit Experience Listing' : 'Create New Experience'}
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              {isEdit
                ? 'Update the listing details below.'
                : 'Your listing will be submitted for admin review before going live.'}
            </p>
          </div>
          {isEdit && currentStatus && (
            <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${STATUS_LABEL[currentStatus]?.cls || 'bg-gray-100 text-gray-500 border-gray-200'}`}>
              {STATUS_LABEL[currentStatus]?.label || currentStatus}
            </span>
          )}
        </div>

        {/* Info banner for new listings */}
        {!isEdit && (
          <div className="mb-5 flex items-start gap-3 px-4 py-3 bg-[#1A5F45]/8 border border-[#1A5F45]/20 rounded-xl text-sm text-[#1A5F45]">
            <span className="text-lg leading-none">ℹ️</span>
            <p>
              New listings are submitted for <strong>admin review</strong>. Once approved they automatically become visible to customers in the app. You'll see the review status in your <a href="/listings" className="font-semibold underline">Listings</a> page.
            </p>
          </div>
        )}

        {/* Pending banner */}
        {isPending && (
          <div className="mb-5 flex items-start gap-3 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
            <span className="text-lg leading-none">⏳</span>
            <p>This listing is <strong>awaiting admin review</strong>. You cannot edit it until the review is complete.</p>
          </div>
        )}

        {/* Rejection reason banner */}
        {isRejected && rejectionReason && (
          <div className="mb-5 flex items-start gap-3 px-4 py-3.5 bg-red-50 border border-red-200 rounded-xl">
            <span className="text-lg leading-none mt-0.5">⚠️</span>
            <div>
              <p className="text-xs font-bold text-red-600 uppercase tracking-wide mb-1">Admin Feedback — Action Required</p>
              <p className="text-sm text-red-800">{rejectionReason}</p>
              <p className="text-xs text-gray-500 mt-1.5">
                Address the feedback above, update the form, then click <strong>"Update &amp; Resubmit for Review"</strong>.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-5 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>
        )}

        {loading ? (
          <div className="p-8 text-center text-gray-500 font-semibold">Loading listing details...</div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 space-y-6">

            {/* Basic Info */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-[#1A5F45] uppercase tracking-wider border-b pb-2 border-gray-100">
                Basic Information
              </h2>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Title *</label>
                <input type="text" name="title" required value={formData.title} onChange={handleChange}
                  placeholder="e.g. Alpine Glacier Trek &amp; Lake Camping"
                  disabled={isPending}
                  className={`${inputCls} ${isPending ? 'opacity-60 cursor-not-allowed' : ''}`} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Description *</label>
                <textarea name="description" required rows={4} value={formData.description} onChange={handleChange}
                  placeholder="Tell adventurers what makes this experience special..."
                  disabled={isPending}
                  className={`${inputCls} resize-none ${isPending ? 'opacity-60 cursor-not-allowed' : ''}`} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Category</label>
                  <select name="category" value={formData.category} onChange={handleChange}
                    disabled={isPending}
                    className={`${inputCls} ${isPending ? 'opacity-60 cursor-not-allowed' : ''}`}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Difficulty Level</label>
                  <select name="difficulty" value={formData.difficulty} onChange={handleChange}
                    disabled={isPending}
                    className={`${inputCls} ${isPending ? 'opacity-60 cursor-not-allowed' : ''}`}>
                    {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-[#1A5F45] uppercase tracking-wider border-b pb-2 border-gray-100">
                Location &amp; Group Limits
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">City / Region *</label>
                  <input type="text" name="city" required value={formData.city} onChange={handleChange}
                    placeholder="e.g. Manali" disabled={isPending}
                    className={`${inputCls} ${isPending ? 'opacity-60 cursor-not-allowed' : ''}`} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Country *</label>
                  <input type="text" name="country" required value={formData.country} onChange={handleChange}
                    disabled={isPending}
                    className={`${inputCls} ${isPending ? 'opacity-60 cursor-not-allowed' : ''}`} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Price (₹) *</label>
                  <input type="number" name="price" required value={formData.price} onChange={handleChange}
                    placeholder="250" disabled={isPending}
                    className={`${inputCls} ${isPending ? 'opacity-60 cursor-not-allowed' : ''}`} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Duration *</label>
                  <input type="text" name="duration" required value={formData.duration} onChange={handleChange}
                    placeholder="3 days / 2 nights" disabled={isPending}
                    className={`${inputCls} ${isPending ? 'opacity-60 cursor-not-allowed' : ''}`} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Max Group Size</label>
                  <input type="number" name="maxGroupSize" required value={formData.maxGroupSize} onChange={handleChange}
                    disabled={isPending}
                    className={`${inputCls} ${isPending ? 'opacity-60 cursor-not-allowed' : ''}`} />
                </div>
              </div>
            </div>

            {/* Logistics */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-[#1A5F45] uppercase tracking-wider border-b pb-2 border-gray-100">
                Logistics &amp; Dates
              </h2>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Images (comma-separated URLs)</label>
                <input type="text" name="images" value={formData.images} onChange={handleChange}
                  placeholder="https://example.com/img1.jpg, https://example.com/img2.jpg"
                  disabled={isPending}
                  className={`${inputCls} ${isPending ? 'opacity-60 cursor-not-allowed' : ''}`} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Inclusions (comma-separated)</label>
                  <textarea name="includes" rows={2} value={formData.includes} onChange={handleChange}
                    placeholder="Camping gear, Professional Guide, Food"
                    disabled={isPending}
                    className={`${inputCls} resize-none ${isPending ? 'opacity-60 cursor-not-allowed' : ''}`} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Exclusions (comma-separated)</label>
                  <textarea name="exclusions" rows={2} value={formData.exclusions} onChange={handleChange}
                    placeholder="Travel insurance, Personal expenses"
                    disabled={isPending}
                    className={`${inputCls} resize-none ${isPending ? 'opacity-60 cursor-not-allowed' : ''}`} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Cancellation Policy</label>
                <input type="text" name="cancellationPolicy" value={formData.cancellationPolicy} onChange={handleChange}
                  disabled={isPending}
                  className={`${inputCls} ${isPending ? 'opacity-60 cursor-not-allowed' : ''}`} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                  Available Dates (YYYY-MM-DD, comma-separated)
                </label>
                <input type="text" name="availableDates" value={formData.availableDates} onChange={handleChange}
                  placeholder="2026-06-05, 2026-06-10, 2026-06-15"
                  disabled={isPending}
                  className={`${inputCls} ${isPending ? 'opacity-60 cursor-not-allowed' : ''}`} />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button type="button" onClick={() => navigate('/listings')}
                className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-xl transition">
                Cancel
              </button>
              {!isPending && (
                <button type="submit" disabled={saving}
                  className={`px-6 py-2.5 text-sm font-bold text-white rounded-xl shadow-sm transition disabled:opacity-60 ${
                    isRejected
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-[#1A5F45] hover:bg-[#145038]'
                  }`}>
                  {submitLabel}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </Layout>
  );
}
