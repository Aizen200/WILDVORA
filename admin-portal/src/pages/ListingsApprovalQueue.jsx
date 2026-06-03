import { useState } from 'react'
import { FilterIcon, CheckIcon, EyeIcon, XCircleIcon, PlusIcon, MapPinIcon, CalIcon } from '../components/shared.jsx'

const listings = [
  {
    tag: 'EXPERIENCE',
    name: 'Summit Ridge Sanctuary',
    host: 'Julian Thorne',
    date: 'Oct 24, 2023',
    location: 'Aspen, CO',
    img: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=480&h=260&fit=crop',
  },
  {
    tag: 'PROPERTY',
    name: 'Whispering Pines Cabin',
    host: 'Elena Vance',
    date: 'Oct 25, 2023',
    location: 'Tahoe, CA',
    img: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=480&h=260&fit=crop',
  },
  {
    tag: 'EXCLUSIVE',
    name: 'Red Rock Observatory',
    host: 'Marcus Chen',
    date: 'Oct 26, 2023',
    location: 'Moab, UT',
    img: 'https://images.unsplash.com/photo-1488415032361-b7e238421f1b?w=480&h=260&fit=crop',
  },
  {
    tag: 'EXPERIENCE',
    name: 'Jungle Canopy Retreat',
    host: 'Priya Sharma',
    date: 'Oct 27, 2023',
    location: 'Costa Rica',
    img: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=480&h=260&fit=crop',
  },
]

const tagStyles = {
  EXPERIENCE: 'bg-sky-100 text-sky-600 border border-sky-200',
  PROPERTY:   'bg-teal-100 text-teal-600 border border-teal-200',
  EXCLUSIVE:  'bg-orange-100 text-orange-500 border border-orange-200',
}

export default function ListingsApprovalQueue() {
  const [approved, setApproved] = useState({})
  const [rejected, setRejected] = useState({})

  const handleApprove = (i) => {
    setApproved(p => ({ ...p, [i]: !p[i] }))
    setRejected(p => ({ ...p, [i]: false }))
  }
  const handleReject = (i) => {
    setRejected(p => ({ ...p, [i]: !p[i] }))
    setApproved(p => ({ ...p, [i]: false }))
  }

  return (
    // Light cream content area
    <div className="flex-1 overflow-y-auto px-8 py-8" style={{ backgroundColor: '#f5f1ea' }}>

      {/* Header */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Pending Review</h1>
          <p className="text-gray-500 text-sm mt-1">
            There are 12 new listings awaiting approval for the Summer Season.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-300 bg-white hover:bg-gray-50 transition-all"
          >
            <FilterIcon /> Filter
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-300 bg-white hover:bg-gray-50 transition-all"
          >
            Newest First
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-3 gap-5">
        {listings.map((l, i) => (
          <div
            key={i}
            className={`bg-white rounded-xl border overflow-hidden transition-all shadow-sm ${
              approved[i]
                ? 'border-emerald-300 ring-1 ring-emerald-200'
                : rejected[i]
                ? 'border-red-200 opacity-60'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
            }`}
          >
            {/* Image */}
            <div className="relative">
              <img src={l.img} alt={l.name} className="w-full h-44 object-cover" />
              <span className={`absolute top-3 left-3 text-xs font-bold px-2.5 py-0.5 rounded-full tracking-wide ${tagStyles[l.tag]}`}>
                {l.tag}
              </span>
              {approved[i] && (
                <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                  <div className="bg-emerald-500 rounded-full p-3 text-white shadow-lg">
                    <CheckIcon />
                  </div>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-4">
              <h3 className="text-gray-900 font-bold text-sm mb-1 truncate">{l.name}</h3>
              <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-medium mb-3">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                Host: {l.host}
              </div>
              <div className="flex items-center gap-4 text-gray-400 text-xs mb-4">
                <span className="flex items-center gap-1">
                  <CalIcon /> {l.date}
                </span>
                <span className="flex items-center gap-1">
                  <MapPinIcon /> {l.location}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleApprove(i)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    approved[i]
                      ? 'bg-emerald-600 text-white shadow'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  <CheckIcon /> Approve
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 transition-all">
                  <EyeIcon /> Review
                </button>
                <button
                  onClick={() => handleReject(i)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    rejected[i]
                      ? 'bg-red-500 text-white border-red-500'
                      : 'border-red-200 text-red-500 bg-white hover:bg-red-50'
                  }`}
                >
                  <XCircleIcon /> Reject
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}