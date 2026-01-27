// src/admin/pages/Bookings.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Search, Download, Calendar, 
  CheckCircle, Clock, XCircle, X, Save, AlertCircle, RefreshCw 
} from 'lucide-react';
import { fetchBookingRegister } from '../apis/admin_api';
import BookingTable from '../components/BookingTable';

export default function Bookings() {
  const [activeTab, setActiveTab] = useState('All');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Date Filter State
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Modal States
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [editingBooking, setEditingBooking] = useState(null);
  const [newStatus, setNewStatus] = useState("");

  // Pagination & Sorting
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  
  const [statusKey, setStatusKey] = useState(null);

  const tabs = ['All', 'Confirmed', 'Pending', 'Cancelled'];

  useEffect(() => {
    loadBookings();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, itemsPerPage, startDate, endDate]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const res = await fetchBookingRegister();
      if (res && res.status === 1 && Array.isArray(res.data)) {
        setBookings(res.data);
        if (res.data.length > 0) {
          const firstItem = res.data[0];
          const key = ['Status', 'status', 'BookingStatus', 'booking_status'].find(k => k in firstItem) 
                      || Object.keys(firstItem).find(k => k.toLowerCase().includes('status'));
          setStatusKey(key);
        }
      } else {
        setBookings([]);
      }
    } catch (err) {
      console.error("Failed to load bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  const getNormalizedStatus = useCallback((booking) => {
    const rawVal = statusKey ? booking[statusKey] : "Unknown";
    if (rawVal == null) return "Unknown";
    const s = String(rawVal).trim().toLowerCase();
    if (['1', 'confirmed', 'active', 'booked', 'success'].includes(s)) return 'Confirmed';
    if (['0', 'pending', 'hold', 'initiated', 'waiting'].includes(s)) return 'Pending';
    if (['2', 'cancelled', 'canceled', 'refunded', 'failed'].includes(s)) return 'Cancelled';
    return String(rawVal);
  }, [statusKey]);

  const getStatusColor = (statusLabel) => {
    const s = statusLabel.toLowerCase();
    if (s === 'confirmed') return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    if (s === 'pending')   return 'bg-amber-50 text-amber-600 border-amber-100';
    if (s === 'cancelled') return 'bg-red-50 text-red-600 border-red-100';
    return 'bg-slate-50 text-slate-600';
  };

  // --- FILTERING LOGIC ---
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // 1. Status Filter
      const status = getNormalizedStatus(b);
      const matchesTab = activeTab === 'All' || status.toLowerCase() === activeTab.toLowerCase();
      if (!matchesTab) return false;

      // 2. Date Filter
      if (startDate || endDate) {
        // Ensure date parsing works for your API format
        const checkIn = new Date(b.CheckInDate); 
        
        if (startDate) {
          const start = new Date(startDate);
          if (checkIn < start) return false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (checkIn > end) return false;
        }
      }

      // 3. Search Term
      if (searchTerm === "") return true;
      const term = searchTerm.toLowerCase();
      const guest = `${b.GuestFirstName || ''} ${b.GuestLastName || ''}`.toLowerCase();
      const id = (b.BookingID || b.ReservationNo || '').toString().toLowerCase();
      return guest.includes(term) || id.includes(term);
    });
  }, [bookings, activeTab, searchTerm, getNormalizedStatus, startDate, endDate]);

  // --- FIXED: SORTING LOGIC ---
  const sortedBookings = useMemo(() => {
    let sortableItems = [...filteredBookings];
    
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aValue, bValue;

        // 1. Map Table Keys to Data Values
        switch (sortConfig.key) {
          case 'Guest': // Combine First & Last Names
            aValue = `${a.GuestFirstName || ''} ${a.GuestLastName || ''}`.trim();
            bValue = `${b.GuestFirstName || ''} ${b.GuestLastName || ''}`.trim();
            break;

          case 'TotalAmount': // Map 'TotalAmount' column to 'GrandTotal' data
            aValue = parseFloat(a.GrandTotal || a.TotalAmount || 0);
            bValue = parseFloat(b.GrandTotal || b.TotalAmount || 0);
            break;

          case 'BookingID': // Ensure Numeric Sort
            aValue = Number(a.BookingID || a.ReservationNo || 0);
            bValue = Number(b.BookingID || b.ReservationNo || 0);
            break;

          case 'CheckInDate': // Convert to Timestamps
            aValue = new Date(a.CheckInDate || 0).getTime();
            bValue = new Date(b.CheckInDate || 0).getTime();
            break;

          default: // Fallback for direct keys (e.g., RoomName)
            aValue = a[sortConfig.key] || '';
            bValue = b[sortConfig.key] || '';
        }

        // 2. Compare Values
        
        // Handle Numbers (Amount, ID, Date Timestamps)
        if (typeof aValue === 'number' && typeof bValue === 'number') {
           return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }

        // Handle Strings (Case-Insensitive)
        const strA = String(aValue).toLowerCase();
        const strB = String(bValue).toLowerCase();

        if (strA < strB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (strA > strB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredBookings, sortConfig]);

  const paginatedBookings = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedBookings.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedBookings, currentPage, itemsPerPage]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const handleView = (b) => setSelectedBooking(b);
  const handleEdit = (b) => {
    setEditingBooking(b);
    setNewStatus(getNormalizedStatus(b)); 
  };

  const handleSaveStatus = async () => {
    if (!editingBooking || !statusKey) return;
    const updatedBookings = bookings.map((b) => {
      const bId = b.BookingID || b.ReservationNo;
      const editId = editingBooking.BookingID || editingBooking.ReservationNo;
      if (bId === editId) {
        return { ...b, [statusKey]: newStatus };
      }
      return b;
    });
    setBookings(updatedBookings);
    setEditingBooking(null);
    alert(`Status updated to ${newStatus} successfully!`);
  };

  const clearDateFilter = () => {
    setStartDate("");
    setEndDate("");
    setShowDateFilter(false);
  };

  const stats = useMemo(() => {
    return bookings.reduce((acc, curr) => {
      const status = getNormalizedStatus(curr).toLowerCase();
      if (status === 'confirmed') acc.confirmed++;
      else if (status === 'pending') acc.pending++;
      else if (status === 'cancelled') acc.cancelled++;
      return acc;
    }, { confirmed: 0, pending: 0, cancelled: 0 });
  }, [bookings, getNormalizedStatus]);

  return (
    <div className="space-y-6 animate-fade-in-up relative pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Bookings</h1>
          <p className="text-slate-500 text-sm mt-1">Manage all your hotel reservations</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center cursor-pointer gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium shadow-sm">
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Confirmed" count={stats.confirmed} icon={CheckCircle} color="emerald" active={activeTab === 'Confirmed'} onClick={() => setActiveTab('Confirmed')} />
        <StatCard label="Pending" count={stats.pending} icon={Clock} color="amber" active={activeTab === 'Pending'} onClick={() => setActiveTab('Pending')} />
        <StatCard label="Cancelled" count={stats.cancelled} icon={XCircle} color="red" active={activeTab === 'Cancelled'} onClick={() => setActiveTab('Cancelled')} />
      </div>

      {/* --- FILTERS & SEARCH BAR --- */}
      <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 relative z-20">
        
        {/* Tabs */}
        <div className="flex p-1 bg-slate-50 rounded-lg w-full md:w-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                activeTab === tab ? 'bg-white text-indigo-600 shadow-sm cursor-pointer' : 'text-slate-500 hover:text-slate-700 cursor-pointer'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search & Date Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto px-2 pb-2 md:pb-0">
          <div className="relative flex-1 md:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search guest or ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>
          
          {/* --- DATE FILTER BUTTON --- */}
          <div className="relative">
            <button 
              onClick={() => setShowDateFilter(!showDateFilter)}
              className={`p-2 border rounded-lg transition-colors flex items-center cursor-pointer gap-2 ${
                (startDate || endDate) 
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-600' 
                  : 'border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
              title="Filter by Date"
            >
              <Calendar size={18}/>
              {(startDate || endDate) && <span className="text-xs font-medium hidden sm:inline cursor-pointer">Active</span>}
            </button>

            {/* --- DATE FILTER DROPDOWN --- */}
            {showDateFilter && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-100 p-4 z-50 animate-fade-in">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold text-slate-700 text-sm">Filter by Check-In</h4>
                  <button onClick={clearDateFilter} className="text-xs cursor-pointer text-slate-400 hover:text-red-500 flex items-center gap-1">
                    <RefreshCw size={12}/> Clear
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Start Date</label>
                    <input 
                      type="date" 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full cursor-pointer text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">End Date</label>
                    <input 
                      type="date" 
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate}
                      className="w-full cursor-pointer text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-600"
                    />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-50 flex justify-end">
                  <button 
                    onClick={() => setShowDateFilter(false)} 
                    className="bg-indigo-600 cursor-pointer text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors w-full"
                  >
                    Apply Filter
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <BookingTable 
        bookings={paginatedBookings}
        loading={loading}
        getNormalizedStatus={getNormalizedStatus}
        getStatusColor={getStatusColor}
        onView={handleView}
        onEdit={handleEdit}
        onSort={handleSort}
        sortConfig={sortConfig}
        totalItems={filteredBookings.length}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
      />

      {/* --- MODALS (View & Edit) --- */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-semibold text-slate-800">Booking Details</h3>
              <button onClick={() => setSelectedBooking(null)}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4 text-sm">
               <div><p className="text-xs text-slate-500 uppercase">Guest</p><p className="font-medium">{selectedBooking.GuestFirstName} {selectedBooking.GuestLastName}</p></div>
               <div><p className="text-xs text-slate-500 uppercase">ID</p><p className="font-medium">{selectedBooking.BookingID || selectedBooking.ReservationNo}</p></div>
               <div><p className="text-xs text-slate-500 uppercase">Check In</p><p className="font-medium">{selectedBooking.CheckInDate}</p></div>
               <div><p className="text-xs text-slate-500 uppercase">Status</p>
                 <span className={`px-2 py-0.5 rounded text-xs border ${getStatusColor(getNormalizedStatus(selectedBooking))}`}>
                   {getNormalizedStatus(selectedBooking)}
                 </span>
               </div>
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end">
              <button onClick={() => setSelectedBooking(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium">Close</button>
            </div>
          </div>
        </div>
      )}

      {editingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Update Status</h3>
                <p className="text-xs text-slate-500">ID: #{editingBooking.BookingID || editingBooking.ReservationNo}</p>
              </div>
              <button onClick={() => setEditingBooking(null)}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100 flex gap-3 items-start">
                 <AlertCircle className="text-indigo-600 shrink-0 mt-0.5" size={18} />
                 <div className="text-xs text-indigo-800">
                    Changing status for <strong>{editingBooking.GuestFirstName}</strong>.
                 </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Select New Status</label>
                <div className="relative">
                  <select 
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full appearance-none bg-white border border-slate-300 text-slate-700 py-2.5 px-4 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Confirmed">Confirmed</option>
                    <option value="Pending">Pending</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
              <button onClick={() => setEditingBooking(null)} className="px-4 py-2 border border-slate-300 bg-white text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50">Cancel</button>
              <button onClick={handleSaveStatus} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm">
                <Save size={16} /> Save
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Stats Card Component
const StatCard = React.memo(({ label, count, icon: Icon, color, active, onClick }) => {
    const colors = {
        emerald: "bg-emerald-50 text-emerald-600 border-emerald-500 ring-emerald-500",
        amber: "bg-amber-50 text-amber-600 border-amber-500 ring-amber-500",
        red: "bg-red-50 text-red-600 border-red-500 ring-red-500",
    };
    const baseClass = `p-4 rounded-xl border cursor-pointer flex items-center justify-between shadow-sm transition-all`;
    const activeClass = active ? `ring-1 ${colors[color].split(" ").filter(c=>c.startsWith('border') || c.startsWith('ring')).join(" ")}` : "border-slate-200 hover:shadow-md";
    return (
        <div onClick={onClick} className={`${baseClass} ${activeClass} bg-white`}>
            <div>
                <p className="text-slate-500 text-xs uppercase font-bold tracking-wider">{label}</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">{count}</h3>
            </div>
            <div className={`p-3 rounded-lg ${colors[color].split(" ").slice(0, 2).join(" ")}`}>
                <Icon size={24} />
            </div>
        </div>
    );
});