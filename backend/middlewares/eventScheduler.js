const cron = require('node-cron');
const moment = require('moment');

let sseConnections = new Set();

function generateCronExpression(todo) {
    const now = moment();
    const dueDate = moment(todo.dueDate);
    
    if (dueDate.isBefore(now)) {
      return null;
    }
  
    if (todo.reminderTime && todo.reminderDays && todo.reminderDays.length > 0) {
      const [hours, minutes] = todo.reminderTime.split(':');
      const days = todo.reminderDays.map(day => day.substr(0, 3).toLowerCase()).join(',');
      return `${minutes} ${hours} * * ${days}`;
    }
  
    // For due dates, we'll schedule for 9:00 AM on the due date
    const minutes = 0;
    const hours = 9;
    const dayOfMonth = dueDate.date();
    const month = dueDate.month() + 1;
    const dayOfWeek = '*';
  
    
    if (dueDate.year() === now.year()) {
      return `${minutes} ${hours} ${dayOfMonth} ${month} ${dayOfWeek}`;
    } else {
      // If the due date is in a future year, we need to include the year
      const year = dueDate.year();
      return `${minutes} ${hours} ${dayOfMonth} ${month} ${dayOfWeek} ${year}`;
    }
  }

  function scheduleTodoNotification(todos) {
    todos.forEach(todo => {
      const cronExpression = generateCronExpression(todo);
      if (cronExpression) {
        try {
          cron.schedule(cronExpression, function () {
            console.log(`Reminder for todo: ${todo.title}`);
            sseConnections.forEach(res => {
              res.write(`data: ${JSON.stringify({ message: `Reminder: ${todo.title}`, todo })}\n\n`);
            });
          });
        } catch (error) {
          console.error(`Error scheduling todo ${todo.id}: ${error.message}`);
        }
      }
    });
  
    sseConnections.forEach(res => {
      res.write(`data: ${JSON.stringify({ message: 'Reminders scheduled' })}\n\n`);
    });
  }

function addSSEConnection(res) {
    sseConnections.add(res);
}

function removeSSEConnection(res) {
    sseConnections.delete(res);
}

function setupSSERoute(router) {
    router.get('/sseevents', (req, res) => {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': 'http://localhost:5173',
            'Access-Control-Allow-Credentials': 'true'
        });

        addSSEConnection(res);

        req.on('close', () => {
            removeSSEConnection(res);
            res.end();
        });
    });
}

module.exports = {
    scheduleTodoNotification,
    setupSSERoute,
    addSSEConnection,
    removeSSEConnection
};