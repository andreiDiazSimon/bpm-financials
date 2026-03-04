"use client";

export default function AnalyticsPage() {
  return (
    <div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg text-[#1a1a1a] font-semibold mb-4">Module 2</h2>
        <p className="text-[#5c5c5c] mb-6">
          Welcome to Module 2 - Dashboard Overview
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#f2f2f2] rounded-lg p-4">
            <h3 className="text-sm font-semibold text-[#1a1a1a] mb-2">Overview</h3>
            <p className="text-xs text-[#5c5c5c]">
              Module 2 provides a comprehensive dashboard overview of your system.
            </p>
          </div>

          <div className="bg-[#f2f2f2] rounded-lg p-4">
            <h3 className="text-sm font-semibold text-[#1a1a1a] mb-2">Status</h3>
            <p className="text-xs text-green-600 font-medium">Active</p>
          </div>

          <div className="bg-[#f2f2f2] rounded-lg p-4">
            <h3 className="text-sm font-semibold text-[#1a1a1a] mb-2">Last Updated</h3>
            <p className="text-xs text-[#5c5c5c]">
              {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
