"use client";

export default function ReportsPage() {
  return (
    <div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg text-[#1a1a1a] font-semibold mb-4">Module 5</h2>
        <p className="text-[#5c5c5c] mb-6">
          Welcome to Module 5 - Reports & Analytics
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#f2f2f2] rounded-lg p-4">
            <h3 className="text-sm font-semibold text-[#1a1a1a] mb-2">Generated Reports</h3>
            <p className="text-2xl text-[#0067b8] font-bold">89</p>
            <p className="text-xs text-green-600">+12 this month</p>
          </div>

          <div className="bg-[#f2f2f2] rounded-lg p-4">
            <h3 className="text-sm font-semibold text-[#1a1a1a] mb-2">Scheduled</h3>
            <p className="text-2xl text-[#0067b8] font-bold">6</p>
            <p className="text-xs text-[#5c5c5c]">Auto-generated weekly</p>
          </div>

          <div className="bg-[#f2f2f2] rounded-lg p-4">
            <h3 className="text-sm font-semibold text-[#1a1a1a] mb-2">Data Export</h3>
            <p className="text-2xl text-[#0067b8] font-bold">24</p>
            <p className="text-xs text-green-600">Downloads this week</p>
          </div>
        </div>
      </div>
    </div>
  );
}
