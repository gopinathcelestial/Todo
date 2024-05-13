interface NotificationScheduler {
  scheduleNotification: (title: string, options: NotificationOptions, time: number) => void;
}

const NotificationSchedulerService = (): NotificationScheduler => {
  const scheduleNotification = async (title: string, options: NotificationOptions, time: number) => {
    const showNotification = () => {
      let timeDiff = time - new Date().getTime();

      if (timeDiff<0){
        return 
      } 
      setTimeout(() => {
        const notification = new Notification(title, options);
        setTimeout(() => {
          notification.close();
        }, 10 * 1000);
      }, timeDiff);
    };

    const showError = () => {
      const error = document.querySelector('.error');
      if (error) {
        error.style.display = 'block';
        error.textContent = 'You blocked the notifications';
      }
    };

    let granted = false;

    if (Notification.permission === 'granted') {
      granted = true;
    } else if (Notification.permission === 'denied') {
      let permission = await Notification.requestPermission();
      granted = permission === 'granted' ? true : false;
    }

    granted ? showNotification() : showError();
  };

  return {
    scheduleNotification,
  };
};

export default NotificationSchedulerService;
