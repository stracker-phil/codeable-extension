/* --- Show notification count in title --- */

// Listen for page load events, throttled to 2 seconds
if (window.Pace) {
  let last_message_sent = Date.now()
  const message_interval = 2000 // 2 seconds

  window.Pace.on('done', () => {

    if (Date.now() > last_message_sent + message_interval) {
      window.postMessage({type: 'UPDATE_NOTIFICATIONS'})
      last_message_sent = Date.now()
    }
  })
}

// Listen for new notification sound
const audio_element = document.querySelector('#filling-inbox')

if (audio_element) {
  audio_element.addEventListener('play', () => {
    window.postMessage({type: 'UPDATE_NOTIFICATIONS'})
  }, false)
}

// Listen for user clicking "Mark all as read"
document.addEventListener('click', (e) => {
  if (e.target.innerText.toLowerCase() == 'mark all as read') {
    window.postMessage({type: 'UPDATE_NOTIFICATIONS'})
  }
}, false)


/* --- Show comment and expert count in notifications widget --- */

// TODO refactor comments and experts helper functions into one
function createOrUpdateExpertsMeta(notification_el, number) {
  if (!notification_el.querySelector('span.notification__meta__experts')) {
    // Create span for user meta
    let expert_element = document.createElement('span')
    expert_element.classList.add('notification__meta__experts')
    expert_element.style.marginLeft = '12px'
    expert_element.style.order = '1'
    
    // Create user icon element
    let expert_element_icon = document.createElement('i')
    expert_element_icon.classList.add('icon', 'icon-number-of-experts-with-fill') 
    expert_element_icon.style.verticalAlign = 'middle'

    // Create user icon text node
    let expert_element_text = document.createElement('span')
    expert_element_text.classList.add('notification__meta__experts__num')
    expert_element_text.textContent = number
    expert_element_text.style.verticalAlign = 'middle'
    expert_element_text.style.marginLeft = '4px'
    
    // Append the elements
    expert_element.appendChild(expert_element_icon)
    expert_element.appendChild(expert_element_text)

    // Add it to the page
    notification_el.appendChild(expert_element)
  } else {
    notification_el.querySelector('span.notification__meta__experts__num').textContent = number
  }
}

function createOrUpdateCommentsMeta(notification_el, number) {
  if (!notification_el.querySelector('span.notification__meta__comments')) {
    // Create span for user meta
    let comments_element = document.createElement('span')
    comments_element.classList.add('notification__meta__comments')
    comments_element.style.marginLeft = '12px'
    comments_element.style.order = '2'
    
    // Create user icon element
    let comments_element_icon = document.createElement('i')
    comments_element_icon.classList.add('icon', 'icon-number-of-comments-with-fill') 
    comments_element_icon.style.verticalAlign = 'middle'

    // Create user icon text node
    let comments_element_text = document.createElement('span')
    comments_element_text.classList.add('notification__meta__comments__num')
    comments_element_text.textContent = number
    comments_element_text.style.verticalAlign = 'middle'
    comments_element_text.style.marginLeft = '4px'
    
    // Append the elements
    comments_element.appendChild(comments_element_icon)
    comments_element.appendChild(comments_element_text)

    // Add it to the page
    notification_el.appendChild(comments_element)
  } else {
    notification_el.querySelector('span.notification__meta__comments__num').textContent = number
  }
}

function showReferoo(notification_el, partner) {
  if (!partner) {
    return;
  }
  if (!notification_el.querySelector('span.notification__meta__referoo')) {
    // Create span for referoo partner ID
    let partner_element = document.createElement('span')
    partner_element.classList.add('notification__meta__referoo')
    partner_element.style.marginLeft = '12px'
    partner_element.style.fontSize = '12px'
    partner_element.textContent = partner;
    partner_element.style.verticalAlign = 'middle'
    partner_element.style.color = '#fff'
    partner_element.style.backgroundColor = '#151d22';
    partner_element.style.borderRadius = '3px';
    partner_element.style.padding = '0 7px 2px';
    partner_element.style.lineHeight = '22px';
    partner_element.style.order = '3'

    
    // Add it to the page
    notification_el.appendChild(partner_element)
  }
}

