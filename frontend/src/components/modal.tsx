import React from 'react';

export const Model = ({ isOpen, onClose , title}) => {
  if (!isOpen) return null; // Render nothing if isOpen is false

  const handleSubmit = (event) => {
    event.preventDefault();
    // Perform any form submission logic here
    // Then close the modal
    onClose();
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-gray-500 bg-opacity-50">
      <div className="relative bg-slate-200 max-w-lg w-full rounded-lg p-3 sm:p-5 flex flex-col justify-start dark:bg-slate-900">
        <button
          aria-label="close alert"
          className="absolute top-3 right-3 sm:right-4"
          onClick={handleSubmit}
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
        <h2 className="font-medium mb-5 text-lg md:text-2xl">{title}</h2>
        <form className="flex flex-col stylesInputsField">
          <label className="pb-2">
            Title
            <input
              type="text"
              placeholder="e.g, study for the test"
              required=""
              className="w-full rounded"
              value=""
              
            ></input>
          </label>
          <label className="pb-2">
            Date
            <input
              type="date"
              className="w-full"
              required=""
              min="2024-4-20"
              max="2025-4-20"
              value=""
            ></input>
          </label>
          <label>
            Description (optional)
            <textarea placeholder="e.g, study for the test" className="w-full">
              
            </textarea>
          </label>
         
          <button type="submit" className="btn mt-5" onClick={handleSubmit}>
          {title}
          </button>
        </form>
      </div>
    </div>
  );
};
