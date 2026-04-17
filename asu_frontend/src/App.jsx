import { useState, useEffect } from 'react';
import { iotService, customerService, alertsService } from './api';
import './App.css';

function App() {
  const [meters, setMeters] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSystemData = async () => {
      // 1. Try to fetch Customers
      try {
        const customersRes = await customerService.get('/customers');
        setCustomers(customersRes.data);
      } catch (error) {
        console.error("Customer service is down:", error);
      }

      // 2. Try to fetch Meters
      try {
        const metersRes = await iotService.get('/meters');
        setMeters(metersRes.data);
      } catch (error) {
        console.error("IoT service is down:", error);
      }

      setLoading(false); // Done loading regardless of success/fail
    };

    fetchSystemData();
  }, []);

  if (loading) return <h2>Loading System Data...</h2>;

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>ASU Smart Utility Dashboard</h1>
      <p>Seamlessly pulling data from multiple isolated microservices.</p>

      <div style={{ display: 'flex', gap: '40px', marginTop: '20px' }}>
        
        {/* Customer Service Data */}
        <div style={{ flex: 1, border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
          <h2>👥 Customers (Port 8001)</h2>
          {customers.length === 0 ? <p>No customers found.</p> : (
            <ul>
              {customers.map(c => (
                <li key={c.customer_id}>
                  <strong>{c.full_name}</strong> - {c.account_type} ({c.email})
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* IoT Service Data */}
        <div style={{ flex: 1, border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
          <h2>⚡ Smart Meters (Port 8000)</h2>
          {meters.length === 0 ? <p>No meters found.</p> : (
            <ul>
              {meters.map(m => (
                <li key={m.meter_id}>
                  <strong>ID: {m.meter_id}</strong> - {m.meter_type.toUpperCase()} ({m.status})
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
}

export default App;