function showKeywords(notification_el, keywords) {
  if (!keywords || !keywords.length) {
    return;
  }

  if (!notification_el.querySelector('span.notification__meta__keywords')) {
    // Create span for referoo partner ID
    let keyword_element = document.createElement('span')
    keyword_element.classList.add('notification__meta__keywords')
    keyword_element.style.marginLeft = '12px'
    keyword_element.textContent = keywords.join(', ');
    keyword_element.style.verticalAlign = 'middle'
    keyword_element.style.fontSize = '12px'
    keyword_element.style.order = '4'
    keyword_element.style.whiteSpace = 'no-wrap';
    keyword_element.style.border = '1px solid #b9ccc5';
    keyword_element.style.backgroundColor = '#f9fbfb';
    keyword_element.style.color = '#151d22';
    keyword_element.style.borderRadius = '3px';
    keyword_element.style.padding = '0 7px 2px';
    keyword_element.style.lineHeight = '20px';

    
    // Add it to the page
    notification_el.appendChild(keyword_element)
  }
  console.log('KEYWORDS: ' ,keywords)
}

function checkForKeywords(...contents) {
  const text = contents.join(' ').replace(/[\r\n]+/g,' ');
  const terms = document.myKeywords.map(term => `\\b${term}\\b`);
  const matches = text.match(new RegExp(terms.join('|'), 'g'));

  // Return unique matches
  return [...new Set(matches)];
}

function fetchMyKeywords() {
  document.myUser = {};
  document.myKeywords = [];

  // Set the auth token for API requests
  let auth_token = JSON.parse(localStorage.getItem('ngStorage-Authorization'))

  // Make sure auth token exists before making API calls
  if (!auth_token) {
    return;
  }
    
  // Get the list of comments from the API for each notification/task
  fetch(`https://api.codeable.io/users/me`, {
    method: 'GET',
    headers: {
      'Authorization': `Token ${auth_token}`
    }
  })
  .then(res => res ? res.json() : {})
  .then(userData => {
    document.myUser = userData;

    userData.tags.forEach(tag => {
      if (tag && tag.name) {
        document.myKeywords.push(tag.name)
      }
    })
  })
}

function updateNotificationsMeta() {
  // Set the auth token for API requests
  let auth_token = JSON.parse(localStorage.getItem('ngStorage-Authorization'))

  // Make sure auth token exists before making API calls
  if (auth_token) {
    // Get the array of notification elements
    let notifications = document.querySelectorAll('.popover-notifications-widget cdbl-notification-item a')
    
    // Loop through all notification elements
    notifications.forEach(notification => {
      // Returns '/task/{id}'
      let path = notification.attributes.href.value

      // Get the list of comments from the API for each notification/task
      fetch(`https://api.codeable.io${path}/comments`, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${auth_token}`
        }
      })
      .then(res => res ? res.json() : {})
      .then(comments => {
        // Filter out non-expert comments
        let expert_comments = comments.filter(comment => comment.user.role == 'contractor')

        // Filter out private comments and expert-only comments
        let public_comments = expert_comments.filter(comment => !comment.private && !comment.is_contractors_only)
        
        // Filter out duplicate expert comments
        let unique_experts = public_comments.filter((value, index, self) => {
          return self.findIndex(v => v.user.id === value.user.id) === index;
        })

        // Create/Update the elements
        let notification_meta = notification.querySelector('.notification__meta')

        createOrUpdateExpertsMeta(notification_meta, unique_experts.length)

        createOrUpdateCommentsMeta(notification_meta, public_comments.length)
      })

      fetch(`https://api.codeable.io${path}`, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${auth_token}`
        }
      })
      .then(res => res ? res.json() : {})
      .then(task => {
        // Create/Update the elements
        let notification_meta = notification.querySelector('.notification__meta')

        // Show the referring partner ID (if available)
        showReferoo(notification_meta, task.referoo_partner_tracking_name)

        // Check the task description for keywords.
        const matches = checkForKeywords(task.title, task.description)
        showKeywords(notification_meta, matches);
      })
    })
  }
}

// Variables for throttling notifications meta updates
let last_meta_update = null
const meta_update_interval = 60000 // 1 minute

fetchMyKeywords();

// Listen for DOM node insertions
document.addEventListener('DOMNodeInserted', e => {
  // Make sure we have the right element (new projects popover)
  if (e.target.classList &&
      e.target.classList.contains('popover') &&
      e.target.innerText && 
      e.target.innerText.indexOf('NEW PROJECTS') != -1) {
        // Check if meta updates have been called yet
        // Or if it has been more than a minute since it was last called
        if (!last_meta_update || Date.now() > last_meta_update + meta_update_interval) {
          // Update the nofications meta
          updateNotificationsMeta()

          // Update the timestamp
          last_meta_update = Date.now()
        }      
  }
})