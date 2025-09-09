import { useState, useEffect } from 'react';
import { format, differenceInHours, differenceInMinutes } from 'date-fns';
import { useLocation, useNavigate } from 'react-router-dom';
import { searchFlights } from '../services/http';

const SearchResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [departureFlights, setDepartureFlights] = useState([]);
  const [returnFlights, setReturnFlights] = useState([]);
  const [departurePage, setDeparturePage] = useState(0);
  const [returnPage, setReturnPage] = useState(0);
  const [totalDeparturePages, setTotalDeparturePages] = useState(0);
  const [totalReturnPages, setTotalReturnPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('price');
  const [sortOrder, setSortOrder] = useState('asc');
  const [searchParams, setSearchParams] = useState(null);
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const [selectedDepartureFlight, setSelectedDepartureFlight] = useState(null);
  const [selectedReturnFlight, setSelectedReturnFlight] = useState(null);

  useEffect(() => {
    if (location.state?.searchParams) {
      const params = location.state.searchParams;
      setSearchParams(params);
      setIsRoundTrip(params.tripType === 'roundtrip');
      loadFlights(params, departurePage, returnPage);
    }
  }, [location]);

  useEffect(() => {
    if (searchParams) {
      loadFlights(searchParams, departurePage, returnPage);
    }
  }, [departurePage, returnPage, sortBy, sortOrder]);

  const loadFlights = async (params, depPage, retPage) => {
    setLoading(true);
    try {
      const response = await searchFlights({
        ...params,
        page: depPage,
        size: 10,
        sortBy,
        sortOrder
      });
      
      if (response.data) {
        if (depPage === 0) {
          setDepartureFlights(response.data.departureFlights.content);
          setTotalDeparturePages(response.data.departureFlights.totalPages);
        } else {
          setDepartureFlights(prevFlights => {
            const existingFlightIds = new Set(prevFlights.map(f => f.id));
            const newFlights = response.data.departureFlights.content.filter(
              newFlight => !existingFlightIds.has(newFlight.id)
            );
            return [...prevFlights, ...newFlights];
          });
        }

        if (response.data.roundTrip && response.data.returnFlights) {
          if (retPage === 0) {
            setReturnFlights([...response.data.returnFlights.content]);
            setTotalReturnPages(response.data.returnFlights.totalPages);
          } else {
            setReturnFlights(prevFlights => {
              const existingFlightIds = new Set(prevFlights.map(f => f.id));
              const newFlights = response.data.returnFlights.content.filter(
                newFlight => !existingFlightIds.has(newFlight.id)
              );
              return [...prevFlights, ...newFlights];
            });
          }
        }
      }
    } catch (error) {
      console.error('Error loading flights:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setDeparturePage(0);
    setReturnPage(0);
  };

  const calculateDuration = (departureDateStr, departureTimeStr, arrivalTimeStr) => {
    const departureDateTime = new Date(`${departureDateStr}T${departureTimeStr}`);
    let arrivalDateTime = new Date(`${departureDateStr}T${arrivalTimeStr}`);

    // If arrival time is earlier than departure time, it's on the next day
    if (arrivalDateTime.getTime() < departureDateTime.getTime()) {
        arrivalDateTime.setDate(arrivalDateTime.getDate() + 1);
    }

    const diffMs = arrivalDateTime.getTime() - departureDateTime.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  const SortButton = ({ field, label }) => {
    const isActive = sortBy === field;
  
    return (
      <button
        onClick={() => handleSort(field)}
        className={`flex items-center justify-between w-1/5 px-2 py-1 text-sm ${
          isActive ? 'text-blue-600 font-semibold' : 'text-gray-600'
        }`}
        style={{ minWidth: '120px' }}
      >
        <span>{label}</span>
        {isActive && (
          <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
        )}
      </button>
    );
  };

  const FlightCard = ({ flight, isReturn }) => (
    <div className="bg-white shadow rounded-lg p-6 mb-4">
      <div className="flex items-center justify-between">
        <div className="w-1/5 flex items-center space-x-4">
          <span className="font-medium text-gray-800">{flight.airlineName}</span>
        </div>

        <div className="w-1/5 text-left">
          <div className="text-lg font-semibold">{flight.departureTime}</div>
          <div className="text-sm text-gray-500">{flight.departureAirport}</div>
          <div className="text-xs text-gray-400">
            {format(new Date(flight.departureDate), 'MMM d')}
          </div>
        </div>

        <div className="w-1/5 text-center">
          <div className="text-sm text-gray-600 font-medium">
            {calculateDuration(flight.departureDate, flight.departureTime, flight.arrivalTime)}
          </div>
          <div className="text-xs text-gray-400">Direct</div>
        </div>

        <div className="w-1/5 text-right">
          <div className="text-lg font-semibold">{flight.arrivalTime}</div>
          <div className="text-sm text-gray-500">{flight.destinationAirport}</div>
        </div>

        <div className="w-1/5 text-right">
          <div className="text-2xl font-bold text-blue-600">${flight.price}</div>
          <div className="text-sm text-gray-500 mb-2">{flight.availableSeats} seats left</div>
          <button
            onClick={() => {
              if (!isReturn) {
                setSelectedDepartureFlight(flight);
                if (!isRoundTrip) {
                  navigate('/my-bookings', {
                    state: {
                      selectedDepartureFlight: flight,
                      cabinClass: searchParams.cabinClass
                    }
                  });
                } else {
                  console.log('Departure flight selected:', flight);
                  alert('Departure flight selected! Now select your return flight.');
                }
              } else {
                if (selectedDepartureFlight) {
                  setSelectedReturnFlight(flight);
                  navigate('/my-bookings', {
                    state: {
                      selectedDepartureFlight: selectedDepartureFlight,
                      selectedReturnFlight: flight,
                      cabinClass: searchParams.cabinClass
                    }
                  });
                } else {
                  console.warn('Return flight selected before departure flight. Please select a departure flight first.');
                  alert('Please select a departure flight first.');
                }
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Select
          </button>
        </div>
      </div>
    </div>
  );

  const handleLoadMore = (isReturn = false) => {
    if (isReturn) {
      setReturnPage(prev => prev + 1);
    } else {
      setDeparturePage(prev => prev + 1);
    }
  };

  const LoadMoreButton = ({ isReturn }) => {
    const currentPage = isReturn ? returnPage : departurePage;
    const totalPages = isReturn ? totalReturnPages : totalDeparturePages;
    
    if (!loading && currentPage < totalPages - 1) {
      return (
        <div className="mt-8 text-center">
          <button
            onClick={() => handleLoadMore(isReturn)}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Load More {isReturn ? 'Return' : 'Departure'} Flights
          </button>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-4 mb-6">
          <div className="flex space-x-4 items-center">
            <SortButton field="price" label="Price" />
            <SortButton field="departureTime" label="Departure Time" />
            <SortButton field="duration" label="Duration" />
          </div>
        </div>

        {/* Flight List */}
        <div className="space-y-8">
          {/* Departure Flights */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Departure Flights</h2>
            {departureFlights.map((flight) => (
              <FlightCard key={flight.id} flight={flight} isReturn={false} />
            ))}
            <LoadMoreButton isReturn={false} />
          </div>

          {/* Return Flights */}
          {isRoundTrip && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Return Flights</h2>
              {returnFlights && returnFlights.length > 0 ? (
                <>
                  {returnFlights.map((flight) => (
                    <FlightCard key={flight.id} flight={flight} isReturn={true} />
                  ))}
                  <LoadMoreButton isReturn={true} />
                </>
              ) : (
                <div className="text-center text-gray-500 py-4">No return flights found</div>
              )}
            </div>
          )}
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="mt-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResultPage;
