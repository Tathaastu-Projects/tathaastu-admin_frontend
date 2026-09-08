"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Plus, Edit, Trash2, Image as ImageIcon, Calendar, Link as LinkIcon } from "lucide-react";
import { motion } from "framer-motion";

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  link: string;
  image: string;
}

const mockEvents: Event[] = [
  {
    id: "E001",
    title: "Full Moon Meditation",
    description: "Join us for a guided meditation session",
    date: "2025-01-20",
    time: "7:00 PM",
    link: "https://meet.google.com/abc-xyz",
    image: "/event1.jpg",
  },
  {
    id: "E002",
    title: "Astrology Workshop",
    description: "Learn the basics of astrology",
    date: "2025-01-25",
    time: "6:00 PM",
    link: "https://meet.google.com/def-uvw",
    image: "/event2.jpg",
  },
];

export default function EventsContentPage() {
  const [events, setEvents] = useState<Event[]>(mockEvents);
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this event?")) {
      setEvents(events.filter((e) => e.id !== id));
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Events & Content</h1>
            <p className="text-gray-600">Manage banners, videos, and live event schedules</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setSelectedEvent(null);
              setShowModal(true);
            }}
            className="bg-gradient-to-r from-spiritual-purple to-spiritual-darkPurple text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow"
          >
            <Plus className="w-5 h-5" />
            Add New Event
          </motion.button>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="h-48 bg-gradient-to-br from-spiritual-purple to-spiritual-darkPurple flex items-center justify-center">
                <ImageIcon className="w-16 h-16 text-white opacity-50" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{event.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{event.description}</p>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Calendar className="w-4 h-4" />
                    <span>{event.date} at {event.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <LinkIcon className="w-4 h-4" />
                    <a href={event.link} target="_blank" rel="noopener noreferrer" className="truncate">
                      {event.link}
                    </a>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedEvent(event);
                      setShowModal(true);
                    }}
                    className="flex-1 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors"
                  >
                    <Edit className="w-4 h-4 inline mr-2" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl p-6 w-full max-w-md"
            >
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                {selectedEvent ? "Edit Event" : "Add New Event"}
              </h2>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Event Title</label>
                  <input
                    type="text"
                    defaultValue={selectedEvent?.title || ""}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-spiritual-purple focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    defaultValue={selectedEvent?.description || ""}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-spiritual-purple focus:border-transparent outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      defaultValue={selectedEvent?.date || ""}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-spiritual-purple focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                    <input
                      type="time"
                      defaultValue={selectedEvent?.time || ""}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-spiritual-purple focus:border-transparent outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Meeting Link</label>
                  <input
                    type="url"
                    defaultValue={selectedEvent?.link || ""}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-spiritual-purple focus:border-transparent outline-none"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-spiritual-purple to-spiritual-darkPurple text-white rounded-lg font-semibold hover:shadow-lg transition-shadow"
                  >
                    {selectedEvent ? "Update" : "Create"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

