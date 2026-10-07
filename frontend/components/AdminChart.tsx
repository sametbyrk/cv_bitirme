'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface ChartData {
  date: string;
  users: number;
  resumes: number;
}

interface AdminChartProps {
  data: ChartData[];
}

export function AdminChart({ data }: AdminChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-80 flex items-center justify-center bg-white rounded-2xl shadow-sm border border-gray-100 mt-8">
        <p className="text-gray-500 font-medium">No data available for the selected period.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-96 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mt-8">
      <h3 className="text-lg font-bold text-gray-800 mb-6">Daily Activity (Last 7 Days)</h3>
      <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7280', fontSize: 12 }}
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7280', fontSize: 12 }}
                allowDecimals={false}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Line 
                type="monotone" 
                name="New Users"
                dataKey="users" 
                stroke="#3B82F6" 
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2 }}
                activeDot={{ r: 8 }}
              />
              <Line 
                type="monotone" 
                name="New Resumes"
                dataKey="resumes" 
                stroke="#8B5CF6" 
                strokeWidth={3} 
                dot={{ r: 4, strokeWidth: 2 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
      </div>
    </div>
  );
}
