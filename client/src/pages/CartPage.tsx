import React from 'react';
import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight } from 'lucide-react';

export const CartPage: React.FC = () => {
  const { cart, removeFromCart, updateQuantity, totalPrice, totalItems } = useCart();
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Cart is Empty</h2>
        <p className="text-gray-500 mb-8">Looks like you haven't added any products to your cart yet.</p>
        <Link
          to="/shop"
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-grow">
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {cart.map((item) => (
                <li key={item._id} className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <img
                        src={item.imageUrl || `https://via.placeholder.com/100?text=${item.nameEn.replace(/ /g, '+')}`}
                        alt={item.nameEn}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{item.nameEn}</h3>
                        <p className="text-sm text-gray-500">{item.nameMr}</p>
                        <p className="text-sm font-medium text-indigo-600 mt-1">₹{item.price} / {item.unit}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="flex items-center border rounded-md">
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity - 1)}
                          className="p-2 hover:bg-gray-100 text-gray-600"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="px-4 font-medium text-gray-900">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity + 1)}
                          className="p-2 hover:bg-gray-100 text-gray-600"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item._id)}
                        className="text-red-500 hover:text-red-700 p-2"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="w-full lg:w-96">
          <div className="bg-white shadow sm:rounded-md p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>
            <div className="flow-root">
              <dl className="-my-4 text-sm divide-y divide-gray-200">
                <div className="py-4 flex items-center justify-between">
                  <dt className="text-gray-600">Subtotal ({totalItems} items)</dt>
                  <dd className="font-medium text-gray-900">₹{totalPrice}</dd>
                </div>
                <div className="py-4 flex items-center justify-between">
                  <dt className="text-gray-600">Shipping</dt>
                  <dd className="font-medium text-gray-900 text-green-600">Free</dd>
                </div>
                <div className="py-4 flex items-center justify-between">
                  <dt className="text-base font-bold text-gray-900">Order Total</dt>
                  <dd className="text-base font-bold text-indigo-600">₹{totalPrice}</dd>
                </div>
              </dl>
            </div>
            <div className="mt-6">
              <button
                onClick={() => navigate('/checkout')}
                className="w-full flex justify-center items-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Proceed to Checkout
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 flex justify-center">
              <Link to="/shop" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                or Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
