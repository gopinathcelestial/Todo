import React, { useState, useEffect } from "react";
import axios from "axios";
import { Model, SyncAcc } from "./modal";
import { useNavigate } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import NotificationSchedulerService from "./NotificationSchedulerService";
import interactionPlugin from "@fullcalendar/interaction";
import useSpeechToText from "../hooks/useSpeechToText";
import "../App.css";

import { toast } from "react-toastify";

interface Todo {
  id: number;
  title: string;
  description: string;
  isCompleted: boolean;
  dueDate: Date;
  reminderTime: string;
  reminderDays: Array<any>;
  origin: string
}

export const Todos = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [SyncTitle, setSyncTitle] = useState("");
  const [modalTaskData, setModalTaskData] = useState<Todo | null>(null);
  const [completedTodos, setCompletedTodos] = useState<Todo[]>([]);
  const [allTasksCount, setAllTasksCount] = useState(0);
  const [completedTasksCount, setCompletedTasksCount] = useState(0);
  const [title, settitle] = useState("All Tasks");
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [filteredTodos, setFilteredTodos] = useState<Todo[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const navigate = useNavigate();
  const googleIcon = <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="30" height="30" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path></svg>
  const microsoftIcon = <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="30" height="30" viewBox="0 0 48 48"><path fill="#ff5722" d="M6 6H22V22H6z" transform="rotate(-180 14 14)"></path><path fill="#4caf50" d="M26 6H42V22H26z" transform="rotate(-180 34 14)"></path><path fill="#ffc107" d="M26 26H42V42H26z" transform="rotate(-180 34 34)"></path><path fill="#03a9f4" d="M6 26H22V42H6z" transform="rotate(-180 14 34)"></path></svg>
  const { isListening, transcript, startListening, stopListening } = useSpeechToText({ continuous: true });
  const startStopListening = (e: any) => {
    e.preventDefault();
    document.getElementById("titleInput")?.focus();
    isListening ? stopVoiceInput(e) : startListening();
  };

  const stopVoiceInput = async (e: any) => {
    try {
      console.log("transcript", transcript);
      if (transcript === "") {
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
      setSearchQuery(transcript);
    } catch (error) {
      console.error("Error extracting entities:", error);
    }
    stopListening();
  };

  const fetchTodos = () => {
    const notificationSchedulerService = NotificationSchedulerService();

    // Fetch Todos from your DB
    axios
      .get("http://localhost:3000/api/v1/todos", {
        withCredentials: true,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      })
      .then((response) => {
        const allTodos = response.data;

        // Fetch events from Google Calendar
        axios
          .get("http://localhost:3000/events", {
            withCredentials: true,
            headers: {
              "Access-Control-Allow-Origin": "*",
            },
          })
          .then((eventResponse) => {
            const calendarEvents = eventResponse.data;
            // // Fetch events from Microsoft Calendar
            // axios
            //   .get("http://localhost:3000/microsoft/events", {
            //     withCredentials: true,
            //     headers: {
            //       "Access-Control-Allow-Origin": "*",
            //     },
            //   }).then((calendarResponse)=>{
            //     const microsoftEvents = calendarResponse.data;


            // // Combine todos and calendar events
            // const combinedTodos = [...allTodos, ...calendarEvents, ...microsoftEvents];
            const combinedTodos = [...allTodos, ...calendarEvents];

            setTodos(combinedTodos);
            setAllTasksCount(combinedTodos.length);

            combinedTodos.forEach((task) => {
              const dueDate =
                new Date(task.dueDate).toDateString() + " " + "09:00";
              const dueDateTimestamp = new Date(dueDate).getTime();
              notificationSchedulerService.scheduleNotification(
                `Task Reminder: ${task.title}`,
                {
                  body: `Description: ${task.description}`,
                },
                dueDateTimestamp
              );

              const reminderDays = task?.reminderDays?.map((day: any) =>
                getDayNumber(day.toLowerCase())
              );
              const reminderTime = task?.reminderTime || "00:00:00";

              reminderDays?.forEach((day: any) => {
                const reminderDate = new Date();
                const today = new Date();
                const dayDiff = (day - today.getDay() + 7) % 7;
                reminderDate.setDate(reminderDate.getDate() + dayDiff);
                const [hours, minutes, seconds] = reminderTime.split(":");
                reminderDate.setHours(parseInt(hours));
                reminderDate.setMinutes(parseInt(minutes));

                notificationSchedulerService.scheduleNotification(
                  `Task Reminder: ${task.title}`,
                  {
                    body: `Description: ${task.description}`,
                  },
                  reminderDate.getTime()
                );
              });
            });
          // });

        function getDayNumber(day: string) {
          const daysMap: { [key: string]: number } = {
            sunday: 0,
            monday: 1,
            tuesday: 2,
            wednesday: 3,
            thursday: 4,
            friday: 5,
            saturday: 6,
          };
          return daysMap[day];
        }
      }).catch((error) => {
          console.error("Error fetching calendar events:", error);
            toast.error("Error fetching calendar events", {
              position: "top-right",
              autoClose: 3000,
              hideProgressBar: true,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
              theme: "light",
            });
          });
      })
      .catch((error) => {
        navigate("/signin");
        console.error("Error fetching todos:", error);
        toast.error(error.response.data.message || "there is some error while fetching the todos", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
      });

    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  };

  const handleLoginResponse = () => {
    const params = new URLSearchParams(window.location.search);
    const loginStatus = params.get('login');

    if (loginStatus === 'success') {
      toast.success("Login successful", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      })
    } else if (loginStatus === 'alreadyloggedin') {
      toast.info("You are already logged in", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    } else if (loginStatus === 'failed') {
      toast.error("Login failed", {
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

    // this remove the loginstatus parameter from the url
    if (loginStatus) {
      setTimeout(() => {
        const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.history.replaceState({ path: newUrl }, '', newUrl);
      }, 500); // Adjust the delay as needed
    }
  };

  useEffect(() => {
    fetchTodos();
    handleLoginResponse();
  }, []);

  const handleSignOut = async () => {
    try {
      const response = await axios.post(
        "http://localhost:3000/auth/signout",
        {},
        {
          withCredentials: true,
        }
      );
      console.log("Sign out successful:", response.data);
      toast.success("Successfully Signed Out", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
      navigate("/signin");
    } catch (error: any) {
      toast.error("There is some error while signing out, please try again", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
      console.error(
        "Error signing out:",
        error.response ? error.response.data : error
      );
    }
  };

  const handleMarkAsCompleted = async (id: number) => {
    try {
      const updatedTodos = todos.map((todo) => {
        if (todo.id === id) {
          return { ...todo, isCompleted: !todo.isCompleted };
        }
        return todo;
      });

      await axios.put(
        `http://localhost:3000/api/v1/todos/${id}`,
        { isCompleted: !todos.find((todo) => todo.id === id)?.isCompleted },
        {
          withCredentials: true,
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
        }
      );

      setTodos(updatedTodos);
    } catch (error) {
      toast.error("There is some issue, please try again", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
      console.error("Error marking task as completed:", error);
    }
  };

  const handleDeleteTask = async (id: number) => {
    try {
      await axios.delete(`http://localhost:3000/api/v1/todos/${id}`, {
        withCredentials: true,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      });

      fetchTodos();
      toast.success("Task has been deleted", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    } catch (error) {
      toast.error("There is some issue, please try again", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
      console.error("Error deleting task:", error);
    }
  };

  const handleEditTask = (todo: Todo) => {
    console.log(todo);
    setModalTaskData(todo);
    setModalTitle("Edit Task");
    setIsModalOpen(true);
  };

  const handleTodoAdded = () => {
    setIsModalOpen(false);
    setModalTaskData(null);
    fetchTodos();
  };

  const handleAllTasksClick = () => {
    setShowCalendar(false);
    settitle("All Tasks");
    const sortedTodos = sortTodos(todos);
    setFilteredTodos(sortedTodos);
  };
  const handleCompletedTasksClick = () => {
    settitle("Completed tasks");
    setTodos(completedTodos);
    setModalTitle("Completed tasks");
  };

  const handleCalendarViewClick = () => {
    const updatedCalendarEvents = todos.map((task) => {
      const startDate = new Date(task.dueDate);

      return {
        title: task.title,
        date: startDate.toISOString().split("T")[0],
      };
    });
    setCalendarEvents(updatedCalendarEvents);
    setShowCalendar(true);
    settitle("Calendar View");
  };

  const toggleSortOrder = () => {
    const newSortOrder = sortOrder === "asc" ? "desc" : "asc";
    setSortOrder(newSortOrder);
    const sortedTodos = sortTodos(todos);
    setFilteredTodos(sortedTodos);
  };

  const sortTodos = (todos: any) => {
    return todos.sort((a: any, b: any) => {
      const titleA = a.title.toLowerCase();
      const titleB = b.title.toLowerCase();

      if (sortOrder === "asc") {
        if (titleA < titleB) return -1;
        if (titleA > titleB) return 1;
        return 0;
      } else {
        if (titleA < titleB) return 1;
        if (titleA > titleB) return -1;
        return 0;
      }
    });
  };

  async function handleDateSelect(selectInfo: any) {
    const title = prompt("Enter the title of the todo");
    const description = prompt("Enter the description of the todo");

    if (title && description) {
      try {
        const response = await axios.post(
          "http://localhost:3000/api/v1/todos",
          {
            title: title,
            description: description,
            dueDate: selectInfo.startStr,
            isCompleted: false,
          },
          {
            withCredentials: true,
            headers: {
              "Access-Control-Allow-Origin": "*",
            },
          }
        );

        setCalendarEvents((prevEvents) => [
          ...prevEvents,
          {
            title: title,
            start: selectInfo.startStr,
            description: description,
            id: response.data.id,
          },
        ]);

        fetchTodos();

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
      } catch (error) {
        toast.error("Error creating task", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
        console.error("Error creating/updating task:", error);
      }
    } else {
      toast.error("Title and description are required to create a task", {
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

  function renderEventContent(eventInfo: any) {
    return (
      <>
        <b>{eventInfo.timeText}</b>
        <i>{eventInfo.event.title}</i>
      </>
    );
  }

  return (
    <>
      <nav className="fixed top-0 z-50 w-full bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700 flex items-center justify-between px-3 py-3 lg:px-5">
        <a
          href="/"
          className="text-xl font-semibold sm:text-2xl whitespace-nowrap dark:text-white"
        >
          Tasklist
        </a>

        <div className="navbar-end flex-grow flex justify-center">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 384 512"
              width="1rem"
              version="1.1"
              className={`absolute right-2 top-1/2 transform -translate-y-1/2 cursor-pointer ${isListening ? "animate-blink" : ""
                }`}
              onClick={startStopListening}
            >
              <path
                fill={isListening ? "red" : "#c2c2c2"}
                d="M192 0C139 0 96 43 96 96V256c0 53 43 96 96 96s96-43 96-96V96c0-53-43-96-96-96zM64 216c0-13.3-10.7-24-24-24s-24 10.7-24 24v40c0 89.1 66.2 162.7 152 174.4V464H120c-13.3 0-24 10.7-24 24s10.7 24 24 24h72 72c13.3 0 24-10.7 24-24s-10.7-24-24-24H216V430.4c85.8-11.7 152-85.3 152-174.4V216c0-13.3-10.7-24-24-24s-24 10.7-24 24v40c0 70.7-57.3 128-128 128s-128-57.3-128-128V216z"
              />
            </svg>
          </div>
        </div>

        <button
          type="button"
          className="text-sm text-gray-500 ml-auto mr-3 md:mr-0 hover:text-gray-700 focus:outline-none"
          onClick={handleSignOut}
        >
          Sign Out
        </button>
      </nav>

      <aside
        id="logo-sidebar"
        className="fixed top-0 left-0 z-40 w-64 h-screen pt-20 transition-transform -translate-x-full bg-white border-r border-gray-200 sm:translate-x-0 dark:bg-gray-800 dark:border-gray-700"
        aria-label="Sidebar"
      >
        <div className="h-auto px-3 pb-4 overflow-y-auto bg-white dark:bg-gray-800">
          <ul className="space-y-2 font-medium">
            <li>
              <a
                href="#"
                className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group"
              >
                <svg fill="#000000" width="30" height="30" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M2,11H8a1,1,0,0,0,1-1V4A1,1,0,0,0,8,3H2A1,1,0,0,0,1,4v6A1,1,0,0,0,2,11ZM3,5H7V9H3ZM23,7a1,1,0,0,1-1,1H12a1,1,0,0,1,0-2H22A1,1,0,0,1,23,7Zm0,10a1,1,0,0,1-1,1H12a1,1,0,0,1,0-2H22A1,1,0,0,1,23,17ZM3.235,19.7,1.281,17.673a1,1,0,0,1,1.438-1.391l1.252,1.3L7.3,14.289A1,1,0,1,1,8.7,15.711l-4.046,4a1,1,0,0,1-.7.289H3.942A1,1,0,0,1,3.235,19.7Z" /></svg>
                <span
                  className="flex-1 ms-3 whitespace-nowrap"
                  onClick={handleAllTasksClick}
                >
                  All tasks{" "}
                </span>
                <span className="inline-flex items-center justify-center px-2 ms-3 text-sm font-medium text-gray-800 bg-gray-100 rounded-full dark:bg-gray-700 dark:text-gray-300">
                  {allTasksCount}
                </span>
              </a>
            </li>

            <li>
              <a
                href="#"
                className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group"
              >
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 9H21M7 3V5M17 3V5M6 13H8M6 17H8M11 13H13M11 17H13M16 13H18M16 17H18M6.2 21H17.8C18.9201 21 19.4802 21 19.908 20.782C20.2843 20.5903 20.5903 20.2843 20.782 19.908C21 19.4802 21 18.9201 21 17.8V8.2C21 7.07989 21 6.51984 20.782 6.09202C20.5903 5.71569 20.2843 5.40973 19.908 5.21799C19.4802 5 18.9201 5 17.8 5H6.2C5.0799 5 4.51984 5 4.09202 5.21799C3.71569 5.40973 3.40973 5.71569 3.21799 6.09202C3 6.51984 3 7.07989 3 8.2V17.8C3 18.9201 3 19.4802 3.21799 19.908C3.40973 20.2843 3.71569 20.5903 4.09202 20.782C4.51984 21 5.07989 21 6.2 21Z" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <span
                  className="flex-1 ms-3 whitespace-nowrap"
                  onClick={handleCalendarViewClick}
                >
                  Calendar View
                </span>
              </a>
            </li>
          </ul>
        </div>
        <div>
          <ul>
            <li>
              <a
                href="#"
                className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group"
              >
                <span
                  className="flex-1 ms-3 whitespace-nowrap"
                  onClick={() => {
                    setSyncTitle("Sync task from cloud");
                    setIsSyncOpen(true);
                  }}
                >
                  Sync Accounts
                </span>
              </a>
            </li>
          </ul>
        </div>
      </aside>

      <div className="p-4 pt-7 sm:ml-64">
        <div className="p-4 border-2 border-gray-200 border-dashed rounded-lg dark:border-gray-700 mt-14">
          <Model
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title={modalTitle}
            taskTitle={modalTaskData?.title || ""}
            taskDescription={modalTaskData?.description || ""}
            isCompleted={modalTaskData?.isCompleted || false}
            duedate={modalTaskData?.dueDate || ""}
            reminderTime={modalTaskData?.reminderTime || ""}
            reminderDays={modalTaskData?.reminderDays || ""}
            id={modalTaskData?.id || ""}
            onTodoAdded={handleTodoAdded}
          />
          <SyncAcc
            title={SyncTitle}
            isOpen={isSyncOpen}
            onClose={() => setIsSyncOpen(false)}
          />
          <section>
            {showCalendar ? (
              <>
                <h1 className="font-medium my-5 text-center sm:text-left sm:my-8 md:text-2xl text-lg dark:text-slate-200">
                  {title}
                </h1>
                <FullCalendar
                  plugins={[dayGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  weekends={true}
                  editable={true}
                  selectable={true}
                  events={calendarEvents}
                  eventContent={renderEventContent}
                  height={520}
                  select={handleDateSelect}
                />
              </>
            ) : (
              <>
                <div className="flex w-full items-center justify-between">
                  <h1 className="font-medium my-5 pl-1 text-center sm:text-left sm:my-8 md:text-2xl text-lg dark:text-slate-200 flex items-center">
                    {title} (
                    {title === "All Tasks"
                      ? allTasksCount
                      : completedTasksCount}
                    )
                  </h1>
                  <button
                    className="ml-2 transition hover:text-slate-700 dark:hover:text-slate-200 pr-10"
                    onClick={toggleSortOrder}
                  >
                    {sortOrder !== "asc" ? (
                      <svg
                        fill="#000000"
                        className="h-13"
                        width="3rem"
                        version="1.1"
                        id="Capa_1"
                        xmlns="http://www.w3.org/2000/svg"
                        xmlnsXlink="http://www.w3.org/1999/xlink"
                        viewBox="0 0 413.156 413.156"
                        xmlSpace="preserve"
                      >
                        <g>
                          <path
                            d="M97.113,127.848c-1.251-2.594-3.877-4.243-6.756-4.243c-0.005,0-0.011,0-0.016,0l-9.018,0.019
                            c-2.885,0.006-5.512,1.666-6.754,4.271L0.731,282.682c-1.108,2.324-0.947,5.054,0.427,7.231c1.373,2.177,3.769,3.498,6.343,3.498
                            h11.08c2.891,0,5.524-1.662,6.769-4.271l19.321-40.504h82.928l19.544,40.533c1.251,2.594,3.876,4.243,6.756,4.243H165
                            c0.008,0,0.015,0,0.019,0c4.143,0,7.5-3.358,7.5-7.5c0-1.359-0.361-2.634-0.993-3.734L97.113,127.848z M56.599,223.636
                            l29.314-61.453l29.631,61.453H56.599z"
                          />
                          <path
                            d="M412.37,131.916l-3.99-8.014c-1.269-2.547-3.868-4.157-6.714-4.157H289.719c-4.143,0-7.5,3.358-7.5,7.5v10
                            c0,4.142,3.357,7.5,7.5,7.5h86.968l-95.702,128.506c-1.689,2.267-1.958,5.292-0.698,7.822l3.99,8.015
                            c1.269,2.547,3.868,4.157,6.714,4.157h111.318c4.142,0,7.5-3.358,7.5-7.5v-10c0-4.142-3.358-7.5-7.5-7.5H315.97l95.702-128.507
                            C413.36,137.471,413.63,134.447,412.37,131.916z"
                          />
                          <path
                            d="M271.818,222.604l-7.873-6.165c-1.564-1.226-3.55-1.78-5.53-1.54c-1.975,0.241-3.772,1.255-4.999,2.822l-18.231,23.285
                            v-113.76c0-4.142-3.357-7.5-7.5-7.5h-10c-4.143,0-7.5,3.358-7.5,7.5v113.76l-18.232-23.285c-1.227-1.566-3.024-2.581-4.999-2.822
                            c-1.981-0.241-3.965,0.314-5.53,1.54l-7.873,6.165c-3.261,2.553-3.835,7.267-1.281,10.528l44.51,56.847
                            c1.422,1.816,3.6,2.876,5.905,2.876c2.306,0,4.483-1.061,5.905-2.876l44.51-56.847
                            C275.652,229.871,275.078,225.157,271.818,222.604z"
                          />
                        </g>
                      </svg>
                    ) : (
                      <svg
                        fill="#000000"
                        className="h-13"
                        width="3rem"
                        version="1.1"
                        id="Capa_1"
                        xmlns="http://www.w3.org/2000/svg"
                        xmlnsXlink="http://www.w3.org/1999/xlink"
                        viewBox="0 0 420.046 420.046"
                        xmlSpace="preserve"
                      >
                        <g>
                          <path
                            d="M344.64,131.293c-1.252-2.594-3.877-4.243-6.756-4.243c-0.006,0-0.012,0-0.016,0l-9.018,0.019
                            c-2.885,0.006-5.512,1.666-6.754,4.271l-73.84,154.787c-1.109,2.324-0.947,5.054,0.426,7.231c1.373,2.177,3.77,3.498,6.344,3.498
                            h11.08c2.891,0,5.523-1.662,6.77-4.271l19.32-40.504h82.928l19.545,40.533c1.25,2.594,3.875,4.243,6.756,4.243h11.102
                            c0.008,0,0.014,0,0.02,0c4.143,0,7.5-3.358,7.5-7.5c0-1.359-0.361-2.634-0.994-3.734L344.64,131.293z M304.124,227.081
                            l29.314-61.453l29.631,61.453H304.124z"
                          />
                          <path
                            d="M132.87,135.361l-3.99-8.014c-1.27-2.547-3.869-4.157-6.715-4.157H10.218c-4.143,0-7.5,3.358-7.5,7.5v10
                            c0,4.142,3.357,7.5,7.5,7.5h86.969L1.484,276.696c-1.688,2.267-1.957,5.292-0.697,7.822l3.99,8.015
                            c1.268,2.547,3.867,4.157,6.713,4.157h111.318c4.143,0,7.5-3.358,7.5-7.5v-10c0-4.142-3.357-7.5-7.5-7.5H36.47l95.701-128.507
                            C133.861,140.916,134.13,137.892,132.87,135.361z"
                          />
                          <path
                            d="M244.65,226.049l-7.873-6.165c-1.564-1.226-3.549-1.78-5.529-1.54c-1.975,0.241-3.773,1.255-5,2.822l-18.23,23.285V130.69
                            c0-4.142-3.357-7.5-7.5-7.5h-10c-4.143,0-7.5,3.358-7.5,7.5v113.76l-18.232-23.285c-1.227-1.566-3.023-2.581-4.998-2.822
                            c-1.982-0.241-3.965,0.314-5.531,1.54l-7.873,6.165c-3.26,2.553-3.834,7.267-1.281,10.528l44.51,56.847
                            c1.422,1.816,3.6,2.876,5.906,2.876c2.305,0,4.482-1.06,5.904-2.876l44.51-56.847C248.486,233.316,247.911,228.602,244.65,226.049z
                            "
                          />
                        </g>
                      </svg>
                    )}
                  </button>
                </div>
                <ul className="tasksList mt-4 grid gap-2 sm:gap-4 xl:gap-6 2xl:grid-cols-4 xl:grid-cols-3 lg:grid-cols-4 md:grid-cols-3 grid-cols-2 items-end">
                  <li>
                    <button
                      className="border-2 border-slate-300 text-slate-400 w-full rounded-lg border-dashed transition hover:bg-slate-300 hover:text-slate-500 dark:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300 h-52 sm:h-64"
                      onClick={() => {
                        setModalTitle("Add new Task");
                        setModalTaskData(null);
                        setIsModalOpen(!isModalOpen);
                      }}
                    >
                      Add new task
                    </button>
                  </li>
                  {todos
                    .filter((item) => {
                      const query = searchQuery
                        ? searchQuery.toLowerCase()
                        : "";
                      const title = item.title ? item.title.toLowerCase() : "";
                      return query === "" ? item : title.includes(query);
                    })
                    .map((todo) => (
                      <li key={todo.id}>
                        <article className="bg-slate-100 rounded-lg p-3 sm:p-4 flex text-left transition hover:shadow-lg hover:shadow-slate-300 dark:bg-slate-800 dark:hover:shadow-transparent flex-col h-52 sm:h-64">
                          <div className="flex flex-col flex-1 ">
                            <div className="flex items-center justify-between mb-2">
                              <span className="block font-medium dark:text-slate-200">
                                {todo.title}
                              </span>
                              <span>{(todo.origin === "google" && googleIcon) || (todo.origin === "microsoft" && microsoftIcon)}</span>
                            </div>
                            <div
                              dangerouslySetInnerHTML={{
                                __html: todo.description,
                              }}
                            ></div>
                          </div>
                          <div className="flex justify-between items-center border-dashed border-slate-200 dark:border-slate-700/[.3] border-t-2 w-full pt-4 mt-4">
                            <button
                              title={
                                todo.isCompleted
                                  ? "Mark as Uncompleted"
                                  : "Mark as Completed"
                              }
                              className={`${todo.isCompleted
                                  ? "bg-emerald-200"
                                  : "bg-red-200"
                                } ${todo.isCompleted
                                  ? "text-emerald-800"
                                  : "text-red-800"
                                } order-0 rounded-full font-medium`}
                              onClick={() => handleMarkAsCompleted(todo.id)}
                            >
                              <span className="block py-1 px-3 absolute invisible sm:static sm:visible">
                                {todo.isCompleted
                                  ? "Completed"
                                  : "Mark as Completed"}
                              </span>
                            </button>
                            <div className="flex items-center">
                              <button
                                title="Delete Task"
                                className="mr-2 transition hover:text-slate-700 dark:hover:text-slate-200"
                                onClick={() => handleDeleteTask(todo.id)}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                  className="w-5 h-5 sm:w-6 sm:h-6"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </button>
                              <button
                                title="Edit Task"
                                className="transition w-7 sm:w-8 h-6 sm:h-8 grid place-items-center dark:hover:text-slate-200 hover:text-slate-700"
                                onClick={() => handleEditTask(todo)}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 128 512"
                                  fill="currentColor"
                                  className="w-4 sm:w-5 h-4 sm:h-5"
                                >
                                  <path d="M64 360c30.9 0 56 25.1 56 56s-25.1 56-56 56s-56-25.1-56-56s25.1-56 56-56zm0-160c30.9 0 56 25.1 56 56s-25.1 56-56 56s-56-25.1-56-56s25.1-56 56-56zM120 96c0 30.9-25.1 56-56 56S8 126.9 8 96S33.1 40 64 40s56 25.1 56 56z"></path>
                                </svg>
                              </button>
                            </div>
                          </div>
                        </article>
                      </li>
                    ))}
                </ul>
              </>
            )}
          </section>
        </div>
      </div>
    </>
  );
};
