import React, { useState, useEffect } from 'react';
import './App.css'; // Import your CSS file for styling

function RegistrationForm({ onRegister, onSwitchToLogin, setError }) {
  const [user, setUser] = useState({ email: '', password: '' });
  const [registrationMessage, setRegistrationMessage] = useState(null);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setUser((prevUser) => ({
      ...prevUser,
      [name]: value,
    }));
  };

  const handleRegister = async () => {
    try {
      const response = await fetch('http://localhost:8080/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(user),
      });

      if (response.ok) {
        setRegistrationMessage('Registration successful!');
        onRegister();
      } else {
        const data = await response.json();
        setRegistrationMessage(data.error || 'Registration failed');
        setError(data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Error:', error);
      setRegistrationMessage('Error during registration');
      setError('Error during registration');
    }
  };

  return (
    <div>
      <h2>Registration</h2>
      <label>Email:</label>
      <input type="text" name="email" value={user.email} onChange={handleInputChange} />
      <br />
      <label>Password:</label>
      <input type="password" name="password" value={user.password} onChange={handleInputChange} />
      <br />
      <button onClick={handleRegister}>Register</button>
      <p>
        {registrationMessage && <span>{registrationMessage}</span>}
        <br />
        Already have an account? <button onClick={onSwitchToLogin}>Login</button>
      </p>
    </div>
  );
}

function LoginForm({ onLogin, onSwitchToRegister, setError }) {
  const [user, setUser] = useState({ email: '', password: '' });

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setUser((prevUser) => ({
      ...prevUser,
      [name]: value,
    }));
  };

  const handleLogin = async () => {
    try {
      const response = await fetch('http://localhost:8080/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(user),
      });

      if (response.ok) {
        onLogin();
      } else {
        const data = await response.json();
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error during login');
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <label>Email:</label>
      <input type="text" name="email" value={user.email} onChange={handleInputChange} />
      <br />
      <label>Password:</label>
      <input type="password" name="password" value={user.password} onChange={handleInputChange} />
      <br />
      <button onClick={handleLogin}>Login</button>
      <br />
      <br />
      <p>
        Don't have an account? <button onClick={onSwitchToRegister}>Register</button>
      </p>
    </div>
  );
}

function BookInventory({ onLogout, setError }) {
  const [book, setBook] = useState({ isdn: '', title: '', author: '' });
  const [responses, setResponses] = useState([]);
  const [error, setBookError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editValues, setEditValues] = useState({});

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setBook((prevBook) => ({
      ...prevBook,
      [name]: value,
    }));
  };
  const handleIsdnChange = (index, newIsdn) => {
    const updatedResponses = responses.map((response, idx) => {
      if (idx === index) {
        return { ...response, isdn: newIsdn };
      }
      return response;
    });
    setResponses(updatedResponses);
  };

  const handleAddBook = async () => {
    try {
      const response = await fetch('http://localhost:8080/books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(book),
      });

      if (response.ok) {
        const data = await response.json();
        setResponses([...responses, data]);
        setBook({ isdn: '', title: '', author: '' });
      } else {
        const data = await response.json();
        setBookError(data.error || 'Error adding the book');
      }
    } catch (error) {
      console.error('Error:', error);
      setBookError('Error adding the book');
    }
  };

  const handleDeleteBook = async (bookToDelete) => {
    try {
      const response = await fetch('http://localhost:8080/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookToDelete),
      });

      if (response.ok) {
        const updatedResponses = responses.filter(book => book.isdn !== bookToDelete.isdn);
        setResponses(updatedResponses);
      } else {
        const data = await response.json();
        setBookError(data.error || 'Error deleting the book');
      }
    } catch (error) {
      console.error('Error:', error);
      setBookError('Error deleting the book');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:8080/books');
        if (response.ok) {
          const data = await response.json();
          setResponses(data || []);
        } else {
          const data = await response.json();
          setBookError(data.error || 'Error occurred while fetching existing data');
        }
      } catch (error) {
        console.error('Error:', error);
        setBookError('Error occurred while fetching existing data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLogout = () => {
    setResponses([]);
    onLogout();
  };

  return (
    <div>
      <h1>Library Inventory</h1>
      <div className="form-container">
        <label>
          Title:
          <input type="text" name="title" value={book.title} onChange={handleInputChange} />
        </label>
        <label>
          Author:
          <input type="text" name="author" value={book.author} onChange={handleInputChange} />
        </label>
        <button onClick={handleAddBook}>Add Book</button>
        <button onClick={handleLogout}>Logout</button>
      </div>
      {error && <p className="error-message">{error}</p>}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="table-container">
          <h2>Book List:</h2>
          <table className="book-table">
            <thead>
              <tr>
                <th>ISDN</th>
                <th>Title</th>
                <th>Author</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {responses.length > 0 ? (
                responses.map((response , index) => (
                  <tr key={index}>
                    <td>
                    <input 
                      type="text" 
                      value={response.isdn}  
                      onChange={(e) => handleIsdnChange(index, e.target.value)} 
                    />
                  </td>
                    <td>{response.title}</td>
                    <td>{response.author}</td>
                    <td>
                      <button onClick={() => handleDeleteBook(response)}>Delete Book</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3">No books available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function App() {
  const [isLoggedIn, setLoggedIn] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = () => {
    setLoggedIn(true);
    setError(null);
  };

  const handleLogout = () => {
    setLoggedIn(false);
  };

  const handleRegister = () => {
    setShowRegistration(true);
    setError(null);
  };

  const switchToLogin = () => {
    setShowRegistration(false);
    setError(null);
  };

  return (
    <div className="app-container">
      {error && <p className="error-message">{error}</p>}
      {isLoggedIn ? (
        <BookInventory onLogout={handleLogout} setError={setError} />
      ) : (
        <>
          {showRegistration ? (
            <RegistrationForm onRegister={handleRegister} onSwitchToLogin={switchToLogin} setError={setError} />
          ) : (
            <LoginForm onLogin={handleLogin} onSwitchToRegister={handleRegister} setError={setError} />
          )}
        </>
      )}
    </div>
  );
}

export default App;
