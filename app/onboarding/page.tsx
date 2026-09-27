'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Check } from 'lucide-react'
import { toast } from 'sonner'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [selectedRole, setSelectedRole] = useState('Social Media Manager')
  const [country, setCountry] = useState('United Arab Emirates')
  const [city, setCity] = useState('Dubai')
  const [businessType, setBusinessType] = useState('Restaurants')

  const roles = [
    { title: 'Social Media Manager', icon: '📱' },
    { title: 'Web Designer', icon: '💻' },
    { title: 'Graphic Designer', icon: '🎨' },
    { title: 'Video Editor', icon: '🎬' },
    { title: 'Copywriter', icon: '✍️' },
    { title: 'Photographer', icon: '📸' },
    { title: 'SEO Specialist', icon: '🔍' },
    { title: 'Other', icon: '🤖' },
  ]

  const countries = ['United Arab Emirates', 'India', 'United Kingdom', 'United States', 'Saudi Arabia', 'Australia', 'Canada']

  const handleFinish = () => {
    toast.success('Onboarding complete! 20 free credits loaded.')
    router.push(`/search?role=${encodeURIComponent(selectedRole)}&country=${encodeURIComponent(country)}&city=${encodeURIComponent(city)}&target=${encodeURIComponent(businessType)}`)
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto w-full">
        
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 mb-2">
            <span>Step {step} of 3</span>
            <span>{Math.round((step / 3) * 100)}% Completed</span>
          </div>
          <div className="h-2 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 shadow-xl">
          
          {/* Step 1 */}
          {step === 1 && (
            <div>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  What type of freelancer are you?
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  We customize your AI pitch templates and lead scoring based on your expertise.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                {roles.map((role) => {
                  const isSelected = selectedRole === role.title
                  return (
                    <button
                      key={role.title}
                      onClick={() => setSelectedRole(role.title)}
                      className={`p-4 rounded-xl border text-left flex items-center gap-3 transition-all ${
                        isSelected 
                          ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 shadow-sm'
                          : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 text-gray-800 dark:text-gray-200'
                      }`}
                    >
                      <span className="text-2xl">{role.icon}</span>
                      <span className="font-semibold text-sm">{role.title}</span>
                      {isSelected && <Check className="w-4 h-4 text-blue-600 ml-auto" />}
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow transition-all flex items-center justify-center gap-2"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Where do you want to find clients?
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Set your target location and business category for your first search.
                </p>
              </div>

              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Target Country
                  </label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {countries.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Target City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Dubai, London, Mumbai"
                    className="w-full h-11 px-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    What business type do you target?
                  </label>
                  <input
                    type="text"
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    placeholder="e.g. Restaurants, Salons, Cafes"
                    className="w-full h-11 px-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="w-1/3 py-3.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold rounded-xl transition-all"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="w-2/3 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow transition-all flex items-center justify-center gap-2"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl shadow-inner">
                🎉
              </div>

              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                You are all set!
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                You have <span className="font-bold text-blue-600 dark:text-blue-400">20 free credits</span> loaded in your account. Your first search is completely on us.
              </p>

              <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 rounded-2xl p-4 mb-8 text-left text-xs text-gray-700 dark:text-gray-300 space-y-2">
                <div className="flex justify-between font-semibold">
                  <span>Selected Service:</span>
                  <span className="text-blue-600 dark:text-blue-400">{selectedRole}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Target Area:</span>
                  <span className="text-blue-600 dark:text-blue-400">{city}, {country}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Target Business:</span>
                  <span className="text-blue-600 dark:text-blue-400">{businessType}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="w-1/3 py-3.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold rounded-xl transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleFinish}
                  className="w-2/3 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <span>Find my first client</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </main>
  )
}
