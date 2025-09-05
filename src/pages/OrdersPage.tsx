import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Truck, CheckCircle, Clock, ChevronDown, Edit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Order } from '../types';
import { OrderTracking } from '../components/Order/OrderTracking';
import { useOrders } from '../contexts/OrderContext';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';

export const OrdersPage: React.FC = () => {
  const { orders, loading, fetchUserOrders } = useOrders();
  const [activeTab, setActiveTab] = useState('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    fetchUserOrders();
  }, [fetchUserOrders]);

  // Use orders from context
  const displayOrders = orders;

  const tabs = [
    { id: 'all', name: 'All Orders', count: displayOrders.length },
    { id: 'processing', name: 'Processing', count: displayOrders.filter(o => o.status === 'processing').length },
    { id: 'shipped', name: 'Shipped', count: displayOrders.filter(o => o.status === 'shipped').length },
    { id: 'delivered', name: 'Delivered', count: displayOrders.filter(o => o.status === 'delivered').length },
  ];

  const filteredOrders = activeTab === 'all' ? displayOrders : displayOrders.filter(order => order.status === activeTab);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing': return <Clock className="h-4 w-4" />;
      case 'shipped': return <Truck className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing': return 'bg-yellow-100 text-yellow-700';
      case 'shipped': return 'bg-blue-100 text-blue-700';
      case 'delivered': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };



  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center space-x-3"><div className="p-3 bg-indigo-100 rounded-xl"><Package className="h-8 w-8 text-indigo-600" /></div><div><h1 className="text-3xl font-bold text-gray-900">My Orders</h1><p className="text-gray-600 mt-1">Track and manage your orders</p></div></div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${ activeTab === tab.id ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300' }`}>
                {tab.name}
                {tab.count > 0 && <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${ activeTab === tab.id ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-900' }`}>{tab.count}</span>}
              </button>
            ))}
          </nav>
        </div>

        {loading ? (
          <LoadingSpinner text="Loading your orders..." />
        ) : (
        <div className="space-y-6">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
              <p className="text-gray-600">You haven't placed any orders yet.</p>
              <Link to="/products" className="btn-primary mt-4 inline-block">
                Start Shopping
              </Link>
            </div>
          ) : (
            filteredOrders.map((order, index) => (
            <motion.div key={order.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 cursor-pointer" onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center space-x-4">
                    <div><h3 className="text-lg font-semibold text-gray-900">Order #{order.id.slice(0, 8)}</h3><p className="text-sm text-gray-600">Placed on {new Date(order.created_at).toLocaleDateString()}</p></div>
                    <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>{getStatusIcon(order.status)}<span className="capitalize">{order.status}</span></span>
                  </div>
                  <div className="flex items-center space-x-4 mt-4 lg:mt-0">
                    <span className="text-lg font-bold text-gray-900">${order.total.toFixed(2)}</span>
                    <motion.div animate={{ rotate: expandedOrderId === order.id ? 180 : 0 }}><ChevronDown className="h-5 w-5 text-gray-500" /></motion.div>
                  </div>
                </div>
              </div>
              <AnimatePresence>
                {expandedOrderId === order.id && (
                  <motion.div initial="collapsed" animate="open" exit="collapsed" variants={{ open: { opacity: 1, height: 'auto' }, collapsed: { opacity: 0, height: 0 } }} transition={{ duration: 0.3, ease: 'easeInOut' }} className="overflow-hidden">
                    <div className="p-6">
                      <OrderTracking history={order.trackingHistory} status={order.status} />
                      <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-end">
                        <Link to={`/products/${order.items[0].product.id}#reviews`}>
                          <button className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                            <Edit className="h-4 w-4" />
                            <span>Write a Review</span>
                          </button>
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
          )}
        </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
