"use client";

export default function UsersPage() {
  return (
    <div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg text-[#1a1a1a] font-semibold mb-4">Module 3</h2>
        <p className="text-[#5c5c5c] mb-6">
          Welcome to Module 3 - User Management
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#f2f2f2] rounded-lg p-4">
            <h3 className="text-sm font-semibold text-[#1a1a1a] mb-2">Total Users</h3>
            <p className="text-2xl text-[#0067b8] font-bold">256</p>
            <p className="text-xs text-green-600">+5 this week</p>
          </div>

          <div className="bg-[#f2f2f2] rounded-lg p-4">
            <h3 className="text-sm font-semibold text-[#1a1a1a] mb-2">Active Users</h3>
            <p className="text-2xl text-[#0067b8] font-bold">189</p>
            <p className="text-xs text-green-600">74% active rate</p>
          </div>

          <div className="bg-[#f2f2f2] rounded-lg p-4">
            <h3 className="text-sm font-semibold text-[#1a1a1a] mb-2">New Signups</h3>
            <p className="text-2xl text-[#0067b8] font-bold">12</p>
            <p className="text-xs text-green-600">+3 from last week</p>
          </div>
        </div>
      </div>
    </div>
  );
}
