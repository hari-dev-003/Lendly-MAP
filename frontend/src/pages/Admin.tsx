import { useState, useEffect } from "react";
import axios from "axios";

const Admin = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [password, setPassword] = useState("");
    const [users, setUsers] = useState([]);
    const [products, setProducts] = useState([]);

    useEffect(() => {
        if (isLoggedIn) {
            fetchUsers();
            fetchProducts();
        }
    }, [isLoggedIn]);


const fetchUsers = async () => {
  try {
    const response = await axios.get("http://localhost:3000/api/users");

    console.log(response.data);

    setUsers(response.data.users); // ✅ correct
  } catch (error) {
    console.error("Failed to fetch users:", error);
  }
};

const fetchProducts = async () => {
  try {
    const response = await axios.get("http://localhost:3000/api/products");

    // console.log(response.data );
    
    setProducts(response.data.products);
  } catch (error) {
    console.error("Failed to fetch products:", error);
  }
};

console.log(products[0]);


    // console.log(users.users.username);
    
    const handleLogin = () => {
        if (password === "admin123") {
            setIsLoggedIn(true);
        } else {
            alert("Invalid password");
        }
    };

    // ... rest of your code remains the same
 const handleLogout = () => {
    setIsLoggedIn(false);
    setPassword("");
  };

  /* ---------------- LOGIN PAGE ---------------- */

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-xl shadow-md w-80 text-center">
          <h2 className="text-2xl font-bold mb-6">Admin Login</h2>

          <input
            type="password"
            placeholder="Enter password"
            className="w-full border px-4 py-2 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />

          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  /* ---------------- DASHBOARD ---------------- */

  return (
    <div className="min-h-screen bg-gray-100 p-10">

      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>

        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-5 py-2 rounded-lg hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      {/* Grid Layout */}
      <div className="grid md:grid-cols-2 gap-8">

        {/* USERS TABLE */}
   <div className="bg-white p-6 rounded-xl shadow">
  <h2 className="text-xl font-semibold mb-4">Users</h2>

  <table className="w-full text-left border-collapse">
    <thead>
      <tr className="border-b">
        <th className="py-3">ID</th>
        <th>Name</th>
        <th>Email</th>
      </tr>
    </thead>

    <tbody>
      {users && users.length > 0 ? (
        users.map((user) => (
          <tr key={user._id} className="border-b hover:bg-gray-50">
            <td className="py-3">{user._id}</td>
            <td>{user.username}</td>
            <td>{user.email}</td>
          </tr>
        ))
      ) : (
        <tr>
          <td colSpan="3" className="text-center py-4 text-gray-500">
            No users found
          </td>
        </tr>
      )}
    </tbody>
  </table>
</div>

        {/* PRODUCTS TABLE */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4">Products</h2>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b">
                <th className="py-3">ID</th>
                <th>Name</th>
                <th>Price</th>
                <th>Period</th>
                <th>Owner</th>
              </tr>
            </thead>

            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b hover:bg-gray-50">
                  <td className="py-3">{product._id}</td>
                  <td>{product.title}</td>
                  <td>{product.price}</td>
                  <td>{product.period}</td>
                                    <td>{product.owner}</td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};

export default Admin;