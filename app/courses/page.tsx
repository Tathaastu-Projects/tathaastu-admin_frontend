"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Plus, Edit, Trash2, Image as ImageIcon } from "lucide-react";
import { motion } from "framer-motion";

interface Course {
  id: string;
  title: string;
  category: string;
  price: number;
  discountPrice?: number; // Optional discount price
  enrollments: number;
  image: string;
}

const mockCourses: Course[] = [
  { id: "C001", title: "Advanced Astrology", category: "Astrology", price: 2999, discountPrice: 1999, enrollments: 245, image: "/course1.jpg" },
  { id: "C002", title: "Numerology Mastery", category: "Numerology", price: 1999, discountPrice: 1499, enrollments: 189, image: "/course2.jpg" },
  { id: "C003", title: "Tarot Reading Basics", category: "Tarot", price: 1499, enrollments: 312, image: "/course3.jpg" },
  { id: "C004", title: "Palmistry Guide", category: "Palmistry", price: 1799, discountPrice: 1299, enrollments: 156, image: "/course4.jpg" },
];

const categories = ["All", "Astrology", "Numerology", "Tarot", "Palmistry", "Vastu"];

export default function CoursesManagementPage() {
  const [courses, setCourses] = useState<Course[]>(mockCourses);
  const [activeCategory, setActiveCategory] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const filteredCourses =
    activeCategory === "All"
      ? courses
      : courses.filter((c) => c.category === activeCategory);

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this course?")) {
      setCourses(courses.filter((c) => c.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const price = parseFloat(formData.get("price") as string);
    const discountPriceValue = formData.get("discountPrice") as string;
    const discountPrice = discountPriceValue ? parseFloat(discountPriceValue) : undefined;

    const courseData = {
      title: formData.get("title") as string,
      category: formData.get("category") as string,
      price,
      discountPrice,
    };

    if (selectedCourse) {
      // Update existing course
      setCourses(
        courses.map((c) =>
          c.id === selectedCourse.id ? { ...c, ...courseData } : c
        )
      );
    } else {
      // Create new course
      const newCourse: Course = {
        id: `C${String(courses.length + 1).padStart(3, "0")}`,
        ...courseData,
        enrollments: 0,
        image: "",
      };
      setCourses([...courses, newCourse]);
    }
    setShowModal(false);
    setSelectedCourse(null);
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Courses Management</h1>
            <p className="text-gray-600">Manage all spiritual courses</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setSelectedCourse(null);
              setShowModal(true);
            }}
            className="bg-gradient-to-r from-spiritual-purple to-spiritual-darkPurple text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow"
          >
            <Plus className="w-5 h-5" />
            Create New Course
          </motion.button>
        </div>

        {/* Category Tabs */}
        <div className="bg-white rounded-xl p-4 shadow-md">
          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeCategory === category
                    ? "bg-gradient-to-r from-spiritual-purple to-spiritual-darkPurple text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="h-48 bg-gradient-to-br from-spiritual-purple to-spiritual-darkPurple flex items-center justify-center">
                <ImageIcon className="w-16 h-16 text-white opacity-50" />
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">{course.title}</h3>
                    <p className="text-sm text-spiritual-purple font-medium">{course.category}</p>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  {course.discountPrice ? (
                    <>
                      <div className="flex items-center gap-3">
                        <p className="text-2xl font-bold text-gray-800">₹{course.discountPrice.toLocaleString()}</p>
                        <p className="text-lg text-gray-400 line-through">₹{course.price.toLocaleString()}</p>
                        <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-semibold rounded">
                          {Math.round(((course.price - course.discountPrice) / course.price) * 100)}% OFF
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">Original Price: ₹{course.price.toLocaleString()}</p>
                    </>
                  ) : (
                    <p className="text-2xl font-bold text-gray-800">₹{course.price.toLocaleString()}</p>
                  )}
                  <p className="text-sm text-gray-600">{course.enrollments} enrollments</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedCourse(course);
                      setShowModal(true);
                    }}
                    className="flex-1 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors"
                  >
                    <Edit className="w-4 h-4 inline mr-2" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(course.id)}
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
                {selectedCourse ? "Edit Course" : "Create New Course"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Course Title</label>
                  <input
                    type="text"
                    name="title"
                    defaultValue={selectedCourse?.title || ""}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-spiritual-purple focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    name="category"
                    defaultValue={selectedCourse?.category || ""}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-spiritual-purple focus:border-transparent outline-none"
                  >
                    <option value="">Select category</option>
                    <option value="Astrology">Astrology</option>
                    <option value="Numerology">Numerology</option>
                    <option value="Tarot">Tarot</option>
                    <option value="Palmistry">Palmistry</option>
                    <option value="Vastu">Vastu</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Original Price (₹)</label>
                  <input
                    type="number"
                    name="price"
                    defaultValue={selectedCourse?.price || ""}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-spiritual-purple focus:border-transparent outline-none"
                    placeholder="Enter original price"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount Price (₹) <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    name="discountPrice"
                    defaultValue={selectedCourse?.discountPrice || ""}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-spiritual-purple focus:border-transparent outline-none"
                    placeholder="Enter discounted price"
                  />
                  {selectedCourse?.discountPrice && (
                    <p className="text-xs text-green-600 mt-1">
                      Discount: {Math.round(((selectedCourse.price - selectedCourse.discountPrice) / selectedCourse.price) * 100)}% OFF
                    </p>
                  )}
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
                    {selectedCourse ? "Update" : "Create"}
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

