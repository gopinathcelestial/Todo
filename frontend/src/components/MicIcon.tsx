import React from 'react';

const MicrophoneButton = () => {
    
    return (
        <div className="fixed bottom-5 right-5 cursor-pointer">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-gray-700 hover:text-gray-900"
                viewBox="0 0 20 20"
                fill="currentColor"
            >
                <path
                    fillRule="evenodd"
                    d="M10 12a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"
                />
                <path
                    fillRule="evenodd"
                    d="M14.5 10a4.5 4.5 0 01-9 0V6a4.5 4.5 0 019 0v4zm-2.8 2.8a6 6 0 10-2.4-2.4l2.4 2.4z"
                    clipRule="evenodd"
                />
            </svg>
        </div>
    );
};

export default MicrophoneButton;
