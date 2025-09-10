import React, { useState, useContext } from 'react';
import { useLocation, useNavigate, UNSAFE_NavigationContext as NavigationContext } from 'react-router-dom';

// --- SVG Icon Components ---
const KeyIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-gray-600"><circle cx="7.5" cy="15.5" r="5.5"></circle><path d="m21 2-9.6 9.6"></path><path d="m15.5 7.5 3 3L22 7l-3-3"></path></svg>);

// --- Helper function to create a new adult guest object ---
const createAdultGuest = (uniqueId) => ({
    uniqueId,
    fullName: '',
    email: '',
    phone: '',
});

// --- Helper function to generate initial state for guests distributed in rooms ---
const generateInitialRoomGuestsState = (roomsData = [], guestsData = { adults: 1, children: 0 }) => {
    const allIndividualRooms = [];
    roomsData.forEach(room => {
        for (let i = 0; i < room.quantity; i++) {
            allIndividualRooms.push({
                uniqueRoomId: `${room.roomId}-${i}`,
                roomTitle: room.title,
                roomNumber: i + 1,
                adults: [],
                children: [],
            });
        }
    });

    if (allIndividualRooms.length === 0) return [];

    let adultsToDistribute = guestsData.adults;
    let childrenToDistribute = guestsData.children;

    // Ensure at least one adult per room, if possible
    if (adultsToDistribute >= allIndividualRooms.length) {
        allIndividualRooms.forEach(room => {
            room.adults.push(createAdultGuest(`adult-${room.uniqueRoomId}-0`));
            adultsToDistribute--;
        });
    }

    // Distribute remaining guests into the first room
    let adultIdx = allIndividualRooms.length > 0 ? allIndividualRooms[0].adults.length : 0;
    while (adultsToDistribute > 0 && allIndividualRooms.length > 0) {
        allIndividualRooms[0].adults.push(createAdultGuest(`adult-${allIndividualRooms[0].uniqueRoomId}-${adultIdx++}`));
        adultsToDistribute--;
    }
    let childIdx = 0;
    while (childrenToDistribute > 0 && allIndividualRooms.length > 0) {
        allIndividualRooms[0].children.push({ uniqueId: `child-${allIndividualRooms[0].uniqueRoomId}-${childIdx++}`, fullName: '', age: '' });
        childrenToDistribute--;
    }

    return allIndividualRooms;
};

