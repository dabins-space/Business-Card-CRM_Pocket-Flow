import { useState } from 'react';

export default function TestAPI() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testBasicAPI = async () => {
    setLoading(true);
    setResult('Testing basic API...');
    
    try {
      const response = await fetch('/api/test');
      const text = await response.text();
      
      setResult(`
Basic API Test:
Status: ${response.status}
Body: ${text}
      `);
      
    } catch (error) {
      setResult(`Basic API Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testSimpleSaveContact = async () => {
    setLoading(true);
    setResult('Testing simple save-contact API...');
    
    try {
      const testData = {
        imageBase64: 'data:image/jpeg;base64,test',
        imageExt: 'jpg',
        name: 'Test User',
        company: 'Test Company'
      };

      const response = await fetch('/api/save-contact-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData)
      });

      const text = await response.text();
      
      setResult(`
Simple Save Contact API Test:
Status: ${response.status}
Body: ${text}
      `);
      
    } catch (error) {
      setResult(`Simple Save Contact API Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testSaveContact = async () => {
    setLoading(true);
    setResult('Testing save-contact API...');
    
    try {
      const testData = {
        imageBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
        imageExt: 'jpg',
        name: 'Test User',
        title: 'Test Title',
        department: 'Test Dept',
        company: 'Test Company',
        email: 'test@example.com',
        phone: '010-1234-5678',
        importance: 3,
        inquiryTypes: ['test'],
        memo: 'Test memo'
      };

      const response = await fetch('/api/save-contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData)
      });

      const text = await response.text();
      
      setResult(`
Save Contact API Test:
Status: ${response.status}
Headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)}
Body: ${text}
      `);
      
    } catch (error) {
      setResult(`Save Contact API Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>API Test Page</h1>
      <div style={{ marginBottom: '10px' }}>
        <button 
          onClick={testBasicAPI} 
          disabled={loading}
          style={{ padding: '10px 20px', fontSize: '16px', marginRight: '10px' }}
        >
          {loading ? 'Testing...' : 'Test Basic API'}
        </button>
        <button 
          onClick={testSimpleSaveContact} 
          disabled={loading}
          style={{ padding: '10px 20px', fontSize: '16px', marginRight: '10px' }}
        >
          {loading ? 'Testing...' : 'Test Simple Save Contact API'}
        </button>
        <button 
          onClick={testSaveContact} 
          disabled={loading}
          style={{ padding: '10px 20px', fontSize: '16px' }}
        >
          {loading ? 'Testing...' : 'Test Full Save Contact API'}
        </button>
      </div>
      <pre style={{ 
        marginTop: '20px', 
        padding: '10px', 
        backgroundColor: '#f5f5f5', 
        border: '1px solid #ccc',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-all'
      }}>
        {result}
      </pre>
    </div>
  );
}
