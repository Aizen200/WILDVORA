import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { hostAPI } from '../api/hostAPI';
import api from '../api/axios';
import Layout from '../components/Layout';

const CATEGORIES = [
  'Trekking', 'Camping', 'Paragliding', 'Rafting', 'Scuba Diving',
  'Cycling', 'Wildlife Safari', 'Climbing', 'Skiing', 'Water Sports', 'Jungle',
];
const DIFFICULTIES = ['Easy', 'Moderate', 'Difficult'];

const STATUS_LABEL = {
  live:              { label: 'Approved',       cls: 'bg-green-50 text-green-700 border-green-200' },
  pending:           { label: 'Pending Review',  cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  draft:             { label: 'Draft',           cls: 'bg-gray-100 text-gray-500 border-gray-200' },
  paused:            { label: 'Paused',          cls: 'bg-slate-100 text-slate-600 border-slate-200' },
  rejected:          { label: 'Rejected',        cls: 'bg-red-50 text-red-600 border-red-200' },
  changes_requested: { label: 'Changes Needed',  cls: 'bg-orange-50 text-orange-600 border-orange-200' },
};

async function uploadFiles(files) {
  const formData = new FormData();
  files.forEach(f => formData.append('files', f));
  const res = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.urls; // string[]
}

async function uploadFile(file) {
  const urls = await uploadFiles([file]);
  return urls[0];
}

const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 outline-none focus:ring-1 focus:ring-[#1A5F45] focus:border-[#1A5F45] transition placeholder-gray-400';

function SectionCard({ children }) {
  return (
    <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 space-y-4">
      {children}
    </div>
  );
}

function SectionHeader({ children }) {
  return (
    <h2 className="text-sm font-bold text-[#1A5F45] uppercase tracking-wider border-b pb-2 border-gray-100">
      {children}
    </h2>
  );
}

function Label({ children, required }) {
  return (
    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

function UploadPlaceholder({ onClick, disabled, icon, title, subtitle }) {
  return (
    <button
      type="button" onClick={onClick} disabled={disabled}
      className={`w-full border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-2 py-8 hover:border-[#1A5F45] hover:bg-[#1A5F45]/4 transition ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span>{icon}</span>
      <span className="text-sm font-semibold text-gray-500">{title}</span>
      <span className="text-xs text-gray-400">{subtitle}</span>
    </button>
  );
}

export default function ListingForm() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const isEdit   = !!id;

  const [loading,         setLoading]         = useState(isEdit);
  const [saving,          setSaving]          = useState(false);
  const [error,           setError]           = useState('');
  const [currentStatus,   setCurrentStatus]   = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [uploading,       setUploading]       = useState(false);

  // Media state: { preview: string, url: string | null }
  const [coverImage,      setCoverImage]      = useState(null);
  const [adventureImages, setAdventureImages] = useState([]);
  const [video,           setVideo]           = useState(null);

  // Requirements checklist
  const [reqInput, setReqInput] = useState('');

  const coverRef    = useRef(null);
  const advRef      = useRef(null);
  const videoRef    = useRef(null);

  const [formData, setFormData] = useState({
    // Basic Info
    title: '', category: 'Trekking', description: '',
    // Location
    city: '', state: '', country: 'India', meetingPoint: '', googleMapsLink: '',
    // Social
    instagram: '', website: '',
    // Booking Info
    price: '', availableDates: '', duration: '', minGroupSize: 1, maxGroupSize: 12, bookingDeadline: '',
    cancellationPolicy: 'Flexible: Cancel up to 24 hours in advance for a full refund.',
    // Difficulty & Requirements
    difficulty: 'Moderate', ageRestriction: '', medicalRestrictions: '',
    // Safety
    firstAidAvailable: false, emergencyContact: '', safetyBriefingIncluded: false,
    nearestFacility: '',
    // Requirements checklist
    requirements: [],
    // Inclusions / Exclusions
    includes: '', exclusions: '',
    // Operator Info
    businessRegistrationNumber: '', gstNumber: '', tourismRegistration: '',
    yearsOfOperation: '', guideCertifications: '',
    // Experience Builder fields
    activities: '', stayOptions: '', meals: '', campfire: 'No', localExperiences: '',
    equipmentIncluded: '', pickupDrop: '', bestSeason: '', packingChecklist: '',
    // Dynamic Availability overrides
    closedDates: '', weatherCancellations: '', routeClosures: '',
  });

  useEffect(() => {
    if (!isEdit) return;
    hostAPI.getListing(id)
      .then(res => {
        const exp = res.data.experience;
        setCurrentStatus(exp.status || '');
        setRejectionReason(exp.rejectionReason || '');
        setFormData({
          title:               exp.title                || '',
          category:            exp.category             || 'Trekking',
          description:         exp.description          || '',
          city:                exp.location?.city       || '',
          state:               exp.location?.state      || '',
          country:             exp.location?.country    || 'India',
          meetingPoint:        exp.location?.meetingPoint   || '',
          googleMapsLink:      exp.location?.googleMapsLink || '',
          instagram:           exp.socialLinks?.instagram   || '',
          website:             exp.socialLinks?.website     || '',
          price:               exp.price                || '',
          availableDates:      exp.availableDates?.join(', ') || '',
          duration:            exp.duration             || '',
          minGroupSize:        exp.minGroupSize         || 1,
          maxGroupSize:        exp.maxGroupSize         || 12,
          bookingDeadline:     exp.bookingDeadline      || '',
          cancellationPolicy:  exp.cancellationPolicy   || '',
          difficulty:          exp.difficulty           || 'Moderate',
          ageRestriction:      exp.ageRestriction       || '',
          medicalRestrictions: exp.medicalRestrictions  || '',
          firstAidAvailable:       exp.safetyInfo?.firstAidAvailable      ?? false,
          emergencyContact:        exp.safetyInfo?.emergencyContact        || '',
          safetyBriefingIncluded:  exp.safetyInfo?.safetyBriefingIncluded ?? false,
          nearestFacility:         exp.emergencyInfo?.nearestFacility      || '',
          requirements:            exp.requirements       || [],
          includes:            exp.includes?.join(', ')    || '',
          exclusions:          exp.exclusions?.join(', ')  || '',
          businessRegistrationNumber: exp.operatorInfo?.businessRegistrationNumber || '',
          gstNumber:               exp.operatorInfo?.gstNumber              || '',
          tourismRegistration:     exp.operatorInfo?.tourismRegistration    || '',
          yearsOfOperation:        exp.operatorInfo?.yearsOfOperation       || '',
          guideCertifications:     exp.operatorInfo?.guideCertifications    || '',
          // Experience Builder fields
          activities:          exp.activities?.join(', ')       || '',
          stayOptions:         exp.stayOptions?.join(', ')      || '',
          meals:               exp.meals?.join(', ')            || '',
          campfire:            exp.campfire                     || 'No',
          localExperiences:    exp.localExperiences?.join(', ') || '',
          equipmentIncluded:   exp.equipmentIncluded?.join(', ')|| '',
          pickupDrop:          exp.pickupDrop                   || '',
          bestSeason:          exp.bestSeason                   || '',
          packingChecklist:    exp.packingChecklist?.join(', ') || '',
          // Dynamic Availability overrides
          closedDates:         exp.closedDates?.join(', ')         || '',
          weatherCancellations:exp.weatherCancellations?.join(', ')|| '',
          routeClosures:       exp.routeClosures?.join(', ')       || '',
        });
        if (exp.coverImage) setCoverImage({ preview: exp.coverImage, url: exp.coverImage });
        const advImgs = exp.adventureImages?.length ? exp.adventureImages : (exp.images || []);
        if (advImgs.length) setAdventureImages(advImgs.map(u => ({ preview: u, url: u })));
        if (exp.video) setVideo({ preview: exp.video, url: exp.video });
      })
      .catch(err => setError(err.response?.data?.message || 'Failed to load listing details.'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  // ── Cover Image ──
  const handleCoverChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setCoverImage({ preview, url: null });
    setUploading(true);
    setError('');
    try {
      const url = await uploadFile(file);
      setCoverImage({ preview, url });
    } catch (err) {
      setError('Cover image upload failed: ' + err.message);
      setCoverImage(null);
    } finally {
      setUploading(false);
      if (coverRef.current) coverRef.current.value = '';
    }
  };

  // ── Adventure Images ──
  const handleAdvChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const placeholders = files.map(f => ({ preview: URL.createObjectURL(f), url: null }));
    setAdventureImages(prev => [...prev, ...placeholders]);
    setUploading(true);
    setError('');
    try {
      const urls = await uploadFiles(files);
      setAdventureImages(prev => {
        const confirmed = [...prev];
        const offset = confirmed.length - files.length;
        urls.forEach((url, i) => { confirmed[offset + i] = { preview: placeholders[i].preview, url }; });
        return confirmed;
      });
    } catch (err) {
      setAdventureImages(prev => prev.slice(0, prev.length - files.length));
      setError('Adventure images upload failed: ' + err.message);
    } finally {
      setUploading(false);
      if (advRef.current) advRef.current.value = '';
    }
  };

  const removeAdvImage = (idx) => setAdventureImages(prev => prev.filter((_, i) => i !== idx));

  // ── Video ──
  const handleVideoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setVideo({ preview, url: null });
    setUploading(true);
    setError('');
    try {
      const url = await uploadFile(file);
      setVideo({ preview, url });
    } catch (err) {
      setError('Video upload failed: ' + err.message);
      setVideo(null);
    } finally {
      setUploading(false);
      if (videoRef.current) videoRef.current.value = '';
    }
  };

  // ── Requirements Checklist ──
  const addReq = () => {
    const val = reqInput.trim();
    if (!val) return;
    setFormData(prev => ({ ...prev, requirements: [...prev.requirements, val] }));
    setReqInput('');
  };
  const removeReq = (idx) =>
    setFormData(prev => ({ ...prev, requirements: prev.requirements.filter((_, i) => i !== idx) }));

  // ── Submit ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!coverImage?.url) {
      setError('Please upload a cover image before submitting.');
      return;
    }
    if (uploading) {
      setError('Please wait for uploads to finish.');
      return;
    }
    setSaving(true);
    setError('');

    const advUrls = adventureImages.filter(i => i.url).map(i => i.url);

    const payload = {
      title:       formData.title,
      description: formData.description,
      category:    formData.category,
      location: {
        city:           formData.city,
        state:          formData.state,
        country:        formData.country,
        meetingPoint:   formData.meetingPoint,
        googleMapsLink: formData.googleMapsLink,
      },
      socialLinks: {
        instagram: formData.instagram,
        website:   formData.website,
      },
      coverImage:      coverImage.url,
      adventureImages: advUrls,
      video:           video?.url || '',
      images:          [coverImage.url, ...advUrls],
      price:           Number(formData.price),
      duration:        formData.duration,
      difficulty:      formData.difficulty,
      minGroupSize:    Number(formData.minGroupSize),
      maxGroupSize:    Number(formData.maxGroupSize),
      bookingDeadline: formData.bookingDeadline ? Number(formData.bookingDeadline) : undefined,
      cancellationPolicy: formData.cancellationPolicy,
      ageRestriction:     formData.ageRestriction,
      medicalRestrictions: formData.medicalRestrictions,
      safetyInfo: {
        firstAidAvailable:      formData.firstAidAvailable,
        emergencyContact:       formData.emergencyContact,
        safetyBriefingIncluded: formData.safetyBriefingIncluded,
      },
      emergencyInfo: {
        contact:         formData.emergencyContact,
        nearestFacility: formData.nearestFacility,
      },
      requirements: formData.requirements,
      includes:     formData.includes.split(',').map(s => s.trim()).filter(Boolean),
      exclusions:   formData.exclusions.split(',').map(s => s.trim()).filter(Boolean),
      availableDates: formData.availableDates.split(',').map(s => s.trim()).filter(Boolean),
      operatorInfo: {
        businessRegistrationNumber: formData.businessRegistrationNumber,
        gstNumber:                  formData.gstNumber,
        tourismRegistration:        formData.tourismRegistration,
        yearsOfOperation:           formData.yearsOfOperation ? Number(formData.yearsOfOperation) : undefined,
        guideCertifications:        formData.guideCertifications,
      },
      // Experience Builder mapping
      activities:        formData.activities.split(',').map(s => s.trim()).filter(Boolean),
      stayOptions:       formData.stayOptions.split(',').map(s => s.trim()).filter(Boolean),
      meals:             formData.meals.split(',').map(s => s.trim()).filter(Boolean),
      campfire:          formData.campfire,
      localExperiences:  formData.localExperiences.split(',').map(s => s.trim()).filter(Boolean),
      equipmentIncluded: formData.equipmentIncluded.split(',').map(s => s.trim()).filter(Boolean),
      pickupDrop:        formData.pickupDrop,
      bestSeason:        formData.bestSeason,
      packingChecklist:  formData.packingChecklist.split(',').map(s => s.trim()).filter(Boolean),
      // Dynamic Availability overrides
      closedDates:          formData.closedDates.split(',').map(s => s.trim()).filter(Boolean),
      weatherCancellations: formData.weatherCancellations.split(',').map(s => s.trim()).filter(Boolean),
      routeClosures:        formData.routeClosures.split(',').map(s => s.trim()).filter(Boolean),
    };

    try {
      if (isEdit) await hostAPI.editListing(id, payload);
      else        await hostAPI.createListing(payload);
      navigate('/listings');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save listing. Please try again.');
      setSaving(false);
    }
  };

  const isRejected = ['rejected', 'changes_requested'].includes(currentStatus);
  const isPending  = currentStatus === 'pending';
  const dis        = isPending ? 'opacity-60 cursor-not-allowed' : '';

  const submitLabel = saving
    ? 'Submitting...'
    : uploading
    ? 'Uploading media...'
    : isRejected
    ? 'Update & Resubmit for Review'
    : isEdit
    ? 'Save & Submit for Review'
    : 'Submit for Review';

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

        {/* Banners */}
        {!isEdit && (
          <div className="mb-5 flex items-start gap-3 px-4 py-3 bg-[#1A5F45]/8 border border-[#1A5F45]/20 rounded-xl text-sm text-[#1A5F45]">
            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p>
              New listings are submitted for <strong>admin review</strong>. Once approved they become visible to customers in the app.
              You&apos;ll see the review status in your{' '}
              <a href="/listings" className="font-semibold underline">Listings</a> page.
            </p>
          </div>
        )}
        {isPending && (
          <div className="mb-5 flex items-start gap-3 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
            <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-yellow-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <p>This listing is <strong>awaiting admin review</strong>. You cannot edit it until the review is complete.</p>
          </div>
        )}
        {isRejected && rejectionReason && (
          <div className="mb-5 flex items-start gap-3 px-4 py-3.5 bg-red-50 border border-red-200 rounded-xl">
            <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <div>
              <p className="text-xs font-bold text-red-600 uppercase tracking-wide mb-1">Admin Feedback — Action Required</p>
              <p className="text-sm text-red-800">{rejectionReason}</p>
              <p className="text-xs text-gray-500 mt-1.5">
                Address the feedback above, update the form, then click <strong>&quot;Update &amp; Resubmit for Review&quot;</strong>.
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
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* ── 1. Basic Information ── */}
            <SectionCard>
              <SectionHeader>Basic Information</SectionHeader>
              <div>
                <Label required>Adventure Title</Label>
                <input type="text" name="title" required value={formData.title} onChange={handleChange}
                  placeholder="e.g. Alpine Glacier Trek & Lake Camping"
                  disabled={isPending} className={`${inputCls} ${dis}`} />
              </div>
              <div>
                <Label required>Adventure Category</Label>
                <select name="category" value={formData.category} onChange={handleChange}
                  disabled={isPending} className={`${inputCls} ${dis}`}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <Label required>Detailed Description</Label>
                <textarea name="description" required rows={5} value={formData.description} onChange={handleChange}
                  placeholder="Tell adventurers what makes this experience special — the landscape, the journey, the highlights..."
                  disabled={isPending} className={`${inputCls} resize-none ${dis}`} />
              </div>
            </SectionCard>

            {/* ── 2. Location ── */}
            <SectionCard>
              <SectionHeader>Location</SectionHeader>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>State</Label>
                  <input type="text" name="state" value={formData.state} onChange={handleChange}
                    placeholder="e.g. Himachal Pradesh" disabled={isPending} className={`${inputCls} ${dis}`} />
                </div>
                <div>
                  <Label required>City / Region</Label>
                  <input type="text" name="city" required value={formData.city} onChange={handleChange}
                    placeholder="e.g. Manali" disabled={isPending} className={`${inputCls} ${dis}`} />
                </div>
              </div>
              <div>
                <Label>Meeting Point</Label>
                <input type="text" name="meetingPoint" value={formData.meetingPoint} onChange={handleChange}
                  placeholder="e.g. Solang Valley Parking Lot, Manali"
                  disabled={isPending} className={`${inputCls} ${dis}`} />
              </div>
              <div>
                <Label>Google Maps Link (if any)</Label>
                <input type="url" name="googleMapsLink" value={formData.googleMapsLink} onChange={handleChange}
                  placeholder="https://maps.google.com/..."
                  disabled={isPending} className={`${inputCls} ${dis}`} />
              </div>
            </SectionCard>

            {/* ── 3. Social Media Links ── */}
            <SectionCard>
              <SectionHeader>Social Media Links (Optional)</SectionHeader>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Instagram</Label>
                  <input type="url" name="instagram" value={formData.instagram} onChange={handleChange}
                    placeholder="https://instagram.com/yourbusiness"
                    disabled={isPending} className={`${inputCls} ${dis}`} />
                </div>
                <div>
                  <Label>Website</Label>
                  <input type="url" name="website" value={formData.website} onChange={handleChange}
                    placeholder="https://yourwebsite.com"
                    disabled={isPending} className={`${inputCls} ${dis}`} />
                </div>
              </div>
            </SectionCard>

            {/* ── 4. Booking Information ── */}
            <SectionCard>
              <SectionHeader>Booking Information</SectionHeader>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label required>Price Per Person (₹)</Label>
                  <input type="number" name="price" required min={1} value={formData.price} onChange={handleChange}
                    placeholder="2500" disabled={isPending} className={`${inputCls} ${dis}`} />
                </div>
                <div>
                  <Label required>Duration</Label>
                  <input type="text" name="duration" required value={formData.duration} onChange={handleChange}
                    placeholder="3 days / 2 nights" disabled={isPending} className={`${inputCls} ${dis}`} />
                </div>
              </div>
              <div>
                <Label>Available Dates</Label>
                <p className="text-xs text-gray-400 mb-1.5">
                  Format: <span className="font-semibold text-gray-600">YYYY-MM-DD</span>, comma-separated. Each date becomes a selectable slot for customers.
                </p>
                <input type="text" name="availableDates" value={formData.availableDates} onChange={handleChange}
                  placeholder="2026-07-05, 2026-07-12, 2026-07-19, 2026-08-02"
                  disabled={isPending} className={`${inputCls} ${dis}`} />
                {formData.availableDates && (
                  <p className="text-xs text-[#1A5F45] mt-1">
                    {formData.availableDates.split(',').filter(s => s.trim()).length} date(s) added
                  </p>
                )}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Min Group Size</Label>
                  <input type="number" name="minGroupSize" min={1} value={formData.minGroupSize} onChange={handleChange}
                    disabled={isPending} className={`${inputCls} ${dis}`} />
                </div>
                <div>
                  <Label>Max Group Size</Label>
                  <input type="number" name="maxGroupSize" min={1} value={formData.maxGroupSize} onChange={handleChange}
                    disabled={isPending} className={`${inputCls} ${dis}`} />
                </div>
                <div>
                  <Label>Booking Deadline (days before)</Label>
                  <input type="number" name="bookingDeadline" min={0} value={formData.bookingDeadline}
                    onChange={handleChange} placeholder="2"
                    disabled={isPending} className={`${inputCls} ${dis}`} />
                </div>
              </div>
              <div>
                <Label>Cancellation Policy</Label>
                <input type="text" name="cancellationPolicy" value={formData.cancellationPolicy}
                  onChange={handleChange} disabled={isPending} className={`${inputCls} ${dis}`} />
              </div>
            </SectionCard>

            {/* ── Dynamic Availability & Closures ── */}
            <SectionCard>
              <SectionHeader>Dynamic Availability & Alert Overrides</SectionHeader>
              <p className="text-xs text-gray-400 -mt-2 mb-4">
                Instantly set closures, flag bad weather dates, or note active route/trail blocks.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Closed Dates</Label>
                  <p className="text-[10px] text-gray-400 mb-1">Format: YYYY-MM-DD, comma-separated</p>
                  <input type="text" name="closedDates" value={formData.closedDates} onChange={handleChange}
                    placeholder="e.g. 2026-07-15, 2026-07-20"
                    disabled={isPending} className={`${inputCls} ${dis}`} />
                </div>
                <div>
                  <Label>Weather Cancellations</Label>
                  <p className="text-[10px] text-gray-400 mb-1">Format: YYYY-MM-DD, comma-separated</p>
                  <input type="text" name="weatherCancellations" value={formData.weatherCancellations} onChange={handleChange}
                    placeholder="e.g. 2026-07-18"
                    disabled={isPending} className={`${inputCls} ${dis}`} />
                </div>
              </div>

              <div>
                <Label>Route & Trail Closures</Label>
                <input type="text" name="routeClosures" value={formData.routeClosures} onChange={handleChange}
                  placeholder="e.g. Rohtang Pass closed due to heavy rain; Kunzum Pass snow block"
                  disabled={isPending} className={`${inputCls} ${dis}`} />
              </div>
            </SectionCard>

            {/* ── 5. Difficulty & Requirements ── */}
            <SectionCard>
              <SectionHeader>Difficulty & Requirements</SectionHeader>
              <div>
                <Label>Difficulty Level</Label>
                <div className="flex gap-3 mt-1">
                  {DIFFICULTIES.map(d => (
                    <button key={d} type="button" disabled={isPending}
                      onClick={() => setFormData(prev => ({ ...prev, difficulty: d }))}
                      className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition ${
                        formData.difficulty === d
                          ? 'bg-[#1A5F45] text-white border-[#1A5F45]'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-[#1A5F45]/50'
                      } ${dis}`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Age Restrictions</Label>
                  <input type="text" name="ageRestriction" value={formData.ageRestriction} onChange={handleChange}
                    placeholder="e.g. 12–65 years" disabled={isPending} className={`${inputCls} ${dis}`} />
                </div>
                <div>
                  <Label>Medical Restrictions</Label>
                  <input type="text" name="medicalRestrictions" value={formData.medicalRestrictions}
                    onChange={handleChange} placeholder="e.g. No heart conditions, no vertigo"
                    disabled={isPending} className={`${inputCls} ${dis}`} />
                </div>
              </div>
            </SectionCard>

            {/* ── Experience Builder ── */}
            <SectionCard>
              <SectionHeader>Experience Builder Details</SectionHeader>
              <p className="text-xs text-gray-400 -mt-2 mb-4">
                List the activities, stay options, meals, campfire details, equipment, pickup logistics, and seasonal info.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Activities Included</Label>
                  <input type="text" name="activities" value={formData.activities} onChange={handleChange}
                    placeholder="e.g. Ridge trekking, River crossing, Nature walk"
                    disabled={isPending} className={`${inputCls} ${dis}`} />
                </div>
                <div>
                  <Label>Stay Options</Label>
                  <input type="text" name="stayOptions" value={formData.stayOptions} onChange={handleChange}
                    placeholder="e.g. Dome Tents (Twin sharing), Wooden Cottages"
                    disabled={isPending} className={`${inputCls} ${dis}`} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Meals Included</Label>
                  <input type="text" name="meals" value={formData.meals} onChange={handleChange}
                    placeholder="e.g. Breakfast, Lunch, High tea, Dinner"
                    disabled={isPending} className={`${inputCls} ${dis}`} />
                </div>
                <div>
                  <Label>Campfire Details</Label>
                  <select name="campfire" value={formData.campfire} onChange={handleChange}
                    disabled={isPending} className={`${inputCls} ${dis}`}>
                    <option value="No">No Campfire</option>
                    <option value="Yes">Yes, Included</option>
                    <option value="Yes (Paid addon)">Yes (Paid Add-on)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Local Experiences Included</Label>
                  <input type="text" name="localExperiences" value={formData.localExperiences} onChange={handleChange}
                    placeholder="e.g. Local village lunch, Folklore evening story"
                    disabled={isPending} className={`${inputCls} ${dis}`} />
                </div>
                <div>
                  <Label>Equipment Included</Label>
                  <input type="text" name="equipmentIncluded" value={formData.equipmentIncluded} onChange={handleChange}
                    placeholder="e.g. Trekking pole, Sleeping bag, Headlamp"
                    disabled={isPending} className={`${inputCls} ${dis}`} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Pickup & Drop Logistics</Label>
                  <input type="text" name="pickupDrop" value={formData.pickupDrop} onChange={handleChange}
                    placeholder="e.g. Pick up Solang valley, Drop at Manali Mall road"
                    disabled={isPending} className={`${inputCls} ${dis}`} />
                </div>
                <div>
                  <Label>Best Season</Label>
                  <input type="text" name="bestSeason" value={formData.bestSeason} onChange={handleChange}
                    placeholder="e.g. June - September"
                    disabled={isPending} className={`${inputCls} ${dis}`} />
                </div>
              </div>

              <div>
                <Label>Packing Checklist</Label>
                <input type="text" name="packingChecklist" value={formData.packingChecklist} onChange={handleChange}
                  placeholder="e.g. Heavy jacket, Woolen socks, Sunscreen, Power bank"
                  disabled={isPending} className={`${inputCls} ${dis}`} />
              </div>
            </SectionCard>

            {/* ── 6. Safety Information ── */}
            <SectionCard>
              <SectionHeader>Safety Information</SectionHeader>
              <div className="flex flex-col gap-3">
                <label className={`flex items-center gap-3 ${isPending ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                  <input type="checkbox" name="firstAidAvailable" checked={formData.firstAidAvailable}
                    onChange={handleChange} disabled={isPending} className="w-4 h-4 accent-[#1A5F45]" />
                  <span className="text-sm text-gray-700 font-medium">First Aid Available</span>
                </label>
                <label className={`flex items-center gap-3 ${isPending ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                  <input type="checkbox" name="safetyBriefingIncluded" checked={formData.safetyBriefingIncluded}
                    onChange={handleChange} disabled={isPending} className="w-4 h-4 accent-[#1A5F45]" />
                  <span className="text-sm text-gray-700 font-medium">Safety Briefing Included</span>
                </label>
              </div>
              <div>
                <Label>Emergency Contact Number</Label>
                <input type="tel" name="emergencyContact" value={formData.emergencyContact} onChange={handleChange}
                  placeholder="+91 9876543210" disabled={isPending} className={`${inputCls} ${dis}`} />
              </div>
              <div>
                <Label>Nearest Hospital / Medical Facility</Label>
                <p className="text-xs text-gray-400 mb-1.5">Visible to customers in the app to help them plan emergency access.</p>
                <input type="text" name="nearestFacility" value={formData.nearestFacility} onChange={handleChange}
                  placeholder="e.g. Civil Hospital Manali — 4 km from base camp"
                  disabled={isPending} className={`${inputCls} ${dis}`} />
              </div>
            </SectionCard>

            {/* ── 7. Requirements & Must-Carry Essentials ── */}
            <SectionCard>
              <SectionHeader>Requirements & Must-Carry Essentials</SectionHeader>
              <p className="text-xs text-gray-400 -mt-2">
                Items participants must bring. Shown as a prominent checklist to customers before they book.
              </p>

              {/* Quick-add presets */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1.5">Quick add common items:</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Trekking Shoes', 'Water Bottle (2L)', 'Rain Jacket', 'Government ID',
                    'Personal Medicines', 'Backpack', 'Power Bank', 'Warm Clothing',
                    'Torch / Headlamp', 'Sunscreen', 'First Aid Kit', 'Trekking Pole',
                  ].filter(preset => !formData.requirements.includes(preset)).map(preset => (
                    <button
                      key={preset}
                      type="button"
                      disabled={isPending}
                      onClick={() => setFormData(prev => ({ ...prev, requirements: [...prev.requirements, preset] }))}
                      className="text-xs px-2.5 py-1 rounded-full border border-dashed border-gray-300 text-gray-500 hover:border-[#1A5F45] hover:text-[#1A5F45] hover:bg-[#1A5F45]/5 transition disabled:opacity-40"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom item input */}
              <div className="flex gap-2">
                <input
                  type="text" value={reqInput} onChange={e => setReqInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addReq(); } }}
                  placeholder="Add a custom item..."
                  disabled={isPending} className={`${inputCls} flex-1 ${dis}`}
                />
                <button type="button" onClick={addReq} disabled={isPending || !reqInput.trim()}
                  className="px-4 py-2 text-sm font-bold bg-[#1A5F45] text-white rounded-xl disabled:opacity-40 hover:bg-[#145038] transition">
                  Add
                </button>
              </div>

              {/* Added items */}
              {formData.requirements.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.requirements.map((r, i) => (
                    <span key={i} className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-[#1A5F45]/8 text-[#1A5F45] rounded-full border border-[#1A5F45]/20 font-medium">
                      <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="20 6 9 17 4 12"/></svg>
                      {r}
                      {!isPending && (
                        <button type="button" onClick={() => removeReq(i)}
                          className="ml-1 text-gray-400 hover:text-red-500 transition font-bold leading-none">&times;</button>
                      )}
                    </span>
                  ))}
                </div>
              )}
              {formData.requirements.length === 0 && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  No items added yet. Use quick-add or type a custom item above.
                </p>
              )}
            </SectionCard>

            {/* ── 8. Inclusions & Exclusions ── */}
            <SectionCard>
              <SectionHeader>Inclusions &amp; Exclusions</SectionHeader>
              <p className="text-xs text-gray-400 -mt-2">
                <span className="font-semibold text-[#1A5F45]">Comma-separated</span> — each item separated by a comma becomes a separate bullet in the customer app.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>What's Included</Label>
                  <p className="text-xs text-gray-400 mb-1">e.g. Accommodation, Meals, Certified Guide</p>
                  <textarea name="includes" rows={4} value={formData.includes} onChange={handleChange}
                    placeholder="Accommodation, Breakfast & Dinner, Certified Guide, Camping Equipment, Transportation from pickup point"
                    disabled={isPending} className={`${inputCls} resize-none ${dis}`} />
                  {formData.includes && (
                    <p className="text-xs text-green-600 mt-1">
                      {formData.includes.split(',').filter(s => s.trim()).length} item(s) will be shown
                    </p>
                  )}
                </div>
                <div>
                  <Label>What's Not Included</Label>
                  <p className="text-xs text-gray-400 mb-1">e.g. Travel Insurance, Personal Expenses</p>
                  <textarea name="exclusions" rows={4} value={formData.exclusions} onChange={handleChange}
                    placeholder="Travel Insurance, Personal Expenses, Air/Train Tickets to Starting Point, Emergency Evacuation Charges"
                    disabled={isPending} className={`${inputCls} resize-none ${dis}`} />
                  {formData.exclusions && (
                    <p className="text-xs text-red-500 mt-1">
                      {formData.exclusions.split(',').filter(s => s.trim()).length} item(s) will be shown
                    </p>
                  )}
                </div>
              </div>
            </SectionCard>

            {/* ── 9. Images & Media ── */}
            <SectionCard>
              <SectionHeader>Images & Media</SectionHeader>

              {/* Cover Image */}
              <div>
                <Label required>Cover Image</Label>
                <p className="text-xs text-gray-400 mb-2">Main photo shown on listing cards and as the hero image in the app.</p>
                {coverImage ? (
                  <div className="relative w-full h-52 rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
                    <img src={coverImage.preview} alt="Cover" className="w-full h-full object-cover" />
                    {!coverImage.url && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white text-xs font-semibold animate-pulse">Uploading...</span>
                      </div>
                    )}
                    {coverImage.url && (
                      <span className="absolute bottom-2 left-2 px-2 py-1 rounded-full bg-green-500 text-white text-xs font-bold">✓ Uploaded</span>
                    )}
                    {!isPending && (
                      <button type="button"
                        onClick={() => { setCoverImage(null); if (coverRef.current) coverRef.current.value = ''; }}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition text-sm">
                        ✕
                      </button>
                    )}
                  </div>
                ) : (
                  <UploadPlaceholder
                    onClick={() => coverRef.current?.click()} disabled={isPending}
                    icon={<svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>} title="Click to upload cover image" subtitle="JPG, PNG, WEBP · Max 10 MB"
                  />
                )}
                <input ref={coverRef} type="file" accept="image/*" className="hidden"
                  onChange={handleCoverChange} disabled={isPending} />
              </div>

              {/* Adventure Images */}
              <div>
                <Label>Adventure Images</Label>
                <p className="text-xs text-gray-400 mb-2">
                  Multiple photos showcasing the adventure.{' '}
                  <span className={adventureImages.length < 3 ? 'text-amber-600 font-semibold' : 'text-green-600 font-semibold'}>
                    {adventureImages.length}/3 minimum
                  </span>
                </p>
                {adventureImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    {adventureImages.map((img, idx) => (
                      <div key={idx} className="relative h-28 rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
                        <img src={img.preview} alt={`Adv ${idx + 1}`} className="w-full h-full object-cover" />
                        {!img.url && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <span className="text-white text-xs font-semibold animate-pulse">Uploading...</span>
                          </div>
                        )}
                        {img.url && (
                          <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-full bg-green-500 text-white text-xs font-bold">✓</span>
                        )}
                        {!isPending && (
                          <button type="button" onClick={() => removeAdvImage(idx)}
                            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition text-xs">
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <button type="button" onClick={() => advRef.current?.click()} disabled={isPending}
                  className={`w-full py-3 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center gap-2 hover:border-[#1A5F45] hover:bg-[#1A5F45]/4 transition text-sm font-semibold text-gray-500 ${dis}`}>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                  </svg>
                  {adventureImages.length > 0 ? 'Add More Photos' : 'Upload Adventure Photos'}
                </button>
                <input ref={advRef} type="file" accept="image/*" multiple className="hidden"
                  onChange={handleAdvChange} disabled={isPending} />
              </div>

              {/* Video */}
              <div>
                <Label>Video (Optional)</Label>
                <p className="text-xs text-gray-400 mb-2">Short clip showcasing the experience. MP4, MOV · Max 100 MB</p>
                {video ? (
                  <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-black">
                    <video src={video.preview} controls className="w-full max-h-52 object-contain" />
                    {!video.url && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none">
                        <span className="text-white text-sm font-semibold animate-pulse">Uploading video...</span>
                      </div>
                    )}
                    {video.url && (
                      <span className="absolute bottom-2 left-2 px-2 py-1 rounded-full bg-green-500 text-white text-xs font-bold">✓ Uploaded</span>
                    )}
                    {!isPending && (
                      <button type="button"
                        onClick={() => { setVideo(null); if (videoRef.current) videoRef.current.value = ''; }}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black/90 transition text-sm">
                        ✕
                      </button>
                    )}
                  </div>
                ) : (
                  <button type="button" onClick={() => videoRef.current?.click()} disabled={isPending}
                    className={`w-full py-3 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center gap-2 hover:border-[#1A5F45] hover:bg-[#1A5F45]/4 transition text-sm font-semibold text-gray-500 ${dis}`}>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                    </svg>
                    Upload Video
                  </button>
                )}
                <input ref={videoRef} type="file" accept="video/*" className="hidden"
                  onChange={handleVideoChange} disabled={isPending} />
              </div>
            </SectionCard>

            {/* ── 10. Trust & Verification ── */}
            <SectionCard>
              <SectionHeader>Trust & Verification</SectionHeader>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Operator Name</Label>
                  <input type="text" disabled value={formData.businessRegistrationNumber ? 'From your account profile' : ''}
                    placeholder="Pulled from your account" className={`${inputCls} opacity-60 cursor-not-allowed`} />
                  <p className="text-xs text-gray-400 mt-1">Your registered name is used from your account.</p>
                </div>
                <div>
                  <Label>Business Registration Number</Label>
                  <input type="text" name="businessRegistrationNumber" value={formData.businessRegistrationNumber}
                    onChange={handleChange} placeholder="CIN / Registration No."
                    disabled={isPending} className={`${inputCls} ${dis}`} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>GST Number (Optional)</Label>
                  <input type="text" name="gstNumber" value={formData.gstNumber} onChange={handleChange}
                    placeholder="e.g. 27AAAA0000A1Z5"
                    disabled={isPending} className={`${inputCls} ${dis}`} />
                </div>
                <div>
                  <Label>Tourism Registration (Optional)</Label>
                  <input type="text" name="tourismRegistration" value={formData.tourismRegistration}
                    onChange={handleChange} placeholder="Tourism Dept. Registration No."
                    disabled={isPending} className={`${inputCls} ${dis}`} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Years of Operation</Label>
                  <input type="number" name="yearsOfOperation" min={0} value={formData.yearsOfOperation}
                    onChange={handleChange} placeholder="5"
                    disabled={isPending} className={`${inputCls} ${dis}`} />
                </div>
                <div>
                  <Label>Guide Certifications</Label>
                  <input type="text" name="guideCertifications" value={formData.guideCertifications}
                    onChange={handleChange} placeholder="e.g. IMF Certified, Wilderness First Responder"
                    disabled={isPending} className={`${inputCls} ${dis}`} />
                </div>
              </div>
            </SectionCard>

            {/* ── 11. Customer Information Collected at Booking ── */}
            <SectionCard>
              <SectionHeader>Customer Information Collected During Booking</SectionHeader>
              <p className="text-xs text-gray-400 -mt-2">The following information is automatically collected from customers when they book this experience.</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  'Full Name', 'Phone Number', 'Email Address',
                  'Emergency Contact Name', 'Emergency Contact Number', 'Age',
                  'Gender (Optional)', 'Medical Conditions (Optional)', 'Special Requirements',
                ].map(field => (
                  <div key={field} className="flex items-center gap-2 text-sm text-gray-600 py-1.5 px-3 bg-gray-50 rounded-lg border border-gray-100">
                    <span className="text-green-500 font-bold text-xs">✓</span>
                    <span>{field}</span>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* ── Actions ── */}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => navigate('/listings')}
                className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition">
                Cancel
              </button>
              {!isPending && (
                <button type="submit" disabled={saving || uploading}
                  className={`px-6 py-2.5 text-sm font-bold text-white rounded-xl shadow-sm transition disabled:opacity-60 ${
                    isRejected ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#1A5F45] hover:bg-[#145038]'
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
