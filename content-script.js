/* --- Show notification count in title --- */

// Get notifications from the API
async function getNotifications(token) {
  // Send request to the API
  const response = await fetch('https://api.codeable.io/users/me/notifications', {
    method: 'GET',
    headers: {
      'Authorization': `Token ${token}`
    }
  })

  // Handle errors
  if (!response.ok) {
    const message = `An error has occurred: ${response.status}`
    throw new Error(message)
  }

  // Return the response
  const notifications = await response.json()

  return notifications
}


// Add the notifications count to the page title
function updateDocumentTitle(title, count) {
  document.title = `(${count}) ${title}`
}


// Get the notifications and update the count and page title
function updateNotificationsCount(token, title) {
  getNotifications(token)
    .then(notifications => {
      // Filter out notifications that have been read
      const unread_notifications = notifications.filter(notification => !notification.is_read)
      
      // Update the page title to show the unread notifications count
      updateDocumentTitle(title, unread_notifications.length)
    })
}


/* --- Utilities and Init --- */

// Utility for injecting script into the page
function injectScript(file_path, tag) {
  let node = document.getElementsByTagName(tag)[0]
  let script = document.createElement('script')
  script.setAttribute('type', 'text/javascript')
  script.setAttribute('src', file_path)
  node.appendChild(script)
}


// Functionality that needs to run when the extension is first installed
function initExtension() {
  // Store a copy of the page title when the page loads
  const page_title = document.title

  // Set the user auth token, will be null if logged out
  let auth_token = JSON.parse(localStorage.getItem('ngStorage-Authorization'))

  // Check notifications on first page load if token is set
  if (auth_token) {
    updateNotificationsCount(auth_token, page_title)
  }

  // Add the event listeners to the page
  injectScript(chrome.runtime.getURL('inject-script.js'), 'body')

  // Listen for specific events from inject-script.js
  window.addEventListener('message', (e) => {
    // Refresh the auth token from storage whenever an event is received
    auth_token = JSON.parse(localStorage.getItem('ngStorage-Authorization'))

    if (auth_token 
        && e.data.type 
        && (e.data.type == 'UPDATE_NOTIFICATIONS')) {
      updateNotificationsCount(auth_token, page_title)
    }
  }, false)
}


// Initialize
initExtension()