import React, { useState } from "react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { log } from "console";

export default function Add() {

        const user = JSON.parse(localStorage.getItem("user"));



  const [image, setImage] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    period: "day",
    location: "",
    owner: "Owner: " + user.user.username,
    category: "",
  });

          // console.log("Current user:   ", user.user.username);



  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {

    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {

    if (e.target.files) {
      setImage(e.target.files[0]);
    }

  };

  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();
    setLoading(true);
    setError("");

    try {

      const data = new FormData();

      data.append("title", formData.title);
      data.append("description", formData.description);
      data.append("price", formData.price);
      data.append("period", formData.period);
      data.append("location", formData.location);
      data.append("owner", formData.owner);
      data.append("category", formData.category);

      if (image) {
        data.append("image", image);
      }

      const response = await fetch("http://localhost:3000/api/upload", {
        method: "POST",
        body: data
      });

      if (!response.ok) throw new Error("Upload failed");

      alert("Product uploaded successfully");

      setFormData({
        title: "",
        description: "",
        price: "",
        period: "day",
        location: "",
        owner: "",
        category: "",
      });

      setImage(null);

    } catch (err) {

      setError("Upload failed");

    } finally {

      setLoading(false);

    }

  };

  return (
    <div>
      <Navbar />

      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 mt-12 mb-20">

        <div className="w-full max-w-2xl bg-white p-8 rounded-2xl shadow-lg">

          <h1 className="text-3xl font-bold mb-6 text-center">
            Add New Listing
          </h1>

          {error && (
            <div className="bg-red-100 text-red-600 p-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            <input
              type="text"
              name="title"
              placeholder="Item Title"
              value={formData.title}
              onChange={handleChange}
              className="w-full border px-4 py-2 rounded"
              required
            />

            <input
              type="file"
              name="image"
              onChange={handleFileChange}
              className="w-full border px-4 py-2 rounded"
              required
            />

            <input
              type="number"
              name="price"
              placeholder="Price"
              value={formData.price}
              onChange={handleChange}
              className="w-full border px-4 py-2 rounded"
              required
            />

            <select
              name="period"
              value={formData.period}
              onChange={handleChange}
              className="w-full border px-4 py-2 rounded"
            >
              <option value="hour">Per Hour</option>
              <option value="day">Per Day</option>
              <option value="week">Per Week</option>
            </select>

            <input
              type="text"
              name="location"
              placeholder="Location"
              value={formData.location}
              onChange={handleChange}
              className="w-full border px-4 py-2 rounded"
            />
            {/* <label htmlFor="owner">Owner</label> */}
            <input
              type="text"
              name="owner"
              placeholder="Owner"
              value={formData.owner}
              onChange={handleChange}
              className="w-full border px-4 py-2 rounded"
            />

            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full border px-4 py-2 rounded"
            >
              <option value="">Select Category</option>
              <option value="gaming">Gaming</option>
              <option value="electronics">Electronics</option>
              <option value="tools">Tools</option>
              <option value="bikes">Bikes</option>
              <option value="cameras">Cameras</option>
              <option value="music">Other</option>
            </select>

            <textarea
              name="description"
              placeholder="Description"
              value={formData.description}
              onChange={handleChange}
              className="w-full border px-4 py-2 rounded"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg"
            >
              {loading ? "Uploading..." : "Add Listing"}
            </button>

          </form>

        </div>

      </div>

      <Footer />
    </div>
  );
}