"use client";

import { Construction } from "lucide-react";

export default function BudgetingAndCostAllocation() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center max-w-md">
        <div className="w-16 h-16 bg-[#f2f2f2] rounded-full flex items-center justify-center mx-auto mb-6">
          <Construction className="w-8 h-8 text-[#0067b8]" />
        </div>
        <h1 className="text-xl font-semibold text-[#1a1a1a] mb-3">
          Budget and Cost Allocation
        </h1>
        <p className="text-[#5c5c5c] mb-2">
          This module is under construction.
        </p>
        <p className="text-sm text-[#5c5c5c]">Check back soon for updates.</p>
      </div>
    </div>
  );
}
