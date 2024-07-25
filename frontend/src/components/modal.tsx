import React, { useState } from "react";
import axios from "axios";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { toast } from "react-toastify";
import { Avatar, ListGroup, Tooltip } from "flowbite-react";
import useSpeechToText from "../hooks/useSpeechToText";

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
  // State for the form inputs
  if (!isOpen) return null;
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

  const { isListening, transcript, startListening, stopListening } =
    useSpeechToText({ continuous: true });
  const startStopListening = (e) => {
    e.preventDefault();
    document.getElementById("titleInput")?.focus();
    isListening ? stopVoiceInput(e) : startListening();
  };

  const stopVoiceInput = async (e) => {
    try {
      stopListening();
      e.currentTarget.disabled = true;
      console.log('transcript', transcript)
      if (transcript === '') {
        toast.info("I didn't get you, can you say that again?", {
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
      if (transcript) {
        const response = await toast.promise(
          axios.post(
            "http://127.0.0.1:8000/extract-entities",
            { text: transcript },
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          ),
          {
            pending: 'Analysing your voice. please wait.',
            success: 'Todo Updated Successfully',
            error: 'There is some error. please try again'
          }
        );
        const data = response.data;
        setTaskTitle(data.title)
        setTaskDescription(data.description)
        if (data.due_date != "No due date found") {
          setDueDate(data.due_date)
          setShowDueDate(true)
        }
        console.log("Extracted entities:", data);
      }
      e.target.disabled = false;
    } catch (error) {
      console.error("Error extracting entities:", error);
      e.target.disabled = false;
    }
  };

  const handleSubmit = async (event:any) => {
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
        <div className="flex justify-between items-center mb-5">
          <button
            className="btn px-2 text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700 flex items-center"
            onClick={startStopListening}
            id="voiceBtn"
          >
            {isListening ? "Stop Voice Input" : "Add Todo via Voice"}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 384 512"
              width="1rem"
              version="1.1"
              className={`ml-2 ${isListening ? "animate-blink" : ""}`}
            >
              <path
                fill={isListening ? "red" : "#c2c2c2"}
                d="M192 0C139 0 96 43 96 96V256c0 53 43 96 96 96s96-43 96-96V96c0-53-43-96-96-96zM64 216c0-13.3-10.7-24-24-24s-24 10.7-24 24v40c0 89.1 66.2 162.7 152 174.4V464H120c-13.3 0-24 10.7-24 24s10.7 24 24 24h72 72c13.3 0 24-10.7 24-24s-10.7-24-24-24H216V430.4c85.8-11.7 152-85.3 152-174.4V216c0-13.3-10.7-24-24-24s-24 10.7-24 24v40c0 70.7-57.3 128-128 128s-128-57.3-128-128V216z"
              />
            </svg>
          </button>
        </div>
        <form
          className="flex flex-col stylesInputsField"
          onSubmit={handleSubmit}
        >
          <label className="pb-4 ">
            Title
            <input
              type="text"
              placeholder="e.g., Study for the test"
              required
              className="w-full pl-2 mt-1"
              id="titleInput"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
            />
          </label>
          <label>
            Description
            <ReactQuill
              value={taskDescription}
              onChange={(value) => setTaskDescription(value)}
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
                value={dueDate.substring(0, 10) || ""}
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
          <div className="pt-4">

            <ul className="items-center w-full text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg sm:flex dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              <li className="w-full border-b border-gray-200 sm:border-b-0 sm:border-r dark:border-gray-600">
                <div className="flex items-center ps-3">
                  <input
                    id="showDueDate"
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
                    checked={showDueDate}
                    onChange={() => setShowDueDate(!showDueDate)}
                  />
                  <label
                    htmlFor="showDueDate"
                    className="w-full py-3 ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
                  >
                    Due Date
                  </label>
                </div>
              </li>
              <li className="w-full border-b border-gray-200 sm:border-b-0 sm:border-r dark:border-gray-600">
                <div className="flex items-center ps-3">
                  <input
                    id="showReminderTime"
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
                    checked={showReminderTime}
                    onChange={() => setShowReminderTime(!showReminderTime)}
                  />
                  <label
                    htmlFor="showReminderTime"
                    className="w-full py-3 ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
                  >
                    Reminder Time
                  </label>
                </div>
              </li>
              <li className="w-full dark:border-gray-600">
                <div className="flex items-center ps-3">
                  <input
                    id="showReminderDays"
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
                    checked={showReminderDays}
                    onChange={() => setShowReminderDays(!showReminderDays)}
                  />
                  <label
                    htmlFor="showReminderDays"
                    className="w-full py-3 ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
                  >
                    Reminder Days
                  </label>
                </div>
              </li>
            </ul>
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

export const SyncAcc = ({ isOpen, onClose, title, todos, logout, emailOptions }) => {
  const uniqueGoogleEmails = new Set();
  const uniqueMicrosoftEmails = new Set();
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [displayAs, setDisplayAs] = useState('list');
  const emailCounts = {};
  const logoutIcon = 'https://c3.klipartz.com/pngpicture/421/12/sticker-png-sword-art-online-vector-icons-logout-thumbnail.png';
  const stackedIcon = <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" transform="rotate(0)"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M18 8L6 8M6 8L10.125 4M6 8L10.125 12" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> <path opacity="0.5" d="M6 16L18 16M18 16L13.875 12M18 16L13.875 20" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>
  const listIcon = <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path opacity="0.5" d="M16 18L16 6M16 6L20 10.125M16 6L12 10.125" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M8 6L8 18M8 18L12 13.875M8 18L4 13.875" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>


  const handleGoogleLogin = async (event) => {
    event.preventDefault();
    window.location.href = "http://localhost:3000/googlelogin";
  };

  const handleMicrosoftLogin = async (event) => {
    event.preventDefault();
    window.location.href = "http://localhost:3000/microsoftlogin";
  };

  todos.forEach((todo) => {
    const { email } = todo;
    emailCounts[email] = (emailCounts[email] || 0) + 1;
  });

  const handleLogout = async (email) => {
    if (selectedAvatar || email) {
      console.log(selectedAvatar||email);
      logout(selectedAvatar||email);
      toast.success(`Selected avatar: ${selectedAvatar||email}`, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
      setSelectedAvatar(null);
    }
  };

  const displayAccountAs = () =>{
    if (displayAs === 'avatar') {
      setDisplayAs('list');
    }else{
      setDisplayAs('avatar');
    }
  };

  const handleAvatarClick = (email) => {
    if (selectedAvatar === email) {
      setSelectedAvatar(null);
    } else {
      setSelectedAvatar(email);
    }
  };

  return (
    <div className={`z-50 fixed top-0 left-0 w-full h-full flex items-center justify-center bg-gray-500 bg-opacity-50 ${isOpen ? "" : "hidden"}`}>
      <div className="relative bg-slate-200 max-w-lg w-full rounded-lg p-3 sm:p-5 flex flex-col justify-start dark:bg-slate-900">
        <button aria-label="close alert" className="absolute top-3 right-3 sm:right-4" onClick={onClose}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
        <h2 className="font-medium mb-5 text-lg md:text-2xl">{title}</h2>
        <div className="flex justify-between items-center mb-5">
          <div>
            <button className="btn px-2 text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700 flex items-center" id="google" onClick={handleGoogleLogin}>
              <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="30" height="30" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
              </svg>
              <span className="ms-3 whitespace-nowrap">Sync with Google</span>
            </button>
          </div>
          <div className="flex items-center">
            <div className="border-b border-gray-400 w-full"></div>
            <div className="text-center mx-4 text-gray-500 dark:text-gray-300">OR</div>
            <div className="border-b border-gray-400 w-full"></div>
          </div>
          <div>
            <button className="btn px-2 text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700 flex items-center" id="microsoft" onClick={handleMicrosoftLogin}>
              <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="30" height="30" viewBox="0 0 48 48">
                <path fill="#ff5722" d="M6 6H22V22H6z" transform="rotate(-180 14 14)"></path>
                <path fill="#4caf50" d="M26 6H42V22H26z" transform="rotate(-180 34 14)"></path>
                <path fill="#ffc107" d="M26 26H42V42H26z" transform="rotate(-180 34 34)"></path>
                <path fill="#03a9f4" d="M6 26H22V42H6z" transform="rotate(-180 14 34)"></path>
              </svg>
              <span className="ms-3 whitespace-nowrap">Sync with Microsoft</span>
            </button>
          </div>
        </div>
        {(emailOptions.length >1)? <div className="flex items-center justify-between mr-[5px]"> Already logged in accounts <span title={displayAs === 'avatar'? 'View as List': 'View as Stacked'} onClick={()=>{displayAccountAs()}}>{displayAs === 'avatar'? stackedIcon: listIcon}</span></div>:''}    
        <div className="flex justify-center pt-5">
          <div className="w-1/2 flex justify-center pr-2">
            {displayAs === 'avatar' ? (
              <Avatar.Group>
                {todos
                  .filter((todo) => todo.origin === "google")
                  .filter((todo) => {
                    if (!uniqueGoogleEmails.has(todo.email)) {
                      uniqueGoogleEmails.add(todo.email);
                      return true;
                    }
                    return false;
                  })
                  .map((todo) => (
                    <div key={todo.email} className="relative">
                      <Tooltip
                        content={<img width="30px" src={logoutIcon} onClick={() => handleLogout(todo.email)} />}
                        className="rounded-full py-[5px] px-[7px]"
                        style="light"
                        trigger="click"
                        arrow={true}
                      >
                        <Avatar
                          key={todo.email}
                          title={todo.email}
                          img={todo.picture}
                          onClick={() => handleAvatarClick(todo.email)}
                          rounded
                          bordered={selectedAvatar === todo.email}
                          color={selectedAvatar === todo.email ? "pink" : ""}
                          stacked
                        />
                      </Tooltip>
                    </div>
                  ))}
                {Object.keys(emailCounts).map((email) => {
                  if (emailCounts[email] > 3 && uniqueGoogleEmails.has(email)) {
                    return <Avatar.Counter key={`counter-${email}`} total={emailCounts[email] - 3} href="#" />;
                  }
                  return null;
                })}
              </Avatar.Group>
            ) : (
              <ListGroup className="w-full">
                {todos
                  .filter((todo) => todo.origin === "google")
                  .filter((todo) => {
                    if (!uniqueGoogleEmails.has(todo.email)) {
                      uniqueGoogleEmails.add(todo.email);
                      return true;
                    }
                    return false;
                  })
                  .map((todo) => (
                    <div className="flex items-center justify-between mr-[5px]" key={todo.email}>
                      <ListGroup.Item title={'Google: '+todo.email} onClick={() => handleAvatarClick(todo.email)}>
                        <img width="30px" title={'Google: '+todo.email} src={todo.picture} />
                        <span className="ms-3">{todo.name}</span>
                      </ListGroup.Item>
                      <img width="30px" className="ms-3" src={logoutIcon} onClick={() => handleLogout(todo.email)} />
                    </div>
                  ))}
              </ListGroup>
            )}
          </div>
          <div className="w-1/2 flex justify-center pl-2">
          {displayAs === 'avatar' ? (
            <Avatar.Group>
              {todos
                .filter((todo) => todo.origin === "microsoft")
                .filter((todo) => {
                  if (!uniqueMicrosoftEmails.has(todo.email)) {
                    uniqueMicrosoftEmails.add(todo.email);
                    return true;
                  }
                  return false;
                })
                .map((todo) => (
                  <div key={todo.email} className="relative">
                    <Tooltip content={<img height="30px" width="50px" src={logoutIcon} onClick={() => handleLogout(todo.email)} />} className="rounded-full py-[5px] px-[7px]" style="light" trigger="click" arrow={true}>
                      <Avatar
                        key={todo.email}
                        title={todo.email}
                        img={todo.picture}
                        onClick={() => handleAvatarClick(todo.email)}
                        rounded
                        bordered={selectedAvatar === todo.email}
                        color={selectedAvatar === todo.email ? "pink" : ""}
                        stacked
                      />
                    </Tooltip>
                  </div>
                ))}
              {Object.keys(emailCounts).map((email) => {
                if (emailCounts[email] > 3 && uniqueMicrosoftEmails.has(email)) {
                  return <Avatar.Counter key={`counter-${email}`} total={emailCounts[email] - 3} href="#" />;
                }
                return null;
              })}
            </Avatar.Group>
          ):(
            <ListGroup className="w-full">
                {todos
                  .filter((todo) => todo.origin === "microsoft")
                  .filter((todo) => {
                    if (!uniqueMicrosoftEmails.has(todo.email)) {
                      uniqueMicrosoftEmails.add(todo.email);
                      return true;
                    }
                    return false;
                  })
                  .map((todo) => (
                    <div className="flex items-center justify-between mr-[5px]" key={todo.email}>
                      <ListGroup.Item title={todo.email} onClick={() => handleAvatarClick(todo.email)}>
                        <img width="30px" title={todo.email} src={todo.picture} />
                        <span className="ms-3">{todo.name}</span>
                      </ListGroup.Item>
                      <img width="30px" className="ms-3" src={logoutIcon} onClick={() => handleLogout(todo.email)} />
                    </div>
                  ))}
              </ListGroup>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};