import { useState, useEffect } from 'react';
import { format, isAfter, isBefore } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { searchFlights, getAirports, isAuthenticated, logout } from '../services/http';

const HomePage = () => {
  const navigate = useNavigate();
  const [airports, setAirports] = useState([]);
  const [searchParams, setSearchParams] = useState({
    from: '',
    to: '',
    tripType: 'oneway', // 'oneway' or 'roundtrip'
    cabinClass: 'economy', // 'economy', 'business', 'firstClass'
    departureDate: format(new Date(), 'yyyy-MM-dd'),
    returnDate: format(new Date(), 'yyyy-MM-dd'),
    passengers: 1
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAirports = async () => {
      try {
        const response = await getAirports();
        setAirports(response.data || []);
      } catch (error) {
        console.error('Failed to fetch airports:', error);
        setAirports([]);
      }
    };
    fetchAirports();
  }, []);

  const validateForm = () => {
    const newErrors = {};
    
    if (!searchParams.from) {
      newErrors.from = 'Departure city is required';
    }
    if (!searchParams.to) {
      newErrors.to = 'Arrival city is required';
    }
    if (searchParams.from === searchParams.to) {
      newErrors.to = 'Departure and arrival cities cannot be the same';
    }
    
    const today = new Date();
    const departureDate = new Date(searchParams.departureDate);
    
    if (isBefore(departureDate, today)) {
      newErrors.departureDate = 'Departure date cannot be earlier than today';
    }
    
    if (searchParams.tripType === 'roundtrip') {
      const returnDate = new Date(searchParams.returnDate);
      if (isBefore(returnDate, departureDate)) {
        newErrors.returnDate = 'Return date cannot be earlier than departure date';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      setLoading(true);
      try {
        const response = await searchFlights(searchParams);
        navigate('/search-results', { 
          state: { 
            searchParams,
            initialResults: response 
          }
        });
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleTripTypeChange = (type) => {
    setSearchParams(prev => ({
      ...prev,
      tripType: type,
      returnDate: type === 'oneway' ? '' : prev.returnDate
    }));
  };

  const handleLogout = () => {
    logout();
    navigate('/'); // Redirect to home page after logout
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Flight Search
          </h1>
          
          {isAuthenticated() && (
            <div className="text-right mb-4">
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Logout
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Trip Type Selection */}
            <div className="flex space-x-4 mb-6">
              <button
                type="button"
                onClick={() => handleTripTypeChange('oneway')}
                className={`flex-1 py-2 px-4 rounded-md ${
                  searchParams.tripType === 'oneway'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                One Way
              </button>
              <button
                type="button"
                onClick={() => handleTripTypeChange('roundtrip')}
                className={`flex-1 py-2 px-4 rounded-md ${
                  searchParams.tripType === 'roundtrip'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                Round Trip
              </button>
            </div>

            {/* Departure and Arrival */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="from" className="block text-sm font-medium text-gray-700">
                  From
                </label>
                <select
                  id="from"
                  value={searchParams.from}
                  onChange={(e) => setSearchParams({...searchParams, from: e.target.value})}
                  className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                    errors.from ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                >
                  <option value="">Select departure city</option>
                  {airports.map((airport) => (
                    <option key={airport.id} value={airport.id}>
                      {airport.city} ({airport.code})
                    </option>
                  ))}
                </select>
                {errors.from && <p className="mt-1 text-sm text-red-600">{errors.from}</p>}
              </div>

              <div>
                <label htmlFor="to" className="block text-sm font-medium text-gray-700">
                  To
                </label>
                <select
                  id="to"
                  value={searchParams.to}
                  onChange={(e) => setSearchParams({...searchParams, to: e.target.value})}
                  className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                    errors.to ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                >
                  <option value="">Select arrival city</option>
                  {airports.map((airport) => (
                    <option key={airport.id} value={airport.id}>
                      {airport.city} ({airport.code})
                    </option>
                  ))}
                </select>
                {errors.to && <p className="mt-1 text-sm text-red-600">{errors.to}</p>}
              </div>
            </div>

            {/* Cabin Class Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cabin Class
              </label>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: 'economy', label: 'Economy' },
                  { value: 'business', label: 'Business' },
                  { value: 'firstClass', label: 'First Class' }
                ].map((cabin) => (
                  <button
                    key={cabin.value}
                    type="button"
                    onClick={() => setSearchParams({...searchParams, cabinClass: cabin.value})}
                    className={`py-2 px-4 rounded-md ${
                      searchParams.cabinClass === cabin.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {cabin.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Selection */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="departureDate" className="block text-sm font-medium text-gray-700">
                  Departure Date
                </label>
                <input
                  type="date"
                  id="departureDate"
                  value={searchParams.departureDate}
                  onChange={(e) => setSearchParams({...searchParams, departureDate: e.target.value})}
                  className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                    errors.departureDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.departureDate && <p className="mt-1 text-sm text-red-600">{errors.departureDate}</p>}
              </div>

              {searchParams.tripType === 'roundtrip' && (
                <div>
                  <label htmlFor="returnDate" className="block text-sm font-medium text-gray-700">
                    Return Date
                  </label>
                  <input
                    type="date"
                    id="returnDate"
                    value={searchParams.returnDate}
                    onChange={(e) => setSearchParams({...searchParams, returnDate: e.target.value})}
                    className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                      errors.returnDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {errors.returnDate && <p className="mt-1 text-sm text-red-600">{errors.returnDate}</p>}
                </div>
              )}
            </div>

            {/* Passengers */}
            <div>
              <label htmlFor="passengers" className="block text-sm font-medium text-gray-700">
                Passengers
              </label>
              <input
                type="number"
                id="passengers"
                min="1"
                max="9"
                value={searchParams.passengers}
                onChange={(e) => setSearchParams({...searchParams, passengers: parseInt(e.target.value)})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Search Button */}
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={loading}
                className={`w-full sm:w-auto px-8 py-3 border border-transparent text-base font-medium rounded-md text-white ${
                  loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
              >
                {loading ? 'Searching...' : 'Search Flights'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 