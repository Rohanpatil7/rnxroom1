// src/admin/pages/SummaryReport.jsx
import React, { useEffect, useState } from "react";
import { 
  Calendar, Search, Download, FileText, 
  CheckCircle, IndianRupee, PieChart, AlertCircle
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from "recharts";
import { BallTriangle } from "react-loader-spinner";

import { fetchSummaryReport } from "../apis/admin_api";
import StatCard from "../components/StateCard"; 

export default function SummaryReport() {
  // ----------------------------
  // 1️⃣ STATE VARIABLES
  // ----------------------------
  const today = new Date().toISOString().split("T")[0];
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [paymentSummary, setPaymentSummary] = useState(null);
  const [categoryList, setCategoryList] = useState([]);

  // ----------------------------
  // 2️⃣ API CALL
  // ----------------------------
  const loadSummaryReport = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetchSummaryReport({
        FromDate: fromDate,
        ToDate: toDate,
      });

      if (response?.status === 1) {
        setPaymentSummary(response.payment_summary || null);

        // Normalize data keys if backend has typos (e.g., catergory_name)
        const categories = (response.categorywise_bookings || []).map(
          (item) => ({
            category_name: item.category_name ?? item.catergory_name ?? "Unknown",
            booking_count: Number(item.booking_count || 0),
            booking_amount: Number(item.booking_amount || 0),
          })
        );
        setCategoryList(categories);
      } else {
        setPaymentSummary(null);
        setCategoryList([]);
        setError("No data found for the selected date range.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to connect to the server.");
      setPaymentSummary(null);
      setCategoryList([]);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------
  // 3️⃣ INITIAL LOAD
  // ----------------------------
  useEffect(() => {
    loadSummaryReport();
  }, []);

  const totalBookingAmount = categoryList.reduce(
    (sum, item) => sum + item.booking_amount,
    0
  );

  const handleExport = () => {
    if (categoryList.length === 0) return;
    
    // Simple CSV Export Logic
    const headers = ["Category,Bookings,Amount"];
    const rows = categoryList.map(c => 
      `${c.category_name},${c.booking_count},${c.booking_amount}`
    );
    const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `summary_report_${fromDate}_${toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in-up pb-20">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Summary Report</h1>
          <p className="text-slate-500 text-sm mt-1">
            Financial and operational overview
          </p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={handleExport}
                disabled={categoryList.length === 0}
                className="flex items-center cursor-pointer gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Download size={16} /> Export CSV
            </button>
        </div>
      </div>

      {/* --- FILTERS BAR --- */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-end md:items-center gap-4">
        
        {/* From Date */}
        <div className="w-full md:w-auto">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">From</label>
            <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16}/>
                <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full md:w-48 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all cursor-pointer text-slate-600 font-medium"
                />
            </div>
        </div>

        {/* To Date */}
        <div className="w-full md:w-auto">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">To</label>
            <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16}/>
                <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full md:w-48 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all cursor-pointer text-slate-600 font-medium"
                />
            </div>
        </div>

        {/* Action Button */}
        <button
          onClick={loadSummaryReport}
          className="w-full md:w-auto mt-auto flex items-center justify-center cursor-pointer gap-2 bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 active:scale-95 transition-all shadow-md shadow-indigo-100 h-[38px]"
        >
          <Search size={16} /> Generate
        </button>
      </div>

      {/* --- LOADING STATE --- */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-100">
           <BallTriangle color="#4F46E5" height={60} width={60} visible={true} />
           <p className="mt-4 text-slate-400 text-sm animate-pulse">Crunching numbers...</p>
        </div>
      )}

      {/* --- ERROR STATE --- */}
      {!loading && error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-6 text-center text-red-600">
            <AlertCircle className="mx-auto mb-2" size={32} />
            <p className="font-medium">{error}</p>
        </div>
      )}

      {/* --- CONTENT --- */}
      {!loading && !error && paymentSummary && (
        <div className="space-y-6 animate-fade-in">
            
            {/* 1. STATS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                    label="Total Bookings"
                    value={paymentSummary.total_bookings}
                    icon={FileText}
                    color="text-indigo-600"
                />
                <StatCard
                    label="Paid Bookings"
                    value={paymentSummary.paid_bookings}
                    icon={CheckCircle}
                    color="text-emerald-600"
                />
                <StatCard
                    label="Total Revenue"
                    value={`₹ ${totalBookingAmount.toLocaleString("en-IN")}`}
                    icon={IndianRupee}
                    color="text-violet-600"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* 2. CHART SECTION */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                            <PieChart size={18} />
                        </div>
                        <h2 className="font-bold text-slate-800">Revenue by Category</h2>
                    </div>

                    <div className="flex-1 min-h-[300px]">
                        {categoryList.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={categoryList} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis 
                                        dataKey="category_name" 
                                        tick={{ fontSize: 11, fill: '#64748b' }} 
                                        axisLine={false} 
                                        tickLine={false}
                                        dy={10}
                                    />
                                    <YAxis 
                                        tick={{ fontSize: 11, fill: '#64748b' }} 
                                        axisLine={false} 
                                        tickLine={false}
                                        tickFormatter={(val) => `₹${val/1000}k`}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                                        formatter={(value) => [`₹ ${value.toLocaleString("en-IN")}`, 'Revenue']}
                                    />
                                    <Bar
                                        dataKey="booking_amount"
                                        fill="#6366f1"
                                        radius={[6, 6, 0, 0]}
                                        barSize={40}
                                        animationDuration={1500}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                                No revenue data available
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. TABLE SECTION */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800">Category Breakdown</h3>
                        <span className="text-xs font-medium text-slate-500 bg-white border px-2 py-1 rounded">
                            {categoryList.length} Categories
                        </span>
                    </div>
                    
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    <th className="px-6 py-4">Category Name</th>
                                    <th className="px-6 py-4 text-center">Count</th>
                                    <th className="px-6 py-4 text-right">Revenue</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {categoryList.length > 0 ? (
                                    categoryList.map((item, index) => (
                                        <tr key={index} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-700">
                                                {item.category_name}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                                    {item.booking_count}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-semibold text-indigo-600">
                                                ₹ {item.booking_amount.toLocaleString("en-IN")}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-12 text-center text-slate-400 text-sm">
                                            No data to display
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
      )}
    </div>
  );
}