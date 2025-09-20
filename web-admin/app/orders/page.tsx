import React from 'react';

const OrdersPage = () => {
  return (
    <div>
      <h1>Search Orders</h1>
      {/* TODO: Implement order search functionality */}
      <input type="text" placeholder="Search by user ID, order ID, etc." />
      <button>Search</button>

      <h2>Force Cancel Order</h2>
      {/* TODO: Implement force cancel functionality */}
      <input type="text" placeholder="Order ID" />
      <button>Force Cancel</button>
    </div>
  );
};

export default OrdersPage;
