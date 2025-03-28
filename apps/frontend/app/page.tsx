export default function Home() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-2xl font-semibold mb-4">Market Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Placeholder for charts and metrics */}
          <div className="bg-gray-50 p-4 rounded-lg h-40 flex items-center justify-center">
            Chart Placeholder
          </div>
          <div className="bg-gray-50 p-4 rounded-lg h-40 flex items-center justify-center">
            Metrics Placeholder
          </div>
          <div className="bg-gray-50 p-4 rounded-lg h-40 flex items-center justify-center">
            Social Signals Placeholder
          </div>
        </div>
      </div>
    </div>
  )
}