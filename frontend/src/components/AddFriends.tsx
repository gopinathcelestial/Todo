import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FaTimes } from 'react-icons/fa';

interface AddFriendsProps {
  isOpen: boolean;
  onRequestClose: () => void;
}

export const AddFriend: React.FC<AddFriendsProps> = ({
  isOpen,
  onRequestClose,
}) => {
  // State declarations
  const [email, setEmail] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [addedEmails, setAddedEmails] = useState<{ email: string; id: string }[]>([]);
  const [suggestions, setSuggestions] = useState<{ email: string; id: string }[]>([]);
  const [inviteFriend, setInviteFriend] = useState(false);
  const [friendsRequest, setFriendsRequest] = useState<{ email: string; id: string }[]>([]);

  useEffect(() => {
    const fetchEmails = async () => {
      const emails = await fetchRegisteredEmails();
      setSuggestions(emails);
    };
    fetchEmails();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setIsDropdownOpen(!!value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (email) {
        addEmail(email, '');
        setEmail('');
        setIsDropdownOpen(false);
      }
    }
  };

  const handleSuggestionClick = (suggestion: { email: string; id: string }) => {
    addEmail(suggestion.email, suggestion.id);
    setEmail('');
    setIsDropdownOpen(false);
  };

  const addEmail = (emailToAdd: string, id: string) => {
    if (emailToAdd && !addedEmails.some(email => email.email === emailToAdd)) {
      setAddedEmails(prevEmails => [...prevEmails, { email: emailToAdd, id }]);
    }
  };

  const removeEmail = (emailToRemove: string) => {
    setAddedEmails(addedEmails.filter(email => email.email !== emailToRemove));
  };

  const filteredSuggestions = suggestions.filter(suggestion =>
    suggestion.email.toLowerCase().includes(email.toLowerCase())
  );

  const fetchRegisteredEmails = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/v1/friends/users', {
        withCredentials: true,
        headers: {
          "Access-Control-Allow-Origin": "*",
        }
      });
      return response.data.map((user: { email: string, id: string }) => ({
        email: user.email,
        id: user.id,
      }));
    } catch (error) {
      console.error('Failed to fetch registered emails:', error);
      return [];
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const successfulRequests: { email: string; id: string }[] = [];

    try {
      for (const user of addedEmails) {
        try {
          const friendRequestResponse = await axios.post(
            `http://localhost:3000/api/v1/friends/friend-request/${user.id}`,
            {},
            {
              withCredentials: true,
              headers: {
                "Access-Control-Allow-Origin": "*",
              },
            }
          );
          console.log(`Friend request sent to ${user.email}:`, friendRequestResponse.data.message);
          successfulRequests.push(user); // Add to successful requests array
        } catch (error) {
          if (axios.isAxiosError(error)) {
            console.error(`Failed to send friend request to ${user.email}:`, error.response?.data?.message || error.message);
            toast.error(`Failed to send friend request to ${user.email}: ${error.response?.data?.message || error.message}`, {
              position: "top-right",
              autoClose: 3000,
              hideProgressBar: true,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
              theme: "light",
            });
          } else {
            console.error(`Failed to send friend request to ${user.email}:`, (error as Error).message);
            toast.error(`Failed to send friend request to ${user.email}: ${(error as Error).message}`, {
              position: "top-right",
              autoClose: 3000,
              hideProgressBar: true,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
              theme: "light",
            });
          }
        }
      }
      // Update the friendsRequest state with successful requests
      setFriendsRequest(successfulRequests);
      onRequestClose();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Error sending friend requests:", error.message);
      } else {
        console.error("Error sending friend requests:", (error as Error).message);
      }
    }
  };

  return (
    isOpen && (
      <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-gray-500 bg-opacity-50">
        <div className="relative bg-slate-200 max-w-lg w-full rounded-lg p-3 sm:p-5 flex flex-col justify-start dark:bg-slate-900">
          <button
            aria-label="close alert"
            className="absolute top-3 right-3 sm:right-4"
            onClick={onRequestClose}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>

          <form
            className="flex flex-col"
            onSubmit={handleSubmit}
          >
            <h1 className="text-xl font-bold mb-4 text-center">Send Friend Requests</h1>
            <div className="w-full border-b border-gray-200 sm:border-b-0 sm:border-l dark:border-gray-600 pt-4">
              <div className="flex items-center">
                <label htmlFor="inviteFriend" className="relative inline-flex items-center cursor-pointer">
                  <input
                    id="inviteFriend"
                    type="checkbox"
                    className="sr-only peer"
                    checked={inviteFriend}
                    onChange={() => setInviteFriend(!inviteFriend)}
                  />
                  <span className="ml-2 text-gray-900 dark:text-gray-100">Invite Friend</span>
                </label>
              </div>
            </div>
            <div className='pt-4'>
              <div className="relative">
                <label className="pb-4">
                  <input
                    type="email"
                    id="guestEmail"
                    className="w-full pl-2 mt-1 border border-gray-300 rounded-lg"
                    value={email}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter guest's email"
                    aria-haspopup="listbox"
                    aria-expanded={isDropdownOpen}
                  />
                </label>
                {isDropdownOpen && filteredSuggestions.length > 0 && (
                  <ul className="border border-gray-300 mt-2 absolute bg-white w-full max-h-60 overflow-auto z-10 rounded-lg shadow-lg">
                    {filteredSuggestions.map((suggestion, index) => (
                      <li
                        key={index}
                        className="p-2 cursor-pointer hover:bg-gray-200"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        {suggestion.email}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {friendsRequest.length > 0 && (
                <div className="mt-4">
                </div>
              )}
              <div className="mt-4 flex flex-wrap">
                {addedEmails.map((addedEmail, index) => (
                  <div key={index} className="flex items-center mb-2 mr-2 p-2 bg-gray-200 rounded-lg">
                    <span className="mr-2">{addedEmail.email}</span>
                    <FaTimes
                      className="cursor-pointer text-red-500"
                      onClick={() => removeEmail(addedEmail.email)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="btn mt-5 px-2 text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700"
              >
                Send Invitations
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  );
};
export default AddFriend;
