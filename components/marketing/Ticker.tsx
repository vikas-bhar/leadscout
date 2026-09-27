'use client'

export function Ticker() {
  const items = [
    'Restaurants in Dubai',
    'Salons in London',
    'Cafes in Mumbai',
    'Hotels in New York',
    'Gyms in Sydney',
    'Shops in Toronto',
    'Spas in Singapore',
    'Bakeries in Paris',
  ]

  return (
    <div className="bg-gray-950 py-4 overflow-hidden border-y border-gray-800">
      <div className="flex w-max animate-ticker">
        {/* Render twice for seamless infinite scroll */}
        {[...items, ...items, ...items].map((item, idx) => (
          <div key={idx} className="flex items-center mx-6 text-sm font-medium text-gray-400">
            <span>{item}</span>
            <span className="ml-6 w-1.5 h-1.5 rounded-full bg-blue-500" />
          </div>
        ))}
      </div>
    </div>
  )
}
