import React, { useState } from "react";
import axios from "axios";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { toast } from "react-toastify";

export const Model = ({
  isOpen,
  onClose,
  title,
  taskTitle: initialTaskTitle,
  taskDescription: initialTaskDescription,
  isCompleted: initialIsCompleted,
  duedate: initialDuedate,
  reminderTime: initialReminderTime,
  reminderDays: initialReminderDays,
  id: id,
  onTodoAdded,
}) => {
  if (!isOpen) return null;

  // State for the form inputs
  const [taskTitle, setTaskTitle] = useState(initialTaskTitle || "");
  const [taskDescription, setTaskDescription] = useState(
    initialTaskDescription || ""
  );
  const [dueDate, setDueDate] = useState(initialDuedate || ""); // State for due date
  const [reminderTime, setReminderTime] = useState(initialReminderTime || ""); // State for reminder time
  const [reminderDays, setReminderDays] = useState(initialReminderDays || []); // State for reminder days
  const [isCompleted, setIsCompleted] = useState(initialIsCompleted || false);
  const [showDueDate, setShowDueDate] = useState(false);
  const [showReminderTime, setShowReminderTime] = useState(false);
  const [showReminderDays, setShowReminderDays] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      let response;
      if (title === "Add new Task") {
        response = await axios.post(
          "http://localhost:3000/api/v1/todos",
          {
            title: taskTitle,
            description: taskDescription,
            dueDate: dueDate,
            reminderTime: reminderTime,
            reminderDays: reminderDays,
            isCompleted: false,
          },
          {
            withCredentials: true,
            headers: {
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
        toast.success("Task created successfully", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
        console.log("Task created:", response.data);
      } else {
        // Edit existing task
        response = await axios.put(
          `http://localhost:3000/api/v1/todos/${id}`,
          {
            title: taskTitle,
            description: taskDescription,
            dueDate: dueDate,
            reminderTime: reminderTime,
            reminderDays: reminderDays,
            isCompleted: initialIsCompleted,
          },
          {
            withCredentials: true,
            headers: {
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
        toast.success("Task modified successfully", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
        console.log("Task updated:", response.data);
      }

      onClose();
      onTodoAdded();
    } catch (error) {
      console.error("Error creating/updating task:", error);
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
        <form
          className="flex flex-col stylesInputsField"
          onSubmit={handleSubmit}
        >
          <label className="pb-4">
            Title
            <input
              type="text"
              placeholder="e.g., Study for the test"
              required
              className="w-full pl-2 mt-1"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
            />
          </label>
          <label>
            Description (optional)
            <ReactQuill
              value={taskDescription}
              onChange={setTaskDescription}
              className="w-full mt-1"
              modules={{
                toolbar: [
                  [{ header: [1, 2, 3, false] }],
                  ["bold", "italic", "underline"],
                  ["link"],
                ],
              }}
              formats={["header", "bold", "italic", "underline", "link"]}
            />
          </label>

          {showDueDate && (
            <label className="pb-4 pt-4">
              Due Date
              <input
                type="date"
                value={dueDate.substring(0, 10)}
                onChange={(e) => setDueDate(e.target.value)}
                required
                className="w-full pl-2 mt-1"
              />
            </label>
          )}
          {showReminderTime && (
            <label className="pb-4">
              Reminder Time
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="w-full pl-2 mt-1"
              />
            </label>
          )}
          {showReminderDays && (
            <label className="pb-4">
              Reminder Days
              <span className="text-sm text-gray-500">
                (Hold Ctrl/Cmd to select multiple options)
              </span>
              <select
                multiple
                value={reminderDays}
                onChange={(e) =>
                  setReminderDays(
                    Array.from(
                      e.target.selectedOptions,
                      (option) => option.value
                    )
                  )
                }
                className="w-full pl-2 mt-1"
              >
                <option value="Sunday">Sunday</option>
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
                <option value="Friday">Friday</option>
                <option value="Saturday">Saturday</option>
              </select>
            </label>
          )}

          <div className="flex justify-between pb-4 pt-4">
            <label className="pb-4">
              <input
                type="checkbox"
                checked={showDueDate}
                onChange={() => setShowDueDate(!showDueDate)}
              />
              Due Date
            </label>
            <label className="pb-4">
              <input
                type="checkbox"
                checked={showReminderTime}
                onChange={() => setShowReminderTime(!showReminderTime)}
              />
              Reminder Time
            </label>
            <label className="pb-4">
              <input
                type="checkbox"
                checked={showReminderDays}
                onChange={() => setShowReminderDays(!showReminderDays)}
              />
              Reminder Days
            </label>
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              className="btn mt-5 px-2 text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700"
            >
              {title}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
