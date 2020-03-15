/*
KEY COMPONENTS:
"activeItem" = null until an edit button is clicked. Will contain object of item we are editing
"list_snapshot" = Will contain previous state of list. Used for removing extra rows on list update

PROCESS:
1 - Fetch Data and build rows "buildList()"
2 - Create Item on form submit
3 - Edit Item click - Prefill form and change submit URL
4 - Delete Item - Send item id to delete URL
5 - Cross out completed task - Event handle updated item

NOTES:
-- Add event handlers to "edit", "delete", "title"
-- Render with strike through items completed
-- Remove extra data on re-render
-- CSRF Token
*/

// django CSRF token for AJAX
function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Global variables
var csrftoken = getCookie('csrftoken');
var activeItem = null
var list_snapshot = []

buildList()

function buildList(){
    var wrapper = document.getElementById('list-wrapper')
    var url = 'http://127.0.0.1:8000/api/task-list/'

    fetch(url)
    .then((resp) => resp.json())
    .then(function(data){
        console.log('Fetched To Do List:', data)

        var list = data
        for (var i in list) { // loops through the task list and generates html code for each one

            // solved flash glitch by wrapper.innerHTML = ''
            try {
                document.getElementById(`data-row-${i}`).remove()
            } catch (error) {
                
            }

            var title = `<span class="title">${list[i].title}</span>`
            if (list[i].completed == true) {
                title = `<strike class="title">${list[i].title}</strike>`
            }

            var item = `<div id="data-row-${i}" class="task-wrapper flex-wrapper"> 
                            <div style="flex: 7">
                                ${title}
                            </div>
                            <div style="flex:1">
                                <button class="btn btn-sm btn-outline-info edit fas fa-pen"></button>
                            </div>
                            <div style="flex:1">
                                <button class="btn btn-sm btn-outline-dark delete fas fa-trash"></button>
                            </div>
                        </div>`
                        // inject html code in the middle of list-wrapper
                        wrapper.innerHTML += item
        }

        if (list_snapshot.length > list.length) {
            for (var i = list.length; i < list_snapshot.length; i++){
                document.getElementById(`data-row-${i}`).remove()
            }
        }
        list_snapshot = list

        // starts edit item once edit button is clicked
        for (var i in list) {
            var editBtn = document.getElementsByClassName('edit')[i]
            var deleteBtn = document.getElementsByClassName('delete')[i]
            var titleText = document.getElementsByClassName('title')[i]

            // Immediately invoked function expression
            editBtn.addEventListener('click' , (function(item){
                return function(){
                    editItem(item)
                }
            })(list[i]))
            // same but for delete button
            deleteBtn.addEventListener('click' , (function(item){
                return function(){
                    deleteItem(item)
                }
            })(list[i]))
            // complete or uncomplete item
            titleText.addEventListener('click' , (function(item){
                return function(){
                    completeUncompleteItem(item)
                }
            })(list[i]))
        }
    })
}

// create and update
var form = document.getElementById('form-wrapper')
form.addEventListener('submit', function(e) {
    e.preventDefault() // stop our form from submitting
    console.log("Form submitted.")
    var url = 'http://127.0.0.1:8000/api/task-create/'
    
    // if you clicked the edit button beforehand, submitting will update that id
    if (activeItem != null){
        url = `http://127.0.0.1:8000/api/task-update/${activeItem.id}/`
        activeItem = null
    }
    
    var title = document.getElementById('title').value
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-type': 'application/json',
            'X-CSRFToken': csrftoken, // include CSRF token from django function
        },
        body: JSON.stringify({'title': title}), // the content of the form, you can send objects here
    }
    ).then(function(response){
        buildList() // re-render the list after you submit the form
        document.getElementById('form').reset() // clears the form so the past input will be removed
        document.getElementById('submit').value = 'Add'
    })
})

function editItem(item){
    console.log({'Item clicked.': item})
    activeItem = item
    document.getElementById('title').value = activeItem.title // clicked item will appear on the text box
    document.getElementById('submit').value = 'Update'
}

function deleteItem(item){
    console.log({'Delete clicked.': item})
    fetch(`http://127.0.0.1:8000/api/task-delete/${item.id}`, {
        method: 'DELETE',
        headers: {
            'Content-type': 'application/json',
            'X-CSRFToken': csrftoken, // include CSRF token from django function
        },
    }
    ).then((response) => {
        buildList() // re-render the list after you submit the form
    })
}

function completeUncompleteItem(item){
    item.completed = !item.completed
    console.log({'Strike clicked': item})
    fetch(`http://127.0.0.1:8000/api/task-update/${item.id}/`, {
        method: 'POST',
        headers: {
            'Content-type': 'application/json',
            'X-CSRFToken': csrftoken, // include CSRF token from django function
        },
        body: JSON.stringify({'title': item.title, 'completed': item.completed}),
    }
    ).then((response) => {
        buildList() // re-render the list after you submit the form
    })
}
