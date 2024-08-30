import React, { useState, useEffect } from "react";
import axios from "axios";
import { Model, SyncAcc } from "./modal";
import { useNavigate } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import NotificationSchedulerService from "./NotificationSchedulerService";
import interactionPlugin from "@fullcalendar/interaction";
import useSpeechToText from "../hooks/useSpeechToText";
import { Dropdown, Avatar, Button, TextInput, Label, ToggleSwitch } from "flowbite-react";
import { Skeletonmask } from "./skeletonMask";
import "../App.css";
import { toast } from "react-toastify";
import { constants } from "./AllSVG";
import AddFriends from "./AddFriends";
import { FaBell, FaTimes, FaCheck } from 'react-icons/fa';

interface Todo {
  id: number;
  title: string;
  description: string;
  isCompleted: boolean;
  dueDate: Date;
  reminderTime: string;
  reminderDays: Array<any>;
  picture: string;
  name: string;
  email: string;
  origin: string;
  mobileNumber: number;
}

interface FriendRequest {
  id: string;
  email: string;
}

export const Todos = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [SyncTitle, setSyncTitle] = useState("");
  const [modalTaskData, setModalTaskData] = useState<Todo | null>(null);
  const [allTasksCount, setAllTasksCount] = useState(0);
  const [completedTasksCount, setCompletedTasksCount] = useState(0);
  const [title, settitle] = useState("All Tasks");
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [filteredTodos, setFilteredTodos] = useState<Todo[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [filterToday, setFilterToday] = useState(false);
  const [filterCompleted, setFilterCompleted] = useState(false);
  const [filterInCompleted, setFilterInCompleted] = useState(false);
  const [filterByDate, setFilterByDate] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [filterMail, setfilterMail] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [emailOptions, setEmailOptions] = useState<string[]>([]);
  const [filterByEmail, setFilterByEmail] = useState(false);
  const [viewOption, setViewOption] = useState('XL');
  const [viewProp, setViewProp] = useState('grid-cols-1');
  const [viewIcon, setViewIcon] = useState(constants.singleCol);
  const [translate, setTranslate] = useState('sm:translate-x-[-14rem]');
  const [margin, setMargin] = useState('ml-8');
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [toggleNav, setToggleNav] = useState(constants.ArrowForward);
  const [showView, setShowView] = useState("task");
  const [Fname, setFname] = useState('');
  const [Lname, setLname] = useState('');
  const [mobileNumber, setmobileNumber] = useState('');
  const [userInfo, setUserInfo] = useState<any[]>([]);
  const [profileImgPreview, setProfileImgPreview] = useState(constants.defaultUser);
  const [theme, setTheme] = useState(false);
  const [themeClass, setThemeClass] = useState('themeLight');
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const [isAddFriendsOpen, setIsAddFriendsOpen] = useState(false);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [isPopupVisible, setPopupVisible] = useState(false);
  const [friends, setFriends] = useState<{
    Fname: ReactNode;
    Lname: ReactNode;
    mobileNumber: ReactNode;
    profileImg: string; id: string, email: string
  }[]>([]);


  const navigate = useNavigate();

  const { isListening, transcript, startListening, stopListening } =
    useSpeechToText({ continuous: true });

  const startStopListening = (e: any) => {
    e.preventDefault();
    document.getElementById("titleInput")?.focus();
    isListening ? stopVoiceInput(e) : startListening();
  };

  useEffect(() => {
    const uniqueEmails = [...new Set(todos.map((task) => task.email))];
    setEmailOptions(uniqueEmails);
  }, [todos]);

  useEffect(() => {
    const eventSource = new EventSource('http://localhost:3000/api/v1/sseevents');
    eventSource.onmessage = (event) => {
      const newMessage = JSON.parse(event.data);
      console.log('New message from server:', newMessage);
      setTimeout(() => {
        const notification = new Notification(newMessage.message);
        setTimeout(() => {
          notification.close()
        }, 5000);
      }, 0);
      toast.info(newMessage.message);
    };

    return () => {
      eventSource.close();
    };
  }, []);

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

  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { id, checked } = event.target;
    switch (id) {
      case "today-task":
        setFilterToday(checked);
        if (checked) {
          setFilterByDate(false); // Disable date filter
        }
        break;
      case "completed-tasks":
        setFilterCompleted(checked);
        break;
      case "incomplete-tasks":
        setFilterInCompleted(checked);
        break;
      case "filter-date":
        setFilterByDate(checked);
        if (checked) {
          setFilterToday(false); // Disable today's tasks filter
        }
        break;
      case "filter-email":
        setFilterByEmail(checked);
        break;
      default:
        break;
    }
  };

  const handleEmailChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const options = event.target.options;
    const selected = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(options[i].value);
      }
    }
    setSelectedEmails(selected);
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = event.target;
    const date = value ? new Date(value) : null;
    if (id === "start-date") {
      setStartDate(date);
    } else if (id === "end-date") {
      setEndDate(date);
    }
  };

  const applyFilters = async () => {
    if (
      !filterByDate &&
      !filterCompleted &&
      !filterInCompleted &&
      !filterToday &&
      !filterByEmail
    ) {
      await fetchTodos();
    }

    if (todos.length === 0) {
      await fetchTodos();
    }

    // Timeout to ensure state updates are reflected
    setTimeout(() => {
      const filteredTodos = todos.filter((todo) => {
        let matches = true;

        if (filterToday) {
          const today = new Date().toDateString();
          matches = matches && new Date(todo.dueDate).toDateString() === today;
        }

        if (filterCompleted) {
          matches = matches && todo.isCompleted;
        }

        if (filterInCompleted) {
          matches = matches && !todo.isCompleted;
        }

        if (filterByDate && startDate && endDate) {
          matches =
            matches &&
            new Date(todo.dueDate) >= startDate &&
            new Date(todo.dueDate) <= endDate;
        }

        if (filterByEmail) {
          matches = matches && selectedEmails.includes(todo.email);
        }

        return matches;
      });

      setTodos(filteredTodos);
    }, 0);
  };

  const logout = async (email: any) => {
    try {
      const response = await axios.get(
        `http://localhost:3000/logout?email=${email}`,
        { withCredentials: true }
      );
      if (response.status === 200) {
        toast.success("Successfully logged out", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
        fetchTodos();
      } else {
        toast.error("There is some error while Log out, please try again", {
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
    } catch (error) {
      toast.error("An error occurred during logout", {
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
  };
  const fetchTodos = async () => {
    setIsLoading(true);
    userDetails();
    const notificationSchedulerService = NotificationSchedulerService();

    // Fetch Todos from your DB
    await axios
      .get("http://localhost:3000/api/v1/todos", {
        withCredentials: true,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      })
      .then((response) => {
        const allTodos = response.data;

        // Fetch events from Google and microsoft Calendar
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
              if (!filterMail.includes(task.email)) {
                setfilterMail((prev) => [...prev, task.email]);
              }
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
          })
          .catch((error) => {
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
          }).finally(() => {
            setIsLoading(false); // End loading
          })
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
      })

    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  };

  const handleLoginResponse = () => {
    const params = new URLSearchParams(window.location.search);
    const loginStatus = params.get("login");

    if (loginStatus === "success") {
      toast.success("Login successful", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    } else if (loginStatus === "alreadyloggedin") {
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
    } else if (loginStatus === "failed") {
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
        const newUrl =
          window.location.protocol +
          "//" +
          window.location.host +
          window.location.pathname;
        window.history.replaceState({ path: newUrl }, "", newUrl);
      }, 500); // Adjust the delay as needed
    }
  };

  useEffect(() => {
    fetchTodos();
    handleLoginResponse();
    userDetails();
  }, []);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const userResponse = await axios.get('http://localhost:3000/auth/user', {
          withCredentials: true,
          headers: {
            "Access-Control-Allow-Origin": "*",
          }
        });
        const friendIds = userResponse.data.friends;

        // Fetch details for each friend
        const friendDetailsPromises = friendIds.map(id =>
          axios.get(`http://localhost:3000/auth/user/${id}`, {
            withCredentials: true,
            headers: {
              "Access-Control-Allow-Origin": "*",
            }
          })
        );
        const friendDetailsResponses = await Promise.all(friendDetailsPromises);

        // Extract data from responses
        const friendsData = friendDetailsResponses.map(response => response.data);
        setFriends(friendsData);
      } catch (error) {
        console.error('Error fetching friends data:', error);
      }
    };

    fetchFriends();

    const intervalId = setInterval(fetchFriends, 30000);

    return () => clearInterval(intervalId);
  }, []);

  const handleNotificationClick = async () => {
    setPopupVisible(!isPopupVisible);
    if (!isPopupVisible) {
      try {
        const response = await axios.get('http://localhost:3000/auth/user', {
          withCredentials: true,
          headers: {
            "Access-Control-Allow-Origin": "*",
          }
        });

        if (Array.isArray(response.data.friendRequests)) {
          const friendRequestDetails: FriendRequest[] = await Promise.all(
            response.data.friendRequests.map(async (requestId: string) => {
              try {
                const requestResponse = await axios.get(`http://localhost:3000/auth/user/${requestId}`, {
                  withCredentials: true,
                  headers: {
                    "Access-Control-Allow-Origin": "*",
                  }
                });
                return {
                  id: requestResponse.data._id,
                  email: requestResponse.data.email,
                };
              } catch (innerError) {
                console.error(`Failed to fetch details for requestId ${requestId}:`, innerError);
                return null;
              }
            })
          );

          setFriendRequests(friendRequestDetails.filter((request): request is FriendRequest => request !== null));
        } else {
          console.error('Expected an array but received:', response.data);
        }
      } catch (error) {
        console.error('Failed to fetch friend requests:', error);
      }
    }
  };

  const handleAcceptRequest = async (userId: string) => {
    try {
      const response = await axios.post(`http://localhost:3000/api/v1/friends/accept-request/${userId}`, {}, {
        withCredentials: true,
        headers: {
          "Access-Control-Allow-Origin": "*",
        }
      });

      if (response.status === 200) {
        setFriendRequests(prevRequests =>
          prevRequests.filter(request => request.id !== userId)
        );
        console.log(response.data.message);
      }
    } catch (error) {
      console.error('Failed to accept friend request:', error);
    }
  };

  const handleRejectRequest = async (userId: string) => {
    try {
      const response = await axios.delete(`http://localhost:3000/api/v1/friends/friend-request/${userId}`, {
        withCredentials: true,
        headers: {
          "Access-Control-Allow-Origin": "*",
        }
      });

      if (response.status === 200) {
        setFriendRequests(prevRequests =>
          prevRequests.filter(request => request.id !== userId)
        );
        console.log(response.data.message);
      }
    } catch (error) {
      console.error('Failed to reject friend request:', error);
    }
  };

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

  const handleDeleteTask = async (id: number, origins: string) => {
    try {
      if (origins === "google") {
        await axios.delete(`http://localhost:3000/deleteEvent/${id}`, {
          withCredentials: true,
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
        });
        fetchTodos();
        toast.success("Google Task has been deleted", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
      } else if (origins === "microsoft") {
        await axios.delete(`http://localhost:3000/deleteMicrosoftEvent/${id}`, {
          withCredentials: true,
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
        });
        fetchTodos();
        toast.success("Microsoft Task has been deleted", {
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
      }
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
    const sortedTodos = sortTodos(todos, "newest");
    setFilteredTodos(sortedTodos);
    setShowView('task');
  };

  const handleAddFriendsClick = () => {
    setShowView('community');
  };

  const handleModalClose = () => {
    setIsAddFriendsOpen(false);
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
    setShowView('calendar');
  };

  const handleSortOrderChange = (event: any) => {
    const newSortOrder = event.target.value;
    setSortOrder(newSortOrder);
    const sortedTodos = sortTodos(todos, newSortOrder);
    setFilteredTodos(sortedTodos);
  };

  const sortTodos = (todos: any, newSort: string) => {
    return todos.sort((a: any, b: any) => {
      if (newSort === "asc" || newSort === "desc") {
        const titleA = a.title.toLowerCase();
        const titleB = b.title.toLowerCase();
        if (newSort === "asc") {
          if (titleA < titleB) return -1;
          if (titleA > titleB) return 1;
          return 0;
        } else {
          if (titleA < titleB) return 1;
          if (titleA > titleB) return -1;
          return 0;
        }
      } else if (newSort === "newest") {
        const createdA = new Date(a.createdAt);
        const createdB = new Date(b.createdAt);
        return createdB - createdA;
      } else if (newSort === "oldest") {
        const createdA = new Date(a.createdAt);
        const createdB = new Date(b.createdAt)
        return createdA - createdB;
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

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleFilterClear = () => {
    setFilterToday(false);
    setFilterCompleted(false);
    setFilterInCompleted(false);
    setFilterByDate(false);
    setStartDate(null);
    setEndDate(null);
    fetchTodos(); // Optionally refetch todos to reset the list
  };

  const handleViewsClick = () => {
    if (viewOption === 'List') {
      setViewProp("grid-cols-1");
      setViewOption('XL');
      setViewIcon(constants.singleCol);
    } else if (viewOption === 'XL') {
      setViewProp("grid-cols-2");
      setViewOption('L');
      setViewIcon(constants.twoCol);
    } else if (viewOption === 'L') {
      setViewProp("grid-cols-3");
      setViewOption('M');
      setViewIcon(constants.threeCol);
    } else if (viewOption === 'M') {
      setViewProp("grid-cols-4");
      setViewOption('S');
      setViewIcon(constants.fourCol);
    } else if (viewOption === 'S') {
      setViewProp("grid-cols-5");
      setViewOption('XS');
      setViewIcon(constants.fiveCol);
    } else if (viewOption === 'XS') {
      setViewProp("grid-cols-6");
      setViewOption('List');
      setViewIcon(constants.sixCol);
    }
  };

  const handleToggle = () => {
    if (isNavOpen) {
      setTranslate('sm:translate-x-[-14rem]');
      setIsNavOpen(false);
      setToggleNav(constants.ArrowForward);
      setMargin('ml-8');
    } else {
      setTranslate('sm:translate-x-0');
      setIsNavOpen(true);
      setToggleNav(constants.ArrowBackward);
      setMargin('ml-64');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setProfileImgPreview(reader.result);
      } else {
        console.error('FileReader result is not a string');
      }
    };

    if (file) {
      reader.readAsDataURL(file);
    }
  };


  const handleDeleteFriend = async (userId: string) => {
    try {
      await axios.delete(`http://localhost:3000/api/v1/friends/friends/${userId}`, {
        withCredentials: true,
        headers: {
          "Access-Control-Allow-Origin": "*",
        }
      });

      setFriends(prevFriends => prevFriends.filter(friend => friend._id !== userId));
      console.log('Friend removed successfully');
    } catch (error) {
      console.error('Error removing friend:', error);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    const fname = e.target.querySelectorAll('input[id="fname"]')[0].value;
    const lname = e.target.querySelectorAll('input[id="lname"]')[0].value;
    const mobilenumber = e.target.querySelectorAll('input[id="mobilenumber"]')[0].value;
    const cpass = e.target.querySelectorAll('input[id="cpassword"]')[0].value;
    const newpass = e.target.querySelectorAll('input[id="new-password"]')[0].value;

    const userData = {
      Fname,
      Lname,
      profileImg: profileImgPreview,
      currentpass: cpass,
      newPass: newpass,
      mobileNumber,
    };

    try {
      const response = await axios.put(
        'http://localhost:3000/auth/user',
        userData,
        {
          withCredentials: true,
          headers: {
            "Access-Control-Allow-Origin": "*",
          }
        }
      );
      if (response.status === 200) {
        toast.success('User updated successfully', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
        userDetails();
      } else {
        toast.error("There is some error while updating user info, please try again", {
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

    } catch (error) {
      console.error('Error updating user:', error);
      toast.error(error.response.data.message, {
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
  };

  const userDetails = async () => {
    const response = await axios.get(
      `http://localhost:3000/auth/user`,
      { withCredentials: true }
    );

    const userDetail = {
      email: response.data.email,
      fname: response.data.Fname,
      lname: response.data.Lname,
      password: response.data.password,
      profileImg: response.data.profileImg,
      mobileNumber: response.data.mobileNumber
    };

    setFname(userDetail.fname);
    setLname(userDetail.lname);
    setmobileNumber(userDetail.mobileNumber);
    setProfileImgPreview(userDetail.profileImg);
    setUserInfo(userDetail);
    console.log(userDetail);

  }
  const toggleDarkMode = () => {
    if (theme) {
      setTheme(false);
      document.getElementsByClassName('App')[0].classList.remove('dark');
      setThemeClass('themeLight');
    } else {
      setTheme(true);
      document.getElementsByClassName('App')[0].classList.add('dark');
      setThemeClass('themeBlack');
    }
  }
  const toggleDropdown = () => {
    setDropdownVisible(!isDropdownVisible);
  };
  return (
    <>
      <nav className="fixed top-0 z-50 w-full bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700 flex items-center justify-between px-3 py-3 lg:px-5">
        <svg
          width="30"
          height="30"
          viewBox="0 0 1024 1024"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          fill="#000000"
        >
          <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
          <g
            id="SVGRepo_tracerCarrier"
            strokeLinecap="round"
            strokeLinejoin="round"
          ></g>
          <g id="SVGRepo_iconCarrier">
            <path
              d="M861.588238 240.133873v-65.792823c0-36.191275-29.439775-65.631049-65.631049-65.63105h-21.877358c-36.191275 0-65.631049 29.439775-65.631049 65.63105v65.631049H314.659414v-65.631049c0-36.191275-29.439775-65.631049-65.631049-65.63105h-21.877358c-36.191275 0-65.631049 29.439775-65.631049 65.63105v65.792823c-36.317212 0.868255-65.631049 30.539428-65.63105 67.061417v543.745565c0 37.06772 30.155471 67.223191 67.223191 67.223191h696.886045c37.06772 0 67.223191-30.155471 67.223191-67.223191V307.19529c-0.001024-36.52199-29.315885-66.193162-65.633097-67.061417z m-109.385765-65.792823c0-12.060345 9.817012-21.877358 21.877358-21.877358h21.877358c12.060345 0 21.877358 9.817012 21.877358 21.877358v175.016814c0 12.060345-9.817012 21.877358-21.877358 21.877358h-21.877358c-12.060345 0-21.877358-9.817012-21.877358-21.877358V174.34105z m-546.928824 0c0-12.060345 9.817012-21.877358 21.877358-21.877358h21.877358c12.060345 0 21.877358 9.817012 21.877358 21.877358v175.016814c0 12.060345-9.817012 21.877358-21.877358 21.877358h-21.877358c-12.060345 0-21.877358-9.817012-21.877358-21.877358V174.34105z m678.191947 676.600829c0 12.935767-10.532708 23.468476-23.468476 23.468475H163.111076c-12.935767 0-23.468476-10.532708-23.468476-23.468475V307.19529c0-12.402323 9.677764-22.593054 21.877358-23.415233v65.577807c0 36.191275 29.439775 65.631049 65.631049 65.631049h21.877358c36.191275 0 65.631049-29.439775 65.631049-65.631049v-65.631049h393.789368v65.631049c0 36.191275 29.439775 65.631049 65.631049 65.631049h21.877358c36.191275 0 65.631049-29.439775 65.631049-65.631049v-65.577807c12.19857 0.82218 21.877358 11.012911 21.877358 23.415233v543.746589z"
              fill="#869da2"
            ></path>
            <path
              d="M706.719439 478.272194l-48.01715-44.741741-182.28128 195.621482-111.468348-122.615387-48.563905 44.148911 159.469116 172.685427z"
              fill="#b6d8dd"
            ></path>
          </g>
        </svg>
        <span className="ms-3 whitespace-nowrap"></span>
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
              className="px-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 dark:bg-black dark:border-blue-600"
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

        <div className="flex justify-between">
          <div className="navbar-end flex-grow flex justify-end mr-5 mt-2">
            <div className="relative">
              <FaBell
                className="text-xl cursor-pointer"
                onClick={handleNotificationClick}
              />
              {friendRequests.length > 0 && (
                <span className="absolute top-0 right-0 inline-block w-2.5 h-2.5 bg-red-500 rounded-full"></span>
              )}

              {isPopupVisible && (
                <div className="absolute right-0 top-11 w-64 h-[50vh] bg-white shadow-lg border border-gray-300 rounded-lg overflow-y-auto z-1000">
                  <div className="p-4 relative">
                    <FaTimes
                      className="absolute top-2 right-2 text-gray-500 cursor-pointer"
                      onClick={() => setPopupVisible(false)}
                    />
                    <h4 className="text-lg font-semibold">Friend Requests</h4>
                    <ul>
                      {friendRequests.length > 0 ? (
                        friendRequests.map((request) => (
                          <li key={request.id} className="border-b py-2">
                            <div className="flex justify-between items-center">
                              <span>{request.email}</span>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleAcceptRequest(request.id)}
                                  className="bg-green-500 text-white px-2 py-1 rounded"
                                >
                                  <FaCheck />
                                </button>
                                <button
                                  onClick={() => handleRejectRequest(request.id)}
                                  className="bg-red-500 text-white px-2 py-1 rounded"
                                >
                                  <FaTimes />
                                </button>
                              </div>
                            </div>
                          </li>
                        ))
                      ) : (
                        <li>No friend requests</li>
                      )}
                    </ul>
                  </div>
                </div>
              )}

            </div>
          </div>

          <Dropdown label={<img className="w-8 h-8 rounded-full" src={userInfo.profileImg} />} arrowIcon={false} inline>
            <Dropdown.Header>
              <span className="block text-sm">{userInfo.fname} {userInfo.lname}</span>
              <span className="block truncate text-sm font-medium">{userInfo.email}</span>
            </Dropdown.Header>
            <Dropdown.Item onClick={() => setShowView('settings')}>Settings</Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item onClick={handleSignOut}>Sign out</Dropdown.Item>
          </Dropdown>
        </div>
      </nav>

      <aside
        id="logo-sidebar"
        className={`fixed top-0 left-0 z-40 w-64 h-screen pt-20 transition-transform  bg-white border-r border-gray-200 ${translate} dark:bg-gray-800 dark:border-gray-700`}
        aria-label="Sidebar"
      >
        <button className="float-right mt-3" onClick={handleToggle}>{toggleNav}</button>
        <div className="h-[450pt] px-3 pb-4 overflow-y-auto bg-white dark:bg-gray-800">
          <ul className="space-y-2 font-medium">
            <li>
              <a
                href="#"
                className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group"
              >
                <svg
                  fill="#929292"
                  width="25"
                  height="25"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  stroke="#929292"
                >
                  <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                  <g
                    id="SVGRepo_tracerCarrier"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></g>
                  <g id="SVGRepo_iconCarrier">
                    <path d="M2,11H8a1,1,0,0,0,1-1V4A1,1,0,0,0,8,3H2A1,1,0,0,0,1,4v6A1,1,0,0,0,2,11ZM3,5H7V9H3ZM23,7a1,1,0,0,1-1,1H12a1,1,0,0,1,0-2H22A1,1,0,0,1,23,7Zm0,10a1,1,0,0,1-1,1H12a1,1,0,0,1,0-2H22A1,1,0,0,1,23,17ZM3.235,19.7,1.281,17.673a1,1,0,0,1,1.438-1.391l1.252,1.3L7.3,14.289A1,1,0,1,1,8.7,15.711l-4.046,4a1,1,0,0,1-.7.289H3.942A1,1,0,0,1,3.235,19.7Z"></path>
                  </g>
                </svg>
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
                <svg
                  width="25"
                  height="25"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  stroke="#929292"
                >
                  <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                  <g
                    id="SVGRepo_tracerCarrier"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></g>
                  <g id="SVGRepo_iconCarrier">
                    {" "}
                    <path
                      d="M3 9H21M7 3V5M17 3V5M6 12H8M11 12H13M16 12H18M6 15H8M11 15H13M16 15H18M6 18H8M11 18H13M16 18H18M6.2 21H17.8C18.9201 21 19.4802 21 19.908 20.782C20.2843 20.5903 20.5903 20.2843 20.782 19.908C21 19.4802 21 18.9201 21 17.8V8.2C21 7.07989 21 6.51984 20.782 6.09202C20.5903 5.71569 20.2843 5.40973 19.908 5.21799C19.4802 5 18.9201 5 17.8 5H6.2C5.0799 5 4.51984 5 4.09202 5.21799C3.71569 5.40973 3.40973 5.71569 3.21799 6.09202C3 6.51984 3 7.07989 3 8.2V17.8C3 18.9201 3 19.4802 3.21799 19.908C3.40973 20.2843 3.71569 20.5903 4.09202 20.782C4.51984 21 5.07989 21 6.2 21Z"
                      stroke="#929292"
                      strokeWidth="2"
                      strokeLinecap="round"
                    ></path>{" "}
                  </g>
                </svg>
                <span
                  className="flex-1 ms-3 whitespace-nowrap"
                  onClick={handleCalendarViewClick}
                >
                  Calendar View
                </span>
              </a>
            </li>
            <li>
              <a
                href="#"
                className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group"
                onClick={handleAddFriendsClick}
              >
                <svg
                  viewBox="0 0 640 512"
                  fill="#929292"
                  width="25"
                  height="25"
                >
                  <path
                    d="M0 24C0 10.7 10.7 0 24 0h592c13.3 0 24 10.7 24 24s-10.7 24-24 24H24C10.7 48 0 37.3 0 24zm0 464c0-13.3 10.7-24 24-24h592c13.3 0 24 10.7 24 24s-10.7 24-24 24H24c-13.3 0-24-10.7-24-24zm211.2-328c0 35.3-28.7 64-64 64s-64-28.7-64-64 28.7-64 64-64 64 28.7 64 64zM32 320c0-35.3 28.7-64 64-64h96c12.2 0 23.7 3.4 33.4 9.4-37.2 15.1-65.6 47.2-75.8 86.6H64c-17.7 0-32-14.3-32-32zm461.6 32c-10.3-40.1-39.6-72.6-77.7-87.4 9.4-5.5 20.4-8.6 32.1-8.6h96c35.3 0 64 28.7 64 64 0 17.7-14.3 32-32 32h-82.4zm-102.4-61.6c32.1 7.4 58.1 30.9 68.9 61.6 3.5 10 5.5 20.8 5.5 32 0 17.7-14.3 32-32 32h-224c-17.7 0-32-14.3-32-32 0-11.2 1.9-22 5.5-32 10.5-29.7 35.3-52.8 66.1-60.9 7.8-2.1 16-3.1 24.5-3.1h96c7.4 0 14.7.8 21.6 2.4zm172-130.4c0 35.3-28.7 64-64 64s-64-28.7-64-64 28.7-64 64-64 64 28.7 64 64zm-241.6 96c-44.2 0-80-35.8-80-80s35.8-80 80-80 80 35.8 80 80-35.8 80-80 80z"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>

                <span
                  className="flex-1 ms-3 whitespace-nowrap"

                >
                  Friends Community
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
                <svg
                  width="25"
                  height="25"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  stroke="#929292"
                >
                  <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                  <g
                    id="SVGRepo_tracerCarrier"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></g>
                  <g id="SVGRepo_iconCarrier">
                    {" "}
                    <path
                      d="M18.5249 9.46C18.8317 10.2474 19 11.1041 19 12C19 15.866 15.866 19 12 19H9M5.47507 14.54C5.16832 13.7526 5 12.8959 5 12C5 8.13401 8.13401 5 12 5H15M15 5L12 2M15 5L12 8M9 19L12 16M9 19L12 22"
                      stroke="#929292"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></path>{" "}
                  </g>
                </svg>
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

      <div id="mainpage" className={`p-4 pt-7 ${themeClass}`}>
        <div className={`p-4 border-2 border-gray-200 border-dashed rounded-lg dark:border-gray-700 mt-14 ${margin}`}>
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
            origin={modalTaskData?.origin || ""}
            id={modalTaskData?.id || ""}
            onTodoAdded={handleTodoAdded}
          />
          <SyncAcc
            title={SyncTitle}
            isOpen={isSyncOpen}
            onClose={() => setIsSyncOpen(false)}
            todos={todos}
            logout={logout}
            emailOptions={emailOptions}
          />
          <section>
            {showView === 'calendar' && (
              <>
                <h1 className="font-medium my-5 text-center sm:text-left sm:my-8 md:text-2xl text-lg dark:text-slate-200">
                  {title}
                </h1>
                <FullCalendar
                  plugins={[dayGridPlugin, interactionPlugin, timeGridPlugin]}
                  initialView="dayGridMonth"
                  weekends={true}
                  editable={true}
                  selectable={true}
                  events={calendarEvents}
                  headerToolbar={{
                    left: "prev,next today",
                    center: "title",
                    right: "dayGridMonth,timeGridWeek,timeGridDay",
                  }}
                  eventContent={renderEventContent}
                  height={520}
                  select={handleDateSelect}
                />
              </>
            )}{showView === 'task' && (
              <>
                <div className="flex w-full items-center justify-between">
                  <h1 className="font-medium my-5 pl-1 text-center sm:text-left sm:my-8 md:text-2xl text-lg dark:text-slate-200 flex items-center">
                    {title} (
                    {title === "All Tasks"
                      ? allTasksCount
                      : completedTasksCount}
                    )
                  </h1>
                  <div className="flex items-center justify-center p-4">
                    <div className="flex items-center justify-center p-4">
                      <button
                        id="dropdownDefault"
                        onClick={toggleDropdown}

                        data-dropdown-toggle="dropdown"
                        className="bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-4 py-2.5 text-center inline-flex items-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
                        type="button"
                      >
                        Filter by category
                        <svg
                          className="w-4 h-4 ml-2"
                          aria-hidden="true"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 9l-7 7-7-7"
                          ></path>
                        </svg>
                      </button>

                      <div
                        id="dropdown"
                        className={`z-10 ${isDropdownVisible ? '' : 'hidden'} w-64 p-4 bg-white rounded-lg shadow dark:bg-gray-700`}
                      >
                        <div className="flex justify-between items-center">
                          <h6 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
                            Category
                          </h6>
                          <div className="mb-3 text-sm font-medium text-gray-900 dark:text-white bg-slate-200 p-1 rounded-md">
                            <button onClick={handleFilterClear}>Clear</button>
                          </div>
                        </div>
                        <ul
                          className="space-y-2 text-sm"
                          aria-labelledby="dropdownDefault"
                        >
                          <li className="flex items-center">
                            <input
                              id="today-task"
                              type="checkbox"
                              checked={filterToday}
                              onChange={handleFilterChange}
                              className="w-4 h-4 bg-gray-100 border-gray-300 rounded text-primary-600 focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
                              disabled={filterByDate}
                            />
                            <label
                              htmlFor="today-task"
                              className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-100"
                            >
                              Today's Tasks
                            </label>
                          </li>

                          <li className="flex items-center">
                            <input
                              id="completed-tasks"
                              type="checkbox"
                              checked={filterCompleted}
                              onChange={handleFilterChange}
                              className="w-4 h-4 bg-gray-100 border-gray-300 rounded text-primary-600 focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
                            />
                            <label
                              htmlFor="completed-tasks"
                              className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-100"
                            >
                              Completed Tasks
                            </label>
                          </li>

                          <li className="flex items-center">
                            <input
                              id="incomplete-tasks"
                              type="checkbox"
                              checked={filterInCompleted}
                              onChange={handleFilterChange}
                              className="w-4 h-4 bg-gray-100 border-gray-300 rounded text-primary-600 focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
                            />
                            <label
                              htmlFor="incomplete-tasks"
                              className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-100"
                            >
                              Incomplete Tasks
                            </label>
                          </li>
                          { }

                          <li className="flex items-center">
                            <input
                              id="filter-date"
                              type="checkbox"
                              checked={filterByDate}
                              onChange={handleFilterChange}
                              className="w-4 h-4 bg-gray-100 border-gray-300 rounded text-primary-600 focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
                              disabled={filterToday}
                            />
                            <label
                              htmlFor="filter-date"
                              className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-100"
                            >
                              Filter by Date
                            </label>
                          </li>

                          <li className="flex items-center">
                            <input
                              id="filter-email"
                              type="checkbox"
                              checked={filterByEmail}
                              onChange={handleFilterChange}
                              className="w-4 h-4 bg-gray-100 border-gray-300 rounded text-primary-600 focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
                            />
                            <label
                              htmlFor="filter-email"
                              className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-100"
                            >
                              Filter by Email
                            </label>
                          </li>
                        </ul>

                        <div
                          id="email-filters"
                          className={`mt-4 ${filterByEmail ? "" : "hidden"} space-y-2`}
                        >
                          <label
                            htmlFor="email-select"
                            className="block text-sm font-medium text-gray-900 dark:text-gray-100"
                          >
                            Select Email:
                          </label>
                          <select
                            id="email-select"
                            multiple
                            value={selectedEmails}
                            onChange={handleEmailChange}
                            className="block w-full px-3 py-2 text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                          >
                            {emailOptions.map((email, index) => (
                              <option key={index} value={email}>
                                {email}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div
                          id="date-filters"
                          className={`mt-4 ${filterByDate ? "" : "hidden"
                            } space-y-2`}
                        >
                          <label
                            htmlFor="start-date"
                            className="block text-sm font-medium text-gray-900 dark:text-gray-100"
                          >
                            Start Date:
                          </label>
                          <input
                            type="date"
                            id="start-date"
                            value={
                              startDate
                                ? startDate.toISOString().split("T")[0]
                                : ""
                            }
                            onChange={handleDateChange}
                            className="block w-full px-3 py-2 text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                          />

                          <label
                            htmlFor="end-date"
                            className="block text-sm font-medium text-gray-900 dark:text-gray-100"
                          >
                            End Date:
                          </label>
                          <input
                            type="date"
                            id="end-date"
                            value={
                              endDate ? endDate.toISOString().split("T")[0] : ""
                            }
                            onChange={handleDateChange}
                            className="block w-full px-3 py-2 text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={applyFilters}
                          className="mt-4 w-full bg-slate-200 p-1 rounded-md px-4 py-2 text-sm font-medium text-black bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-500 dark:bg-primary-500 dark:hover:bg-primary-600 dark:focus:ring-primary-700"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                    <div>
                      <select onChange={handleSortOrderChange} value={sortOrder} className="bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-4 py-2.5 text-center inline-flex items-center dark:bg-inherit dark:hover:bg-primary-700 dark:focus:ring-primary-800 focus:outline-gray border-none">
                        <option value="newest">Sort by Newest</option>
                        <option value="oldest">Sort by Oldest</option>
                        <option value="asc">Sort by Ascending</option>
                        <option value="desc">Sort by Descending</option>
                      </select>
                    </div>
                    <button onClick={() => handleViewsClick()}>{viewIcon}</button>
                  </div>
                </div>
                <div className="tasks-container">
                  {isLoading ? (<Skeletonmask viewprop={viewProp} />) : (
                    <ul className={`tasksList mt-4 grid gap-2 sm:gap-4 xl:gap-6 ${viewProp} items-end`}>
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
                          const title = item.title
                            ? item.title.toLowerCase()
                            : "";
                          return query === "" ? item : title.includes(query);
                        })
                        .map((todo) => (todo.id &&
                          <li key={todo.id}>
                            <article className="bg-slate-100 rounded-lg p-3 sm:p-4 flex text-left transition hover:shadow-lg hover:shadow-slate-300 dark:bg-slate-800 dark:hover:shadow-transparent flex-col h-52 sm:h-64">
                              <div className="flex flex-col flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="block font-medium dark:text-slate-200">
                                    {todo.title}
                                  </span>
                                </div>
                                <div
                                  dangerouslySetInnerHTML={{
                                    __html: todo.description,
                                  }}
                                ></div>
                              </div>
                              {todo.dueDate && (
                                <div className="flex items-center justify-between">
                                  <div>
                                    <span className="font-semibold">
                                      Due Date:
                                    </span>{" "}
                                    {formatDate(todo.dueDate)}
                                  </div>
                                  <div
                                    title={
                                      todo.reminderDays?.length > 1
                                        ? todo.reminderDays.join(", ")
                                        : "Recurring Event"
                                    }
                                  >
                                    {todo.reminderDays?.length !== 0 &&
                                      todo.reminderDays?.length !==
                                      undefined && (
                                        <svg
                                          width="1.3rem"
                                          x="0px"
                                          y="0px"
                                          viewBox="0 0 100 125"
                                        >
                                          <g transform="translate(0,-952.36218)">
                                            <path
                                              d="M 50 5 C 25.182705 5 5 25.18274 5 50 C 5 74.8173 25.18271 95 50 95 C 74.817291 95 95 74.8174 95 50 A 3.0003 3.0003 0 1 0 89 50 C 89 71.5748 71.574659 89 50 89 C 28.425342 89 11 71.5747 11 50 C 11 28.42538 28.425347 11 50 11 C 61.153759 11 71.301196 15.58823 78.4375 23 L 70.40625 23 A 3.0003 3.0003 0 1 0 70.40625 29 L 84.8125 29 A 3.0003 3.0003 0 0 0 87.8125 26 L 87.8125 11.59375 A 3.0003 3.0003 0 0 0 84.75 8.53125 A 3.0003 3.0003 0 0 0 81.8125 11.59375 L 81.8125 17.875 C 73.615577 9.8628178 62.308129 5 50 5 z M 48.75 25.75 A 3.0003 3.0003 0 0 0 45.8125 28.8125 L 45.8125 52.375 A 3.0003 3.0003 0 0 0 46.6875 54.5 L 59.09375 66.9375 A 3.0052038 3.0052038 0 0 0 63.34375 62.6875 L 51.8125 51.1875 L 51.8125 28.8125 A 3.0003 3.0003 0 0 0 48.75 25.75 z"
                                              transform="translate(0,952.36218)"
                                            />
                                          </g>
                                        </svg>
                                      )}
                                  </div>
                                </div>
                              )}
                              <div
                                className={`flex ${todo.origin == undefined
                                  ? "justify-between"
                                  : "justify-end"
                                  } items-center border-dashed border-slate-200 dark:border-slate-700/[.3] border-t-2 w-full pt-4 mt-4`}
                              >
                                {todo.origin == undefined && (
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
                                    onClick={() =>
                                      handleMarkAsCompleted(todo.id)
                                    }
                                  >
                                    <span className="block py-1 px-3 absolute invisible sm:static sm:visible">
                                      {todo.isCompleted
                                        ? "Completed"
                                        : "Mark as Completed"}
                                    </span>
                                  </button>
                                )}
                                <div className="flex items-center flex-none">
                                  <div className="relative group">
                                    {todo.email ? (
                                      <Dropdown
                                        label=""
                                        dismissOnClick={true}
                                        renderTrigger={() => (
                                          <div className="relative">
                                            <img
                                              className="w-8 h-8 rounded-full"
                                              src={
                                                todo.picture
                                                  ? todo.picture
                                                  : constants.defaultUser
                                              }
                                              title={todo.email}
                                              alt={todo.name}
                                            />
                                            {todo.origin && (
                                              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span title={todo.email} className="text-white">
                                                  {(todo.origin === "google" &&
                                                    constants.googleIcon) ||
                                                    (todo.origin ===
                                                      "microsoft" &&
                                                      constants.microsoftIcon)}
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      >
                                        <Dropdown.Item
                                          onClick={() => logout(todo.email)}
                                        >
                                          Log out
                                        </Dropdown.Item>
                                      </Dropdown>
                                    ) : (
                                      <div className="relative">
                                        <img
                                          className="w-8 h-8 rounded-full"
                                          src={constants.defaultUser}
                                        />
                                        {todo.origin && (
                                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-white">
                                              {(todo.origin === "google" &&
                                                constants.googleIcon) ||
                                                (todo.origin === "microsoft" &&
                                                  constants.microsoftIcon)}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  <span className="ms-3 whitespace-nowrap"></span>
                                  <div>
                                    <Dropdown
                                      label=""
                                      dismissOnClick={true}
                                      renderTrigger={() => (
                                        <svg
                                          className="w-5 h-5"
                                          aria-hidden="true"
                                          xmlns="http://www.w3.org/2000/svg"
                                          fill="currentColor"
                                          viewBox="0 0 4 15"
                                        >
                                          <path d="M3.5 1.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 6.041a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 5.959a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
                                        </svg>
                                      )}
                                    >
                                      <Dropdown.Item
                                        onClick={() =>
                                          handleDeleteTask(todo.id, todo.origin)
                                        }
                                      >
                                        Delete
                                      </Dropdown.Item>
                                      <Dropdown.Item
                                        onClick={() => handleEditTask(todo)}
                                      >
                                        Edit
                                      </Dropdown.Item>
                                    </Dropdown>
                                  </div>
                                </div>
                              </div>
                            </article>
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
              </>
            )}
            {showView === 'community' && (
              <>
                <div className="flex justify-between">
                  <div className="w-full">
                    <div className="flex w-full items-center justify-between">
                      <h1 className="font-medium my-5 pl-1 text-center sm:text-left sm:my-8 md:text-2xl text-lg dark:text-slate-200 flex items-center">
                        Friends Community
                      </h1>
                    </div>
                    <div className="tasks-container">
                      {isLoading ? (
                        <Skeletonmask viewprop={viewProp} />
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 ml-12">
                          <div>
                            <button
                              className="border-2 border-slate-300 text-slate-400 w-full max-w-sm rounded-lg border-dashed transition hover:bg-slate-300 hover:text-slate-500 dark:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300 h-52 sm:h-64"
                              onClick={() => setIsAddFriendsOpen(true)}
                            >
                              Add Friends
                            </button>
                          </div>
                          {friends.map((friend, index) => (
                            <article
                              key={index}
                              className="bg-slate-100 rounded-lg p-3 sm:p-4 flex text-left transition hover:shadow-lg hover:shadow-slate-300 dark:bg-slate-800 dark:hover:shadow-transparent flex-col w-full max-w-sm h-64" // Set fixed height here
                            >
                              <div className="flex flex-col flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="block font-medium dark:text-slate-200">
                                    {friend.Fname} {friend.Lname}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Email: {friend.email}</p>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Mobile: {friend.mobileNumber}</p>
                              </div>
                              <div className="flex items-center justify-between mt-4 border-t border-slate-200 dark:border-slate-700/[.3] pt-4">
                                <div className="flex-1"></div>
                                <div className="relative group flex">
                                  <img
                                    className="w-8 h-8 rounded-full"
                                    src={friend.profileImg || "default-profile-image-url"}
                                  />
                                  <div>
                                    <Dropdown
                                      label=""
                                      dismissOnClick={true}
                                      renderTrigger={() => (
                                        <svg
                                          className="w-5 h-5"
                                          aria-hidden="true"
                                          xmlns="http://www.w3.org/2000/svg"
                                          fill="currentColor"
                                          viewBox="0 0 4 15"
                                        >
                                          <path d="M3.5 1.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 6.041a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 5.959a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
                                        </svg>
                                      )}
                                    >
                                      <Dropdown.Item onClick={() => handleDeleteFriend(friend._id)}>
                                        Delete
                                      </Dropdown.Item>
                                    </Dropdown>
                                  </div>
                                </div>
                              </div>
                            </article>
                          ))}
                          <AddFriends isOpen={isAddFriendsOpen} onRequestClose={handleModalClose} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
            {showView === 'settings' && (
              <>
                <h1 className="font-medium my-5 text-center sm:text-left sm:my-8 md:text-2xl text-lg dark:text-slate-200">
                  Settings
                </h1>
                <form className="flex items-center flex-col" onSubmit={handleSubmit}>
                  <div className="flex items-center flex-col gap-2">
                    <Avatar img={profileImgPreview} size="xl" />
                    <div className="absolute pb-6 mt-24 w-36 text-white flex items-center justify-center bg-black bg-opacity-50" onClick={() => document.getElementById('profileImg').click()}>Edit</div>
                    <input type="file" id="profileImg" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                  </div>
                  <div className="w-2/4 gap-6 flex flex-col">
                    <div>
                      <Label htmlFor="Fname" value="First Name" />
                      <TextInput type="text" id="fname" placeholder="First Name" autoComplete="off" value={Fname} onChange={(e) => setFname(e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="Lname" value="Last Name" />
                      <TextInput type="text" id="lname" placeholder="Last Name" autoComplete="off" value={Lname} onChange={(e) => setLname(e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="mobileNumber" value="Mobile Number" />
                      <TextInput id="mobilenumber" type="number" autoComplete="off" value={mobileNumber} onChange={(e) => setmobileNumber(e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="cpassword" value="Current Password" />
                      <TextInput id="cpassword" type="password" autoComplete="off" shadow />
                    </div>
                    <div>
                      <Label htmlFor="new-password" value="New Password" />
                      <TextInput id="new-password" type="password" autoComplete="off" shadow />
                    </div>
                    <div className="flex max-w-md flex-col items-start gap-4">
                      <ToggleSwitch checked={theme} color="success" label="Enable Dark Mode" onChange={toggleDarkMode} />
                    </div>
                    <Button type="submit" color="success">Send</Button>
                    <Button onClick={userDetails} color="dark">Refresh Details</Button>
                  </div>
                </form>
              </>
            )}
          </section>
        </div>
      </div>
    </>
  );
};
