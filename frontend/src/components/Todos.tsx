import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Model } from './modal';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid'
import NotificationSchedulerService from './NotificationSchedulerService';
import { toast } from 'react-toastify';



interface Todo {
  id: number;
  title: string;
  description: string;
  isCompleted: boolean;
  dueDate: Date;
  reminderTime: string
  reminderDays: Array
}

export const Todos = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalTaskData, setModalTaskData] = useState<Todo | null>(null);
  const [completedTodos, setCompletedTodos] = useState<Todo[]>([]);
  const [allTasksCount, setAllTasksCount] = useState(0);
  const [completedTasksCount, setCompletedTasksCount] = useState(0);
  const [title, settitle] = useState("All Task");
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const navigate = useNavigate();

  const fetchTodos = () => {
    const notificationSchedulerService = NotificationSchedulerService();

    axios.get('http://localhost:3000/api/v1/todos', {
      withCredentials: true,
      headers: {
        "Access-Control-Allow-Origin": "*",
      }
    })
      .then(response => {
        const allTodos = response.data;
        setTodos(allTodos);
        setAllTasksCount(allTodos.length);

        allTodos.forEach(task => {
          let dueDate = new Date(task.dueDate).toDateString()+' '+"09:00"
          let dueDateTimestamp = new Date(dueDate).getTime()
          notificationSchedulerService.scheduleNotification(`Task Reminder: ${task.title}`,{
            body: `Description: ${task.description}`
          }, dueDateTimestamp);

          const reminderDays = task.reminderDays.map(day => getDayNumber(day.toLowerCase()));
          const reminderTime = task.reminderTime || '00:00:00';
        
          reminderDays.forEach(day => {
            const reminderDate = new Date();
            const today = new Date();
            const dayDiff = (day - today.getDay() + 7) % 7;
            reminderDate.setDate(reminderDate.getDate() + dayDiff);
            const [hours, minutes, seconds] = reminderTime.split(':');
            reminderDate.setHours(parseInt(hours));
            reminderDate.setMinutes(parseInt(minutes));
        
            notificationSchedulerService.scheduleNotification(`Task Reminder: ${task.title}`,{
              body: `Description: ${task.description}`
            }, reminderDate.getTime());
          });
        });

        function getDayNumber(day) {
          const daysMap = {
            sunday: 0,
            monday: 1,
            tuesday: 2,
            wednesday: 3,
            thursday: 4,
            friday: 5,
            saturday: 6
          };
          return daysMap[day];
        }
       
      })
      .catch(error => {
        console.error('Error fetching todos:', error);
        toast.error("There is some error while fetching Todos", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light"
        });
        navigate('/signin');
      });
      if (Notification.permission !== 'granted') {
        Notification.requestPermission();
      }
    };
    
    useEffect(() => {
      fetchTodos();
  }, []);

  const handleSignOut = async () => {
    try {
      const response = await axios.post('http://localhost:3000/auth/signout', {}, {
        withCredentials: true, 
      });
      console.log('Sign out successful:', response.data);
      toast.success('Successfully Signed Out', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light"
        });
      navigate('/signin');

    } catch (error:any) {
      toast.error("There is some error while signing out, please try again", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light"
      });
      console.error('Error signing out:', error.response ? error.response.data : error);
    }
  };

  const handleMarkAsCompleted = async (id: number) => {
    try {
      const updatedTodos = todos.map(todo => {
        if (todo.id === id) {
          return { ...todo, isCompleted: !todo.isCompleted };
        }
        return todo;
      });

      await axios.put(`http://localhost:3000/api/v1/todos/${id}`,
        { isCompleted: !todos.find(todo => todo.id === id)?.isCompleted },
        {
          withCredentials: true,
          headers: {
            "Access-Control-Allow-Origin": "*",
          }
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
        theme: "light"
      });
      console.error('Error marking task as completed:', error);
    }
  };

  const handleDeleteTask = async (id: number) => {
    try {
      await axios.delete(`http://localhost:3000/api/v1/todos/${id}`, {
        withCredentials: true,
        headers: {
          "Access-Control-Allow-Origin": "*",
        }
      });

      fetchTodos();
      toast.success('Task has been deleted', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light"
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
        theme: "light"
      });
      console.error('Error deleting task:', error);
    }
  };

  const handleEditTask = (todo: Todo) => {
    console.log(todo)
    setModalTaskData(todo);
    setModalTitle('Edit Task');
    setIsModalOpen(true);
  };

  const handleTodoAdded = () => {
    setIsModalOpen(false);
    setModalTaskData(null);
    fetchTodos();
  };

  const handleAllTasksClick = () => {
    setShowCalendar(false); 
    settitle("All Tasks")

  };

  const handleCompletedTasksClick = () => {
    settitle('Completed tasks')
    setTodos(completedTodos);
    setModalTitle('Completed tasks');
  };

  const handleCalendarViewClick = () => {
    const updatedCalendarEvents = todos.map(task => {
      const startDate = new Date(task.dueDate);

      return {
        title: task.title,
        date: startDate.toISOString().split('T')[0],
      };
    });
    setCalendarEvents(updatedCalendarEvents);
    setShowCalendar(true);
    settitle('Calendar View');
  };
  return (
    <>

      <nav className="fixed top-0 z-50 w-full bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="px-3 py-3 lg:px-5 lg:pl-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-start rtl:justify-end">
              <button
                data-drawer-target="logo-sidebar"
                data-drawer-toggle="logo-sidebar"
                aria-controls="logo-sidebar"
                type="button"
                className="inline-flex items-center p-2 text-sm text-gray-500 rounded-lg sm:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
              >
                <span className="sr-only">Open sidebar</span>
                <svg
                  className="w-6 h-6"
                  aria-hidden="true"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    clip-rule="evenodd"
                    fill-rule="evenodd"
                    d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"
                  ></path>
                </svg>
              </button>
              <a href="/" className="flex ms-2 md:me-24">
                <span className="self-center text-xl font-semibold sm:text-2xl whitespace-nowrap dark:text-white">
                  Tasklist
                </span>
              </a>
            </div>
            <div className="flex items-center">
              <div className="flex items-center ms-3">
                <div>
                  <button
                    type="button"
                    className="flex text-sm "
                    aria-expanded="false"
                    data-dropdown-toggle="dropdown-user"
                    onClick={handleSignOut}>
                    Sign Out
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      </nav>

      <aside
        id="logo-sidebar"
        className="fixed top-0 left-0 z-40 w-64 h-screen pt-20 transition-transform -translate-x-full bg-white border-r border-gray-200 sm:translate-x-0 dark:bg-gray-800 dark:border-gray-700"
        aria-label="Sidebar"
      >
        <div className="h-full px-3 pb-4 overflow-y-auto bg-white dark:bg-gray-800">
          <ul className="space-y-2 font-medium">
            <li>
              <a
                href="#"
                className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group"
              >
                <span className="flex-1 ms-3 whitespace-nowrap" onClick={handleAllTasksClick}>All tasks </span>
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
                <span className="flex-1 ms-3 whitespace-nowrap" onClick={handleCalendarViewClick}>
                  Calendar View
                </span>
              </a>
            </li>
          </ul>
        </div>
      </aside>

      <div className="p-4 sm:ml-64">
        <div className="p-4 border-2 border-gray-200 border-dashed rounded-lg dark:border-gray-700 mt-14">
          <Model
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title={modalTitle}
            taskTitle={modalTaskData?.title || ''}
            taskDescription={modalTaskData?.description || ''}
            isCompleted={modalTaskData?.isCompleted || false}
            duedate={modalTaskData?.dueDate || ""}
            reminderTime={modalTaskData?.reminderTime || ""}
            reminderDays={modalTaskData?.reminderDays || ""}
            id={modalTaskData?.id || ''}
            onTodoAdded={handleTodoAdded}
          />
          <section>
          {showCalendar ? (
            <>
            <h1 className="font-medium my-5 text-center sm:text-left sm:my-8 md:text-2xl text-lg dark:text-slate-200">
            {title}
            </h1>
             <FullCalendar
               plugins={[dayGridPlugin]}
               initialView="dayGridMonth"
               weekends={true}  
               events={calendarEvents}
               height={520}
             />
            </>
            ) : (
              <>       
            <h1 className="font-medium my-5 text-center sm:text-left sm:my-8 md:text-2xl text-lg dark:text-slate-200">
            {title} ({title === "All Tasks" ? allTasksCount : completedTasksCount})
            </h1>
            <ul className="tasksList mt-4 grid gap-2 sm:gap-4 xl:gap-6 2xl:grid-cols-4 xl:grid-cols-3 lg:grid-cols-4 md:grid-cols-3 grid-cols-2 items-end">
            <li>
                <button
                  className="border-2 border-slate-300 text-slate-400 w-full rounded-lg border-dashed transition hover:bg-slate-300 hover:text-slate-500 dark:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300 h-52 sm:h-64"
                  onClick={() => {
                    setModalTitle("Add new Task")
                    setModalTaskData(null)
                    setIsModalOpen(!isModalOpen)
                  }}
                >
                  Add new task
                </button>
              </li>
              {todos.map(todo => (
                <li key={todo.id}>
                  <article className="bg-slate-100 rounded-lg p-3 sm:p-4 flex text-left transition hover:shadow-lg hover:shadow-slate-300 dark:bg-slate-800 dark:hover:shadow-transparent flex-col h-52 sm:h-64">
                    <div className="flex flex-col flex-1 ">
                      <div className="flex items-center justify-between mb-2">
                        <span className="block font-medium dark:text-slate-200">
                          {todo.title}
                        </span>
                      </div>
                      <div dangerouslySetInnerHTML={{ __html: todo.description }}></div>
                    </div>
                    <div className="flex border-dashed border-slate-200 dark:border-slate-700/[.3] border-t-2 w-full pt-4 mt-4">

                      <button
                        title={todo.isCompleted ? 'Mark as Uncompleted' : 'Mark as Completed'}
                        className={`bg-${todo.isCompleted ? 'gray' : 'emerald'}-200 text-${todo.isCompleted ? 'gray' : 'emerald'}-800 mr-4 order-0 rounded-full font-medium`}
                        onClick={() => handleMarkAsCompleted(todo.id)}
                      >
                        <span className="block py-1 px-3 absolute invisible sm:static sm:visible">
                          {todo.isCompleted ? 'Completed' : 'Mark as Completed'}
                        </span>
                      </button>
      
                      <button
                        title="Delete Task"
                        className="ml-2 transition hover:text-slate-700 dark:hover:text-slate-200"
                        onClick={() => handleDeleteTask(todo.id)}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-5 h-5 sm:w-6 sm:h-6"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z"
                            clip-rule="evenodd"
                          ></path>
                        </svg>
                      </button>
                      <button
                        title="edit task"
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
