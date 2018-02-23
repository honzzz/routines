// cache elements
var $name = document.getElementById('name');
var $note = document.getElementById('note');
var $save = document.getElementById('save');
var $delete = document.getElementById('delete');

// check URL params
var url_query = window.location.search.substring(1);

// get pack ID
var routine_id = getQueryVariable(url_query, 'routine');

// is user logged in?
var $routines = document.getElementById('routines');
var user = $routines.getAttribute('data-user');

var data;
var routine = {};

// get URL params
// based on https://css-tricks.com/snippets/javascript/get-url-variables/
function getQueryVariable(query, param) {
    var vars = query.split("&");
    for (var i=0;i<vars.length;i++) {
        var pair = vars[i].split("=");
        if (pair[0] == param) {
            return pair[1];
        }
    }
    return 0;
}

// compare first N items of two arrays
function arraysStartSame(n, array1, array2) {
    for (var i=0; i<=n; i++) {
        if (array1[i] != array2[i]) {
            return false;
        }
    }
    return true;
}

function saveRoutine() {

    // get name
    routine.name = $name.value;
    // get note
    if ($note.value) {
        routine.note = $note.value;
    }

    // SUB-TASKS
    // check for sub-tasks specified in brackets
    // example:  routine "strength training" has sub-tasks [biceps, abs, legs]
    var subroutines = routine.name.match(/\[(.*?)\]/);
    if (subroutines) {
        // get array of tasks (map function trims empty spaces)
        var tasks = subroutines[1].split(',').map(function(item) {return item.trim();});

        // clean empty values from array
        tasks = tasks.filter(function(n) {return n;});

        // if sub-tasks already exist and items until currently selected item are the same
        if (routine.sub && arraysStartSame(routine.sub.pos, routine.sub.tasks, tasks)) {
            // just rewrite tasks and keep position
            routine.sub.tasks = tasks
        }
        else {
            // create object for storing sub-tasks
            routine.sub = {
                'tasks': tasks,
                'pos': 0 // set starting position
            };
        }

        // cut everything in brackets out of name
        routine.name = routine.name.replace(subroutines[0],"");
    }
    else {
        // if this routine previously had sub-tasks that are now being removed
        if (routine.tasks) {
            delete routine.tasks;
        }
    }

    // trim spaces around routine name
    routine.name = routine.name.trim();


    // VALIDATE
    // name longer than 2 characters
    if (routine.name.length < 3) {
        alert('Routine name should be at least 3 characters long.');
        return;
    }

    // days
    routine.days = routine.days || 0;

    // state (done or not)
    // if NO type routine
    if ((routine.name.substring(0, 3)).toLowerCase() === "no ") {
        // set to true for new NO routine, use state for old routine
        routine.done = (routine.done == undefined ? true : routine.done);
        routine.no = true;
    }
    else {
        // set to false for new routine, use state for old routine
        routine.done = (routine.done == undefined ? false : routine.done);
    }

    // user logged in
    if (user) {
        // store routine in db
    }
    else {
        // if new routine
        if (routine_id === 'new') {
            // use timestamp as id
            routine.id = (new Date()).getTime();

            // push into data (to the beginning of array - newest at the top)
            data.routines.unshift(routine);
        }
        else {
            // insert old id into routine object to be saved
            routine.id = routine_id;

            // modify routine in data
            // loop through routines
            for (var i=0; i<data.routines.length; i++) {
                // find the routine to edit
                if (data.routines[i].id == routine_id) {
                    // load data into form
                    data.routines[i] = routine;

                    break;
                }
            }
        }

        // store data locally
        localStorage.setItem('routines', JSON.stringify(data));
    }

    // redirect to home page
    //window.location.href = './index.html'; // index.html is there for android app
    window.location.href = './';
}


function deleteRoutine() {console.log('del');
    // user logged in
    if (user) {
        // delete routine in db
    }
    else {
        // delete routine in local data
        // loop through routines
        for (var i=0; i<data.routines.length; i++) {
            // find the routine to delete
            if (data.routines[i].id == routine_id) {
                // if chain longer than 10 days
                if (data.routines[i].days > 10) {
                    // throw a warning and only delete if confirmed
                    if (!confirm('Do you want to delete the routine you have been doing for '+data.routines[i].days+' days?')) {
                        break;
                    }
                }

                // remove routine from data
                data.routines.splice(i, 1);

                // store updated data
                localStorage.setItem('routines', JSON.stringify(data));

                // redirect to home page
                //window.location.href = './index.html'; // index.html is there for android app
                window.location.href = './';

                break;
            }
        }
    }
}


// old routine being edited
if (routine_id !== 'new') {
    // user logged in
    if (user) {
        // get routine from server
    }
    else {
        // display delete button and append click listener to it
        $delete.classList.remove('hidden');
        $delete.addEventListener('click', deleteRoutine, false);

        // get all data from local storage
        data = JSON.parse(localStorage.getItem('routines'));

        // loop through routines
        for (var i=0; i<data.routines.length; i++) {
            // find the routine to edit
            if (data.routines[i].id == routine_id) {
                // store edited routine in variable
                routine = data.routines[i];

                // load editable data into form
                // load description if there is any
                if (data.routines[i].note) {
                    $note.value = data.routines[i].note;
                }

                // if there are subtasks
                var sub_tasks = '';
                if (data.routines[i].sub) {
                    // get them so they can be appended to name
                    sub_tasks = JSON.stringify(data.routines[i].sub.tasks);

                    // strip quotation marks
                    sub_tasks = sub_tasks.replace(/"/g,"");
                }

                // load name
                $name.value = data.routines[i].name+sub_tasks;

                break;
            }
        }
    }
}
// new routine being created
else {
    // hide delete button

    // user not logged in
    if (!user) {
        // get all data from local storage
        data = JSON.parse(localStorage.getItem('routines')) || {
            'last_check': (new Date()).setHours(0,0,0,0), // set last check to today if no data yet (user just started using app)
            'routines': []
        };
    }
}


// keyboard shortcut - saving with enter
    window.onkeyup = function(e) {
        var key = e.keyCode || e.keyCode; // TODO zkontrolovat, že funguje v různých prohlížečích

        if (key == 13) { // enter
            // jump back
            $save.click();
        }
    };


$save.addEventListener('click', saveRoutine, false);


// remove #_=_ artefact left after facebook login
if (window.location.hash == '#_=_'){
    history.replaceState 
        ? history.replaceState(null, null, window.location.href.split('#')[0])
        : window.location.hash = '';
}