// --- Presentational Component: Contains all UI and logic but no router hooks ---
function GuestInfoFormView({ initialBookingDetails, navigate }) {
    // --- State Management ---
    const [bookingData] = useState(initialBookingDetails);
    const [roomGuests, setRoomGuests] = useState(() => generateInitialRoomGuestsState(bookingData.rooms, bookingData.guests));
    const [specialRequests, setSpecialRequests] = useState('');
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // --- Handlers ---
    const handleGuestCountChangeInRoomGroup = (roomTitle, guestType, amount) => {
        setRoomGuests(prevRoomGuests => {
            const newRoomGuests = JSON.parse(JSON.stringify(prevRoomGuests));
            const totalRooms = newRoomGuests.length;
            const totalAdults = newRoomGuests.reduce((sum, r) => sum + r.adults.length, 0);

            if (amount === 1) { // Add guest
                const firstRoomIndexInGroup = newRoomGuests.findIndex(r => r.roomTitle === roomTitle);
                if (firstRoomIndexInGroup === -1) return prevRoomGuests; // Should not happen

                if (guestType === 'adults') {
                    newRoomGuests[firstRoomIndexInGroup].adults.push(createAdultGuest(`adult-dynamic-${Date.now()}`));
                } else {
                    newRoomGuests[firstRoomIndexInGroup].children.push({ uniqueId: `child-dynamic-${Date.now()}`, fullName: '', age: '' });
                }
            } else if (amount === -1) { // Remove guest
                if (guestType === 'adults') {
                    if (totalAdults <= totalRooms) return prevRoomGuests; // Constraint: At least one adult per room overall

                    for (let i = newRoomGuests.length - 1; i >= 0; i--) {
                        if (newRoomGuests[i].roomTitle === roomTitle && newRoomGuests[i].adults.length > 0) {
                            newRoomGuests[i].adults.pop();
                            return newRoomGuests;
                        }
                    }
                } else { // Removing a child
                    for (let i = newRoomGuests.length - 1; i >= 0; i--) {
                         if (newRoomGuests[i].roomTitle === roomTitle && newRoomGuests[i].children.length > 0) {
                            newRoomGuests[i].children.pop();
                            return newRoomGuests;
                        }
                    }
                }
            }
            return newRoomGuests;
        });
    };

    const handleGuestInfoChange = (roomIndex, guestType, guestIndex, field, value) => {
        setRoomGuests(prev => {
            const newRoomGuests = JSON.parse(JSON.stringify(prev));
            newRoomGuests[roomIndex][guestType][guestIndex][field] = value;
            return newRoomGuests;
        });
        const errorKey = `${roomIndex}-${guestType}-${guestIndex}-${field}`;
        if (errors[errorKey]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[errorKey];
                return newErrors;
            });
        }
    };

    const validateForm = () => {
        const newErrors = {};
        let isValid = true;
        roomGuests.forEach((room, roomIndex) => {
            room.adults.forEach((guest, guestIndex) => {
                if (!guest.fullName.trim()) { newErrors[`${roomIndex}-adults-${guestIndex}-fullName`] = "Full name is required."; isValid = false; }
                if (!guest.email || !guest.email.trim()) { newErrors[`${roomIndex}-adults-${guestIndex}-email`] = "Email is required."; isValid = false; } 
                else if (!/\S+@\S+\.\S+/.test(guest.email)) { newErrors[`${roomIndex}-adults-${guestIndex}-email`] = "Email address is invalid."; isValid = false; }
                if (!guest.phone || !guest.phone.trim()) { newErrors[`${roomIndex}-adults-${guestIndex}-phone`] = "Phone number is required."; isValid = false; } 
                else if (!/^\+?(\d.*){10,15}$/.test(guest.phone)) { newErrors[`${roomIndex}-adults-${guestIndex}-phone`] = "Phone number is invalid."; isValid = false; }
            });
            room.children.forEach((guest, guestIndex) => {
                if (!guest.fullName.trim()) { newErrors[`${roomIndex}-children-${guestIndex}-fullName`] = "Full name is required."; isValid = false; }
                if (guest.age === '' || guest.age === null) { newErrors[`${roomIndex}-children-${guestIndex}-age`] = "Age is required."; isValid = false; } 
                else if (isNaN(guest.age) || guest.age < 0 || guest.age > 17) { newErrors[`${roomIndex}-children-${guestIndex}-age`] = "Enter a valid age (0-17)."; isValid = false; }
            });
        });
        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (validateForm()) {
            setIsSubmitting(true);
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const finalBookingData = { 
                guestInfoByRoom: roomGuests, 
                specialRequests, 
                bookingSummary: {
                    ...bookingData,
                    guests: {
                        adults: roomGuests.reduce((sum, r) => sum + r.adults.length, 0),
                        children: roomGuests.reduce((sum, r) => sum + r.children.length, 0)
                    }
                }, 
                bookingDate: new Date().toISOString() 
            };
            console.log('Proceeding to Payment with:', finalBookingData);
            setIsSubmitting(false);
            if(navigate) {
                navigate('/payment', { state: { booking: finalBookingData } });
            }
        }
    };

    const InputField = ({ id, label, type = "text", placeholder, value, onChange, error }) => (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input 
                type={type} id={id} name={id} 
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${error ? 'border-red-500' : 'border-gray-300'}`} 
                placeholder={placeholder} value={value} onChange={onChange}
            />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
    
    const groupedRooms = roomGuests.reduce((acc, room) => {
        (acc[room.roomTitle] = acc[room.roomTitle] || []).push(room);
        return acc;
    }, {});

    return (
        <div className="bg-gray-50 min-h-screen font-sans">
            <div className="container mx-auto p-4 sm:p-6 ">
                 
                <div className="max-w-8xl ">
                    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg">
                        <form onSubmit={handleSubmit} noValidate>
                            {Object.entries(groupedRooms).map(([roomTitle, rooms]) => {
                                const totalAdultsInGroup = rooms.reduce((sum, r) => sum + r.adults.length, 0);
                                const totalChildrenInGroup = rooms.reduce((sum, r) => sum + r.children.length, 0);
                                const totalAdultsInBooking = roomGuests.reduce((sum, r) => sum + r.adults.length, 0);
                                const totalRoomsInBooking = roomGuests.length;
                                
                                return (
                                <div key={roomTitle} className="mb-8 last:mb-0">
                                    <div className="pb-2 mb-4 border-b-2 border-indigo-200">
                                        <h2 className="text-3xl font-semibold text-black-700">Fill The Guest Information</h2>
                                    
                                        <h2 className="text-2xl font-bold text-indigo-700">{roomTitle}</h2>
                                        <div className="flex flex-col sm:flex-row justify-start items-center text-center gap-x-6 gap-y-2 mt-2">
                                            <div className="flex items-center gap-4 w-full sm:w-auto justify-between">
                                                <p className="font-semibold text-gray-800 text-sm">Adults</p>
                                                <div className="flex items-center space-x-2">
                                                    <button type="button" onClick={() => handleGuestCountChangeInRoomGroup(roomTitle, 'adults', -1)} disabled={totalAdultsInGroup === 0 || totalAdultsInBooking <= totalRoomsInBooking} className="h-7 w-7 rounded-full border flex items-center justify-center text-md hover:bg-gray-100 disabled:opacity-50">-</button>
                                                    <span className="w-6 text-center font-bold text-md">{totalAdultsInGroup}</span>
                                                    <button type="button" onClick={() => handleGuestCountChangeInRoomGroup(roomTitle, 'adults', 1)} className="h-7 w-7 rounded-full border flex items-center justify-center text-md hover:bg-gray-100">+</button>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 w-full sm:w-auto justify-between">
                                                <p className="font-semibold text-gray-800 text-sm">Children</p>
                                                <div className="flex items-center space-x-2">
                                                    <button type="button" onClick={() => handleGuestCountChangeInRoomGroup(roomTitle, 'children', -1)} disabled={totalChildrenInGroup === 0} className="h-7 w-7 rounded-full border flex items-center justify-center text-md hover:bg-gray-100 disabled:opacity-50">-</button>
                                                    <span className="w-6 text-center font-bold text-md">{totalChildrenInGroup}</span>
                                                    <button type="button" onClick={() => handleGuestCountChangeInRoomGroup(roomTitle, 'children', 1)} className="h-7 w-7 rounded-full border flex items-center justify-center text-md hover:bg-gray-100">+</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {rooms.map(room => {
                                        const originalRoomIndex = roomGuests.findIndex(r => r.uniqueRoomId === room.uniqueRoomId);
                                        return (
                                            <div key={room.uniqueRoomId} className="mb-6 border border-gray-200 rounded-lg p-4 bg-gray-50/50">
                                                <h3 className="text-lg font-semibold text-gray-800 mb-4">{rooms.length > 1 ? `Room #${room.roomNumber}` : 'Guest Details'}</h3>
                                                {room.adults.map((guest, guestIndex) => {
                                                    const isPrimaryContact = originalRoomIndex === 0 && guestIndex === 0;
                                                    return (
                                                        <div key={guest.uniqueId} className="pt-4 border-t border-gray-200 first:border-t-0 first:pt-0">
                                                            <p className="font-medium text-gray-600 mb-2">{isPrimaryContact ? 'Primary Contact' : `Adult #${guestIndex + 1}`}</p>
                                                            <div className="mb-4"><InputField id={`${guest.uniqueId}-fullName`} label="Full Name" placeholder="John Doe" value={guest.fullName} onChange={(e) => handleGuestInfoChange(originalRoomIndex, 'adults', guestIndex, 'fullName', e.target.value)} error={errors[`${originalRoomIndex}-adults-${guestIndex}-fullName`]}/></div>
                                                            <div className="mb-4"><InputField id={`${guest.uniqueId}-email`} label="Email Address" type="email" placeholder="you@example.com" value={guest.email} onChange={(e) => handleGuestInfoChange(originalRoomIndex, 'adults', guestIndex, 'email', e.target.value)} error={errors[`${originalRoomIndex}-adults-${guestIndex}-email`]}/></div>
                                                            <div className="mb-4"><InputField id={`${guest.uniqueId}-phone`} label="Phone Number" type="tel" placeholder="+91 12345 67890" value={guest.phone} onChange={(e) => handleGuestInfoChange(originalRoomIndex, 'adults', guestIndex, 'phone', e.target.value)} error={errors[`${originalRoomIndex}-adults-${guestIndex}-phone`]}/></div>
                                                        </div>
                                                    )
                                                })}
                                                {room.children.map((guest, guestIndex) => (
                                                    <div key={guest.uniqueId} className="pt-4 border-t border-gray-200">
                                                        <p className="font-medium text-gray-600 mb-2">{`Child #${guestIndex + 1}`}</p>
                                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                                                          <div className="sm:col-span-2"><InputField id={`${guest.uniqueId}-fullName`} label="Full Name" placeholder="Jane Doe" value={guest.fullName} onChange={(e) => handleGuestInfoChange(originalRoomIndex, 'children', guestIndex, 'fullName', e.target.value)} error={errors[`${originalRoomIndex}-children-${guestIndex}-fullName`]}/></div>
                                                          <div><InputField id={`${guest.uniqueId}-age`} label="Age" type="number" placeholder="8" value={guest.age} onChange={(e) => handleGuestInfoChange(originalRoomIndex, 'children', guestIndex, 'age', e.target.value)} error={errors[`${originalRoomIndex}-children-${guestIndex}-age`]}/></div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )
                                    })}
                                </div>
                            )})}
                            <div className="mt-8 pt-6 border-t border-gray-200">
                                <label htmlFor="requests" className="block text-sm font-medium text-gray-700 mb-1">Special Requests (Optional)</label>
                                <textarea id="requests" name="requests" rows="4" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="e.g., late check-in, room preference" value={specialRequests} onChange={(e) => setSpecialRequests(e.target.value)}></textarea>
                            </div>
                            <button type="submit" className="w-full mt-6 bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-wait focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-all flex items-center justify-center" disabled={isSubmitting}>
                                {isSubmitting ? (<><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Processing...</>) : ('Confirm & Proceed to Payment')}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- Wrapper Component: Connects the view to React Router ---
function ConnectedGuestInfoForm() {
    const location = useLocation();
    const navigate = useNavigate();
    const initialBookingDetails = location.state?.bookingDetails;
    return <GuestInfoFormView initialBookingDetails={initialBookingDetails} navigate={navigate} />;
}

// --- Main Export: Decides whether to render the real component or a fallback ---
export default function Guestinfo() {
    const hasRouterContext = useContext(NavigationContext) !== null;

    if (hasRouterContext) {
        // If inside a Router, render the component that uses hooks
        return <ConnectedGuestInfoForm />;
    }

    // Otherwise, render the view with mock data for preview purposes
    const mockNavigate = (path, options) => {
        console.log(`[Mock Navigate] to: ${path} with state:`, options?.state);
        alert(`Would navigate to ${path}`);
    };
    const mockBookingDetails = {
        rooms: [{ roomId: "1", title: 'Standard Room', quantity: 1 }, { roomId: "2", title: 'Deluxe Room', quantity: 1 }],
        guests: { adults: 2, children: 1 },
    };

    return <GuestinfoView initialBookingDetails={mockBookingDetails} navigate={mockNavigate} />;
}