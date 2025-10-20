import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { format, addDays, addHours, setHours, setMinutes } from 'date-fns';
import { FiCalendar, FiClock, FiVideo, FiMapPin, FiDollarSign, FiCheck, FiX } from 'react-icons/fi';

interface TimeSlot {
  id: string;
  start: Date;
  end: Date;
  available: boolean;
  booked?: boolean;
  price?: number;
}

interface Appointment {
  id: string;
  attorneyId: string;
  clientId: string;
  clientName: string;
  date: Date;
  startTime: string;
  endTime: string;
  type: 'consultation' | 'meeting' | 'court' | 'document_review';
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  meetingType: 'in_person' | 'video' | 'phone';
  location?: string;
  videoLink?: string;
  notes?: string;
  price: number;
  isPaid: boolean;
}

interface AttorneyAvailability {
  attorneyId: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:MM format
  endTime: string;
  isRecurring: boolean;
  consultationDuration: number; // in minutes
  bufferTime: number; // minutes between appointments
  maxBookingsPerDay: number;
}

interface CalendarProps {
  attorneyId: string;
  isAttorneyView?: boolean;
  onBookingComplete?: (appointment: Appointment) => void;
}

export const AttorneyCalendar: React.FC<CalendarProps> = ({ 
  attorneyId, 
  isAttorneyView = false,
  onBookingComplete 
}) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [availability, setAvailability] = useState<AttorneyAvailability[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingDetails, setBookingDetails] = useState({
    type: 'consultation',
    meetingType: 'video',
    notes: '',
    clientName: '',
    clientEmail: '',
    clientPhone: ''
  });
  const [loading, setLoading] = useState(false);

  // Load attorney availability and appointments
  useEffect(() => {
    loadAvailability();
    loadAppointments();
  }, [attorneyId]);

  const loadAvailability = async () => {
    try {
      const response = await fetch(`/api/attorneys/${attorneyId}/availability`);
      if (response.ok) {
        const data = await response.json();
        setAvailability(data.availability);
      }
    } catch (error) {
      console.error('Error loading availability:', error);
    }
  };

  const loadAppointments = async () => {
    try {
      const response = await fetch(`/api/attorneys/${attorneyId}/appointments`);
      if (response.ok) {
        const data = await response.json();
        setAppointments(data.appointments);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  };

  // Generate available time slots for a selected date
  const generateTimeSlots = (date: Date) => {
    const dayOfWeek = date.getDay();
    const dayAvailability = availability.find(a => a.dayOfWeek === dayOfWeek);
    
    if (!dayAvailability) {
      setAvailableSlots([]);
      return;
    }

    const slots: TimeSlot[] = [];
    const [startHour, startMinute] = dayAvailability.startTime.split(':').map(Number);
    const [endHour, endMinute] = dayAvailability.endTime.split(':').map(Number);
    
    let currentTime = setMinutes(setHours(date, startHour), startMinute);
    const endTime = setMinutes(setHours(date, endHour), endMinute);
    
    while (currentTime < endTime) {
      const slotEnd = addHours(currentTime, dayAvailability.consultationDuration / 60);
      
      // Check if slot is already booked
      const isBooked = appointments.some(apt => {
        const aptDate = new Date(apt.date);
        return (
          aptDate.toDateString() === date.toDateString() &&
          apt.startTime === format(currentTime, 'HH:mm') &&
          apt.status !== 'cancelled'
        );
      });
      
      slots.push({
        id: `${date.toISOString()}-${format(currentTime, 'HH:mm')}`,
        start: new Date(currentTime),
        end: slotEnd,
        available: !isBooked && currentTime > new Date(),
        booked: isBooked,
        price: 150 // Default consultation price
      });
      
      currentTime = addHours(currentTime, (dayAvailability.consultationDuration + dayAvailability.bufferTime) / 60);
    }
    
    setAvailableSlots(slots);
  };

  // Handle date selection
  const handleDateClick = (arg: any) => {
    const clickedDate = arg.date;
    setSelectedDate(clickedDate);
    generateTimeSlots(clickedDate);
  };

  // Handle slot selection
  const handleSlotSelect = (slot: TimeSlot) => {
    if (!slot.available) {return;}
    setSelectedSlot(slot);
    setShowBookingModal(true);
  };

  // Handle booking submission
  const handleBookingSubmit = async () => {
    if (!selectedSlot || !selectedDate) {return;}
    
    setLoading(true);
    try {
      const appointmentData = {
        attorneyId,
        date: selectedDate,
        startTime: format(selectedSlot.start, 'HH:mm'),
        endTime: format(selectedSlot.end, 'HH:mm'),
        type: bookingDetails.type,
        meetingType: bookingDetails.meetingType,
        notes: bookingDetails.notes,
        price: selectedSlot.price || 150,
        clientName: bookingDetails.clientName,
        clientEmail: bookingDetails.clientEmail,
        clientPhone: bookingDetails.clientPhone
      };
      
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointmentData)
      });
      
      if (response.ok) {
        const newAppointment = await response.json();
        setAppointments([...appointments, newAppointment]);
        setShowBookingModal(false);
        setSelectedSlot(null);
        
        // Refresh available slots
        generateTimeSlots(selectedDate);
        
        if (onBookingComplete) {
          onBookingComplete(newAppointment);
        }
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calendar events for FullCalendar
  const calendarEvents = appointments.map(apt => ({
    id: apt.id,
    title: isAttorneyView ? apt.clientName : 'Booked',
    start: `${format(new Date(apt.date), 'yyyy-MM-dd')}T${apt.startTime}`,
    end: `${format(new Date(apt.date), 'yyyy-MM-dd')}T${apt.endTime}`,
    backgroundColor: apt.status === 'confirmed' ? '#10b981' : 
                     apt.status === 'pending' ? '#f59e0b' : 
                     apt.status === 'cancelled' ? '#ef4444' : '#6b7280',
    borderColor: 'transparent',
    extendedProps: apt
  }));

  // Attorney availability management view
  const AvailabilityManager = () => (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Manage Availability</h3>
      
      <div className="space-y-4">
        {[0, 1, 2, 3, 4, 5, 6].map(day => {
          const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day];
          const dayAvail = availability.find(a => a.dayOfWeek === day);
          
          return (
            <div key={day} className="flex items-center justify-between p-3 border rounded-lg">
              <span className="font-medium">{dayName}</span>
              {dayAvail ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    {dayAvail.startTime} - {dayAvail.endTime}
                  </span>
                  <button className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                  <button className="text-red-600 hover:text-red-800 text-sm">Remove</button>
                </div>
              ) : (
                <button className="text-blue-600 hover:text-blue-800 text-sm">+ Add Hours</button>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Consultation Duration
          </label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="30">30 minutes</option>
            <option value="45">45 minutes</option>
            <option value="60">1 hour</option>
            <option value="90">1.5 hours</option>
            <option value="120">2 hours</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Buffer Time
          </label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="0">No buffer</option>
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
          </select>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar View */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-6">
              {isAttorneyView ? 'Your Schedule' : 'Book an Appointment'}
            </h2>
            
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek'
              }}
              events={calendarEvents}
              dateClick={handleDateClick}
              eventClick={(info) => {
                if (isAttorneyView) {
                  // Show appointment details for attorney
                  console.log('Appointment details:', info.event.extendedProps);
                }
              }}
              height="auto"
              businessHours={availability.map(a => ({
                daysOfWeek: [a.dayOfWeek],
                startTime: a.startTime,
                endTime: a.endTime
              }))}
            />
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Selected Date Time Slots */}
          {selectedDate && !isAttorneyView && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">
                Available Times for {format(selectedDate, 'MMMM d, yyyy')}
              </h3>
              
              {availableSlots.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {availableSlots.map(slot => (
                    <button
                      key={slot.id}
                      onClick={() => handleSlotSelect(slot)}
                      disabled={!slot.available}
                      className={`w-full px-4 py-3 rounded-lg border text-left transition ${
                        slot.available
                          ? 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                          : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={slot.available ? 'text-gray-900' : 'text-gray-500'}>
                          {format(slot.start, 'h:mm a')} - {format(slot.end, 'h:mm a')}
                        </span>
                        {slot.booked ? (
                          <span className="text-xs text-red-600">Booked</span>
                        ) : slot.available ? (
                          <span className="text-sm text-green-600">${slot.price}</span>
                        ) : (
                          <span className="text-xs text-gray-500">Unavailable</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No available slots for this date
                </p>
              )}
            </div>
          )}
          
          {/* Attorney Availability Manager */}
          {isAttorneyView && <AvailabilityManager />}
          
          {/* Upcoming Appointments */}
          {isAttorneyView && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Upcoming Appointments</h3>
              
              <div className="space-y-3">
                {appointments
                  .filter(apt => new Date(apt.date) >= new Date() && apt.status === 'confirmed')
                  .slice(0, 5)
                  .map(apt => (
                    <div key={apt.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{apt.clientName}</span>
                        <span className="text-xs text-gray-500">
                          {format(new Date(apt.date), 'MMM d')}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <FiClock className="w-4 h-4 mr-1" />
                        {apt.startTime} - {apt.endTime}
                      </div>
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        {apt.meetingType === 'video' ? (
                          <FiVideo className="w-4 h-4 mr-1" />
                        ) : (
                          <FiMapPin className="w-4 h-4 mr-1" />
                        )}
                        {apt.meetingType === 'video' ? 'Video Call' : apt.location}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Booking Modal */}
      {showBookingModal && selectedSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Complete Your Booking</h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600">Selected Time:</p>
              <p className="font-medium">
                {selectedDate && format(selectedDate, 'MMMM d, yyyy')} at{' '}
                {format(selectedSlot.start, 'h:mm a')} - {format(selectedSlot.end, 'h:mm a')}
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={bookingDetails.clientName}
                  onChange={(e) => setBookingDetails({...bookingDetails, clientName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={bookingDetails.clientEmail}
                  onChange={(e) => setBookingDetails({...bookingDetails, clientEmail: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={bookingDetails.clientPhone}
                  onChange={(e) => setBookingDetails({...bookingDetails, clientPhone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Consultation Type
                </label>
                <select
                  value={bookingDetails.type}
                  onChange={(e) => setBookingDetails({...bookingDetails, type: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="consultation">Initial Consultation</option>
                  <option value="meeting">Follow-up Meeting</option>
                  <option value="document_review">Document Review</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meeting Type
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="video"
                      checked={bookingDetails.meetingType === 'video'}
                      onChange={(e) => setBookingDetails({...bookingDetails, meetingType: e.target.value as any})}
                      className="mr-2"
                    />
                    <FiVideo className="w-4 h-4 mr-1" />
                    Video
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="phone"
                      checked={bookingDetails.meetingType === 'phone'}
                      onChange={(e) => setBookingDetails({...bookingDetails, meetingType: e.target.value as any})}
                      className="mr-2"
                    />
                    Phone
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="in_person"
                      checked={bookingDetails.meetingType === 'in_person'}
                      onChange={(e) => setBookingDetails({...bookingDetails, meetingType: e.target.value as any})}
                      className="mr-2"
                    />
                    <FiMapPin className="w-4 h-4 mr-1" />
                    In Person
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={bookingDetails.notes}
                  onChange={(e) => setBookingDetails({...bookingDetails, notes: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of your legal matter..."
                />
              </div>
            </div>
            
            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center text-lg font-semibold">
                <FiDollarSign className="w-5 h-5" />
                {selectedSlot.price}
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowBookingModal(false);
                    setSelectedSlot(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleBookingSubmit}
                  disabled={loading || !bookingDetails.clientName || !bookingDetails.clientEmail}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Booking...' : 'Confirm Booking'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};