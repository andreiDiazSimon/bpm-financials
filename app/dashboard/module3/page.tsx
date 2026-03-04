"use client";

export default function ProjectsPage() {
  return (
    <div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg text-[#1a1a1a] font-semibold mb-4">Module 4</h2>
        <p className="text-[#5c5c5c] mb-6">
          Welcome to Module 4 - Project Management
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#f2f2f2] rounded-lg p-4">
            <h3 className="text-sm font-semibold text-[#1a1a1a] mb-2">Active Projects</h3>
            <p className="text-2xl text-[#0067b8] font-bold">18</p>
            <p className="text-xs text-green-600">On track</p>
          </div>

          <div className="bg-[#f2f2f2] rounded-lg p-4">
            <h3 className="text-sm font-semibold text-[#1a1a1a] mb-2">Completed</h3>
            <p className="text-2xl text-[#0067b8] font-bold">42</p>
            <p className="text-xs text-[#5c5c5c]">This year</p>
          </div>

          <div className="bg-[#f2f2f2] rounded-lg p-4">
            <h3 className="text-sm font-semibold text-[#1a1a1a] mb-2">Pending Review</h3>
            <p className="text-2xl text-[#0067b8] font-bold">5</p>
            <p className="text-xs text-orange-500">Needs attention</p>
          </div>
        </div>
      </div>
    </div>
  );
}
