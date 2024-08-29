import React, { useState } from 'react';

function InviteForm() {
  const [email, setEmail] = useState('');

  const handleSubmit = (event) => {debugger
    event.preventDefault(); // Prevent the default form submission behavior
    console.log('Sending invitation to', email); // Placeholder for actual invitation sending logic
    // Reset the email state after submission
    setEmail('');
  };

  return (
    <div className="flex justify-end">
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="guestEmail">Invite User</label>
          <input
            type="email"
            id="guestEmail"
            className="inviteuser"
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter guest's email"
            required
          />
          <button type="submit" className="add-btn">Send</button>
        </div>
      </form>
    </div>
  );
}

export default InviteForm;
