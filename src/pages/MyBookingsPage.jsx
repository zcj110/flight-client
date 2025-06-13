import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { isAuthenticated } from '../services/http';

function MyBookingsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [departureFlight, setDepartureFlight] = useState(null);
  const [returnFlight, setReturnFlight] = useState(null);
  const [cabinClass, setCabinClass] = useState('');
  const [baseFare, setBaseFare] = useState(0);
  const [taxes, setTaxes] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);

  useEffect(() => {
    console.log('MyBookingsPage location.state:', location.state);
    if (location.state) {
      const stateData = location.state.bookingState || location.state;
      console.log('MyBookingsPage stateData:', stateData);
      const { selectedDepartureFlight, selectedReturnFlight, cabinClass: selectedCabinClass } = stateData;
      
      setDepartureFlight(selectedDepartureFlight);
      setReturnFlight(selectedReturnFlight || null);
      setCabinClass(selectedCabinClass || 'Economy');

      let calculatedBaseFare = 0;
      if (selectedDepartureFlight) {
        calculatedBaseFare += selectedDepartureFlight.price;
      }
      if (selectedReturnFlight) {
        calculatedBaseFare += selectedReturnFlight.price;
      }

      const calculatedTaxes = calculatedBaseFare * 0.10;
      const calculatedTotalPrice = calculatedBaseFare + calculatedTaxes;

      setBaseFare(calculatedBaseFare);
      setTaxes(calculatedTaxes);
      setTotalPrice(calculatedTotalPrice);
    }
  }, [location.state]);

  const handleContinueToPayment = () => {
    console.log('isAuthenticated:', isAuthenticated());
    if (isAuthenticated()) {
      console.log('Proceeding to payment...');

      alert("payment success!")
    } else {
      const bookingState = {
        selectedDepartureFlight: departureFlight,
        selectedReturnFlight: returnFlight,
        cabinClass: cabinClass
      };
      
      navigate('/login', { 
        state: { 
          from: '/my-bookings',
          bookingState: bookingState
        }
      });
    }
  };

  const FlightDetailsCard = ({ flight, type }) => (
    <div className="bg-white shadow rounded-lg p-6 mb-4">
      <h3 className="text-xl font-semibold mb-4">{type} Flight</h3>
      {flight ? (
        <>
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium text-gray-800">{flight.airlineName}</span>
            <span className="text-sm text-gray-600">Flight {flight.flightNumber}</span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center items-center mb-4">
            <div>
              <div className="text-lg font-semibold">{flight.departureTime}</div>
              <div className="text-sm text-gray-500">{flight.departureAirport}</div>
              <div className="text-xs text-gray-400">
                {format(new Date(flight.departureDate), 'MMM d, yyyy')}
              </div>
            </div>
            <div className="text-gray-500">→</div>
            <div>
              <div className="text-lg font-semibold">{flight.arrivalTime}</div>
              <div className="text-sm text-gray-500">{flight.destinationAirport}</div>
              <div className="text-xs text-gray-400">
                {format(new Date(flight.departureDate), 'MMM d, yyyy')}
              </div>
            </div>
          </div>
          <div className="text-right text-lg font-bold text-blue-600">
            Price: ${flight.price.toFixed(2)}
          </div>
        </>
      ) : (
        <div className="text-center text-gray-500">No flight information available.</div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Your Booking Summary</h1>

        {departureFlight && (
          <FlightDetailsCard flight={departureFlight} type="Departure" />
        )}

        {returnFlight && (
          <FlightDetailsCard flight={returnFlight} type="Return" />
        )}

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">Booking Details</h3>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-700">Cabin Class:</span>
            <span className="font-semibold">{cabinClass}</span>
          </div>
          <div className="border-t border-gray-200 my-4"></div>
          <h3 className="text-xl font-semibold mb-4">Price Details</h3>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-700">Base Fare:</span>
            <span className="font-semibold">${baseFare.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-700">Taxes & Fees:</span>
            <span className="font-semibold">${taxes.toFixed(2)}</span>
          </div>
          <div className="border-t border-gray-200 my-4"></div>
          <div className="flex justify-between items-center font-bold text-lg">
            <span>Total Price:</span>
            <span className="text-blue-600">${totalPrice.toFixed(2)}</span>
          </div>
        </div>

        <div className="text-center mt-8">
          <button
            onClick={handleContinueToPayment}
            className="px-8 py-4 bg-blue-600 text-white text-xl font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Continue to Payment
          </button>
        </div>
      </div>
    </div>
  );
}

export default MyBookingsPage;
