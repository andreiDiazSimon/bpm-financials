"use client";

export default function DashboardPage() {
  return (
    <div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg text-[#1a1a1a] font-semibold mb-4">Module 1</h2>
        <p className="text-[#5c5c5c] mb-6">
          Welcome to Module 1 - Analytics Dashboard
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#f2f2f2] rounded-lg p-4">
            <h3 className="text-sm font-semibold text-[#1a1a1a] mb-2">Total Views</h3>
            <p className="text-2xl text-[#0067b8] font-bold">12,543</p>
            <p className="text-xs text-green-600">+12% from last month</p>
          </div>

          <div className="bg-[#f2f2f2] rounded-lg p-4">
            <h3 className="text-sm font-semibold text-[#1a1a1a] mb-2">Active Users</h3>
            <p className="text-2xl text-[#0067b8] font-bold">1,234</p>
            <p className="text-xs text-green-600">+8% from last month</p>
          </div>

          <div className="bg-[#f2f2f2] rounded-lg p-4">
            <h3 className="text-sm font-semibold text-[#1a1a1a] mb-2">Bounce Rate</h3>
            <p className="text-2xl text-[#0067b8] font-bold">42.3%</p>
            <p className="text-xs text-red-500">+2% from last month</p>
          </div>

          <div className="bg-[#f2f2f2] rounded-lg p-4">
            <h3 className="text-sm font-semibold text-[#1a1a1a] mb-2">Avg. Session</h3>
            <p className="text-2xl text-[#0067b8] font-bold">5m 23s</p>
            <p className="text-xs text-green-600">+15% from last month</p>
          </div>
        </div>
      </div>
    </div>
  );
}
