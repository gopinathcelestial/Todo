import React, { useState } from 'react';
import axios from 'axios';
import ReactQuill from 'react-quill'; // Import ReactQuill component
import 'react-quill/dist/quill.snow.css'; // Import Quill styles

export const Model = ({ isOpen, onClose, title, taskTitle: initialTaskTitle, taskDescription: initialTaskDescription, isCompleted: initialIsCompleted, id: id, onTodoAdded }) => {
  if (!isOpen) return null;

  // State for the form inputs
  const [taskTitle, setTaskTitle] = useState(initialTaskTitle || '');
  const [taskDescription, setTaskDescription] = useState(initialTaskDescription || '');
  const [isCompleted, setIsCompleted] = useState(initialIsCompleted || false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    // Perform any form submission logic here
    try {
      let response;
      if (title === 'Add new Task') {
        // Create new task
        response = await axios.post('http://localhost:3000/api/v1/todos', {
          title: taskTitle,
          description: taskDescription,
          isCompleted: false, // Set initial completion status to false for new tasks
        }, {
          withCredentials: true,
          headers: {
            "Access-Control-Allow-Origin": "*",
          }
        });
        console.log('Task created:', response.data);
      } else {
        // Edit existing task
        response = await axios.put(`http://localhost:3000/api/v1/todos/${id}`, {
          title: taskTitle,
          description: taskDescription,
          isCompleted: initialIsCompleted, // Keep the original completion status when editing
        }, {
          withCredentials: true,
          headers: {
            "Access-Control-Allow-Origin": "*",
          }
        });
        console.log('Task updated:', response.data);
      }

      // Log or handle response data as needed
      onClose(); // Close the modal after successful submission
      onTodoAdded();
    } catch (error) {
      console.error('Error creating/updating task:', error);
    }
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-gray-500 bg-opacity-50">
      <div className="relative bg-slate-200 max-w-lg w-full rounded-lg p-3 sm:p-5 flex flex-col justify-start dark:bg-slate-900">
        <button
          aria-label="close alert"
          className="absolute top-3 right-3 sm:right-4"
          onClick={onClose}
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
        <form className="flex flex-col stylesInputsField" onSubmit={handleSubmit}>
          <label className="pb-2">
            Title
            <input
              type="text"
              placeholder="e.g., Study for the test"
              required
              className="w-full rounded"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
            />
          </label>
          <label>
            Description (optional)
            <ReactQuill
              value={taskDescription}
              onChange={setTaskDescription}
              className="w-full"
              modules={{
                toolbar: [
                  [{ 'header': [1, 2, 3, false] }],
                  ['bold', 'italic', 'underline'],
                  ['link'],
                ],
              }}
              formats={[
                'header',
                'bold', 'italic', 'underline',
                'link'
              ]}
            />
          </label>
          <button type="submit" className="btn mt-5">
            {title}
          </button>
        </form>
      </div>
    </div>
  );
};
